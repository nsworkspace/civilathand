import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";
const DB = process.env.MONGODB_DB || "civil-at-hand";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fullName,
      phone,
      whatsapp,
      email,
      address,
      role,
      education,
      experience,
      portfolioLink,
      notes,
      joiningDate,
      department,
      employeeId,
    } = body;

    if (!fullName?.trim() || !phone?.trim() || !role?.trim()) {
      return NextResponse.json(
        { error: "Full name, phone, and role are required." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DB);

    const member = {
      id: `emp-${Date.now()}`,
      fullName: fullName.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp?.trim() || "",
      email: email?.trim().toLowerCase() || "",
      address: address?.trim() || "",
      role: role.trim(),
      education: education?.trim() || "",
      experience: experience?.trim() || "",
      portfolioLink: portfolioLink?.trim() || "",
      notes: notes?.trim() || "",
      joiningDate: joiningDate?.trim() || "",
      department: department?.trim() || "",
      employeeId: employeeId?.trim() || "",
      status: "Active",
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("team_members").insertOne(member);

    const { _id, ...responseData } = member as any;
    return NextResponse.json({ success: true, member: responseData }, { status: 201 });
  } catch (err: any) {
    console.error("Team onboarding error:", err);
    return NextResponse.json(
      { error: `Submission failed: ${err.message || err}` },
      { status: 500 }
    );
  }
}
