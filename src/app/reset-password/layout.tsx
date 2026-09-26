import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reset Password", description: "Securely reset your NS Construction account password.", robots: { index: false, follow: false }, };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
