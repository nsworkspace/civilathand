import type { Metadata } from "next";

export const metadata: Metadata = { title: "Careers at Civil At Hand", description: "Explore current careers and opportunities at Civil At Hand.", robots: { index: true, follow: true }, };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
