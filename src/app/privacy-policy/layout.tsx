import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy", description: "NS Construction privacy policy and data handling information.", robots: { index: true, follow: true }, };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
