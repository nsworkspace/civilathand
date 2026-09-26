import type { Metadata } from "next";

export const metadata: Metadata = { title: "NS Construction Links", description: "Official NS Construction resources and quick links.", robots: { index: true, follow: true }, };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
