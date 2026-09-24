"use client";

import { auth } from "@/lib/firebase";

/**
 * Returns the Firebase bearer header required by paid feature APIs.
 * Free features can call the same APIs without a token; the server decides
 * whether authentication is actually required.
 */
export async function getPaymentAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  try {
    const token = await user.getIdToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}
