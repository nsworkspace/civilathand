import clientPromise from "@/lib/mongodb";

export const DEFAULT_HIDDEN_ADMIN_MODULES: string[] = [];
export const DEFAULT_HIDDEN_EDUCATION_CARDS: string[] = [];

export type PanelVisibilitySettings = {
  hiddenAdminModules: string[];
  hiddenEducationCards: string[];
};

export async function getPanelVisibility(): Promise<PanelVisibilitySettings> {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "civil-at-hand");
    const doc = await db.collection("site_panel_visibility").findOne({ key: "global" });
    return {
      hiddenAdminModules: Array.isArray(doc?.hiddenAdminModules) ? doc.hiddenAdminModules.filter((x: unknown): x is string => typeof x === "string") : [...DEFAULT_HIDDEN_ADMIN_MODULES],
      hiddenEducationCards: Array.isArray(doc?.hiddenEducationCards) ? doc.hiddenEducationCards.filter((x: unknown): x is string => typeof x === "string") : [...DEFAULT_HIDDEN_EDUCATION_CARDS],
    };
  } catch (error) {
    console.error("Panel visibility lookup failed:", error);
    return { hiddenAdminModules: [...DEFAULT_HIDDEN_ADMIN_MODULES], hiddenEducationCards: [...DEFAULT_HIDDEN_EDUCATION_CARDS] };
  }
}
