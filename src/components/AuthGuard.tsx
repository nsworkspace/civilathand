"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

const PROTECTED_PATHS = new Set(["/dashboard", "/profile"]);

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isProtected = PROTECTED_PATHS.has(pathname);
  const [isLoading, setIsLoading] = useState(isProtected);

  useEffect(() => {
    if (!isProtected) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!cancelled) router.replace(`/auth?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/auth/status", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || data?.verified !== true) {
          if (!cancelled) router.replace(`/auth?redirect=${encodeURIComponent(pathname)}`);
          return;
        }

        if (!cancelled) {
          try {
            localStorage.setItem(
              "cah_user",
              JSON.stringify({
                id: user.uid,
                email: user.email,
                name: user.displayName || "",
                emailVerified: true,
              })
            );
          } catch {
            // Firebase remains the authentication source of truth.
          }
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) router.replace(`/auth?redirect=${encodeURIComponent(pathname)}`);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [isProtected, pathname, router]);

  if (isProtected && isLoading) return null;
  return <>{children}</>;
}
