import jsPDF from "jspdf";

export interface ReceiptLike {
  id?: string;
  kind?: string;
  title?: string;
  amount?: number;
  paidAt?: string | null;
  paymentId?: string | null;
  razorpayPaymentId?: string | null;
  itemSlug?: string | null;
  slug?: string | null;
  invoiceId?: string | null;
  free?: boolean;
  refunded?: boolean;
  userEmail?: string | null;
}

function currency(value: number) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function safeFilePart(value: string) {
  return value.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "receipt";
}

/**
 * Generates a branded NS Construction receipt directly in the browser.
 * No payment secrets are exposed; only the user's own purchase record is
 * passed from the authenticated profile page.
 */
export function downloadReceipt(receipt: ReceiptLike, buyer?: { name?: string; email?: string }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const amount = Number(receipt.amount || 0);
  const paidDate = receipt.paidAt
    ? new Date(receipt.paidAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : "—";
  const receiptNo = String(receipt.id || `receipt-${Date.now()}`).toUpperCase();
  const paymentId = receipt.paymentId || receipt.razorpayPaymentId || "FREE / ACCOUNT ACCESS";

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("NS Construction", margin, 17);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Structural & Civil Engineering", margin, 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("PAYMENT RECEIPT", pageWidth - margin, 17, { align: "right" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(receiptNo, pageWidth - margin, 24, { align: "right" });

  // Status
  doc.setTextColor(16, 185, 129);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(receipt.refunded ? "REFUNDED" : "PAYMENT CONFIRMED", margin, 52);

  // Buyer
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.text("BILLED TO", margin, 64);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(buyer?.name || "NS Construction Customer", margin, 71);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(buyer?.email || receipt.userEmail || "Verified account", margin, 77);

  // Purchase card
  const cardY = 90;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, cardY, pageWidth - margin * 2, 56, 4, 4, "FD");

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("PURCHASE DETAILS", margin + 7, cardY + 9);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.text(receipt.title || "NS Construction Purchase", margin + 7, cardY + 19);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const rawKind = receipt.kind ? String(receipt.kind).replace(/[-_]/g, " ").toLowerCase() : "purchase";
  const isEducation = /course|mentorship|education/.test(`${rawKind} ${receipt.itemSlug || ""} ${receipt.slug || ""}`);
  const kindLabel = isEducation ? "CIVIL AT HAND EDUCATION" : rawKind.toUpperCase();
  doc.text(`Type: ${kindLabel}`, margin + 7, cardY + 28);
  doc.text(`Date: ${paidDate}`, margin + 7, cardY + 35);
  doc.text(`Payment ID: ${paymentId}`, margin + 7, cardY + 42);

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(amount === 0 ? "FREE" : currency(amount), pageWidth - margin - 7, cardY + 21, { align: "right" });
  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129);
  doc.text(amount === 0 ? "No payment required" : "Paid successfully", pageWidth - margin - 7, cardY + 29, { align: "right" });

  // Reference information
  const refY = 162;
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("REFERENCE", margin, refY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  const ref =
    receipt.invoiceId ||
    receipt.itemSlug ||
    receipt.slug ||
    receipt.id ||
    "—";
  doc.text(String(ref), margin, refY + 8);

  // Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, 255, pageWidth - margin, 255);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("This is a system-generated receipt from NS Construction.", margin, 264);
  doc.text("Keep this receipt for your records. Access remains linked to your verified account.", margin, 270);
  doc.text("Support: info.civilathand@zohomail.in", margin, 276);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("civilathan.in", pageWidth - margin, 270, { align: "right" });

  doc.save(`civil-at-hand-${safeFilePart(receipt.title || receipt.id || "receipt")}.pdf`);
}
