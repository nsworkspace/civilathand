import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { isAdminAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  // Security guard: require admin authentication
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  // Security guard: this endpoint must NEVER be accessible in production.
  // It leaks database connection details and collection names.
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production." },
      { status: 403 }
    );
  }

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "civil-at-hand";
  
  const diagnostics = {
    envUriExists: !!uri,
    envUriMasked: uri ? uri.replace(/:([^@]+)@/, ":****@") : null,
    envDbName: dbName,
    connectionStatus: "Not attempted",
    error: null as any,
    collections: [] as string[]
  };

  try {
    diagnostics.connectionStatus = "Attempting connection...";
    const client = await clientPromise;
    diagnostics.connectionStatus = "Connected successfully!";
    
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    diagnostics.collections = collections.map(c => c.name);
  } catch (err: any) {
    diagnostics.connectionStatus = "Failed";
    diagnostics.error = {
      message: err.message,
      code: err.code,
      name: err.name,
      stack: err.stack ? err.stack.split("\n").slice(0, 3) : null
    };
  }

  return NextResponse.json(diagnostics);
}
