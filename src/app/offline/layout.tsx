import type { Metadata } from "next";

export const metadata: Metadata = { title: "Offline", description: "Civil At Hand offline page.", robots: { index: false, follow: false }, };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
