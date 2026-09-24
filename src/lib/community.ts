import type { Db } from "mongodb";
import { randomBytes } from "crypto";

export const COMMUNITY_MESSAGE_RETENTION_DAYS = 3;
export const COMMUNITY_REACTIONS = ["👍", "❤️", "😂", "😮", "🙏", "🔥", "👏", "💡"] as const;
export type CommunityReaction = (typeof COMMUNITY_REACTIONS)[number];

export type CommunityGroup = {
  id: string; name: string; description: string; imageUrl: string; category: string;
  memberCount: number; createdAt: string; updatedAt: string; announcement?: string; rules?: string;
  visibility?: "public" | "private"; discoverable?: boolean;
};

export function cleanText(value: unknown, maxLength: number): string { return String(value ?? "").replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, maxLength); }
export function safeImageUrl(value: unknown): string { const url = cleanText(value, 500); if (!url) return ""; if (url.startsWith("/api/uploads/") || url.startsWith("/uploads/") || /^https:\/\//i.test(url)) return url; return ""; }
export function normalizeCommunityName(value: unknown): string { return cleanText(value, 100).replace(/\s+/g, " ").toLocaleLowerCase(); }
export function makeCommunityId(prefix: string): string { return `${prefix}_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`; }
export function generateUsername(): string { return `civ_${randomBytes(4).toString("hex")}`; }
export async function createCommunityIndexes(db: Db): Promise<void> { await Promise.all([
  db.collection("community_groups").createIndex({ id: 1 }, { unique: true }),
  db.collection("community_groups").createIndex({ type: 1, normalizedName: 1 }, { unique: true, partialFilterExpression: { normalizedName: { $type: "string" } } }),
  db.collection("community_members").createIndex({ groupId: 1, userId: 1 }, { unique: true }),
  db.collection("community_members").createIndex({ groupId: 1, username: 1 }),
  db.collection("community_messages").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  db.collection("community_messages").createIndex({ groupId: 1, createdAt: -1 }),
  db.collection("community_messages").createIndex({ groupId: 1, userId: 1, createdAt: -1 }),
  db.collection("community_messages").createIndex({ id: 1 }, { unique: true }),
  db.collection("community_chat_saved").createIndex({ groupId: 1, userId: 1, messageId: 1 }, { unique: true }),
  db.collection("community_chat_pins").createIndex({ groupId: 1, messageId: 1 }, { unique: true }),
  db.collection("community_chat_follows").createIndex({ groupId: 1, userId: 1, messageId: 1 }, { unique: true }),
  db.collection("community_chat_polls").createIndex({ id: 1 }, { unique: true }),
  db.collection("community_chat_polls").createIndex({ groupId: 1, createdAt: -1 }),
  db.collection("community_chat_tasks").createIndex({ id: 1 }, { unique: true }),
  db.collection("community_chat_tasks").createIndex({ groupId: 1, status: 1, dueDate: 1 }),
  db.collection("community_chat_assets").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  db.collection("community_chat_assets").createIndex({ groupId: 1, createdAt: -1 }),
  db.collection("community_chat_reports").createIndex({ id: 1 }, { unique: true }),
  db.collection("community_chat_reports").createIndex({ groupId: 1, status: 1, createdAt: -1 }),
  db.collection("users").createIndex({ username: 1 }, { unique: true, sparse: true }),
  db.collection("community_presence").createIndex({ groupId: 1, activeUntil: -1 }),
 ]); }
export async function ensureCommunityIndexes(db: Db): Promise<void> { try { await createCommunityIndexes(db); } catch (error: any) { const message = String(error?.message || ""); if (!message.toLowerCase().includes("already exists") && !message.toLowerCase().includes("equivalent index already exists")) throw error; } }
