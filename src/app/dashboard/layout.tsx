import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard", description: "Your NS Construction account dashboard.", robots: { index: false, follow: false }, };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
