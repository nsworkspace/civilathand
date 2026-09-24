import type { Metadata } from "next";

export const metadata: Metadata = { title: "Engineering Disclaimer", description: "Engineering, design and technical-use disclaimer for Civil At Hand content.", robots: { index: true, follow: true }, };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
