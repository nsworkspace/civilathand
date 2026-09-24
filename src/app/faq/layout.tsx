import type { Metadata } from "next";

export const metadata: Metadata = { title: "Frequently Asked Questions", description: "Frequently asked questions about Civil At Hand services, education and support.", robots: { index: true, follow: true }, };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
