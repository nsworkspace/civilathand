import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyFirebaseIdToken, getBearerToken } from "@/lib/firebase-verify";
import { courseItemSlug } from "@/lib/paymentSlugs";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function POST(request: Request) {
  try {
    const verified = await verifyFirebaseIdToken(getBearerToken(request));
    if (!verified?.email || !verified.emailVerified) {
      return NextResponse.json({ error: "Please sign in with a verified email address before enrolling in a course." }, { status: 401 });
    }

    const body = await request.json();
    const {
      userEmail,
      userName,
      courseSlug,
      courseName,
      duration,
      level,
      priceLabel,
      status,
      progress,
      enrolledAt,
      phone: submittedPhone,
      company: submittedCompany,
      address: submittedAddress,
      goal
    } = body;

    if (!courseSlug || !courseName) {
      return NextResponse.json({ error: "courseSlug and courseName are required." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const course = await db.collection("software_courses").findOne({ slug: courseSlug, source: "admin" });
    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }
    const item = await db.collection("payment_items").findOne({ slug: courseItemSlug(courseSlug), active: true });
    if (!item) {
      return NextResponse.json({ error: "Course enrollment is not configured." }, { status: 409 });
    }
    const amount = Number(item.amount) || 0;
    if (amount > 0) {
      const normalizedCourseSlug = courseSlug.trim().toLowerCase();
      const paid = await db.collection("payment_events").findOne({
        refunded: { $ne: true },
        $and: [
          {
            $or: [
              { amount: { $gt: 0 }, free: { $ne: true } },
              { amount: 0, free: true, $or: [{ couponCode: { $type: "string" } }, { offerId: { $type: "string" } }] },
            ],
          },
          {
            $or: [
              { itemSlug: courseItemSlug(normalizedCourseSlug) },
              { slug: normalizedCourseSlug },
            ],
          },
          {
            $or: [
              { userId: verified.uid },
              { userEmail: verified.email.trim().toLowerCase() },
            ],
          },
        ],
      });
      if (!paid) {
        return NextResponse.json({ error: "Payment is required before course enrollment.", requiresPayment: true }, { status: 403 });
      }
    }
    const collection = db.collection("course_enrollments");
    const profile = await db.collection("users").findOne(
      { id: verified.uid },
      { projection: { phone: 1, company: 1, address: 1, userType: 1, name: 1, email: 1 } }
    );

    const newEnrollment = {
      id: `enroll-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: verified.uid,
      userEmail: verified.email.trim().toLowerCase(),
      userName: profile?.name || userName || "Student User",
      phone: profile?.phone || submittedPhone || null,
      company: profile?.company || submittedCompany || null,
      address: profile?.address || submittedAddress || null,
      goal: typeof goal === "string" ? goal.trim().slice(0, 2000) : null,
      userType: profile?.userType || null,
      courseSlug: courseSlug || "course",
      courseName: course.name || course.title || courseSlug,
      duration: course.duration || duration || "Self-Paced",
      level: course.level || level || "All Levels",
      priceLabel: Number(item.amount || 0) === 0 ? "FREE" : `₹${Number(item.amount).toLocaleString("en-IN")}`,
      status: status || "Active",
      progress: typeof progress === "number" ? progress : 0,
      enrolledAt: enrolledAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Use updateOne with upsert so re-enrolling updates existing record
    await collection.updateOne(
      { userEmail: newEnrollment.userEmail, courseSlug: newEnrollment.courseSlug },
      { $set: newEnrollment },
      { upsert: true }
    );

    try {
      await db.collection("notifications").insertOne({
        id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        title: "New Civil At Hand Course Enrollment",
        message: `${newEnrollment.userName} enrolled in ${newEnrollment.courseName}.`,
        type: "course",
        isAdmin: true,
        read: false,
        createdAt: new Date().toISOString(),
      });
    } catch (notificationError) {
      console.warn("Non-fatal: failed to create course enrollment notification:", notificationError);
    }

    const { _id, ...responseEnrollment } = newEnrollment as any;
    return NextResponse.json({ success: true, enrollment: responseEnrollment }, { status: 201 });
  } catch (error) {
    console.error("Error saving course enrollment:", error);
    return NextResponse.json({ error: "Failed to save course enrollment." }, { status: 500 });
  }
}
