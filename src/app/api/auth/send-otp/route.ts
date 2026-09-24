import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import nodemailer from "nodemailer";
import { randomInt } from "node:crypto";
import { getBearerToken, verifyFirebaseIdToken } from "@/lib/firebase-verify";

let otpTtlIndexEnsured = false;

async function ensureOtpTtlIndex(db: import("mongodb").Db) {
  if (otpTtlIndexEnsured) return;
  try {
    await db.collection("email_otps").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "ttl_email_otp_expires" });
    otpTtlIndexEnsured = true;
  } catch (error) {
    console.warn("Could not ensure OTP TTL index:", error);
  }
}


const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

function generateOtp(): string {
  return randomInt(100000, 1000000).toString();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.zoho.in",
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: process.env.SMTP_SECURE !== "false",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function otpEmailHtml(otp: string, name: string): string {
  const safeName = escapeHtml(name.trim()).slice(0, 120);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Your Civil At Hand Verification Code</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:32px 40px;text-align:center;border-bottom:1px solid #334155;">
            <p style="margin:0;font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
              CIVIL <span style="color:#f97316;">AT HAND</span>
            </p>
            <p style="margin:6px 0 0;font-size:12px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">Design &amp; Consultancy</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#f1f5f9;">Verify your email</h1>
            <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;line-height:1.6;">
              Hi ${safeName || "there"}, use the 6-digit code below to complete your registration. 
              It expires in <strong style="color:#f97316;">10 minutes</strong>.
            </p>

            <!-- OTP box -->
            <div style="background:#0f172a;border:1px solid #475569;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
              <p style="margin:0 0 8px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:2px;">Your verification code</p>
              <p style="margin:0;font-size:42px;font-weight:900;letter-spacing:12px;color:#f97316;font-variant-numeric:tabular-nums;">${otp}</p>
            </div>

            <p style="margin:0 0 24px;font-size:13px;color:#64748b;line-height:1.6;">
              If you didn't create an account with Civil At Hand, you can safely ignore this email.
              Never share this code with anyone — our team will <strong style="color:#94a3b8;">never</strong> ask for it.
            </p>
            <hr style="border:none;border-top:1px solid #334155;margin:0 0 24px;" />
            <p style="margin:0;font-size:12px;color:#475569;text-align:center;">
              &copy; ${new Date().getFullYear()} Civil At Hand : Design &amp; Consultancy<br/>
              <a href="mailto:info.civilathand@zohomail.in" style="color:#f97316;text-decoration:none;">info.civilathand@zohomail.in</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const token = getBearerToken(req);
    const firebaseUser = await verifyFirebaseIdToken(token);

    if (!firebaseUser || !firebaseUser.email || firebaseUser.email.trim().toLowerCase() !== normalizedEmail) {
      return NextResponse.json({ error: "Authentication required. Please try again." }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "civil-at-hand");
    await ensureOtpTtlIndex(db);

    const existing = await db.collection("email_otps").findOne({ email: normalizedEmail });
    if (existing?.createdAt) {
      const elapsed = Date.now() - new Date(existing.createdAt).getTime();
      if (elapsed < 60_000) {
        return NextResponse.json(
          { error: `Please wait ${Math.ceil((60_000 - elapsed) / 1000)} seconds before requesting another code.` },
          { status: 429 }
        );
      }
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await db.collection("email_otps").updateOne(
      { email: normalizedEmail },
      {
        $set: {
          email: normalizedEmail,
          uid: firebaseUser.uid,
          otp,
          expiresAt,
          verified: false,
          attempts: 0,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    // Send email via SMTP
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Civil At Hand" <${process.env.SMTP_USER}>`,
      to: normalizedEmail,
      subject: `${otp} — Your Civil At Hand Verification Code`,
      html: otpEmailHtml(otp, name || ""),
      text: `Your Civil At Hand verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
    });

    return NextResponse.json({ success: true, message: "OTP sent." });
  } catch (err: any) {
    console.error("[send-otp] Error:", err);
    return NextResponse.json(
      { error: "Failed to send OTP. Please try again." },
      { status: 500 }
    );
  }
}
