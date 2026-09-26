import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

const defaultSettings = {
  key: "career_config",
  roles: [
    {
      id: "role-1",
      title: "Architect",
      type: "Freelance",
      location: "Darbhanga, Bihar",
      desc: "Seeking an experienced architect in Darbhanga, Bihar, to design a simple residential house.",
      fullDetails: "Project Requirement: Seeking an experienced architect in Darbhanga, Bihar, to design a simple residential house.\n\nKey Responsibilities:\n• Complete architectural planning, 2D floor plans, elevations, and 3D modeling for a modern residential house.\n• On-site coordination and client consultation in Darbhanga, Bihar.\n• Ensuring structural and municipal planning compliance.\n\nQualifications & Requirements:\n• Degree/Diploma in Architecture (B.Arch / M.Arch / Diploma in Arch).\n• Proficiency in AutoCAD, Revit, SketchUp, or 3ds Max.\n• Prior experience handling complete architectural design for residential projects.",
      active: true,
    },
    {
      id: "role-2",
      title: "Civil Engineering Intern",
      type: "Internship",
      location: "Remote / Pan-India",
      desc: "Learn on real engineering projects with mentorship — drafting, estimation, and BIM basics.",
      fullDetails: "Role Overview:\nJoin NS Construction as a Civil Engineering Intern. Gain hands-on practical exposure working alongside senior structural engineers and architects.\n\nKey Learning & Responsibilities:\n• Learn 2D drafting in AutoCAD and structural modeling basics in STAAD.Pro / ETABS.\n• Assist in BOQ quantity take-offs, Bar Bending Schedules (BBS), and design detailing.\n• Mentorship sessions, project reviews, and guidance for career & competitive exams.\n\nRequirements:\n• Pursuing or completed B.E. / B.Tech / Diploma in Civil Engineering.\n• Eagerness to learn structural detailing, drafting, and construction technologies.",
      active: true,
    },
    {
      id: "role-3",
      title: "Labour Contractors",
      type: "Full-time",
      location: "Pan-India",
      desc: "Looking for Labour Contractors & Manpower Suppliers Across India for ongoing construction projects.",
      fullDetails: "Partnership Overview:\nSeeking experienced Labour Contractors, Civil Sub-contractors, and Manpower Suppliers to partner on ongoing residential & commercial construction projects across India.\n\nScope of Work:\n• Supply skilled, semi-skilled, and un-skilled manpower for RCC framing, masonry, plastering, shuttering, and rebar binding.\n• Execute civil execution tasks as per structural drawings and IS code standards.\n\nRequirements:\n• Registered contractor/firm with proven track record in civil building construction.\n• Ability to mobilize workforce on site with quality workmanship.",
      active: true,
    },
    {
      id: "role-4",
      title: "Web Developer",
      type: "Full-time / Freelance",
      location: "Remote",
      desc: "Web development, Next.js, React, UI design, and interactive civil engineering tools.",
      fullDetails: "Role Overview:\nLooking for a Web Developer to design, enhance, and optimize web applications, interactive calculators, and client management portals for NS Construction.\n\nKey Responsibilities:\n• Develop responsive web applications using React, Next.js, TailwindCSS, and Node.js.\n• Integrate REST APIs, MongoDB databases, and real-time client tools.\n• Optimize web performance, UX/UI animations, and mobile responsiveness.\n\nRequirements:\n• Strong proficiency in React, Next.js, TypeScript, and modern CSS.\n• Experience with Git, API integrations, and clean code practices.",
      active: true,
    },
  ],
  experienceOptions: [
    "Fresher / Entry Level (< 1 Year)",
    "1 - 3 Years",
    "3 - 5 Years",
    "5+ Years Senior"
  ],
  qualificationOptions: [
    "B.E. / B.Tech Civil Engineering",
    "M.E. / M.Tech Structural / Civil",
    "Diploma in Civil Engineering",
    "B.Arch / M.Arch",
    "CAD / BIM Certification / ITI",
    "Other Degree / Qualification"
  ],
  fieldSettings: {
    requireResume: true,
    showNoteField: true,
    requirePhone: true,
  },
  removedRoleIds: [],
  updatedAt: new Date().toISOString(),
};

