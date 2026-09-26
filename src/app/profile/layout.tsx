import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Profile", description: "Manage your NS Construction profile.", robots: { index: false, follow: false }, };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
