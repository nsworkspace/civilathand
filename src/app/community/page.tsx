"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown, ArrowLeft, Bell, Ban, Check, Clock, Copy, Compass, Crown,
  Forward, Flag, Link2, LogOut, Megaphone, Menu, MessageCircle, Paperclip,
  Pencil, RefreshCw, Reply, Search, Send, Settings2, ShieldCheck, Smile,
  Trash2, Users, X, CalendarDays, BookOpen, Headphones, Home, UserCircle,
  ExternalLink, Heart, MoreHorizontal, ImagePlus
} from "lucide-react";
import { auth } from "@/lib/firebase";
import UserAvatar from "@/components/UserAvatar";

const FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Crect width='160' height='160' fill='%230c1a2e'/%3E%3Ccircle cx='125' cy='35' r='70' fill='%23c8942a' fill-opacity='.22'/%3E%3Cpath d='M0 120L45 82l25 17 30-42 60 48v55H0z' fill='%23163354'/%3E%3C/svg%3E";
const EMOJI = ["😀","😂","😊","😍","🤩","😎","🤔","😅","😢","😭","😡","👍","👎","👏","🙏","💪","🤝","🔥","💡","✅","❌","⚠️","📌","🎉"];
const REACTIONS = ["👍","❤️","😂","😮","🙏","🔥","👏","💡"];
const POLL_MS = 2500;
const PRESENCE_POLL_MS = 6000;

type Message = {
  id: string;
  userId?: string;
  username: string;
  text: string;
  linkUrl?: string;
  profileImageId?: string;
  profileImageUrl?: string;
  imageData?: string;
  createdAt: string;
  mine?: boolean;
  edited?: boolean;
  reactions?: Record<string, number>;
  myReactions?: string[];
  replyTo?: { id: string; username: string; text: string; imageData?: boolean } | null;
};
type Space = {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  memberCount: number;
  announcement?: string;
  rules?: string;
  type: "group" | "channel";
  membershipStatus: "active" | "pending";
  lastMessage?: Message | null;
  ownerId?: string;
};
type Presence = { onlineCount: number; typingUsers: string[] };
type Member = { id: string; username: string; role: string; online: boolean; profileImageId?: string; profileImageUrl?: string; name?: string; profession?: string };

type CommunityProfile = {
  userId: string;
  name: string;
  username: string;
  profession: string;
  isSelf: boolean;
  profileImageId?: string;
  profileImageUrl?: string;
};

function safeCachedUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("cah_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function dayLabel(iso: string) {
  const d = new Date(iso), today = new Date(), yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: d.getFullYear() === today.getFullYear() ? undefined : "numeric" });
}

