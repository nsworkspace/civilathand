"use client";

import { useEffect } from "react";

/** Small global UX/accessibility layer. It never renders a floating control. */
export default function AccessibilityLayer() {
  useEffect(() => {
    const main = document.querySelector("main");
    if (main && !main.id) main.id = "main-content";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        document.querySelectorAll<HTMLElement>("[data-dismiss-on-escape='true']").forEach((el) => el.click());
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return null;
}
