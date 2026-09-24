import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'civil-at-hand');
    const vendor = await db.collection('vendors').findOne(
      { _id: new ObjectId(id), $or: [{ isActive: true }, { approved: true }, { status: "approved" }] },
      { projection: { name: 1, companyName: 1, vendorType: 1, category: 1, location: 1, description: 1, updatedAt: 1 } },
    );
    if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    return NextResponse.json(vendor);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch vendor' }, { status: 500 });
  }
}
