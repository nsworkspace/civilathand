import type { Metadata } from "next";

export const metadata: Metadata = { title: "Accessibility Statement", description: "Accessibility standards and support information for Civil At Hand.", robots: { index: true, follow: true }, };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
