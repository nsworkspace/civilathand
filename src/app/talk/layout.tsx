import type { Metadata } from "next";

export const metadata: Metadata = { title: "Talk to NS Construction", description: "Discuss your civil engineering, architecture or project requirements with NS Construction.", robots: { index: true, follow: true }, };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
