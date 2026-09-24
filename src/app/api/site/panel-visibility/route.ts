import { NextResponse } from "next/server";
import { getPanelVisibility } from "@/lib/panelVisibility";

export async function GET() {
  const settings = await getPanelVisibility();
  return NextResponse.json({ hiddenEducationCards: settings.hiddenEducationCards }, { headers: { "Cache-Control": "no-store" } });
}