export async function GET() {
  try {
    const authenticated = await hasModuleAccess("careers");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("career_settings");

    const rawSettings = await collection.findOne({ key: "career_config" });

    if (!rawSettings) {
      await collection.insertOne(defaultSettings);
    } else if (!Array.isArray((rawSettings as any).removedRoleIds)) {
      // One-time compatibility migration: older configurations could have lost
      // the built-in jobs from the admin list. Restore any missing legacy jobs
      // once, then record deliberate deletions so they stay deleted.
      const removedRoleIds: string[] = [];
      const existingRoles = Array.isArray((rawSettings as any).roles) ? (rawSettings as any).roles : [];
      const existingIds = new Set(existingRoles.map((role: any) => String(role?.id || "")));
      const restoredRoles = [...existingRoles];
      for (const legacyRole of defaultSettings.roles) {
        if (!existingIds.has(legacyRole.id)) restoredRoles.push(legacyRole);
      }
      await collection.updateOne(
        { key: "career_config" },
        { $set: { roles: restoredRoles, removedRoleIds, updatedAt: new Date().toISOString() } }
      );
    }

    const finalSettings = (await collection.findOne({ key: "career_config" })) || defaultSettings;
    const { _id, ...formatted } = finalSettings as any;
    return NextResponse.json(formatted, {
      headers: { "Cache-Control": "no-store, no-cache" }
    });
  } catch (error: any) {
    console.error("Error fetching admin career settings:", error);
    return NextResponse.json({ error: "Failed to fetch career settings." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authenticated = await hasModuleAccess("careers");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { roles, experienceOptions, qualificationOptions, fieldSettings } = body;

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("career_settings");

    const usedSlugs = new Set<string>();
    const normalizeSlug = (value: string) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "job";
    const normalizedRoles = (Array.isArray(roles) ? roles : []).map((role: any, index: number) => {
      const base = normalizeSlug(role?.slug || role?.title || `job-${index + 1}`);
      let slug = base;
      let n = 2;
      while (usedSlugs.has(slug)) slug = `${base}-${n++}`;
      usedSlugs.add(slug);
      return { ...role, slug, applyEnabled: role?.applyEnabled !== false, active: role?.active !== false };
    });

    const existingConfig = await collection.findOne({ key: "career_config" });
    const legacyRoleIds = new Set(defaultSettings.roles.map((role) => role.id));
    const previouslyRemoved = new Set<string>(Array.isArray((existingConfig as any)?.removedRoleIds) ? (existingConfig as any).removedRoleIds.map(String) : []);
    const currentRoleIds = new Set(normalizedRoles.map((role: any) => String(role?.id || "")));
    const removedRoleIds = [...previouslyRemoved].filter((id) => !currentRoleIds.has(id));
    for (const id of legacyRoleIds) {
      if (!currentRoleIds.has(id)) removedRoleIds.push(id);
    }

    const updatedConfig = {
      key: "career_config",
      roles: normalizedRoles,
      experienceOptions: Array.isArray(experienceOptions) ? experienceOptions : [],
      qualificationOptions: Array.isArray(qualificationOptions) ? qualificationOptions : [],
      fieldSettings: fieldSettings || { requireResume: true, showNoteField: true, requirePhone: true },
      removedRoleIds: [...new Set(removedRoleIds)],
      updatedAt: new Date().toISOString(),
    };

    await collection.updateOne(
      { key: "career_config" },
      { $set: updatedConfig },
      { upsert: true }
    );

    return NextResponse.json({ success: true, settings: updatedConfig });
  } catch (error: any) {
    console.error("Error saving admin career settings:", error);
    return NextResponse.json({ error: "Failed to save career settings." }, { status: 500 });
  }
}
