"use client";

import { notifyAdmin } from "./AdminToast";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Copy,
  Download,
  Edit,
  Eye,
  FileText,
  Link as LinkIcon,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

type PortfolioItem = { type: "file" | "link"; url: string; name: string };

type Vendor = {
  _id: string;
  name: string;
  companyName: string;
  vendorType: string;
  category: string;
  location: string;
  address: string;
  description: string;
  designation?: string;
  serviceArea?: string;
  yearsExperience?: string;
  teamSize?: string;
  gstin?: string;
  keyServices?: string;
  projectExperience?: string;
  phone_hidden: string;
  email_hidden?: string;
  website?: string;
  portfolio?: PortfolioItem[];
  isActive?: boolean;
  source?: "admin" | "self";
  createdAt?: string;
  updatedAt?: string;
  slug?: string;
  registrationFee?: number;
  registrationPaidAt?: string | Date | null;
  registrationPaymentId?: string | null;
  registrationPaymentOrderId?: string | null;
  feeDisclosureAcceptedAt?: string | Date | null;
  noWorkGuaranteeAcceptedAt?: string | Date | null;
  commissionTermsAcceptedAt?: string | Date | null;
  searchVisibilityAcceptedAt?: string | Date | null;
};

type VendorForm = Omit<Vendor, "_id" | "isActive" | "createdAt" | "updatedAt" | "source">;

const emptyForm: VendorForm = {
  name: "",
  companyName: "",
  vendorType: "Supplier",
  category: "",
  location: "",
  address: "",
  description: "",
  designation: "",
  serviceArea: "",
  yearsExperience: "",
  teamSize: "",
  gstin: "",
  keyServices: "",
  projectExperience: "",
  phone_hidden: "",
  email_hidden: "",
  website: "",
  portfolio: [],
};

const TYPE_TABS = ["All", "Supplier", "Contractor", "Fabricator", "Mason", "Labour", "Consultant", "Service Provider", "Other"];

