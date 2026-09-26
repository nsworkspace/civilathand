import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cookie Policy", description: "Learn how NS Construction uses cookies and similar technologies.", robots: { index: true, follow: true }, };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
