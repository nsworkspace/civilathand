import { redirect } from "next/navigation";
import { getAdminSession, hasModuleAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ChannelAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session || !(await hasModuleAccess("community"))) redirect("/auth?mode=signin&redirect=%2Fcah-expert-control");
  return children;
}
