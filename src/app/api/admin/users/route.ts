import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";
import { getProfileAvatarOption, normalizeProfileAvatarId } from "@/lib/profile-avatar-options";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

// GET /api/admin/users - Fetch all registered users with activity stats
export async function GET(request: Request) {
  try {
    if (!(await hasModuleAccess("registeredUsers"))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const userType = searchParams.get("userType") || "all";

    const client = await clientPromise;
    const db = client.db(dbName);
    const usersColl = db.collection("users");
    const projectsColl = db.collection("projects");
    const leadsColl = db.collection("leads");

    // Fetch all users
    const rawUsers = await usersColl.find({}).sort({ createdAt: -1 }).toArray();

    // Fetch collections for aggregated metrics
    const [allProjects, allLeads] = await Promise.all([
      projectsColl.find({}).toArray(),
      leadsColl.find({}).toArray(),
    ]);

    // Map projects, leads, and attempts by email
    const projectsByEmail = new Map<string, number>();
    allProjects.forEach((p: any) => {
      if (p.clientEmail) {
        const em = p.clientEmail.toLowerCase();
        projectsByEmail.set(em, (projectsByEmail.get(em) || 0) + 1);
      }
    });

    const leadsByEmail = new Map<string, number>();
    allLeads.forEach((l: any) => {
      if (l.email) {
        const em = l.email.toLowerCase();
        leadsByEmail.set(em, (leadsByEmail.get(em) || 0) + 1);
      }
    });


    // Format user records without sensitive data (passwords)
    let users = rawUsers.map((u: any) => {
      const { password, _id, ...safeUser } = u;
      const em = (u.email || "").toLowerCase();
      const isGoogle = u.password === "google-oauth-linked" || u.isGoogle === true;

      const avatar = getProfileAvatarOption(normalizeProfileAvatarId(u.profileImageId));
      return {
        ...safeUser,
        _id: _id.toString(),
        userType: u.userType || "general",
        isGoogle,
        profileImageId: avatar?.id || "avatar-01",
        profileImageUrl: avatar?.imageUrl || "/profile-avatars/avatar-01.jpg",
        projectCount: projectsByEmail.get(em) || 0,
        leadCount: leadsByEmail.get(em) || 0,
        createdAt: u.createdAt || new Date().toISOString(),
      };
    });

    // Filter by search term if provided
    if (search) {
      users = users.filter(
        (u) =>
          u.name?.toLowerCase().includes(search) ||
          u.email?.toLowerCase().includes(search) ||
          u.phone?.toLowerCase().includes(search) ||
          u.id?.toLowerCase().includes(search)
      );
    }

    // Filter by user type if provided
    if (userType && userType !== "all") {
      users = users.filter((u) => u.userType === userType);
    }

    // Summary statistics
    const stats = {
      totalUsers: rawUsers.length,
      studentsCount: rawUsers.filter((u: any) => u.userType === "student").length,
      clientsCount: rawUsers.filter((u: any) => u.userType === "client").length,
      bothCount: rawUsers.filter((u: any) => u.userType === "both").length,
      googleUsersCount: rawUsers.filter(
        (u: any) => u.password === "google-oauth-linked" || u.isGoogle === true
      ).length,
    };

    return NextResponse.json({ success: true, stats, users }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching admin users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch registered users" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users - Update user details (e.g. userType, role, or contact info)
export async function PUT(request: Request) {
  try {
    if (!(await hasModuleAccess("registeredUsers"))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { email, id, userType, name, phone, company, address } = body;

    if (!email && !id) {
      return NextResponse.json(
        { success: false, error: "User ID or Email is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const usersColl = db.collection("users");

    const query = id ? { id } : { email: (email || "").toLowerCase() };
    const updateFields: any = { updatedAt: new Date().toISOString() };

    if (userType) updateFields.userType = userType;
    if (name) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;
    if (company !== undefined) updateFields.company = company;
    if (address !== undefined) updateFields.address = address;

    const result = await usersColl.updateOne(query, { $set: updateFields });

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "User updated successfully" });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users - Delete a user record
export async function DELETE(request: Request) {
  try {
    if (!(await hasModuleAccess("registeredUsers"))) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const id = searchParams.get("id");

    if (!email && !id) {
      return NextResponse.json(
        { success: false, error: "User ID or Email parameter is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const usersColl = db.collection("users");

    const query = id ? { id } : { email: (email || "").toLowerCase() };
    const result = await usersColl.deleteOne(query);

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
