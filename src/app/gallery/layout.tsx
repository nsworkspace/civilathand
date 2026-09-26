import type { Metadata } from "next";

export const metadata: Metadata = { title: "Project Gallery", description: "NS Construction project, construction, design and team gallery.", robots: { index: true, follow: true }, };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
