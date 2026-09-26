import nodemailer from "nodemailer";

const FROM = process.env.SMTP_USER || "info.civilathand@zohomail.in";

function createTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.zoho.in",
    port: Number(process.env.SMTP_PORT || "465"),
    secure: process.env.SMTP_SECURE !== "false",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (match) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[match] || match));
}

export async function sendReviewRequestEmail(input: { to: string; clientName?: string; reviewUrl: string }) {
  const transporter = createTransporter();
  if (!transporter) return { sent: false, reason: "SMTP is not configured." };
  const name = (input.clientName || "there").trim().slice(0, 120);
  const reviewUrl = input.reviewUrl.trim();
  const subject = "A quick NS Construction review would help";
  const text = `Hi ${name},\n\nThank you for working with NS Construction. If you are comfortable sharing your experience, a short Google review helps future clients understand how the consultancy works.\n\n${reviewUrl}\n\nThank you,\nNS Construction`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;line-height:1.6;color:#0f172a"><h1 style="color:#f97316">NS Construction</h1><p>Hi ${escapeHtml(name)},</p><p>Thank you for working with NS Construction. If you are comfortable sharing your experience, a short Google review helps future clients understand how the consultancy works.</p><p><a href="${escapeHtml(reviewUrl)}" style="display:inline-block;background:#f97316;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">Leave a Google review</a></p><p>Thank you,<br/>NS Construction</p></div>`;
  await transporter.sendMail({ from: `"NS Construction" <${FROM}>`, to: input.to, subject, text, html });
  return { sent: true };
}