export default function VendorsAdminPanel() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [viewing, setViewing] = useState<Vendor | null>(null);
  const [form, setForm] = useState<VendorForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [leadCount, setLeadCount] = useState(0);
  const [formSection, setFormSection] = useState<"business" | "private" | "portfolio" | "record">("business");

  const fetchVendors = async () => {
    const res = await fetch("/api/admin/vendors", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setVendors(Array.isArray(data) ? data : []);
  };

  const fetchLeadCount = async () => {
    try {
      const res = await fetch("/api/admin/vendor-leads", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setLeadCount(Array.isArray(data) ? data.length : data.leads?.length || 0);
    } catch {
      // Non-blocking dashboard metric.
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchLeadCount();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vendors.filter((v) => {
      const matchesType = typeFilter === "All" || v.vendorType === typeFilter;
      if (!matchesType) return false;
      if (!q) return true;
      return [
        v.name,
        v.companyName,
        v.vendorType,
        v.category,
        v.location,
        v.address,
        v.description,
        v.designation,
        v.serviceArea,
        v.yearsExperience,
        v.teamSize,
        v.gstin,
        v.keyServices,
        v.projectExperience,
        v.phone_hidden,
        v.email_hidden,
        v.website,
      ].some((value) => String(value || "").toLowerCase().includes(q));
    });
  }, [vendors, search, typeFilter]);

  const openAdd = () => {
    setEditing(null);
    setFormSection("business");
    setForm({ ...emptyForm, portfolio: [] });
    setShowForm(true);
  };

  const openEdit = (vendor: Vendor) => {
    setEditing(vendor);
    setFormSection("business");
    setForm({
      name: vendor.name || "",
      companyName: vendor.companyName || "",
      vendorType: vendor.vendorType || "Supplier",
      category: vendor.category || "",
      location: vendor.location || "",
      address: vendor.address || "",
      description: vendor.description || "",
      designation: vendor.designation || "",
      serviceArea: vendor.serviceArea || "",
      yearsExperience: vendor.yearsExperience || "",
      teamSize: vendor.teamSize || "",
      gstin: vendor.gstin || "",
      keyServices: vendor.keyServices || "",
      projectExperience: vendor.projectExperience || "",
      phone_hidden: vendor.phone_hidden || "",
      email_hidden: vendor.email_hidden || "",
      website: vendor.website || "",
      portfolio: vendor.portfolio || [],
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormSection("business");
    setEditing(null);
    setForm({ ...emptyForm, portfolio: [] });
  };

  const handlePortfolioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
      notifyAdmin("Only PDF or image files are allowed for portfolio.");
      return;
    }
    setUploadingPortfolio(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm((prev) => ({
          ...prev,
          portfolio: [...(prev.portfolio || []), { type: "file", url: data.url, name: file.name }],
        }));
      } else {
        notifyAdmin("Upload failed.");
      }
    } catch {
      notifyAdmin("Upload error.");
    } finally {
      setUploadingPortfolio(false);
      e.target.value = "";
    }
  };

  const handlePortfolioLink = () => {
    const url = prompt("Enter a public Google Drive or portfolio link:");
    if (!url?.trim()) return;
    setForm((prev) => ({
      ...prev,
      portfolio: [...(prev.portfolio || []), { type: "link", url: url.trim(), name: "Portfolio Link" }],
    }));
  };

  const removePortfolioItem = (index: number) => {
    setForm((prev) => ({ ...prev, portfolio: (prev.portfolio || []).filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const required = [form.name, form.companyName, form.category, form.location, form.address, form.phone_hidden, form.email_hidden];
    if (required.some((value) => !String(value || "").trim())) {
      notifyAdmin("Please fill all mandatory fields marked with *.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/vendors", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { ...form, _id: editing._id } : { ...form, source: "admin" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        notifyAdmin(data.error || "Failed to save vendor.");
        return;
      }
      closeForm();
      await fetchVendors();
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = async (vendor: Vendor) => {
    const res = await fetch("/api/admin/vendors", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: vendor._id, isActive: !vendor.isActive }),
    });
    if (res.ok) await fetchVendors();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this vendor permanently?")) return;
    const res = await fetch(`/api/admin/vendors?id=${id}`, { method: "DELETE" });
    if (res.ok) await fetchVendors();
  };

  const exportToCSV = () => {
    if (!vendors.length) return notifyAdmin("No vendors to export.");
    const headers = ["Name", "Company", "Type", "Category", "Location", "Service Coverage", "Experience", "Team Size", "GSTIN", "Address", "Description", "Key Services", "Project Experience", "Phone", "Email", "Website", "Portfolio", "Source", "Approved", "Created At", "Updated At"];
    const rows = vendors.map((v) => [
      v.name, v.companyName, v.vendorType, v.category, v.location, v.serviceArea || "", v.yearsExperience || "", v.teamSize || "", v.gstin || "", v.address, v.description, v.keyServices || "", v.projectExperience || "",
      v.phone_hidden, v.email_hidden || "", v.website || "", (v.portfolio || []).map((p) => p.name).join("; "),
      v.source || "admin", v.isActive ? "Yes" : "No",
      v.createdAt ? new Date(v.createdAt).toLocaleString() : "",
      v.updatedAt ? new Date(v.updatedAt).toLocaleString() : "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `civil-at-hand-vendors-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    if (!vendors.length) return notifyAdmin("No vendors to export.");
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(18);
    doc.text("NS Construction — Vendor Directory", 14, 18);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
    (doc as any).autoTable({
      head: [["Name", "Company", "Type", "Category", "Location", "Phone", "Email", "Approved"]],
      body: vendors.map((v) => [v.name, v.companyName, v.vendorType, v.category, v.location, v.phone_hidden, v.email_hidden || "", v.isActive ? "Yes" : "No"]),
      startY: 31,
      theme: "grid",
      styles: { fontSize: 7 },
    });
    doc.save(`civil-at-hand-vendors-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const copyRegistrationLink = async () => {
    const url = `${window.location.origin}/vendor-register`;
    try {
      await navigator.clipboard.writeText(url);
      notifyAdmin("Vendor registration link copied.");
    } catch {
      notifyAdmin(url);
    }
  };

  const resetForm = () => setForm({ ...emptyForm, portfolio: [] });
  const pendingCount = vendors.filter((v) => !v.isActive).length;
  const activeCount = vendors.filter((v) => v.isActive).length;

  return (
    <div className="p-4 md:p-6 bg-white rounded-2xl shadow-xl border border-slate-200">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Vendors" value={vendors.length} icon={<Users className="w-5 h-5" />} />
        <StatCard label="Pending Approval" value={pendingCount} icon={<AlertCircle className="w-5 h-5" />} tone="orange" />
        <StatCard label="Active Vendors" value={activeCount} icon={<CheckCircle className="w-5 h-5" />} tone="green" />
        <StatCard label="Vendor Leads" value={leadCount} icon={<Eye className="w-5 h-5" />} tone="blue" />
      </div>

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-950">Vendor Management</h2>
          <p className="text-xs text-slate-500 mt-1">Manage every submitted field privately. Use <strong>Edit</strong> on any existing vendor to update the record in a popup.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={copyRegistrationLink} className="admin-action bg-slate-100 text-slate-700"><Copy size={15} /> Registration Link</button>
          <button onClick={exportToCSV} className="admin-action bg-emerald-600 text-white"><Download size={15} /> CSV</button>
          <button onClick={exportToPDF} className="admin-action bg-slate-900 text-white"><FileText size={15} /> PDF</button>
          <button onClick={openAdd} className="admin-action bg-orange-600 text-white"><Plus size={15} /> Add Vendor</button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search every vendor field…" className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none text-sm" />
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
          {TYPE_TABS.map((tab) => (
            <button key={tab} onClick={() => setTypeFilter(tab)} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition ${typeFilter === tab ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[980px]">
            <thead className="bg-slate-950 text-white">
              <tr>
                <th className="p-3">Vendor</th>
                <th className="p-3">Company</th>
                <th className="p-3">Type</th>
                <th className="p-3">Category</th>
                <th className="p-3">Location</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-12 text-center text-slate-500"><Users className="mx-auto mb-3 text-slate-300" size={32} /><p className="font-bold text-slate-700">No vendors found</p><p className="text-xs mt-1">Try another search/filter or add a new vendor.</p><button onClick={openAdd} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs"><Plus size={14} /> Add Vendor</button></td></tr>
              ) : filtered.map((v) => (
                <tr key={v._id} className="border-t border-slate-100 hover:bg-orange-50/30">
                  <td className="p-3 font-bold text-slate-900">{v.name || "—"}</td>
                  <td className="p-3 text-slate-700">{v.companyName || "—"}</td>
                  <td className="p-3"><span className="px-2 py-1 rounded-full bg-orange-100 text-orange-800 font-bold">{v.vendorType || "Other"}</span></td>
                  <td className="p-3 text-slate-700 max-w-[220px] truncate" title={v.category}>{v.category || "—"}</td>
                  <td className="p-3 text-slate-700">{v.location || "—"}</td>
                  <td className="p-3">
                    <button onClick={() => toggleApproval(v)} className={`px-2 py-1 rounded-full font-bold ${v.isActive ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                      {v.isActive ? "Active" : "Pending"}
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end items-center gap-1.5">
                      <button onClick={() => setViewing(v)} title="View complete vendor record" aria-label={`View ${v.companyName || v.name}`} className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-bold"><Eye size={14} /> View</button>
                      <button onClick={() => openEdit(v)} title="Edit vendor" aria-label={`Edit ${v.companyName || v.name}`} className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-[11px] font-extrabold"><Edit size={14} /> Edit</button>
                      <button onClick={() => toggleApproval(v)} title={v.isActive ? "Move to pending" : "Approve vendor"} className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-[11px] font-extrabold ${v.isActive ? "text-amber-700 bg-amber-50 border-amber-100 hover:bg-amber-100" : "text-emerald-700 bg-emerald-50 border-emerald-100 hover:bg-emerald-100"}`}>{v.isActive ? "Unapprove" : "Approve"}</button>
                      <button onClick={() => handleDelete(v._id)} title="Delete vendor" aria-label={`Delete ${v.companyName || v.name}`} className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 text-[11px] font-bold"><Trash2 size={14} /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-slate-50 border-t text-xs text-slate-500">Showing {filtered.length} of {vendors.length} vendors · Click <strong>View</strong> for every stored field.</div>
      </div>

      {showForm && (
        <Modal title={editing ? "Edit Vendor Record" : "Add New Vendor"} onClose={closeForm} wide>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="sticky top-[61px] z-[5] -mx-5 border-b border-slate-200 bg-white/95 px-5 py-3 backdrop-blur">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {[
                  ["business", "Business Profile", "Identity, services & capabilities"],
                  ["private", "Private Details", "Contact & address"],
                  ["portfolio", "Portfolio", "Files & links"],
                  ...(editing ? [["record", "Record & Payment", "Approval & system data"]] : []),
                ].map(([key, label, hint]) => (
                  <button type="button" key={key} onClick={() => setFormSection(key as typeof formSection)} className={`rounded-xl border px-3 py-2.5 text-left transition ${formSection === key ? "border-orange-300 bg-orange-50 text-orange-800 shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}>
                    <span className="block text-[11px] font-black">{label}</span>
                    <span className="mt-0.5 block text-[9px] leading-4 text-slate-400">{hint}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-slate-400">Complete each section carefully. Private details are visible only to administrators and are never part of the public vendor listing.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.18em] text-orange-600">{editing ? "Existing record" : "New record"}</p>
                  <h4 className="mt-1 text-lg font-black text-slate-950">Business identity & classification</h4>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Keep the public-facing capability information accurate. Private contact fields below remain admin-only.</p>
                </div>
                {editing && <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${editing.isActive ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>{editing.isActive ? "Approved / Public" : "Pending Review"}</span>}
              </div>
            </div>

            {formSection === "business" && <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
              <SectionTitle title="Business profile" subtitle="Core information used to identify and match the vendor." />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Vendor / Contact Name *"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" placeholder="Contact person" /></Field>
                <Field label="Designation"><input value={form.designation || ""} onChange={(e) => setForm({ ...form, designation: e.target.value })} className="field" placeholder="Owner, Director, Manager…" /></Field>
                <Field label="Company / Business Name *"><input required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className="field" placeholder="Registered / trading name" /></Field>
                <Field label="Vendor Type *"><select value={form.vendorType} onChange={(e) => setForm({ ...form, vendorType: e.target.value })} className="field"><option>Supplier</option><option>Contractor</option><option>Fabricator</option><option>Mason</option><option>Labour</option><option>Consultant</option><option>Service Provider</option><option>Other</option></select></Field>
                <Field label="Category / Services *"><input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="field" placeholder="e.g. Steel Fabrication, Manpower, MEP" /></Field>
                <Field label="City / State *"><input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="field" placeholder="City, State" /></Field>
                <Field label="Service Coverage"><input value={form.serviceArea || ""} onChange={(e) => setForm({ ...form, serviceArea: e.target.value })} className="field" placeholder="Bihar, Odisha, North East, Pan India…" /></Field>
                <Field label="Years of Experience"><input value={form.yearsExperience || ""} onChange={(e) => setForm({ ...form, yearsExperience: e.target.value })} className="field" placeholder="e.g. 12 years" /></Field>
                <Field label="Team / Workforce Size"><input value={form.teamSize || ""} onChange={(e) => setForm({ ...form, teamSize: e.target.value })} className="field" placeholder="e.g. 25 skilled + 40 labour" /></Field>
                <Field label="GSTIN"><input value={form.gstin || ""} onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })} className="field" placeholder="If applicable" /></Field>
                <Field label="Website (optional)"><input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="field" placeholder="https://example.com" /></Field>
                <Field label="Description / Capabilities" full><textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="field resize-none" placeholder="Short professional description used on the public profile and for search discovery." /></Field>
                <Field label="Key Services" full><textarea rows={3} value={form.keyServices || ""} onChange={(e) => setForm({ ...form, keyServices: e.target.value })} className="field resize-none" placeholder="Main services, capabilities and keywords." /></Field>
                <Field label="Relevant Project Experience" full><textarea rows={3} value={form.projectExperience || ""} onChange={(e) => setForm({ ...form, projectExperience: e.target.value })} className="field resize-none" placeholder="Project sectors, work types, capacities and locations." /></Field>
              </div>
            </section>}

            {formSection === "private" && <section className="rounded-2xl border border-orange-200 bg-orange-50/20 p-4 md:p-5">
              <SectionTitle title="Private contact & address" subtitle="Stored for verification, internal coordination and paid introductions. Never displayed in the public directory." privateLabel />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Phone *"><input required type="tel" value={form.phone_hidden} onChange={(e) => setForm({ ...form, phone_hidden: e.target.value })} className="field" placeholder="+91…" /></Field>
                <Field label="Email *"><input required type="email" value={form.email_hidden} onChange={(e) => setForm({ ...form, email_hidden: e.target.value })} className="field" placeholder="business@example.com" /></Field>
                <Field label="Full Address *" full><textarea required rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="field resize-none" placeholder="Complete business / office address" /></Field>
              </div>
            </section>}

            {formSection === "portfolio" && <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 md:p-5">
              <SectionTitle title="Portfolio & supporting material" subtitle="Optional files or links for internal vendor evaluation." />
              <div className="flex flex-wrap gap-2">
                <label className="admin-action cursor-pointer bg-slate-100 text-slate-700"><Upload size={14} /> Upload PDF/Image<input type="file" accept=".pdf,image/*" onChange={handlePortfolioFileUpload} className="hidden" /></label>
                <button type="button" onClick={handlePortfolioLink} className="admin-action bg-blue-50 text-blue-700"><LinkIcon size={14} /> Add Link</button>
              </div>
              {uploadingPortfolio && <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-orange-600"><Loader2 className="animate-spin" size={13} /> Uploading portfolio…</p>}
              {(form.portfolio || []).length > 0 ? <div className="mt-3 grid gap-2 md:grid-cols-2">{form.portfolio?.map((item, i) => <div key={`${item.url}-${i}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs"><div className="rounded-lg bg-white p-2"><FileText size={14} className="text-slate-500" /></div><span className="min-w-0 flex-1 truncate font-semibold text-slate-700">{item.name}</span><button type="button" onClick={() => removePortfolioItem(i)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"><X size={14} /></button></div>)}</div> : <div className="mt-3 rounded-xl border border-dashed border-slate-300 p-5 text-center text-xs text-slate-400">No portfolio material added.</div>}
            </section>}

            {editing && formSection === "record" && <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5">
              <SectionTitle title="Record information" subtitle="System fields are maintained automatically." />
              <div className="grid gap-3 md:grid-cols-3">
                <Detail label="Record ID" value={editing._id} />
                <Detail label="Source" value={editing.source || "admin"} />
                <Detail label="Status" value={editing.isActive ? "Approved / Public" : "Pending Approval"} />
                <Detail label="Created" value={editing.createdAt ? new Date(editing.createdAt).toLocaleString() : "Not available"} />
                <Detail label="Last Updated" value={editing.updatedAt ? new Date(editing.updatedAt).toLocaleString() : "Not available"} />
                <Detail label="Public URL" value={editing.isActive ? `/vendors/${editing.slug || editing.companyName || editing.name}` : "Available after approval"} />
              </div>
              <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">Approval is controlled separately with the <strong>Approve / Unapprove</strong> action so editing a record never accidentally changes its public status.</p>
            </section>}

            <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-col gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-slate-500">* Required fields · Changes are saved to the vendor record in the database.</p>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeForm} className="rounded-xl border border-slate-200 px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button disabled={loading} type="submit" className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 font-black text-white shadow-sm hover:bg-orange-700 disabled:opacity-60">{loading && <Loader2 className="animate-spin" size={16} />}{editing ? "Save Vendor Changes" : "Create Vendor"}</button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {viewing && (
        <Modal title="Vendor Details" onClose={() => setViewing(null)} wide>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Detail label="Vendor / Contact Name" value={viewing.name} />
            <Detail label="Company / Business Name" value={viewing.companyName} />
            <Detail label="Vendor Type" value={viewing.vendorType} />
            <Detail label="Category / Services" value={viewing.category} />
            <Detail label="City / State" value={viewing.location} />
            <Detail label="Full Address" value={viewing.address} />
            <Detail label="Phone" value={viewing.phone_hidden} privateValue />
            <Detail label="Email" value={viewing.email_hidden || "Not provided"} privateValue />
            <Detail label="Website" value={viewing.website || "Not provided"} />
            <Detail label="Source" value={viewing.source || "admin"} />
            <Detail label="Approval" value={viewing.isActive ? "Active / Approved" : "Pending Approval"} />
            <Detail label="Created" value={viewing.createdAt ? new Date(viewing.createdAt).toLocaleString() : "Not available"} />
            <Detail label="Last Updated" value={viewing.updatedAt ? new Date(viewing.updatedAt).toLocaleString() : "Not available"} />
            <Detail label="Registration Fee" value={viewing.registrationFee != null ? `₹${Number(viewing.registrationFee).toLocaleString("en-IN")}` : "Not recorded"} />
            <Detail label="Payment ID" value={viewing.registrationPaymentId || "Not recorded"} privateValue />
            <Detail label="Payment Date" value={viewing.registrationPaidAt ? new Date(viewing.registrationPaidAt).toLocaleString() : "Not recorded"} privateValue />
            <div className="md:col-span-2 rounded-xl border border-slate-200 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Description</p><p className="text-sm text-slate-700 whitespace-pre-wrap">{viewing.description || "Not provided"}</p></div>
            <div className="md:col-span-2 grid gap-4 md:grid-cols-2"><div className="rounded-xl border border-slate-200 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Key Services</p><p className="text-sm text-slate-700 whitespace-pre-wrap">{viewing.keyServices || "Not provided"}</p></div><div className="rounded-xl border border-slate-200 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Project Experience</p><p className="text-sm text-slate-700 whitespace-pre-wrap">{viewing.projectExperience || "Not provided"}</p></div></div>
            <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Registration acknowledgements</p><div className="grid gap-2 md:grid-cols-2"><Detail label="Fee Disclosure" value={viewing.feeDisclosureAcceptedAt ? "Accepted" : "Not recorded"} /><Detail label="No Work Guarantee" value={viewing.noWorkGuaranteeAcceptedAt ? "Accepted" : "Not recorded"} /><Detail label="Commission Terms" value={viewing.commissionTermsAcceptedAt ? "Accepted" : "Not recorded"} /><Detail label="Search Visibility" value={viewing.searchVisibilityAcceptedAt ? "Accepted" : "Not recorded"} /></div></div>
            <div className="md:col-span-2 rounded-xl border border-slate-200 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Portfolio</p>{(viewing.portfolio || []).length ? <div className="space-y-2">{viewing.portfolio?.map((item, i) => <a key={`${item.url}-${i}`} href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline"><FileText size={14} />{item.name}</a>)}</div> : <p className="text-sm text-slate-400">Not provided</p>}</div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 mt-5"><button onClick={() => toggleApproval(viewing)} className={`px-4 py-2.5 rounded-xl font-bold ${viewing.isActive ? "bg-amber-100 text-amber-800" : "bg-emerald-600 text-white"}`}>{viewing.isActive ? "Move to Pending" : "Approve Vendor"}</button><button onClick={() => { setViewing(null); openEdit(viewing); }} className="px-5 py-2.5 rounded-xl bg-slate-950 text-white font-bold flex items-center gap-2"><Edit size={15} /> Edit Vendor</button></div>
        </Modal>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, tone = "slate" }: { label: string; value: number; icon: React.ReactNode; tone?: string }) {
  const tones: Record<string, string> = { slate: "bg-slate-50 border-slate-200 text-slate-900", orange: "bg-orange-50 border-orange-200 text-orange-900", green: "bg-emerald-50 border-emerald-200 text-emerald-900", blue: "bg-blue-50 border-blue-200 text-blue-900" };
  return <div className={`p-4 rounded-xl border ${tones[tone] || tones.slate}`}><div className="flex justify-between items-center"><div><p className="text-[10px] font-bold uppercase tracking-wider opacity-60">{label}</p><p className="text-2xl font-extrabold mt-1">{value}</p></div>{icon}</div></div>;
}

function SectionTitle({ title, subtitle, privateLabel = false }: { title: string; subtitle: string; privateLabel?: boolean }) {
  return <div className="mb-4 flex items-start justify-between gap-3"><div><h4 className="text-sm font-black text-slate-950">{title}</h4><p className="mt-1 text-[11px] leading-5 text-slate-500">{subtitle}</p></div>{privateLabel && <span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-orange-700">Admin only</span>}</div>;
}

function Field({ label, children, full = false }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <label className={full ? "md:col-span-2 block" : "block"}>
    <span className="mb-1.5 flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-slate-600">{label}</span>
    <div className="rounded-xl">{children}</div>
  </label>;
}

function Detail({ label, value, privateValue = false }: { label: string; value: string; privateValue?: boolean }) {
  return <div className={`rounded-xl border p-3 ${privateValue ? "border-orange-200 bg-orange-50/30" : "border-slate-200 bg-white"}`}><div className="flex items-center justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>{privateValue && <span className="text-[9px] font-bold uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Private</span>}</div><p className="text-sm font-semibold text-slate-800 mt-1 break-words">{value || "Not provided"}</p></div>;
}

function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className={`bg-white w-full ${wide ? "max-w-5xl" : "max-w-xl"} max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl`}><div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-5 py-4 flex items-center justify-between"><h3 className="font-extrabold text-lg text-slate-950">{title}</h3><button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><X size={18} /></button></div><div className="p-5">{children}</div></div></div>;
}
