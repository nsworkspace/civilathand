/**
 * Shared premium invoice template + download/share helpers.
 * Used by both the client Dashboard ("My Invoices") and the Admin Panel
 * ("Billing & Invoicing") so every invoice generated anywhere in the app
 * looks identical, professional, and carries the NS Construction brand.
 */

export interface InvoiceLike {
  id: string;
  projectTitle: string;
  amount: number;
  dueDate: string;
  status: "Unpaid" | "Paid";
  dateGenerated: string;
  paymentLink?: string;
}

export interface InvoiceRenderOptions {
  clientName?: string;
  clientEmail?: string;
}

const CURRENCY = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const BUSINESS_NAME = "NS Construction";
const BUSINESS_TAGLINE = "Structural & Civil Engineering";
const BUSINESS_DOMAIN = "civilathan.in";
const BUSINESS_URL = "https://civilathan.in";
const BUSINESS_EMAIL = "info.civilathand@zohomail.in";
const BUSINESS_LOCATION = "Haryana, India";

/**
 * Builds a full, self-contained, print-ready HTML document for an invoice.
 * Includes the NS Construction logo, a clean two-column layout, a status
 * watermark, and a footer — designed to look good both on screen and when
 * saved as a PDF via the browser print dialog.
 */
export function buildInvoiceHtml(inv: InvoiceLike, opts: InvoiceRenderOptions = {}): string {
  const { clientName, clientEmail } = opts;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const isPaid = inv.status === "Paid";
  const invoiceNo = `#${inv.id.toUpperCase()}`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<base href="${origin}/" />
<title>Invoice ${invoiceNo} · NS Construction</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    color: #0f172a;
    margin: 0;
    padding: 48px;
    background: #f8fafc;
  }
  .sheet {
    max-width: 760px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 18px;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06), 0 10px 40px rgba(15, 23, 42, 0.06);
    overflow: hidden;
    position: relative;
  }
  .watermark {
    position: absolute;
    top: 46%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-24deg);
    font-size: 88px;
    font-weight: 800;
    letter-spacing: 6px;
    color: ${isPaid ? "rgba(16,185,129,0.08)" : "rgba(244,63,94,0.07)"};
    pointer-events: none;
    z-index: 0;
    white-space: nowrap;
  }
  .topbar { height: 6px; background: linear-gradient(90deg, #f97316, #fb923c, #0f172a); }
  .header {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 36px 44px 28px;
    border-bottom: 1px solid #eef2f7;
  }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand img { height: 48px; width: 48px; border-radius: 10px; object-fit: cover; box-shadow: 0 2px 8px rgba(15,23,42,0.12); }
  .brand-name { font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.2px; }
  .brand-tag { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #f97316; margin-top: 2px; }
  .invoice-meta { text-align: right; }
  .invoice-meta h1 { margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px; }
  .invoice-meta .no { font-size: 12px; color: #64748b; font-weight: 600; margin-top: 2px; }
  .badge {
    display: inline-block;
    margin-top: 10px;
    padding: 5px 14px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    background: ${isPaid ? "#d1fae5" : "#fef3c7"};
    color: ${isPaid ? "#047857" : "#b45309"};
  }
  .body { position: relative; z-index: 1; padding: 32px 44px; }
  .grid { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 28px; flex-wrap: wrap; }
  .block h3 { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin: 0 0 8px; }
  .block p { margin: 0; font-size: 13px; color: #0f172a; font-weight: 600; line-height: 1.6; }
  .block p.muted { color: #64748b; font-weight: 500; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  thead th {
    text-align: left;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #94a3b8;
    padding: 0 0 10px;
    border-bottom: 2px solid #0f172a;
  }
  thead th.right { text-align: right; }
  tbody td { padding: 16px 0; border-bottom: 1px solid #eef2f7; font-size: 13px; color: #0f172a; }
  tbody td.right { text-align: right; font-weight: 700; }
  tbody td .desc-sub { display: block; font-size: 11px; color: #64748b; font-weight: 500; margin-top: 2px; }
  .totals { display: flex; justify-content: flex-end; margin-top: 20px; }
  .totals-box { width: 280px; }
  .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #475569; }
  .totals-row.grand {
    margin-top: 6px;
    padding-top: 16px;
    border-top: 2px solid #0f172a;
    font-size: 19px;
    font-weight: 800;
    color: #0f172a;
  }
  .totals-row.grand span:last-child { color: #f97316; }
  .footer {
    position: relative;
    z-index: 1;
    padding: 24px 44px 36px;
    border-top: 1px solid #eef2f7;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }
  .footer p { margin: 0; font-size: 10.5px; color: #94a3b8; line-height: 1.6; }
  .footer .thanks { font-size: 12px; font-weight: 700; color: #0f172a; }
  @media print {
    body { background: #fff; padding: 0; }
    .sheet { box-shadow: none; border-radius: 0; max-width: 100%; }
  }
</style>
</head>
<body>
  <div class="sheet">
    <div class="topbar"></div>
    <div class="watermark">${isPaid ? "PAID" : "UNPAID"}</div>
    <div class="header">
      <div class="brand">
        <img src="/logo.jpg" alt="NS Construction" />
        <div>
          <div class="brand-name">${BUSINESS_NAME}</div>
          <div class="brand-tag">${BUSINESS_TAGLINE}</div>
        </div>
      </div>
      <div class="invoice-meta">
        <h1>Invoice</h1>
        <div class="no">${invoiceNo}</div>
        <span class="badge">${inv.status}</span>
      </div>
    </div>

    <div class="body">
      <div class="grid">
        <div class="block">
          <h3>From</h3>
          <p>${BUSINESS_NAME}</p>
          <p class="muted">${BUSINESS_LOCATION}</p>
          <p class="muted">${BUSINESS_EMAIL}</p>
        </div>
        <div class="block">
          <h3>Billed To</h3>
          <p>${clientName || "Valued Client"}</p>
          ${clientEmail ? `<p class="muted">${clientEmail}</p>` : ""}
        </div>
        <div class="block">
          <h3>Invoice Date</h3>
          <p>${inv.dateGenerated}</p>
        </div>
        <div class="block">
          <h3>Due Date</h3>
          <p>${inv.dueDate}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              ${inv.projectTitle}
              <span class="desc-sub">Professional services as described in the project or service record.</span>
            </td>
            <td class="right">${CURRENCY(inv.amount)}</td>
          </tr>
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-box">
          <div class="totals-row"><span>Subtotal</span><span>${CURRENCY(inv.amount)}</span></div>
          <div class="totals-row grand"><span>${isPaid ? "Total Paid" : "Total Due"}</span><span>${CURRENCY(inv.amount)}</span></div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div>
        <p class="thanks">Thank you for choosing NS Construction.</p>
        <p>This is a system-generated invoice and does not require a signature.</p>
      </div>
      <p>For queries, contact NS Construction support.</p>
    </div>
  </div>
  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`;
}

/**
 * Opens the invoice in a new tab formatted for printing / saving as a PDF.
 */
export function downloadInvoice(inv: InvoiceLike, opts: InvoiceRenderOptions = {}): void {
  const html = buildInvoiceHtml(inv, opts);
  const win = window.open("", "_blank");
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
  } else {
    alert("Please allow pop-ups to download the invoice.");
  }
}

/**
 * Shares the invoice using the native Web Share API when available
 * (as an HTML file when file-sharing is supported, otherwise as a text
 * summary). Falls back to copying a shareable summary to the clipboard.
 */
export async function shareInvoice(inv: InvoiceLike, opts: InvoiceRenderOptions = {}): Promise<void> {
  const invoiceNo = `#${inv.id.toUpperCase()}`;
  const summary = `NS Construction — Invoice ${invoiceNo}\nProject: ${inv.projectTitle}\nAmount: ${CURRENCY(inv.amount)}\nStatus: ${inv.status}\nDue: ${inv.dueDate}${inv.paymentLink ? `\nPay here: ${inv.paymentLink}` : ""}`;

  try {
    const html = buildInvoiceHtml(inv, opts);
    const file = new File([html], `invoice-${inv.id}.html`, { type: "text/html" });

    if (typeof navigator !== "undefined" && (navigator as any).canShare?.({ files: [file] })) {
      await (navigator as any).share({
        title: `NS Construction Invoice ${invoiceNo}`,
        text: summary,
        files: [file],
      });
      return;
    }

    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title: `NS Construction Invoice ${invoiceNo}`, text: summary });
      return;
    }

    await navigator.clipboard.writeText(summary);
    alert("Sharing isn't supported on this device/browser. Invoice details were copied to your clipboard instead.");
  } catch (err: any) {
    if (err?.name === "AbortError") return; // user cancelled the native share sheet
    try {
      await navigator.clipboard.writeText(summary);
      alert("Invoice details were copied to your clipboard.");
    } catch {
      alert("Unable to share the invoice on this device.");
    }
  }
}
