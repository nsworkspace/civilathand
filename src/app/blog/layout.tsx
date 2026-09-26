import type { Metadata } from "next";

export const metadata: Metadata = { title: "Civil Engineering Blog", description: "Civil engineering, construction, design and education insights from NS Construction.", robots: { index: true, follow: true }, };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
