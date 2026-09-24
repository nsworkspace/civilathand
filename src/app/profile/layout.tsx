import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Profile", description: "Manage your Civil At Hand profile.", robots: { index: false, follow: false }, };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
