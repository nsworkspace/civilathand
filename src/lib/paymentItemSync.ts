import { Db } from "mongodb";
import { courseItemSlug, MENTORSHIP_SLUG } from "./paymentSlugs";
export { MENTORSHIP_SLUG };

export type SyncSourceType = "course" | "mentorship" | "study-material";

export interface SyncPaymentItemParams {
  sourceType: SyncSourceType;
  sourceId: string;
  title: string;
  description?: string;
  amount?: number;
  buttonLabel?: string;
  successMessage?: string;
  active?: boolean;
  pagePath?: string;
}

function toSlug(sourceType: SyncSourceType, sourceId: string) {
  if (sourceType === "course") return courseItemSlug(sourceId);
  if (sourceType === "study-material") return `study-material-${sourceId}`;
  return MENTORSHIP_SLUG;
}

export async function syncPaymentItem(db: Db, params: SyncPaymentItemParams) {
  const slug = toSlug(params.sourceType, params.sourceId);
  const items = db.collection("payment_items");
  const existing = await items.findOne({ slug });
  const hasExplicitAmount = params.amount !== undefined && Number.isFinite(Number(params.amount));
  const amount = hasExplicitAmount ? Number(params.amount) : Number(existing?.amount) || 0;
  const category = params.sourceType;
  const doc: Record<string, any> = {
    id: existing?.id || `pay-${slug}`,
    slug,
    title: params.title,
    description: params.description?.trim() || "",
    category,
    pricingMode: existing?.pricingMode === "free" || (existing && Number(existing.amount || 0) === 0) ? "free" : "paid",
    buttonLabel: params.buttonLabel?.trim() || existing?.buttonLabel || (amount === 0 ? "Get Free" : "Pay Now"),
    successMessage: params.successMessage?.trim() || existing?.successMessage || "Thank you! Your payment was received.",
    pageHint: params.pagePath || (params.sourceType === "course" ? "Software / Courses" : params.sourceType === "study-material" ? "/education/study-materials" : "Mentorship"),
    syncedFrom: { type: params.sourceType, id: params.sourceId },
    updatedAt: new Date().toISOString(),
  };
  if (params.pagePath !== undefined && (!existing || !existing.pagePath)) doc.pagePath = params.pagePath;
  if (hasExplicitAmount || !existing) doc.amount = amount;
  if (params.active !== undefined) doc.active = params.active !== false;
  if (existing) await items.updateOne({ slug }, { $set: doc });
  else await items.insertOne({ ...doc, amount, active: params.active !== false, purchaseCount: 0, createdAt: new Date().toISOString() });
  return slug;
}
