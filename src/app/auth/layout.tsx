import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign In", description: "Sign in to your NS Construction account securely.", robots: { index: false, follow: false }, };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
