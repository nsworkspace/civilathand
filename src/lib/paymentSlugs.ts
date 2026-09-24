// Deterministic slugs for the single Payment Center.
export const MENTORSHIP_SLUG = "mentorship-program";

export function courseItemSlug(slug: string) {
  return `course-${String(slug).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}
