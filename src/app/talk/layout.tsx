import type { Metadata } from "next";

export const metadata: Metadata = { title: "Talk to Civil At Hand", description: "Discuss your civil engineering, architecture or project requirements with Civil At Hand.", robots: { index: true, follow: true }, };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