export default function CommunityPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profileCache, setProfileCache] = useState<any>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selected, setSelected] = useState<Space | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageData, setImageData] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState<CommunityProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [presence, setPresence] = useState<Presence>({ onlineCount: 0, typingUsers: [] });
  const [atBottom, setAtBottom] = useState(true);
  const [unread, setUnread] = useState(0);
  const [muted, setMuted] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastCountRef = useRef(0);
  const atBottomRef = useRef(true);
  const pollBusyRef = useRef(false);
  const selectedRef = useRef("");

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    setProfileCache(safeCachedUser());
    const onStorage = () => setProfileCache(safeCachedUser());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const loadSpaces = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/community/my-spaces", { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Unable to load your community.");
      setSpaces(Array.isArray(data.spaces) ? data.spaces : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load your community.");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (space: Space) => {
    if (!user || pollBusyRef.current) return;
    pollBusyRef.current = true;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/community/groups/${encodeURIComponent(space.id)}/messages`, { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Unable to load messages.");
      if (selectedRef.current !== space.id) return;
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to load messages.");
    } finally {
      pollBusyRef.current = false;
    }
  };

  const loadMembers = async (space: Space) => {
    if (!user || space.type !== "group") {
      setMembers([]);
      return;
    }
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/community/groups/${encodeURIComponent(space.id)}/members`, { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && Array.isArray(data.members)) setMembers(data.members);
    } catch {
      // best effort
    }
  };

  const loadPresence = async (space: Space) => {
    if (!user || space.type !== "group") {
      setPresence({ onlineCount: 0, typingUsers: [] });
      return;
    }
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/community/groups/${encodeURIComponent(space.id)}/presence`, { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && selectedRef.current === space.id) setPresence({ onlineCount: Number(data.onlineCount) || 0, typingUsers: Array.isArray(data.typingUsers) ? data.typingUsers : [] });
    } catch {
      // best effort
    }
  };

  const openSpace = async (space: Space) => {
    selectedRef.current = space.id;
    setSelected(space);
    setMessages([]);
    setMembers([]);
    setNotice("");
    setMessageSearch("");
    setDraft("");
    setLinkUrl("");
    setImageData("");
    setReplyTo(null);
    setMenuId(null);
    setEmojiOpen(false);
    setAtBottom(true);
    atBottomRef.current = true;
    setUnread(0);
    await loadMessages(space);
    void loadMembers(space);
    void loadPresence(space);
  };

  useEffect(() => { if (user) void loadSpaces(); }, [user]);

  useEffect(() => {
    if (!user || !spaces.length) return;
    const groupId = searchParams.get("group");
    if (!groupId || selectedRef.current === groupId) return;
    const target = spaces.find(s => s.id === groupId);
    if (target) void openSpace(target);
  }, [user, spaces, searchParams]);

  useEffect(() => {
    if (!selected || !user) return;
    const id = selected.id;
    const timer = window.setInterval(() => {
      if (selectedRef.current === id) void loadMessages(selected);
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [selected?.id, user?.uid]);

  useEffect(() => {
    if (!selected || !user || selected.type !== "group") return;
    const id = selected.id;
    const timer = window.setInterval(() => {
      if (selectedRef.current === id) void loadPresence(selected);
    }, PRESENCE_POLL_MS);
    return () => window.clearInterval(timer);
  }, [selected?.id, user?.uid]);

  useEffect(() => {
    const previous = lastCountRef.current;
    const delta = messages.length - previous;
    lastCountRef.current = messages.length;
    if (delta <= 0) return;
    if (atBottomRef.current) {
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }));
    } else {
      setUnread(v => v + delta);
    }
  }, [messages.length]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }));
    setAtBottom(true);
    atBottomRef.current = true;
    setUnread(0);
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setAtBottom(bottom);
    atBottomRef.current = bottom;
    if (bottom) setUnread(0);
  };

  const sendTyping = async (typing: boolean) => {
    if (!user || !selected || selected.type !== "group") return;
    try {
      const token = await user.getIdToken();
      await fetch(`/api/community/groups/${encodeURIComponent(selected.id)}/presence`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ typing }),
      });
    } catch {
      // best effort
    }
  };

  const sendMessage = async () => {
    if (!user || !selected || selected.type !== "group") return;
    const text = draft.trim();
    const link = linkUrl.trim();
    if (!text && !link && !imageData) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/community/groups/${encodeURIComponent(selected.id)}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ text, linkUrl: link, imageData, replyToId: replyTo?.id || "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Unable to send message.");
      if (data.message) setMessages(prev => [...prev.filter(m => m.id !== data.message.id), data.message]);
      setDraft(""); setLinkUrl(""); setImageData(""); setReplyTo( null); setEmojiOpen(false);
      void sendTyping(false);
      scrollToBottom();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to send message.");
    }
  };

  const messageAction = async (message: Message, action: string, extra: Record<string, unknown> = {}) => {
    if (!user || !selected) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/community/groups/${encodeURIComponent(selected.id)}/messages`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: message.id, action, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Message action failed.");
      if (action === "delete") setMessages(prev => prev.filter(m => m.id !== message.id));
      else if (data.message) setMessages(prev => prev.map(m => m.id === message.id ? data.message : m));
      setMenuId(null);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Message action failed.");
    }
  };

  const copyMessage = async (message: Message) => {
    try {
      await navigator.clipboard?.writeText([message.text, message.linkUrl].filter(Boolean).join("\n") || "Shared image");
      setNotice("Message copied to clipboard.");
    } catch {
      setNotice("Copy is not available in this browser.");
    }
    setMenuId(null);
  };

  const shareMessage = async (message: Message) => {
    try {
      const text = [message.text, message.linkUrl].filter(Boolean).join("\n") || "Shared image";
      if (navigator.share) await navigator.share({ title: `@${message.username} in Community`, text, url: message.linkUrl || window.location.href });
      else await navigator.clipboard?.writeText(text);
      setNotice("Share ready.");
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) setNotice("Unable to share this message.");
    }
    setMenuId(null);
  };

  const openProfile = async (userId: string) => {
    if (!user || !selected || selected.type !== "group" || !userId) return;
    setProfileLoading(true);
    setProfileOpen(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/community/groups/${encodeURIComponent(selected.id)}/members/${encodeURIComponent(userId)}`, { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success || !data.profile) throw new Error(data.error || "Unable to load this member.");
      setProfileOpen({ userId, name: data.profile.name, username: data.profile.username, profession: data.profile.profession, isSelf: !!data.profile.isSelf, profileImageId: data.profile.profileImageId, profileImageUrl: data.profile.profileImageUrl });
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to load this member.");
    } finally {
      setProfileLoading(false);
    }
  };

  const copyInviteLink = async () => {
    if (!selected) return;
    try {
      await navigator.clipboard?.writeText(`${window.location.origin}/community?group=${encodeURIComponent(selected.id)}`);
      setNotice("Community link copied.");
    } catch {
      setNotice("Copy is not available in this browser.");
    }
  };

  const leaveGroup = async () => {
    if (!user || !selected || selected.type !== "group") return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/community/groups/${encodeURIComponent(selected.id)}/members/${encodeURIComponent(user.uid)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Unable to leave community.");
      setSpaces(prev => prev.filter(s => s.id !== selected.id));
      setSelected(null);
      selectedRef.current = "";
      setSettingsOpen(false);
      router.replace("/community");
      setNotice(`You left \"${selected.name}\".`);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to leave community.");
    }
  };

  const pickImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setNotice("Please choose an image."); return; }
    if (file.size > 1024 * 1024) { setNotice("Image must be 1 MB or smaller."); return; }
    const reader = new FileReader();
    reader.onload = () => setImageData(String(reader.result || ""));
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const filteredSpaces = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return spaces;
    return spaces.filter(s => `${s.name} ${s.description} ${s.category}`.toLowerCase().includes(query));
  }, [spaces, search]);

  const filteredMessages = useMemo(() => {
    const q = messageSearch.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter(m => `${m.username} ${m.text} ${m.linkUrl || ""}`.toLowerCase().includes(q));
  }, [messages, messageSearch]);

  const stats = useMemo(() => {
    const channels = spaces.filter(s => s.type === "channel").length;
    const groups = spaces.filter(s => s.type === "group").length;
    const unreadCount = spaces.filter(s => s.lastMessage).length;
    const members = spaces.reduce((sum, s) => sum + (Number(s.memberCount) || 0), 0);
    return { channels, groups, unreadCount, members };
  }, [spaces]);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    spaces.forEach(s => map.set(s.category || "Community", (map.get(s.category || "Community") || 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [spaces]);

  if (!user) return (
    <main className="grid min-h-[100dvh] place-items-center bg-[#eef2f6] p-5">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-navy-950 shadow-lg shadow-orange-500/20"><MessageCircle className="h-8 w-8" /></div>
        <h1 className="mt-4 text-2xl font-black text-navy-950">Community</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to access your joined conversations.</p>
        <a href={`/auth?mode=signin&redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : "/community")}`} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-navy-950 px-5 text-sm font-black text-white">Sign in</a>
      </div>
    </main>
  );

  return (
    <main className="min-h-[100dvh] bg-[#eef2f6] p-0 md:p-4">
      <div className="mx-auto flex min-h-[100dvh] max-w-[1550px] flex-col overflow-hidden bg-white md:min-h-[calc(100dvh-2rem)] md:rounded-[28px] md:border md:border-slate-200 md:shadow-[0_24px_80px_rgba(15,23,42,.12)]">
        {!selected ? (
          <LandingView
            user={user}
            profileCache={profileCache}
            filteredSpaces={filteredSpaces}
            allSpaces={spaces}
            loading={loading}
            search={search}
            setSearch={setSearch}
            stats={stats}
            categories={categories}
            onOpenSpace={(space) => void openSpace(space)}
            onRefresh={() => void loadSpaces()}
            notice={notice}
            error={error}
            onDismiss={() => setNotice("")}
            mobileNavOpen={mobileNavOpen}
            setMobileNavOpen={setMobileNavOpen}
          />
        ) : selected.membershipStatus === "pending" ? (
          <div className="flex min-h-[100dvh] flex-col bg-[#f7f9fb] md:min-h-0">
            <ConversationHeader selected={selected} onBack={() => { setSelected(null); selectedRef.current = ""; }} onSettings={() => setSettingsOpen(true)} presence={presence} />
            <div className="grid flex-1 place-items-center px-6 text-center">
              <div className="max-w-sm">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 text-amber-700"><Clock className="h-8 w-8" /></div>
                <h2 className="mt-5 text-xl font-black text-navy-950">Awaiting approval</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Your request to join <b>{selected.name}</b> is pending approval from a community admin.</p>
                <button onClick={() => { setSelected(null); selectedRef.current = ""; }} className="mt-5 rounded-xl bg-navy-950 px-4 py-2.5 text-xs font-black text-white">Back to Community</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[100dvh] flex-col bg-[radial-gradient(circle_at_top,_#fff,_#f7f9fb_48%,_#f1f4f7)] md:min-h-0">
            <ConversationHeader selected={selected} onBack={() => { setSelected(null); selectedRef.current = ""; router.replace("/community"); }} onSettings={() => setSettingsOpen(true)} presence={presence} />
            {notice && <div className="flex items-center gap-3 border-b bg-orange-50 px-4 py-2.5 text-xs font-bold text-navy-900"><span className="flex-1">{notice}</span><button onClick={() => setNotice("")} className="rounded-lg p-1 hover:bg-orange-100"><X className="h-3.5 w-3.5" /></button></div>}
            <div ref={scrollRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5">
              <div className="mx-auto max-w-4xl">
                <label className="mb-4 flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 shadow-sm focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100"><Search className="h-3.5 w-3.5 text-slate-400" /><input value={messageSearch} onChange={e => setMessageSearch(e.target.value)} placeholder="Search messages" className="min-w-0 flex-1 bg-transparent text-xs outline-none" /><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">{filteredMessages.length}</span></label>
                {selected.announcement && <div className="mb-4 rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4"><div className="text-[9px] font-black uppercase tracking-wider text-orange-700">Pinned announcement</div><p className="mt-1 text-sm font-semibold leading-6 text-navy-950">{selected.announcement}</p></div>}
                {chatLoading ? <div className="py-24 text-center text-xs text-slate-400">Loading conversation…</div> : filteredMessages.length ? filteredMessages.map((message, index) => {
                  const prev = filteredMessages[index - 1];
                  const sameUser = !!prev && prev.userId && prev.userId === message.userId && (new Date(message.createdAt).getTime() - new Date(prev.createdAt).getTime()) < 5 * 60 * 1000;
                  const newDay = !prev || dayLabel(prev.createdAt) !== dayLabel(message.createdAt);
                  return <div key={message.id}>
                    {newDay && <div className="my-4 flex items-center gap-3 text-[9px] font-black uppercase tracking-wider text-slate-400"><span className="h-px flex-1 bg-slate-200" />{dayLabel(message.createdAt)}<span className="h-px flex-1 bg-slate-200" /></div>}
                    <div className={`group mb-2 flex gap-2.5 ${message.mine ? "flex-row-reverse" : ""}`}>
                      <button onClick={e => { e.stopPropagation(); if (message.userId && !message.mine) void openProfile(message.userId); }} className={`mt-1 shrink-0 ${message.mine ? "cursor-default" : "cursor-pointer"} ${sameUser ? "invisible" : ""}`} aria-label={`${message.username} profile`}>
                        <UserAvatar name={message.username} profileImageId={message.profileImageId} profileImageUrl={message.profileImageUrl} size="sm" />
                      </button>
                      <div className={`relative max-w-[91%] sm:max-w-[75%] ${message.mine ? "items-end" : "items-start"}`}>
                        {!sameUser && <div className={`mb-1 flex items-center gap-2 text-[9px] text-slate-400 ${message.mine ? "justify-end" : ""}`}><button onClick={() => { if (message.userId && !message.mine) void openProfile(message.userId); }} className="font-black text-slate-600 hover:underline">@{message.username}</button><span>{new Date(message.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>{message.edited && <span>edited</span>}</div>}
                        <div onClick={() => setMenuId(menuId === message.id ? null : message.id)} className={`relative cursor-pointer rounded-[1.25rem] border px-3.5 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${message.mine ? "rounded-tr-md border-navy-900 bg-gradient-to-br from-navy-950 to-navy-800 text-white" : "rounded-tl-md border-slate-200 bg-white text-slate-700"}`}>
                          {message.replyTo && <button onClick={e => { e.stopPropagation(); document.getElementById(`msg-${message.replyTo?.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }} className="mb-2 w-full rounded-xl bg-slate-100/10 px-2.5 py-2 text-left text-[9px]"><b>↩ @{message.replyTo.username}</b> · {message.replyTo.text || "Image"}</button>}
                          {message.imageData && <img src={message.imageData} alt="Shared" onClick={e => { e.stopPropagation(); setLightbox(message.imageData || null); }} className="mb-2 max-h-72 w-full rounded-xl object-contain" />}
                          {message.text && <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.text}</p>}
                          {message.linkUrl && <a href={message.linkUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="mt-2 flex items-center gap-2 break-all text-xs font-bold text-orange-400 hover:underline"><Link2 className="h-3.5 w-3.5 shrink-0" />{message.linkUrl}</a>}
                          {Object.entries(message.reactions || {}).filter(([, count]) => Number(count) > 0).length > 0 && <div className="mt-2 flex flex-wrap gap-1">{Object.entries(message.reactions || {}).filter(([, count]) => Number(count) > 0).map(([emoji, count]) => <button key={emoji} onClick={e => { e.stopPropagation(); void messageAction(message, "react", { emoji }); }} className="rounded-full bg-slate-100 px-2 py-1 text-[9px]">{emoji} {count}</button>)}</div>}
                          <div id={`msg-${message.id}`} className="mt-1 flex items-center justify-end gap-1 text-[8px] opacity-50"><span>{message.mine ? "You" : ""}</span>{message.mine && <Check className="h-3 w-3" />}</div>
                        </div>
                        {menuId === message.id && <div className={`absolute top-12 z-50 w-[min(88vw,280px)] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl ${message.mine ? "right-0" : "left-0"}`} onClick={e => e.stopPropagation()}>
                          <div className="grid grid-cols-4 gap-1 border-b border-slate-100 pb-2">{REACTIONS.map(emoji => <button key={emoji} onClick={() => void messageAction(message, "react", { emoji })} className="rounded-xl py-2 text-base hover:bg-slate-50">{emoji}</button>)}</div>
                          <div className="grid grid-cols-4 gap-1 pt-2 text-[9px] font-bold text-slate-600">
                            <MenuButton icon={<Reply className="h-3.5 w-3.5" />} text="Reply" onClick={() => { setReplyTo(message); setMenuId(null); }} />
                            <MenuButton icon={<Forward className="h-3.5 w-3.5" />} text="Forward" onClick={() => void shareMessage(message)} />
                            <MenuButton icon={<Copy className="h-3.5 w-3.5" />} text="Copy" onClick={() => void copyMessage(message)} />
                            <MenuButton icon={<Heart className="h-3.5 w-3.5" />} text="React" onClick={() => void messageAction(message, "react", { emoji: "❤️" })} />
                          </div>
                          {message.mine && <div className="mt-2 border-t pt-1"><MenuRow icon={<Pencil className="h-3.5 w-3.5" />} text="Edit message" onClick={() => { setEditing(message); setEditDraft(message.text); setMenuId(null); }} /><MenuRow icon={<Trash2 className="h-3.5 w-3.5" />} text="Delete message" danger onClick={() => void messageAction(message, "delete")} /></div>}
                        </div>}
                      </div>
                    </div>
                  </div>;
                }) : <div className="grid min-h-[45vh] place-items-center text-center text-slate-400"><div><MessageCircle className="mx-auto h-10 w-10" /><p className="mt-3 text-sm font-black">No messages yet</p><p className="mt-1 text-xs">Start the conversation.</p></div></div>}
              </div>
            </div>

            {lightbox && <div onClick={() => setLightbox(null)} className="fixed inset-0 z-[200] grid place-items-center bg-black/85 p-4"><button onClick={() => setLightbox(null)} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white"><X className="h-5 w-5" /></button><img src={lightbox} alt="Full size" onClick={e => e.stopPropagation()} className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain" /></div>}
            {!atBottom && <button onClick={scrollToBottom} className="absolute bottom-28 right-4 z-30 grid h-11 w-11 place-items-center rounded-full bg-navy-950 text-white shadow-xl sm:right-8" aria-label="Scroll to latest"><ArrowDown className="h-4 w-4" />{unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1 text-[9px] font-black text-navy-950">{unread > 9 ? "9+" : unread}</span>}</button>}

            {selected.type === "group" ? <div className="border-t border-slate-200 bg-white/95 p-2.5 backdrop-blur sm:p-3"><div className="mx-auto max-w-4xl">
              {presence.typingUsers.length > 0 && <div className="mb-2 flex items-center gap-1.5 px-1 text-[10px] font-bold text-orange-700">{presence.typingUsers.slice(0, 2).join(", ")}{presence.typingUsers.length > 1 ? " are" : " is"} typing…</div>}
              {replyTo && <div className="mb-2 flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-[10px]"><Reply className="h-3.5 w-3.5 text-orange-600" /><span className="min-w-0 flex-1 truncate"><b>Replying to @{replyTo.username}</b> · {replyTo.text || "Image"}</span><button onClick={() => setReplyTo(null)} className="rounded p-0.5"><X className="h-3.5 w-3.5" /></button></div>}
              {imageData && <div className="mb-2 flex items-center gap-2 rounded-xl border bg-slate-50 p-1.5"><img src={imageData} alt="Preview" className="h-14 w-14 rounded-xl object-cover" /><span className="min-w-0 flex-1 truncate text-[10px] font-bold text-slate-500">Image ready to send</span><button onClick={() => setImageData("")} className="rounded p-1"><X className="h-4 w-4" /></button></div>}
              {linkUrl && <div className="mb-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5"><Link2 className="h-3.5 w-3.5 text-orange-600" /><input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="Paste a link" className="min-w-0 flex-1 bg-transparent text-xs outline-none" /><button onClick={() => setLinkUrl("")}><X className="h-3.5 w-3.5" /></button></div>}
              <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 shadow-inner focus-within:border-orange-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100">
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={pickImage} className="hidden" />
                <button onClick={() => fileRef.current?.click()} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl hover:bg-white" title="Attach image"><Paperclip className="h-4 w-4 text-slate-500" /></button>
                <button onClick={() => setLinkUrl(v => v ? "" : "https://")} className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${linkUrl ? "bg-orange-50 text-orange-700" : "text-slate-500 hover:bg-white"}`} title="Add link"><Link2 className="h-4 w-4" /></button>
                <textarea value={draft} onChange={e => { setDraft(e.target.value.slice(0, 4000)); void sendTyping(true); }} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }} placeholder="Write a message…" className="min-h-10 max-h-28 min-w-0 flex-1 resize-none bg-transparent px-1.5 py-2 text-sm outline-none" />
                <button onClick={() => setEmojiOpen(v => !v)} className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${emojiOpen ? "bg-orange-50 text-orange-700" : "text-slate-500 hover:bg-white"}`} title="Emoji"><Smile className="h-4 w-4" /></button>
                <button onClick={() => void sendMessage()} disabled={!draft.trim() && !linkUrl.trim() && !imageData} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy-950 text-white shadow-md disabled:opacity-30 sm:w-auto sm:px-4"><Send className="h-4 w-4 text-orange-400" /><span className="ml-2 hidden text-xs font-black sm:inline">Send</span></button>
              </div>
              {emojiOpen && <div className="mt-2 flex max-h-32 flex-wrap gap-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">{EMOJI.map(emoji => <button key={emoji} onClick={() => setDraft(v => v + emoji)} className="rounded-lg px-2 py-1 text-lg hover:bg-slate-50">{emoji}</button>)}</div>}
            </div></div> : <div className="border-t bg-white px-4 py-3 text-center text-[9px] font-bold text-slate-400"><Megaphone className="mr-1 inline h-3.5 w-3.5 text-orange-600" /> Broadcast channel · react, reply, copy or share.</div>}
          </div>
        )}
      </div>

      {settingsOpen && selected && <SettingsModal selected={selected} muted={muted} members={members} onToggleMute={() => setMuted(v => !v)} onCopy={copyInviteLink} onLeave={leaveGroup} onClose={() => setSettingsOpen(false)} onProfile={(member) => void openProfile(member.id)} />}
      {(profileLoading || profileOpen) && <ProfileModal profile={profileOpen} loading={profileLoading} onClose={() => setProfileOpen(null)} />}
      {editing && <div className="fixed inset-0 z-[160] grid place-items-center bg-navy-950/60 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-center gap-2"><h3 className="flex-1 text-lg font-black text-navy-950">Edit message</h3><button onClick={() => setEditing(null)} className="rounded-lg p-1"><X className="h-5 w-5" /></button></div><textarea value={editDraft} onChange={e => setEditDraft(e.target.value.slice(0, 4000))} className="mt-4 min-h-28 w-full rounded-xl border p-3 text-sm outline-none focus:border-orange-300" /><div className="mt-3 flex justify-end gap-2"><button onClick={() => setEditing(null)} className="rounded-xl border px-4 py-2 text-xs font-black">Cancel</button><button onClick={() => { if (editing && editDraft.trim()) void messageAction(editing, "edit", { text: editDraft.trim() }); setEditing(null); }} className="rounded-xl bg-navy-950 px-4 py-2 text-xs font-black text-white">Save</button></div></div></div>}
    </main>
  );
}

function LandingView({ user, profileCache, filteredSpaces, allSpaces, loading, search, setSearch, stats, categories, onOpenSpace, onRefresh, notice, error, onDismiss, mobileNavOpen, setMobileNavOpen }: any) {
  const channels = filteredSpaces.filter((s: Space) => s.type === "channel");
  const groups = filteredSpaces.filter((s: Space) => s.type === "group");
  const displaySpaces = filteredSpaces.slice(0, 8);
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f8fafc] md:min-h-0">
      <div className="flex min-h-16 items-center border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-navy-950 shadow-lg shadow-orange-500/20"><MessageCircle className="h-5 w-5" /></div>
          <div className="min-w-0"><h1 className="text-lg font-black tracking-tight text-navy-950">Community</h1><p className="hidden text-[10px] text-slate-400 sm:block">Connect. Share. Grow together.</p></div>
        </div>
        <div className="hidden min-w-[280px] max-w-md flex-1 lg:block">
          <label className="mx-auto flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100"><Search className="h-4 w-4 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search communities, groups or people…" className="min-w-0 flex-1 bg-transparent text-xs outline-none" /></label>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <a href="/community/explore" className="hidden min-h-10 items-center gap-2 rounded-xl bg-navy-950 px-4 text-xs font-black text-white transition hover:bg-navy-800 sm:inline-flex"><Compass className="h-4 w-4 text-orange-400" /> Explore</a>
          <a href="/community/explore" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 sm:hidden" aria-label="Explore"><Compass className="h-4 w-4" /></a>
          <div className="relative hidden sm:block"><Bell className="h-5 w-5 text-slate-500" /><span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-orange-500 px-1 text-[8px] font-black text-white">{Math.min(9, stats.channels + stats.groups)}</span></div>
          <a href="/profile" className="hidden sm:block"><UserAvatar name={profileCache?.name || user.displayName || user.email || "User"} profileImageId={profileCache?.profileImageId} profileImageUrl={profileCache?.profileImageUrl} size="sm" /></a>
          <button onClick={() => setMobileNavOpen(v => !v)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 sm:hidden" aria-label="Menu"><Menu className="h-5 w-5" /></button>
        </div>
      </div>

      {mobileNavOpen && <div className="border-b border-slate-200 bg-white px-4 py-3 sm:hidden"><div className="mb-3 flex items-center gap-2"><UserAvatar name={profileCache?.name || user.displayName || user.email || "User"} profileImageId={profileCache?.profileImageId} profileImageUrl={profileCache?.profileImageUrl} size="sm" /><a href="/profile" onClick={() => setMobileNavOpen(false)} className="text-xs font-black text-navy-950">My Profile</a></div><div className="grid grid-cols-2 gap-2"><MobileLink href="/" icon={<Home className="h-4 w-4" />} text="Home" close={() => setMobileNavOpen(false)} /><MobileLink href="/community/explore" icon={<Compass className="h-4 w-4" />} text="Explore" close={() => setMobileNavOpen(false)} /><MobileLink href="/events" icon={<CalendarDays className="h-4 w-4" />} text="Events" close={() => setMobileNavOpen(false)} /><MobileLink href="/blog" icon={<BookOpen className="h-4 w-4" />} text="Blog" close={() => setMobileNavOpen(false)} /><MobileLink href="/talk" icon={<Headphones className="h-4 w-4" />} text="Talk to us" close={() => setMobileNavOpen(false)} /><MobileLink href="/profile" icon={<UserCircle className="h-4 w-4" />} text="Profile" close={() => setMobileNavOpen(false)} /></div></div>}

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {error && <div className="mb-5 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700"><span className="flex-1">{error}</span><button onClick={onRefresh} className="rounded-lg border border-rose-200 bg-white px-3 py-1.5"><RefreshCw className="mr-1 inline h-3 w-3" />Retry</button></div>}
        {notice && <div className="mb-5 flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-xs font-bold text-navy-900"><span className="flex-1">{notice}</span><button onClick={onDismiss}><X className="h-4 w-4" /></button></div>}

        <div className="mb-6 lg:hidden"><label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:ring-2 focus-within:ring-orange-100"><Search className="h-4 w-4 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your communities…" className="min-w-0 flex-1 bg-transparent text-xs outline-none" /></label></div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={<Megaphone className="h-5 w-5" />} title="Channels" value={stats.channels} meta="Joined channels" />
          <StatCard icon={<Users className="h-5 w-5" />} title="Groups" value={stats.groups} meta="Active groups" />
          <StatCard icon={<UserCircle className="h-5 w-5" />} title="Members" value={stats.members} meta="Across your spaces" />
          <StatCard icon={<MessageCircle className="h-5 w-5" />} title="Conversations" value={allSpaces.length} meta="Your joined spaces" />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,.72fr)]">
          <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3"><div><div className="text-[9px] font-black uppercase tracking-[.2em] text-orange-600">Your channels</div><h2 className="mt-1 text-lg font-black text-navy-950">Stay close to what matters</h2></div><a href="/community/explore" className="text-xs font-black text-orange-600 hover:underline">View all</a></div>
            {loading ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(i => <div key={i} className="h-52 animate-pulse rounded-2xl bg-slate-100" />)}</div> : channels.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{channels.slice(0,6).map((space: Space) => <SpaceCard key={space.id} space={space} onOpen={onOpenSpace} />)}</div> : <EmptyState title="No joined channels yet" description="Explore and join a channel to see it here." href="/community/explore" />}
          </section>

          <aside className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between"><div><div className="text-[9px] font-black uppercase tracking-[.2em] text-orange-600">Explore</div><h2 className="mt-1 text-lg font-black text-navy-950">Trending in your spaces</h2></div><a href="/community/explore" className="text-xs font-black text-orange-600">View all</a></div>
            <div className="space-y-2">{categories.length ? categories.map(([name, count], i) => <a key={name} href="/community/explore" className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 transition hover:bg-slate-50"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600"><ExternalLink className="h-4 w-4" /></span><span className="min-w-0 flex-1"><b className="block truncate text-sm text-navy-950">{name}</b><span className="text-[10px] text-slate-400">{count} joined space{count === 1 ? "" : "s"}</span></span><span className="text-[10px] font-black text-slate-300">0{i + 1}</span></a>) : <p className="py-8 text-center text-xs text-slate-400">Your category activity will appear here.</p>}</div>
          </aside>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)]">
          <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3"><div><div className="text-[9px] font-black uppercase tracking-[.2em] text-orange-600">Groups you’re in</div><h2 className="mt-1 text-lg font-black text-navy-950">Your conversations</h2></div><a href="/community/explore" className="text-xs font-black text-orange-600">View all</a></div>
            {groups.length ? <div className="divide-y divide-slate-100">{groups.slice(0,8).map((space: Space) => <button key={space.id} onClick={() => onOpenSpace(space)} className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-slate-50"><img src={space.imageUrl || FALLBACK} alt="" className="h-12 w-12 shrink-0 rounded-2xl object-cover shadow-sm" /><span className="min-w-0 flex-1"><b className="block truncate text-sm text-navy-950">{space.name}</b><span className="mt-0.5 block truncate text-[10px] text-slate-400">{space.category || "Community"} · {space.memberCount} members</span></span><span className="hidden text-[10px] font-bold text-slate-400 sm:block">{space.lastMessage?.text || space.description}</span><span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-slate-400"><MoreHorizontal className="h-4 w-4" /></span></button>)}</div> : <EmptyState title="No joined groups yet" description="Explore groups and request access from one place." href="/community/explore" />}
          </section>

          <aside className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
            <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="mb-4 flex items-center justify-between"><div><div className="text-[9px] font-black uppercase tracking-[.2em] text-orange-600">Upcoming</div><h2 className="mt-1 text-lg font-black text-navy-950">Events</h2></div><a href="/events" className="text-xs font-black text-orange-600">View all</a></div><a href="/events" className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 transition hover:bg-slate-100"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-orange-600 shadow-sm"><CalendarDays className="h-5 w-5" /></div><div className="min-w-0 flex-1"><b className="block text-sm text-navy-950">See upcoming events</b><span className="text-[10px] text-slate-400">Workshops, community sessions and more</span></div><ArrowDown className="h-4 w-4 -rotate-90 text-slate-400" /></a></section>
            <section className="rounded-[22px] bg-navy-950 p-5 text-white shadow-sm"><div className="text-[9px] font-black uppercase tracking-[.2em] text-orange-300">Need help?</div><h2 className="mt-1 text-lg font-black">Talk to Civil At Hand</h2><p className="mt-2 text-xs leading-5 text-slate-300">Ask a question, start a live support conversation or open your profile.</p><div className="mt-4 grid grid-cols-2 gap-2"><a href="/talk" className="rounded-xl bg-orange-500 px-3 py-2.5 text-center text-[10px] font-black text-white hover:bg-orange-600">Talk to us</a><a href="/profile" className="rounded-xl bg-white/10 px-3 py-2.5 text-center text-[10px] font-black text-white hover:bg-white/15">My profile</a></div></section>
          </aside>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-600"><BookOpen className="h-5 w-5" /></div><div><b className="block text-sm text-navy-950">Learn, share and keep moving</b><span className="text-[10px] text-slate-400">Open the latest blog and learning content</span></div></div><a href="/blog" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-black text-navy-950 hover:bg-slate-50">Open Blog <ExternalLink className="h-3.5 w-3.5" /></a></div>
      </div>

      <nav className="sticky bottom-0 z-50 mt-auto grid grid-cols-5 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
        <BottomNav href="/" icon={<Home className="h-4 w-4" />} text="Home" />
        <BottomNav href="/community/explore" icon={<Compass className="h-4 w-4" />} text="Explore" />
        <BottomNav href="/community" active icon={<Users className="h-4 w-4" />} text="Community" />
        <BottomNav href="/events" icon={<CalendarDays className="h-4 w-4" />} text="Events" />
        <BottomNav href="/profile" icon={<UserCircle className="h-4 w-4" />} text="Profile" />
      </nav>
    </div>
  );
}

function SpaceCard({ space, onOpen }: { space: Space; onOpen: (space: Space) => void }) {
  return <button onClick={() => onOpen(space)} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:-translate-y-0.5 hover:shadow-lg"><div className="relative h-40 overflow-hidden bg-slate-950"><img src={space.imageUrl || FALLBACK} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /><span className="absolute left-3 bottom-3 rounded-full bg-white px-2.5 py-1 text-[9px] font-black text-navy-950 shadow-sm">{space.membershipStatus === "pending" ? "Pending" : "Joined"}</span></div><div className="p-3.5"><div className="flex items-center gap-2"><h3 className="min-w-0 flex-1 truncate text-sm font-black text-navy-950">{space.name}</h3>{space.type === "channel" ? <Megaphone className="h-4 w-4 shrink-0 text-orange-500" /> : <MessageCircle className="h-4 w-4 shrink-0 text-slate-400" />}</div><p className="mt-1 line-clamp-2 text-[10px] leading-5 text-slate-500">{space.description || space.announcement || "Community conversation"}</p><div className="mt-3 flex items-center justify-between text-[9px] font-bold text-slate-400"><span>{space.memberCount} members</span><span>{space.category || "Community"}</span></div></div></button>;
}

function StatCard({ icon, title, value, meta }: { icon: React.ReactNode; title: string; value: number; meta: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600">{icon}</span><div><span className="block text-[10px] font-bold text-slate-400">{title}</span><b className="block text-2xl font-black tracking-tight text-navy-950">{value}</b></div></div><p className="mt-3 text-[10px] text-slate-400">{meta}</p></div>;
}

function EmptyState({ title, description, href }: { title: string; description: string; href: string }) {
  return <div className="grid min-h-[180px] place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center"><div><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-orange-500 shadow-sm"><Compass className="h-5 w-5" /></div><h3 className="mt-3 text-sm font-black text-navy-950">{title}</h3><p className="mt-1 max-w-xs text-[10px] leading-5 text-slate-400">{description}</p><a href={href} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-xl bg-navy-950 px-3 text-[10px] font-black text-white">Explore communities <ArrowDown className="h-3.5 w-3.5 -rotate-90" /></a></div></div>;
}

function ConversationHeader({ selected, onBack, onSettings, presence }: { selected: Space; onBack: () => void; onSettings: () => void; presence: Presence }) {
  return <header className="flex min-h-[72px] items-center gap-3 border-b border-slate-200/80 bg-white/95 px-3 shadow-sm backdrop-blur sm:px-5"><button onClick={onBack} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 lg:hidden" aria-label="Back"><ArrowLeft className="h-4 w-4" /></button><img src={selected.imageUrl || FALLBACK} alt="" className="h-11 w-11 rounded-2xl object-cover shadow-sm" /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="truncate text-base font-black tracking-tight text-navy-950">{selected.name}</h2><span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-black uppercase text-slate-500">{selected.type}</span></div><div className="flex items-center gap-1 truncate text-[10px] text-slate-400"><span>{selected.memberCount} members · {selected.category}</span>{selected.type === "group" && presence.onlineCount > 0 && <span className="ml-1 inline-flex items-center gap-1 font-bold text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500" />{presence.onlineCount} online</span>}</div></div><button onClick={onSettings} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200"><Settings2 className="h-4 w-4 text-slate-500" /></button></header>;
}

function SettingsModal({ selected, muted, members, onToggleMute, onCopy, onLeave, onClose, onProfile }: { selected: Space; muted: boolean; members: Member[]; onToggleMute: () => void; onCopy: () => void; onLeave: () => void; onClose: () => void; onProfile: (member: Member) => void }) {
  return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4" onClick={onClose}><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between"><h3 className="text-lg font-black text-navy-950">Community settings</h3><button onClick={onClose}><X className="h-5 w-5" /></button></div><div className="mt-4 rounded-xl bg-slate-50 p-3"><div className="flex items-center gap-3"><img src={selected.imageUrl || FALLBACK} alt="" className="h-12 w-12 rounded-2xl object-cover" /><div><b className="block text-sm">{selected.name}</b><span className="text-xs text-slate-500">{selected.type} · {selected.memberCount} members</span></div></div><p className="mt-2 text-xs leading-5 text-slate-500">{selected.description}</p></div><div className="mt-4 space-y-2"><button onClick={onCopy} className="flex w-full items-center gap-2 rounded-xl border p-3 text-left hover:bg-slate-50"><Link2 className="h-4 w-4 text-orange-600" /><span className="text-sm font-bold">Copy community link</span></button><button onClick={onToggleMute} className="flex w-full items-center justify-between rounded-xl border p-3 text-left hover:bg-slate-50"><span className="text-sm font-bold">{muted ? "Unmute notifications" : "Mute notifications"}</span><Bell className={`h-4 w-4 ${muted ? "text-orange-500" : "text-slate-400"}`} /></button><button onClick={onClose} className="flex w-full items-center gap-2 rounded-xl border p-3 text-left hover:bg-slate-50"><Flag className="h-4 w-4 text-amber-500" /><span className="text-sm font-bold">Report community</span></button></div><div className="mt-4"><div className="mb-2 text-xs font-black uppercase text-slate-400">Members</div><div className="max-h-44 space-y-1 overflow-y-auto">{members.map(member => <button key={member.id} onClick={() => onProfile(member)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-slate-50"><div className="relative"><UserAvatar name={member.name || member.username} profileImageId={member.profileImageId} profileImageUrl={member.profileImageUrl} size="sm" />{member.online && <span className="absolute -bottom-0 -right-0 h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" />}</div><div className="min-w-0 flex-1"><span className="block truncate text-xs font-bold">@{member.username}</span><span className="text-[10px] text-slate-400">{member.role}</span></div>{member.role === "Owner" ? <Crown className="h-4 w-4 text-orange-500" /> : member.role === "Admin" ? <ShieldCheck className="h-4 w-4 text-blue-500" /> : null}</button>)}{members.length === 0 && <p className="py-3 text-xs text-slate-400">No members loaded.</p>}</div></div>{selected.type === "group" && <div className="mt-4 border-t pt-4"><button onClick={onLeave} className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 py-3 text-sm font-black text-rose-600 hover:bg-rose-50"><LogOut className="h-4 w-4" /> Leave group</button></div>}</div></div>;
}

function ProfileModal({ profile, loading, onClose }: { profile: CommunityProfile | null; loading: boolean; onClose: () => void }) {
  return <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/50 p-4" onClick={onClose}><div className="w-full max-w-xs rounded-2xl bg-white p-5 text-center shadow-2xl" onClick={e => e.stopPropagation()}>{loading ? <div className="py-8 text-xs font-bold text-slate-400">Loading profile…</div> : profile && <><div className="mx-auto flex h-20 w-20 items-center justify-center"><UserAvatar name={profile.name} profileImageId={profile.profileImageId} profileImageUrl={profile.profileImageUrl} size="xl" /></div><h3 className="mt-3 text-base font-black text-navy-950">{profile.name}</h3><p className="text-xs font-bold text-slate-400">@{profile.username}</p>{profile.profession && <p className="mt-2 text-xs text-slate-500">{profile.profession}</p>}<button onClick={onClose} className="mt-5 w-full rounded-xl border py-2.5 text-xs font-black">Close</button></>}</div></div>;
}

function MenuButton({ icon, text, onClick }: { icon: React.ReactNode; text: string; onClick: () => void }) { return <button onClick={onClick} className="flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 hover:bg-slate-50"><span className="text-slate-500">{icon}</span><span className="truncate">{text}</span></button>; }
function MenuRow({ icon, text, onClick, danger = false }: { icon: React.ReactNode; text: string; onClick: () => void; danger?: boolean }) { return <button onClick={onClick} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold hover:bg-slate-50 ${danger ? "text-rose-600" : "text-slate-700"}`}>{icon}{text}</button>; }
function MobileLink({ href, icon, text, close }: { href: string; icon: React.ReactNode; text: string; close: () => void }) { return <a href={href} onClick={close} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold text-slate-700"><span className="text-orange-500">{icon}</span>{text}</a>; }
function BottomNav({ href, icon, text, active = false }: { href: string; icon: React.ReactNode; text: string; active?: boolean }) { return <a href={href} className={`flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[9px] font-black ${active ? "text-orange-600" : "text-slate-400"}`}>{icon}<span>{text}</span></a>; }
