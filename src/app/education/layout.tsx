import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Civil At Hand Education | Courses & Mentorship",
  description: "Civil At Hand Education: practical civil and architectural courses plus universal mentorship for exams, government careers, private-sector roles and real project skills.",
  robots: { index: true, follow: true },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
