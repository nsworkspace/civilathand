import type { Metadata } from "next";

export const metadata: Metadata = { title: "About NS Construction", description: "Learn about NS Construction, our civil engineering, architecture, design and consultancy work.", robots: { index: true, follow: true }, };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
