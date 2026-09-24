"use client";

import { useSearchParams } from "next/navigation";
import CommunityChatPro from "@/components/community/CommunityChatPro";

export default function CommunityProMount(){
  const searchParams=useSearchParams();
  const groupId=searchParams.get("group");
  return groupId ? <CommunityChatPro groupId={groupId}/> : null;
}
