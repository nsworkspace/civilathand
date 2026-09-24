"use client";

import React from "react";
import { FileText, Download, ExternalLink, UserRound } from "lucide-react";
import type { TicketAttachment } from "@/context/ProjectContext";
import UserAvatar from "@/components/UserAvatar";

function linkify(text: string): React.ReactNode[] {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline decoration-current/40 hover:decoration-current break-all">{part}</a>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function isImageAttachment(a: TicketAttachment): boolean {
  if (a.type && a.type.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(a.name || a.url || "");
}

function AttachmentCard({ attachment, tone }: { attachment: TicketAttachment; tone: "self" | "other" }) {
  if (isImageAttachment(attachment)) {
    return (
      <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block mt-2 rounded-xl overflow-hidden border border-black/10 max-w-[220px] group relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={attachment.url} alt={attachment.name} className="w-full max-h-52 object-cover group-hover:opacity-90 transition-opacity" />
        <span className="absolute bottom-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink className="h-3 w-3" /></span>
      </a>
    );
  }
  return (
    <a href={attachment.url} target="_blank" rel="noopener noreferrer" download={attachment.name} className={`mt-2 flex items-center gap-2.5 rounded-xl px-3 py-2.5 border max-w-[240px] transition-colors ${tone === "self" ? "bg-white/10 border-white/20 hover:bg-white/20 text-white" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-navy-950"}`}>
      <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${tone === "self" ? "bg-white/15" : "bg-orange-100 text-orange-600"}`}><FileText className="h-4 w-4" /></span>
      <span className="min-w-0 flex-1"><span className="block text-[11px] font-bold truncate">{attachment.name}</span>{attachment.size && <span className="block text-[9px] opacity-70">{attachment.size}</span>}</span>
      <Download className="h-3.5 w-3.5 flex-shrink-0 opacity-70" />
    </a>
  );
}

function getCachedUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("cah_user");
    const value = raw ? JSON.parse(raw) : null;
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
}

export function ChatAvatar({ name, isSelf, profileImageId, profileImageUrl }: { name: string; isSelf: boolean; profileImageId?: string | null; profileImageUrl?: string | null }) {
  if (isSelf) {
    const cached = getCachedUser();
    return <UserAvatar name={name || cached?.name} profileImageId={profileImageId || cached?.profileImageId} profileImageUrl={profileImageUrl || cached?.profileImageUrl} size="sm" />;
  }
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold flex-shrink-0 shadow-sm bg-navy-950 text-white" title={name}>
      <UserRound className="h-4 w-4" aria-hidden="true" />
    </div>
  );
}

export function ChatBubble({ message, isSelf, fallbackName }: {
  message: { sender: string; senderName?: string; text: string; timestamp: string; attachments?: TicketAttachment[]; profileImageId?: string; profileImageUrl?: string };
  isSelf: boolean;
  fallbackName: string;
}) {
  const displayName = message.senderName || fallbackName;
  const hasText = !!message.text?.trim();
  const attachments = message.attachments || [];
  return (
    <div className={`flex items-end gap-2 ${isSelf ? "flex-row-reverse" : "flex-row"}`}>
      <ChatAvatar name={displayName} isSelf={isSelf} profileImageId={message.profileImageId} profileImageUrl={message.profileImageUrl} />
      <div className={`flex flex-col max-w-[78%] ${isSelf ? "items-end" : "items-start"}`}>
        <div className="flex items-center gap-2 mb-1 px-0.5"><span className="text-[10px] font-bold text-slate-500">{displayName}</span><span className="text-[9px] text-slate-400">{message.timestamp}</span></div>
        <div className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${isSelf ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-br-sm" : "bg-white text-navy-950 border border-slate-200 rounded-bl-sm"}`}>
          {hasText && <p className="whitespace-pre-wrap break-words">{linkify(message.text)}</p>}
          {attachments.map((a, i) => <AttachmentCard key={i} attachment={a} tone={isSelf ? "self" : "other"} />)}
          {!hasText && attachments.length === 0 && <span className="italic opacity-60 flex items-center gap-1"><FileText className="h-3 w-3" /> Empty message</span>}
        </div>
      </div>
    </div>
  );
}
