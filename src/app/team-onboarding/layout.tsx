import type { Metadata } from "next";

export const metadata: Metadata = { title: "Team Onboarding", description: "NS Construction team onboarding and workspace access.", robots: { index: false, follow: false }, };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
