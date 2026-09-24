"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, AlertCircle, ArrowLeft, Briefcase, Building2, Calendar, Check,
  CheckCircle2, CreditCard, Download, FolderKanban, GraduationCap, KeyRound,
  Loader2, Mail, MapPin, Phone, RefreshCw, Save, ShieldCheck, ShoppingBag, User,
} from "lucide-react";
import { useProjects } from "@/context/ProjectContext";
import { auth } from "@/lib/firebase";
import { downloadReceipt } from "@/lib/receipt";
import { PROFILE_AVATAR_OPTIONS, normalizeProfileAvatarId } from "@/lib/profile-avatar-options";

const FALLBACK_AVATAR_OPTIONS = PROFILE_AVATAR_OPTIONS.map((avatar) => ({ ...avatar }));

function bustAvatarUrl(url: string) {
  if (!url || url.startsWith("data:")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}v=20260814`;
}

function readCachedUser() {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(localStorage.getItem("cah_user") || "null");
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const { leads } = useProjects();
  const [user, setUser] = useState<any>(null);
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [userType, setUserType] = useState<"student" | "client" | "both">("both");
  const [profileImageId, setProfileImageId] = useState("avatar-01");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [profileAvatarOptions, setProfileAvatarOptions] = useState(FALLBACK_AVATAR_OPTIONS);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [pendingProfileImageId, setPendingProfileImageId] = useState("avatar-01");
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [accountActivity, setAccountActivity] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  const hydrateUser = (nextUser: any) => {
    if (!nextUser) return;
    setUser(nextUser);
    setUserId(nextUser.id || "");
    setName(nextUser.name || "");
    setEmail(nextUser.email || "");
    setPhone(nextUser.phone || "");
    setCompany(nextUser.company || "");
    setAddress(nextUser.address || "");
    setUserType(nextUser.userType || "both");
    const normalizedAvatarId = normalizeProfileAvatarId(nextUser.profileImageId);
    setProfileImageId(normalizedAvatarId);
    const canonicalAvatar = FALLBACK_AVATAR_OPTIONS.find((avatar) => avatar.id === normalizedAvatarId);
    setProfileImageUrl(canonicalAvatar?.imageUrl || nextUser.profileImageUrl || "");
  };

  const loadAccountActivity = async (nextUser = auth.currentUser) => {
    if (!nextUser) return;
    try {
      setActivityLoading(true);
      const token = await nextUser.getIdToken();
      const res = await fetch("/api/user/activity", {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setAccountActivity(Array.isArray(data.activities) ? data.activities : []);
      setPurchases(Array.isArray(data.purchases) ? data.purchases : []);
    } catch (error) {
      console.error("Failed to load account activity:", error);
    } finally {
      setActivityLoading(false);
    }
  };

  const loadProfile = async (nextUser: any) => {
    if (!nextUser) { setProfileLoading(false); return; }
    try {
      const token = await nextUser.getIdToken();
      const res = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        const serverProfile = data.profile || data;
        if (Array.isArray(data.profileAvatarOptions) && data.profileAvatarOptions.length > 0)
          setProfileAvatarOptions(data.profileAvatarOptions);
        if (serverProfile?.id) { hydrateUser(serverProfile); return; }
      }
      const cachedUser = readCachedUser();
      if (cachedUser) hydrateUser(cachedUser);
    } catch (error) {
      console.error("Failed to load profile:", error);
      const cachedUser = readCachedUser();
      if (cachedUser) hydrateUser(cachedUser);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    const cachedUser = readCachedUser();
    if (cachedUser) hydrateUser(cachedUser);
    const unsub = auth.onIdTokenChanged((nextUser) => {
      if (!nextUser) {
        setUser(null); setAccountActivity([]); setPurchases([]); setProfileLoading(false); return;
      }
      void loadProfile(nextUser);
      void loadAccountActivity(nextUser);
    });
    return () => unsub();
  }, []);

  const userLeads = useMemo(() => {
    if (!user?.email || !Array.isArray(leads)) return [];
    const normalizedEmail = user.email.toLowerCase();
    return leads.filter((lead) => typeof lead.email === "string" && lead.email.toLowerCase() === normalizedEmail);
  }, [user, leads]);

  const selectedAvatar = profileAvatarOptions.find((avatar) => avatar.id === profileImageId) || profileAvatarOptions[0];
  const selectedAvatarUrl = bustAvatarUrl(selectedAvatar?.imageUrl || profileImageUrl || "");
  const avatarInitials = name ? name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() : "U";

  const openAvatarEditor = () => {
    setPendingProfileImageId(profileImageId);
    setShowAvatarEditor(true);
    setErrorMsg(null);
  };

  const closeAvatarEditor = () => {
    setPendingProfileImageId(profileImageId);
    setShowAvatarEditor(false);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErrorMsg(null); setSuccess(false);
    try {
      const currentUser = auth.currentUser;
      const idToken = await currentUser?.getIdToken();
      if (!idToken || !currentUser) throw new Error("Your session expired. Please sign in again.");
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          id: userId, name: name.trim(), email, phone: phone.trim(), company: company.trim(),
          address: address.trim(), userType, profileImageId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update profile.");
      if (Array.isArray(data.profileAvatarOptions) && data.profileAvatarOptions.length > 0)
        setProfileAvatarOptions(data.profileAvatarOptions);
      const existingCached = readCachedUser();
      const newImageId = data.profileImageId || profileImageId;
      const newImageUrl = data.profileImageUrl ||
        profileAvatarOptions.find((avatar) => avatar.id === newImageId)?.imageUrl || selectedAvatarUrl;
      const safeUser = {
        ...data, profileImageId: newImageId, profileImageUrl: newImageUrl,
        emailVerified: existingCached?.emailVerified === true || currentUser.emailVerified === true,
      };
      localStorage.setItem("cah_user", JSON.stringify(safeUser));
      window.dispatchEvent(new Event("storage"));
      hydrateUser(safeUser);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      setErrorMsg(error?.message || "Failed to update profile. Please try again.");
    } finally { setLoading(false); }
  };

  const handleSaveAvatar = async () => {
    const previousImageId = profileImageId;
    setErrorMsg(null);
    try {
      const currentUser = auth.currentUser;
      const idToken = await currentUser?.getIdToken();
      if (!idToken || !currentUser) throw new Error("Your session expired. Please sign in again.");
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          id: userId, name, email, phone, company, address, userType,
          profileImageId: pendingProfileImageId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save profile photo.");
      if (Array.isArray(data.profileAvatarOptions) && data.profileAvatarOptions.length > 0)
        setProfileAvatarOptions(data.profileAvatarOptions);
      const avatar = (data.profileAvatarOptions || profileAvatarOptions)
        .find((item: any) => item.id === pendingProfileImageId);
      const existingCached = readCachedUser();
      const safeUser = {
        ...data,
        profileImageId: data.profileImageId || pendingProfileImageId,
        profileImageUrl: data.profileImageUrl || avatar?.imageUrl || "",
        emailVerified: existingCached?.emailVerified === true || currentUser.emailVerified === true,
      };
      localStorage.setItem("cah_user", JSON.stringify(safeUser));
      window.dispatchEvent(new Event("storage"));
      hydrateUser(safeUser);
      setSuccess(true);
      setShowAvatarEditor(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      setProfileImageId(previousImageId);
      setErrorMsg(error?.message || "Failed to save profile photo. Please try again.");
    }
  };

  const handleReset = () => {
    if (!user) return;
    hydrateUser(user); setErrorMsg(null); setSuccess(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }} className="relative z-10 flex-grow py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-8 flex items-center gap-2">
            <button type="button" onClick={() => router.back()} className="group inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-500 hover:text-orange-600">
              <ArrowLeft className="h-4 w-4" /><span>Back</span>
            </button><span className="text-sm text-slate-300">/</span>
            <span className="text-sm font-semibold text-slate-900">My Profile</span>
          </nav>

          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/40 md:p-8">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <button type="button" onClick={openAvatarEditor}
                className="group relative h-20 w-20 overflow-hidden rounded-2xl bg-slate-100 shadow-md ring-1 ring-slate-200"
                aria-label="Edit profile photo">
                {selectedAvatarUrl ? <img src={selectedAvatarUrl} alt="Selected profile photo"
                  className="h-full w-full object-cover"
                  onError={(event) => { event.currentTarget.style.display = "none"; }} /> :
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600 text-2xl font-bold text-white">{avatarInitials}</div>}
                <span className="absolute inset-x-0 bottom-0 bg-slate-950/75 py-1 text-center text-[10px] font-bold text-white opacity-0 group-hover:opacity-100">Edit</span>
              </button>
              <div className="min-w-0 flex-grow space-y-1">
                <h1 className="truncate text-2xl font-bold text-slate-900">{name || "Your Name"}</h1>
                <p className="flex items-center gap-2 text-sm text-slate-500"><Mail className="h-4 w-4" />{email || "Verified account"}</p>
                {company && <p className="flex items-center gap-2 text-sm text-slate-500"><Building2 className="h-4 w-4" />{company}</p>}
                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />Verified account</span>
                  <span className="hidden text-slate-300 sm:inline">•</span>
                  <span>Member since {new Date().getFullYear()}</span>
                </div>
              </div>
              <div className="self-start sm:self-center"><div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />Active</div></div>
            </div>
          </div>

          {profileLoading && <div className="mb-8 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading your saved profile…</div>}

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/40 md:p-8">
                <div className="mb-6 border-b border-slate-100 pb-5">
                  <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
                  <p className="mt-1 text-sm text-slate-500">Update your details. Your email cannot be changed.</p>
                </div>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <AnimatePresence mode="wait">
                    {success && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Profile updated. Your changes are saved.</motion.div>}
                    {errorMsg && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{errorMsg}</motion.div>}
                  </AnimatePresence>

                  <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div><h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Profile photo</h3><p className="mt-1 text-xs text-slate-500">Only your saved photo is shown here. Click it to edit.</p></div>
                      <button type="button" onClick={openAvatarEditor} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:border-orange-300 hover:bg-orange-50">Edit photo</button>
                    </div>
                  </section>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <label className="space-y-1.5"><span className="text-xs font-bold uppercase tracking-wider text-slate-600">Full Name</span><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm" /></label>
                    <label className="space-y-1.5"><span className="text-xs font-bold uppercase tracking-wider text-slate-600">Email Address</span><input type="email" readOnly value={email} className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 py-3 px-4 text-sm text-slate-500" /></label>
                    <label className="space-y-1.5"><span className="text-xs font-bold uppercase tracking-wider text-slate-600">Phone Number</span><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm" /></label>
                    <label className="space-y-1.5"><span className="text-xs font-bold uppercase tracking-wider text-slate-600">Company Name</span><input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm" /></label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">I am using this portal as a</label>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      {([{type:"client" as const,label:"Client",icon:Briefcase},{type:"student" as const,label:"Student",icon:GraduationCap},{type:"both" as const,label:"Both",icon:FolderKanban}]).map(({type,label,icon:Icon}) => {
                        const active = userType === type;
                        return <button key={type} type="button" onClick={() => setUserType(type)} className={`flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-left ${active ? "border-orange-500 bg-orange-50" : "border-slate-200 hover:border-orange-300"}`}><Icon className="h-4 w-4" /><span className="text-xs font-extrabold">{label}</span>{active && <Check className="ml-auto h-3.5 w-3.5 text-orange-500" />}</button>;
                      })}
                    </div>
                  </div>

                  <label className="space-y-1.5 block"><span className="text-xs font-bold uppercase tracking-wider text-slate-600">Consulting / Billing Address</span><textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm" /></label>

                  <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                    <button type="button" onClick={handleReset} className="rounded-xl px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100">Reset</button>
                    <button type="submit" disabled={loading || !userId} className="flex items-center gap-2 rounded-xl bg-orange-500 px-8 py-3 text-sm font-bold text-white disabled:opacity-60">{loading ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : <><Save className="h-4 w-4" />Save Changes</>}</button>
                  </div>
                </form>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
                <div className="mb-5 flex items-center gap-3"><ShoppingBag className="h-5 w-5 text-orange-600" /><h3 className="text-lg font-bold">My Purchases</h3><button type="button" onClick={() => void loadAccountActivity()} className="ml-auto p-2 text-slate-400"><RefreshCw className={`h-4 w-4 ${activityLoading ? "animate-spin" : ""}`} /></button></div>
                {purchases.length === 0 ? <p className="py-6 text-center text-sm text-slate-400">No purchases yet</p> : <div className="space-y-2">{purchases.slice(0,12).map((purchase) => <div key={purchase.id} className="rounded-xl border border-slate-100 p-3"><p className="text-sm font-bold">{purchase.title}</p><p className="text-xs text-slate-500">₹{Number(purchase.amount || 0).toLocaleString("en-IN")}</p>{!purchase.refunded && <button type="button" onClick={() => downloadReceipt(purchase,{name,email})} className="mt-2 text-xs font-bold text-orange-600">Download receipt</button>}</div>)}</div>}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
                <div className="mb-5 flex items-center gap-3"><Activity className="h-5 w-5 text-indigo-600" /><h3 className="text-lg font-bold">Account Activity</h3></div>
                {accountActivity.length === 0 ? <p className="py-6 text-center text-sm text-slate-400">No account activity recorded yet.</p> : <div className="space-y-3">{accountActivity.slice(0,20).map((activity) => <div key={activity.id} className="rounded-xl border border-slate-100 p-3"><p className="text-xs font-bold">{activity.title}</p><p className="text-xs text-slate-500">{activity.message}</p></div>)}</div>}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
                <div className="flex items-start gap-3"><KeyRound className="h-5 w-5 text-orange-600" /><div><h3 className="font-bold">Account Security</h3><p className="mt-1 text-xs text-slate-500">Password resets are handled securely by Firebase Authentication.</p></div></div>
                <button type="button" onClick={() => router.push("/forgot-password")} className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold">Reset password</button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
                <h3 className="mb-2 text-lg font-bold">Recent Activity</h3>
                {userLeads.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">No service requests yet</p> : <div className="space-y-3">{userLeads.map((lead) => <motion.div key={lead.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><p className="text-sm font-semibold">{lead.service}</p><p className="text-xs text-slate-500">{lead.date} · {lead.status}</p></motion.div>)}</div>}
              </div>
            </div>
          </div>
        </div>
      </motion.main>

      {showAvatarEditor && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="dialog" aria-modal="true" aria-labelledby="profile-photo-dialog-title"
          onMouseDown={(event) => { if (event.currentTarget === event.target) closeAvatarEditor(); }}>
          <div className="w-full max-w-4xl rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div><h2 id="profile-photo-dialog-title" className="text-xl font-bold text-slate-900">Choose profile photo</h2><p className="mt-1 text-sm text-slate-500">Your current photo stays unchanged until you press Save.</p></div>
              <button type="button" onClick={closeAvatarEditor} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold">×</button>
            </div>
            <div className="grid grid-cols-2 gap-4 py-6 sm:grid-cols-3 lg:grid-cols-6">
              {FALLBACK_AVATAR_OPTIONS.map((avatar) => {
                const active = pendingProfileImageId === avatar.id;
                return <button key={avatar.id} type="button" onClick={() => setPendingProfileImageId(avatar.id)}
                  className={`group relative overflow-hidden rounded-2xl border-2 bg-white text-left ${active ? "border-orange-500 shadow-lg" : "border-slate-200 hover:border-orange-300"}`}
                  aria-pressed={active}>
                  <div className="aspect-square overflow-hidden bg-slate-100"><img src={bustAvatarUrl(avatar.imageUrl)} alt={avatar.label} className="h-full w-full object-cover" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.opacity = "0"; }} /></div>
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5"><span className="truncate text-xs font-bold text-slate-700">{avatar.label}</span>{active && <Check className="h-4 w-4 text-orange-500" />}</div>
                </button>;
              })}
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button type="button" onClick={closeAvatarEditor} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600">Cancel</button>
              <button type="button" onClick={handleSaveAvatar} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white"><Save className="h-4 w-4" />Save photo</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <style jsx global>{`.custom-scrollbar::-webkit-scrollbar{width:4px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:8px}`}</style>
    </div>
  );
}
