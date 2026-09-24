import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Civil At Hand Courses | Civil, Structural, BIM & Architecture",
  description: "Explore Civil At Hand Courses across AutoCAD, Revit, structural design, BIM, site engineering, quantity surveying, architecture, planning and Vastu.",
  robots: { index: true, follow: true },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
