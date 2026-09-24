import type { Metadata } from "next";

export const metadata: Metadata = { title: "Civil At Hand Links", description: "Official Civil At Hand resources and quick links.", robots: { index: true, follow: true }, };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
