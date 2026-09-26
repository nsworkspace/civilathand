import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getVendorRegistrationAccess, requireVerifiedVendorUser } from "@/lib/vendorRegistration";
import { generateSlug } from "@/lib/utils";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

function clean(value: unknown) { return String(value ?? "").trim(); }
function validHttpsUrl(value: string) { return !value || /^https:\/\/[^\s]+$/i.test(value); }

export async function POST(req: Request) {
  try {
    const user = await requireVerifiedVendorUser(req);
    if (!user) return NextResponse.json({ error: "Please sign in with a verified email address before submitting your vendor registration.", requiresAuth: true }, { status: 401 });

    const body = await req.json();
    const name = clean(body.name), companyName = clean(body.companyName), vendorType = clean(body.vendorType), category = clean(body.category), location = clean(body.location);
    const address = clean(body.address), description = clean(body.description), phone = clean(body.phone_hidden), email = clean(body.email_hidden).toLowerCase();
    const website = clean(body.website), serviceArea = clean(body.serviceArea), keyServices = clean(body.keyServices), projectExperience = clean(body.projectExperience);
    const yearsExperience = clean(body.yearsExperience), teamSize = clean(body.teamSize), gstin = clean(body.gstin).toUpperCase(), designation = clean(body.designation);
    const portfolio = Array.isArray(body.portfolio) ? body.portfolio.slice(0, 8) : [];

    const missing: string[] = [];
    if (!name) missing.push("Contact name");
    if (!companyName) missing.push("Company / business name");
    if (!vendorType) missing.push("Vendor type");
    if (!category) missing.push("Primary service / category");
    if (!location) missing.push("City / State");
    if (!phone) missing.push("Phone");
    if (!email) missing.push("Email");
    if (!description) missing.push("Business description");
    if (!serviceArea) missing.push("Service coverage");
    if (!body.registrationFeeAcknowledged || !body.noWorkGuaranteeAcknowledged || !body.commissionTermsAcknowledged || !body.searchVisibilityAcknowledged) {
      missing.push("Required registration acknowledgements");
    }
    if (missing.length) return NextResponse.json({ error: `Please complete: ${missing.join(", ")}.` }, { status: 400 });
    if (!validHttpsUrl(website)) return NextResponse.json({ error: "Website must use a valid HTTPS address." }, { status: 400 });
    if (email !== user.email!.trim().toLowerCase()) return NextResponse.json({ error: "The registration email must match your verified NS Construction account email." }, { status: 400 });

    const client = await clientPromise;
    const db = client.db(dbName);
    const access = await getVendorRegistrationAccess(db, user.uid);
    if (!access.allowed) return NextResponse.json({ error: access.alreadyUsed ? "This registration payment has already been used. Please start a new registration." : "A valid vendor registration payment is required before submitting the registration." }, { status: 402 });

    const collection = db.collection("vendors");
    const existing = await collection.findOne({ $or: [{ email_hidden: email }, { phone_hidden: phone }] }, { projection: { _id: 1 } });
    if (existing) return NextResponse.json({ error: "A vendor with this email or phone already exists." }, { status: 409 });

    const safePortfolio = [] as { type: "file" | "link"; url: string; name: string }[];
    for (const item of portfolio) {
      if (!item || !item.url || !item.name) continue;
      const url = String(item.url).trim();
      const type = item.type === "link" ? "link" : "file";
      if (type === "link" && !/^https:\/\/[^\s]+$/i.test(url)) continue;
      if (type === "file") {
        const match = url.match(/^\/api\/uploads\/([a-zA-Z0-9._-]+)$/);
        if (!match) continue;
        const owned = await db.collection("uploaded_files").findOne({ filename: match[1], ownerUid: user.uid, purpose: "vendor-portfolio" }, { projection: { filename: 1 } });
        if (!owned) continue;
      }
      safePortfolio.push({ type, url, name: String(item.name).trim().slice(0, 200) });
    }

    const now = new Date();
    const baseSlug = generateSlug(companyName || name);
    const slug = baseSlug || `vendor-${Date.now()}`;
    const newVendor = {
      name, companyName, vendorType, category, location, address, description, phone_hidden: phone, email_hidden: email, website,
      designation, yearsExperience, serviceArea, keyServices, projectExperience, teamSize, gstin,
      portfolio: safePortfolio,
      slug,
      isActive: false,
      approved: false,
      status: "pending",
      source: "self",
      registrationPaymentId: access.paymentEvent?.razorpayPaymentId || null,
      registrationPaymentOrderId: access.paymentEvent?.razorpayOrderId || null,
      registrationFee: access.configuredAmount,
      registrationPaidAt: access.paymentEvent?.paidAt || (access.configuredAmount === 0 ? now : null),
      feeDisclosureAcceptedAt: now,
      noWorkGuaranteeAcceptedAt: now,
      commissionTermsAcceptedAt: now,
      searchVisibilityAcceptedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const insert = await collection.insertOne(newVendor);

    if (access.paymentEvent?._id && access.configuredAmount > 0) {
      const claim = await db.collection("payment_events").updateOne(
        { _id: access.paymentEvent._id, vendorRegistrationId: { $exists: false } },
        { $set: { vendorRegistrationId: String(insert.insertedId), vendorRegistrationClaimedAt: now.toISOString() } },
      );
      if (!claim.modifiedCount) {
        await collection.deleteOne({ _id: insert.insertedId });
        return NextResponse.json({ error: "This registration payment was used by another submission. Please start with a new registration payment." }, { status: 409 });
      }
    }

    await db.collection("uploaded_files").updateMany(
      { ownerUid: user.uid, purpose: "vendor-portfolio", filename: { $in: safePortfolio.filter((p) => p.type === "file").map((p) => p.url.split("/").pop()) } },
      { $set: { claimedByVendorId: String(insert.insertedId), claimedAt: now } },
    );

    return NextResponse.json({ success: true, vendorId: String(insert.insertedId), paymentVerified: access.configuredAmount === 0 || !!access.paymentEvent });
  } catch (error) {
    console.error("Vendor registration error:", error);
    return NextResponse.json({ error: "Unable to complete vendor registration securely. Please try again." }, { status: 500 });
  }
}
