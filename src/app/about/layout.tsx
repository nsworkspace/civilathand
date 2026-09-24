import type { Metadata } from "next";

export const metadata: Metadata = { title: "About Civil At Hand", description: "Learn about Civil At Hand, our civil engineering, architecture, design and consultancy work.", robots: { index: true, follow: true }, };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
