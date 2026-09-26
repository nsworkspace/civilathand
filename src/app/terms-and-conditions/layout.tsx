import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms and Conditions", description: "Terms and conditions for using NS Construction services and website.", robots: { index: true, follow: true }, };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
