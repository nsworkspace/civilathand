import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getBearerToken, verifyFirebaseIdToken } from "@/lib/firebase-verify";

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || typeof email !== "string" || !otp) {
      return NextResponse.json({ error: "Email and OTP are required." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = String(otp).replace(/\D/g, "");
    if (normalizedOtp.length !== 6) {
      return NextResponse.json({ error: "Enter the 6-digit verification code." }, { status: 400 });
    }

    const firebaseUser = await verifyFirebaseIdToken(getBearerToken(req));
    if (!firebaseUser || !firebaseUser.email || firebaseUser.email.trim().toLowerCase() !== normalizedEmail) {
      return NextResponse.json({ error: "Authentication required. Please sign in again." }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "civil-at-hand");
    await db.collection("email_verifications").createIndex({ uid: 1 }, { unique: true, name: "uniq_email_verification_uid" }).catch(() => {});
    await db.collection("email_verifications").createIndex({ email: 1 }, { name: "email_verification_email" }).catch(() => {});

    if (firebaseUser.emailVerified) {
      return NextResponse.json({ success: true, verified: true, message: "Email already verified." });
    }

    const record = await db.collection("email_otps").findOne({
      email: normalizedEmail,
      uid: firebaseUser.uid,
    });

    if (!record) {
      return NextResponse.json(
        { error: "No OTP found for this email. Please request a new one." },
        { status: 400 }
      );
    }

    if (new Date() > new Date(record.expiresAt)) {
      await db.collection("email_otps").deleteOne({ _id: record._id });
      return NextResponse.json(
        { error: "OTP has expired. Please request a new code." },
        { status: 400 }
      );
    }

    const attempts = Number(record.attempts || 0);
    if (attempts >= MAX_ATTEMPTS) {
      await db.collection("email_otps").deleteOne({ _id: record._id });
      return NextResponse.json(
        { error: "Too many incorrect codes. Please request a new OTP." },
        { status: 429 }
      );
    }

    if (record.otp !== normalizedOtp) {
      const nextAttempts = attempts + 1;
      if (nextAttempts >= MAX_ATTEMPTS) {
        await db.collection("email_otps").deleteOne({ _id: record._id });
      } else {
        await db.collection("email_otps").updateOne(
          { _id: record._id },
          { $set: { attempts: nextAttempts } }
        );
      }
      return NextResponse.json(
        { error: nextAttempts >= MAX_ATTEMPTS ? "Too many incorrect codes. Please request a new OTP." : "Incorrect code. Please try again." },
        { status: nextAttempts >= MAX_ATTEMPTS ? 429 : 400 }
      );
    }

    const now = new Date();
    await db.collection("email_verifications").updateOne(
      { uid: firebaseUser.uid },
      {
        $set: {
          uid: firebaseUser.uid,
          email: normalizedEmail,
          verifiedAt: now,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );

    await db.collection("email_otps").deleteOne({ _id: record._id });

    return NextResponse.json({ success: true, verified: true, message: "Email verified." });
  } catch (err) {
    console.error("[verify-otp] Error:", err);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
