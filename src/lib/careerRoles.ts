export function slugifyCareerRole(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function roleSlug(role: any) {
  return role?.slug || slugifyCareerRole(role?.title || role?.id || "job");
}

export function roleList(value: unknown) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String).map((v) => v.trim()).filter(Boolean);
  return String(value || "")
    .split(/\r?\n|,/)
    .map((v) => v.trim())
    .filter(Boolean);
}
