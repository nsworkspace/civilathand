/**
 * Generates a URL-friendly slug from a text string (e.g. a blog post title).
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove all non-word chars (except spacing and dashes)
    .replace(/[\s_]+/g, "-")  // Replace spaces and underscores with a single dash
    .replace(/^-+|-+$/g, ""); // Trim leading and trailing dashes
}
