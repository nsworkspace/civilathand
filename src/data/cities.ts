export interface CityItem {
  slug: string;
  name: string;
  state: string;
}

// Pan-India target list for local SEO landing pages (/services/[service]/[city]).
// Keep slugs lowercase-hyphenated; `name` is used in copy and metadata.
// Add more cities here any time — new pages generate automatically, no
// other file needs to change.
export const CITIES: CityItem[] = [
  { slug: "delhi", name: "Delhi", state: "Delhi" },
  { slug: "gurgaon", name: "Gurgaon", state: "Haryana" },
  { slug: "noida", name: "Noida", state: "Uttar Pradesh" },
  { slug: "chandigarh", name: "Chandigarh", state: "Chandigarh" },
  { slug: "jalandhar", name: "Jalandhar", state: "Punjab" },
  { slug: "ludhiana", name: "Ludhiana", state: "Punjab" },
  { slug: "amritsar", name: "Amritsar", state: "Punjab" },
  { slug: "mohali", name: "Mohali", state: "Punjab" },
  { slug: "panchkula", name: "Panchkula", state: "Haryana" },
  { slug: "karnal", name: "Karnal", state: "Haryana" },
  { slug: "jaipur", name: "Jaipur", state: "Rajasthan" },
  { slug: "lucknow", name: "Lucknow", state: "Uttar Pradesh" },
  { slug: "kanpur", name: "Kanpur", state: "Uttar Pradesh" },
  { slug: "dehradun", name: "Dehradun", state: "Uttarakhand" },
  { slug: "mumbai", name: "Mumbai", state: "Maharashtra" },
  { slug: "pune", name: "Pune", state: "Maharashtra" },
  { slug: "ahmedabad", name: "Ahmedabad", state: "Gujarat" },
  { slug: "surat", name: "Surat", state: "Gujarat" },
  { slug: "bangalore", name: "Bangalore", state: "Karnataka" },
  { slug: "hyderabad", name: "Hyderabad", state: "Telangana" },
  { slug: "chennai", name: "Chennai", state: "Tamil Nadu" },
  { slug: "kolkata", name: "Kolkata", state: "West Bengal" },
  { slug: "bhopal", name: "Bhopal", state: "Madhya Pradesh" },
  { slug: "indore", name: "Indore", state: "Madhya Pradesh" },
  { slug: "patna", name: "Patna", state: "Bihar" },
];

export function findCity(slug: string): CityItem | undefined {
  return CITIES.find((c) => c.slug === slug.toLowerCase());
}
