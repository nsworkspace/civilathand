/**
 * Shared branded proposal template — used by the admin Proposal Builder to
 * generate a print-ready / downloadable PDF quote for a client, in the same
 * visual style as buildInvoiceHtml() in invoice.ts.
 */

export interface ProposalItem {
  service: string;
  description?: string;
  rate: number;
  qty: number;
}

export interface ProposalLike {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  items: ProposalItem[];
  notes?: string;
  validTill?: string;
  createdAt: string;
}

const CURRENCY = (n: number) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`;

export function proposalTotal(items: ProposalItem[]): number {
  return items.reduce((sum, it) => sum + Number(it.rate || 0) * Number(it.qty || 1), 0);
}

export function buildProposalHtml(proposal: ProposalLike): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const total = proposalTotal(proposal.items);
  const proposalNo = `#${proposal.id.toUpperCase()}`;

  const rows = proposal.items
    .map(
      it => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">
            <div style="font-weight:700;color:#0f172a;">${escapeHtml(it.service)}</div>
            ${it.description ? `<div style="font-size:12px;color:#64748b;margin-top:2px;">${escapeHtml(it.description)}</div>` : ""}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;text-align:center;color:#334155;">${it.qty}</td>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;text-align:right;color:#334155;">${CURRENCY(it.rate)}</td>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;color:#0f172a;">${CURRENCY(it.rate * it.qty)}</td>
        </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<base href="${origin}/" />
<title>Proposal ${proposalNo} · Civil At Hand</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    color: #0f172a;
    margin: 0;
    padding: 48px;
    max-width: 820px;
    margin: 0 auto;
  }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; }
  .brand { font-size: 22px; font-weight: 800; color: #0f172a; }
  .brand span { color: #f97316; }
  .meta { text-align: right; font-size: 12px; color: #64748b; }
  .title { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #f97316; margin-bottom: 4px; }
  .parties { display: flex; justify-content: space-between; gap: 24px; margin: 32px 0; padding: 20px 0; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
  .parties h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin: 0 0 6px; }
  .parties p { margin: 0; font-size: 13px; color: #334155; line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; padding-bottom: 8px; border-bottom: 2px solid #0f172a; }
  th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
  th:nth-child(2) { text-align: center; }
  .total-row td { padding-top: 16px; font-size: 16px; }
  .notes { margin-top: 28px; font-size: 12px; color: #64748b; background: #f8fafc; padding: 16px; border-radius: 8px; }
  .footer { margin-top: 48px; text-align: center; font-size: 11px; color: #94a3b8; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">Service Proposal</div>
      <div class="brand">Civil<span>At</span>Hand</div>
    </div>
    <div class="meta">
      <div>Proposal ${proposalNo}</div>
      <div>${new Date(proposal.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
      ${proposal.validTill ? `<div>Valid till ${new Date(proposal.validTill).toLocaleDateString("en-IN")}</div>` : ""}
    </div>
  </div>

  <div class="parties">
    <div>
      <h4>Prepared For</h4>
      <p><strong>${escapeHtml(proposal.clientName)}</strong><br/>${escapeHtml(proposal.clientEmail)}${proposal.clientPhone ? `<br/>${escapeHtml(proposal.clientPhone)}` : ""}</p>
    </div>
    <div style="text-align:right;">
      <h4>Prepared By</h4>
      <p>Civil At Hand — Design &amp; Consultancy<br/>info.civilathand@zohomail.in</p>
    </div>
  </div>

  <table>
    <thead>
      <tr><th>Service</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="3" style="text-align:right;font-weight:700;">Total</td>
        <td style="text-align:right;font-weight:800;color:#f97316;">${CURRENCY(total)}</td>
      </tr>
    </tbody>
  </table>

  ${proposal.notes ? `<div class="notes">${escapeHtml(proposal.notes)}</div>` : ""}

  <div class="footer">This proposal is issued by Civil At Hand and is subject to mutual confirmation before work begins.</div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Opens a print dialog (→ Save as PDF) for the given proposal, same UX as invoices. */
export function downloadProposal(proposal: ProposalLike) {
  const html = buildProposalHtml(proposal);
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.onload = () => win.print();
}
