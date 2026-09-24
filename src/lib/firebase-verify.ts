import { firebaseConfig } from "@/lib/firebase";
import clientPromise from "@/lib/mongodb";

export interface VerifiedFirebaseUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
}

export async function verifyFirebaseIdToken(
  idToken: string | null | undefined
): Promise<VerifiedFirebaseUser | null> {
  if (!idToken) return null;

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        cache: "no-store",
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const user = data?.users?.[0];
    if (!user?.localId) return null;

    let emailVerified = !!user.emailVerified;

    // The app uses its own OTP email-verification flow. Firebase's client
    // emailVerified flag remains false because we intentionally do not send
    // Firebase verification emails. Treat the server-side OTP record as an
    // additional, authoritative verification source for this application.
    if (!emailVerified && user.email) {
      try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB || "civil-at-hand");
        const verification = await db.collection("email_verifications").findOne({
          uid: user.localId,
          email: String(user.email).trim().toLowerCase(),
        });
        emailVerified = !!verification?.verifiedAt;
      } catch (error) {
        // Fail closed if the verification store is unavailable.
        console.error("[firebase-verify] Verification lookup failed:", error);
        emailVerified = false;
      }
    }

    return {
      uid: user.localId,
      email: user.email || null,
      emailVerified,
    };
  } catch {
    return null;
  }
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}
