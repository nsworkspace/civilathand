import type { Metadata } from "next";
import CommunityPwaRegister from "@/components/CommunityPwaRegister";

export const metadata: Metadata = {
  title: "Community | NS Construction",
  description: "NS Construction professional community rooms and conversations.",
  applicationName: "NS Construction Community",
  manifest: "/community-app/manifest.webmanifest",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "CAH Community", statusBarStyle: "black-translucent" },
};

export default function CommunityAppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen bg-[#f4f6f8]"><CommunityPwaRegister />{children}</div>;
}
