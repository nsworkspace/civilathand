import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { checkPaymentAccess } from "@/lib/paymentAccess";
import { getBearerToken, verifyFirebaseIdToken } from "@/lib/firebase-verify";
import { validateEmailDomain } from "@/lib/email-validation";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limit = rateLimit(`mentorship-apply:${ip}`, { limit: 5, windowMs: 10 * 60_000 });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many applications from this network. Please try again later." }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid application data." }, { status: 400 });
    }

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const academicLevel = String(body.academicLevel || "Not Specified").trim();
    const fieldOfStudy = String(body.fieldOfStudy || "Not Specified").trim();
    const goals = String(body.goals || "Not Specified").trim();

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: "Please enter a valid full name." }, { status: 400 });
    }
    const emailValidation = validateEmailDomain(email);
    if (!emailValidation.isValid) {
      return NextResponse.json({ error: emailValidation.error || "Please enter a valid email address." }, { status: 400 });
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) {
      return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
    }
    if (goals.length < 20 || goals.length > 3000) {
      return NextResponse.json({ error: "Please describe your goals in at least 20 characters." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);

    // Every mentorship application is tied to a verified account, including
    // the free tier. This prevents anonymous submissions and keeps the
    // application/payment/receipt trail attached to one identity.
    const verified = await verifyFirebaseIdToken(getBearerToken(request));
    if (!verified?.uid || !verified.email || !verified.emailVerified) {
      return NextResponse.json(
        { error: "Please sign in with a verified account before submitting a mentorship application.", requiresAuth: true },
        { status: 401 }
      );
    }

    const verifiedEmail = verified.email.trim().toLowerCase();
    if (verifiedEmail !== email) {
      return NextResponse.json(
        { error: "Use the email address linked to your signed-in account.", requiresAuth: true },
        { status: 403 }
      );
    }

    const mentorName = String(body.mentorName || "").trim();
    const settings = await db.collection("mentorship_settings").findOne({});
    const mentors = Array.isArray((settings as any)?.mentors) ? (settings as any).mentors : [];
    if (mentors.length > 0) {
      if (!mentorName) {
        return NextResponse.json({ error: "Please select a mentor." }, { status: 400 });
      }
      const selectedMentor = mentors.find((mentor: any) => String(mentor?.name || "").trim() === mentorName);
      if (!selectedMentor) {
        return NextResponse.json({ error: "Selected mentor is not currently available." }, { status: 400 });
      }
    }

    const access = await checkPaymentAccess(db, request, "mentorship-program");
    if (!access.allowed) {
      return NextResponse.json(
        {
          error: access.requiresAuth
            ? "Please sign in with a verified account and complete mentorship payment before submitting."
            : "Mentorship payment is required before submitting this application.",
          requiresPayment: !access.requiresAuth,
          requiresAuth: access.requiresAuth,
        },
        { status: access.requiresAuth ? 401 : 402 },
      );
    }

    const existing = await db.collection("mentorship_applications").findOne({
      email,
      status: { $in: ["Pending", "Approved", "Active"] },
    });
    if (existing) {
      return NextResponse.json({ error: "We already have an active mentorship application for this email." }, { status: 409 });
    }

    const now = new Date().toISOString();
    const newApplication = {
      id: `mentorship-app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: verified.uid,
      mentorName: mentorName || null,
      name,
      email,
      phone,
      academicLevel,
      fieldOfStudy,
      mentorshipAreas: Array.isArray(body.mentorshipAreas) ? body.mentorshipAreas.slice(0, 12).map((v: unknown) => String(v).slice(0, 100)) : ["General Guidance"],
      proficiency: Number.isFinite(Number(body.proficiency)) ? Math.min(5, Math.max(1, Number(body.proficiency))) : 3,
      goals,
      timeZoneComfort: String(body.timeZoneComfort || "Not Specified").slice(0, 100),
      availability: body.availability && typeof body.availability === "object" ? body.availability : { Morning: [], Afternoon: [], Evening: [] },
      status: "Pending",
      notes: "",
      paymentItemSlug: "mentorship-program",
      accessMode: access.free ? "free" : "paid",
      createdAt: now,
      updatedAt: now,
    };

    await db.collection("mentorship_applications").insertOne(newApplication);

    try {
      await db.collection("notifications").insertOne({
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: "New Mentorship Application",
        message: `${name} has applied for Mentorship (Level: ${academicLevel || "N/A"}).`,
        type: "mentorship",
        isAdmin: true,
        read: false,
        createdAt: now,
      });
    } catch (notifErr) {
      console.warn("Failed to create admin notification for mentorship:", notifErr);
    }

    const { _id, ...responseApp } = newApplication as any;
    return NextResponse.json({ success: true, application: responseApp }, { status: 201 });
  } catch (error) {
    console.error("Error submitting mentorship application:", error);
    return NextResponse.json({ error: "Failed to submit mentorship application. Please try again." }, { status: 500 });
  }
}
