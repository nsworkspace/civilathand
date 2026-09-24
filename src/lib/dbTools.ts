// ─────────────────────────────────────────────────────────────────────
// Database Tools — lets a superadmin browse/delete raw MongoDB documents
// from the admin panel instead of opening MongoDB Atlas/Compass directly.
//
// SAFETY MODEL (read before changing this file):
//  1. Superadmin only. This is never exposed through ADMIN_MODULES /
//     hasModuleAccess, so it can never be granted to a sub-admin account,
//     even one with every other module ticked. Every route in
//     src/app/api/admin/db-tools/route.ts calls isAdminAuthenticated().
//  2. Collection allowlist. Only collections listed in EDITABLE_COLLECTIONS
//     can be browsed/deleted here at all — this prevents typos or scripted
//     abuse from touching an unexpected collection.
//  3. Protected collections (PROTECTED_COLLECTIONS) can never be deleted
//     from this generic tool, even by the superadmin. These are either:
//       - financial/audit records with their own safer flow (refunds,
//         payment history) where a raw delete would corrupt entitlement
//         history or accounting,
//       - auth/session integrity records (email OTP/verification),
//       - singleton config documents, or
//       - collections with linked binary data (GridFS) that a raw
//         document delete would silently orphan.
//  4. Every deletion is snapshotted into `admin_deleted_backups` BEFORE
//     the delete happens, and logged to `activity_logs`. This means an
//     accidental delete is recoverable, not just logged after the fact.
// ─────────────────────────────────────────────────────────────────────

export const EDITABLE_COLLECTIONS = [
  "leads",
  "projects",
  "invoices",
  "drawings",
  "tickets",
  "chats",
  "blogs",
  "portfolio",
  "services",
  "notifications",
  "career_applications",
  "career_settings",
  "team_members",
  "vendors",
  "vendor_leads",
  "software_courses",
  "course_enrollments",
  "mentorship_applications",
  "mentorship_settings",
  "payment_coupons",
  "payment_offers",
  "service_payment_requests",
  "users",
  "user_activity",
  "analytics_events",
  "analytics_pages",
  "calculator_logs",
  "uploaded_files",
] as const;

// Deliberately NOT included in EDITABLE_COLLECTIONS, so they never even
// show up as browsable in this tool (fully out of scope, not just
// delete-blocked): admin_accounts (has its own panel with escalation
// protection) and admin_deleted_backups (the safety net itself).
export const PROTECTED_COLLECTIONS = [
  "payment_events",
  "payment_orders",
  "payment_webhook_events",
  "email_verifications",
  "email_otps",
  "study_materials",
  "site_panel_visibility",
  "admin_profile",
  "activity_logs",
] as const;

export type EditableCollection = typeof EDITABLE_COLLECTIONS[number];

export function isEditableCollection(value: string): value is EditableCollection {
  return (EDITABLE_COLLECTIONS as readonly string[]).includes(value);
}

export function isProtectedCollection(value: string): boolean {
  return (PROTECTED_COLLECTIONS as readonly string[]).includes(value);
}

export const DB_TOOLS_BACKUP_COLLECTION = "admin_deleted_backups";
// Restorable window for accidental deletes — after this, backups are
// still kept but purely as an audit trail (restore is a manual DB action).
export const DB_TOOLS_BACKUP_TTL_DAYS = 30;
