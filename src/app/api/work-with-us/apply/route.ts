import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, experience, qualification, role, roleSlug, note, resumeUrl, resumeName, currentCity, linkedin, portfolioUrl, noticePeriod, expectedCompensation, skills, availability } = body;

    if (!name?.trim() || !email?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "Name, email, and mobile number are required." }, { status: 400 });
    }

    if (!resumeUrl || !resumeUrl.trim()) {
      return NextResponse.json({ error: "Resume upload is mandatory. Please attach your resume before submitting." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const settings = await db.collection("career_settings").findOne({ key: "career_config" });
    const roles = Array.isArray(settings?.roles) ? settings.roles : [];
    const selectedJob = roleSlug ? roles.find((r: any) => String(r.slug || "") === String(roleSlug).trim()) : roles.find((r: any) => String(r.title || "") === String(role || "").trim());
    if (roleSlug && !selectedJob) {
      return NextResponse.json({ error: "The selected job is no longer available." }, { status: 404 });
    }
    if (selectedJob && (selectedJob.active === false || selectedJob.applyEnabled === false)) {
      return NextResponse.json({ error: "Applications are closed for this position." }, { status: 409 });
    }

    const collection = db.collection("career_applications");

    const newApplication = {
      id: `app-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      experience: experience || "Fresher",
      qualification: qualification || "Civil Engineering",
      role: role || "General Position",
      roleSlug: roleSlug?.trim() || "",
      note: note?.trim() || "",
      currentCity: currentCity?.trim() || "",
      linkedin: linkedin?.trim() || "",
      portfolioUrl: portfolioUrl?.trim() || "",
      noticePeriod: noticePeriod?.trim() || "",
      expectedCompensation: expectedCompensation?.trim() || "",
      skills: skills?.trim() || "",
      availability: availability?.trim() || "",
      resumeUrl: resumeUrl || "",
      resumeName: resumeName || "Resume",
      status: "new",
      createdAt: new Date().toISOString(),
    };

    await collection.insertOne(newApplication);

    const { _id, ...responseApp } = newApplication as any;
    return NextResponse.json({ success: true, application: responseApp }, { status: 201 });
  } catch (error: any) {
    console.error("Error submitting career application:", error);
    return NextResponse.json(
      { error: `Failed to submit application: ${error.message || error}` },
      { status: 500 }
    );
  }
}
