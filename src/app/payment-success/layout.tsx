import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payment Successful", description: "Your NS Construction payment confirmation.", robots: { index: false, follow: false }, };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
