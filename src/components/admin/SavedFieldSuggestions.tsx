"use client";

import { useEffect, useState } from "react";

type Suggestion = { value: string; label: string };

export function SavedFieldSuggestions({ type = "contacts", query = "", id }: { type?: string; query?: string; id: string }) {
  const [items, setItems] = useState<Suggestion[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/suggestions?type=${encodeURIComponent(type)}&q=${encodeURIComponent(query)}`, { cache: "no-store", signal: controller.signal });
        const data = await res.json();
        if (data?.success) setItems(data.suggestions || []);
      } catch {}
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [type, query]);

  return (
    <datalist id={id}>
      {items.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
    </datalist>
  );
}
