import type { Metadata } from "next";

export const metadata: Metadata = { title: "Careers at NS Construction", description: "Explore current careers and opportunities at NS Construction.", robots: { index: true, follow: true }, };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
