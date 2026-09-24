import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact Civil At Hand", description: "Contact Civil At Hand for civil engineering, architecture, consultancy, education and support.", robots: { index: true, follow: true }, };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
