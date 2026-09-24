import type { Metadata } from "next";
import type { ReactNode } from "react";

// Server-only wrapper so we can set `noindex` on /private without turning
// page.tsx into a server component (it needs useState/localStorage).
export const metadata: Metadata = {
  title: "Private",
  robots: { index: false, follow: false, nocache: true },
};

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return children;
}
