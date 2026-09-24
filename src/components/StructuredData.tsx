import React from "react";
import { SITE, SOCIAL_LIST } from "@/data/site";

export function StructuredData() {
  const graph = [
    {
      "@type": "Person",
      "@id": `${SITE.url}/#founder`,
      name: "Nikhil",
      jobTitle: "Founder & Lead Engineer",
      worksFor: { "@id": `${SITE.url}/#organization` },
      url: `${SITE.url}/about`,
    },
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#organization`,
      name: SITE.name,
      legalName: SITE.legalName,
      url: SITE.url,
      logo: SITE.logo,
      description: SITE.description,
      sameAs: SOCIAL_LIST,
      areaServed: { "@type": "Country", name: SITE.address.countryName },
      knowsAbout: [
        "Civil engineering education",
        "Structural engineering",
        "Architecture",
        "Construction and site engineering",
        "BIM and CAD",
        "Quantity surveying",
        "Engineering tools",
        "Career development",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        email: SITE.email,
        contactType: "customer service",
        areaServed: "IN",
        availableLanguage: ["en", "hi"],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      description: SITE.description,
      publisher: { "@id": `${SITE.url}/#organization` },
      inLanguage: "en-IN",
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE.url}/blog?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "EducationalOrganization",
      "@id": `${SITE.url}/#education`,
      name: SITE.name,
      url: SITE.url,
      description: SITE.shortDescription,
      email: SITE.email,
      areaServed: { "@type": "Country", name: SITE.address.countryName },
      sameAs: SOCIAL_LIST,
      knowsAbout: [
        "Civil engineering education",
        "Structural engineering",
        "Architecture",
        "Construction and site engineering",
        "BIM and CAD",
        "Quantity surveying",
        "Engineering tools",
        "Career development",
      ],
    },
  ];

  const json = { "@context": "https://schema.org", "@graph": graph };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
