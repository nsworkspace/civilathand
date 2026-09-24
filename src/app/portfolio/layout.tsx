import type { Metadata } from "next";

export const metadata: Metadata = { title: "Civil Engineering Portfolio", description: "Selected civil engineering, architecture, design and consultancy projects.", robots: { index: true, follow: true }, };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
