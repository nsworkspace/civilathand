export interface Course {
  slug: string;
  name: string;
  sub: string;
  category: "Civil Engineering" | "Structural Design" | "Site & Construction" | "BIM & Digital" | "Architecture & Planning" | "Career & Management";
  mode: "Live" | "Self-Paced";
  level: string;
  duration: string;
  priceLabel: string;
  badge: string;
  badgeColor: string;
  accent: string;
  summary: string;
  learn: string[];
  modules: string[];
  whoFor: string[];
  comingSoon: boolean;
  paymentLink?: string;
  priceAmount?: number;
  views?: number;
}

/**
 * Course records are intentionally database-backed.
 *
 * Courses must be created from Admin → Courses. Keeping this export empty
 * prevents demo/catalog records from being reintroduced into the public
 * course library when the database is empty.
 */
export const COURSES: Course[] = [];

export function getCourse(slug: string): Course | undefined {
  return COURSES.find((course) => course.slug === slug);
}
