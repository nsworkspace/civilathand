import type { Metadata } from "next";
import { SITE } from "@/data/site";
import { ProjectProvider } from "@/context/ProjectContext";
import AuthGuard from "@/components/AuthGuard";
import { StructuredData } from "@/components/StructuredData";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import AnalyticsPageTracker from "@/components/AnalyticsPageTracker";
import AccessibilityLayer from "@/components/AccessibilityLayer";
import { SiteChrome } from "@/components/SiteChrome";
import { MarketingIntegrations } from "@/components/MarketingIntegrations";
import "./globals.css";

const SOCIAL_IMAGE = "/opengraph-image";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | Civil & Architecture Learning Platform`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  alternates: {
    canonical: SITE.url,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} | Civil & Architecture Learning Platform`,
    description: SITE.shortDescription,
    images: [
      {
        url: SOCIAL_IMAGE,
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "Civil At Hand — Civil Engineering & Architecture Learning Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} | Civil & Architecture Learning Platform`,
    description: SITE.shortDescription,
    images: [SOCIAL_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN">
      <head>
        <StructuredData />
      </head>
      <body>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <AccessibilityLayer />
        <ServiceWorkerRegister />
        <MarketingIntegrations />
        <ProjectProvider>
          <AuthGuard>
            <SiteChrome>{children}</SiteChrome>
          </AuthGuard>
          <AnalyticsPageTracker />
        </ProjectProvider>
      </body>
    </html>
  );
}
