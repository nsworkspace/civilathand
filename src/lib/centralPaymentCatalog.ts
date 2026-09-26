import { Db } from "mongodb";

export interface CentralPaymentSeed {
  slug: string;
  title: string;
  description: string;
  category: string;
  amount: number;
  pageHint: string;
  accessType?: string;
  accessValue?: string;
  active?: boolean;
}

export const CENTRAL_PAYMENT_SEEDS: CentralPaymentSeed[] = [
  { slug: "vendor-registration", active: true, title: "Vendor Network Registration", description: "Vendor registration and onboarding fee for suppliers, contractors, fabricators, manpower providers and specialist service businesses joining the NS Construction Vendor Network. Registration supports professional listing and review; it does not guarantee projects or work.", category: "vendor-registration", amount: 99, pageHint: "Vendor Network / Registration", accessType: "vendor-registration", accessValue: "vendor-registration" },
  { slug: "mentorship-program", active: true, title: "1:1 Mentorship Program", description: "Personalized civil engineering mentorship.", category: "mentorship", amount: 0, pageHint: "Education / Mentorship", accessType: "mentorship", accessValue: "mentorship-program" },
  { slug: "calculator-unit-converter", title: "Civil Engineering Unit Converter", description: "Paid access to the professional civil and architectural engineering unit converter.", category: "calculator", amount: 99, pageHint: "Calculators / Unit Converter", accessType: "calculator", accessValue: "unit-converter" },
  { slug: "calculator-concrete", title: "Concrete Calculator", description: "Paid access to the professional concrete material quantity calculator.", category: "calculator", amount: 149, pageHint: "Calculators / Concrete", accessType: "calculator", accessValue: "concrete" },
];

export function getCentralPaymentSeed(slug: string) {
  return CENTRAL_PAYMENT_SEEDS.find((item) => item.slug === slug) || null;
}

export async function ensureCentralPaymentCatalog(db: Db) {
  const collection = db.collection("payment_items");
  const now = new Date().toISOString();
  for (const seed of CENTRAL_PAYMENT_SEEDS) {
    const existing = await collection.findOne({ slug: seed.slug });
    if (existing) {
      // Never overwrite an admin-set price or active flag. Only fill missing metadata.
      await collection.updateOne(
        { slug: seed.slug },
        {
          $set: {
            title: existing.title || seed.title,
            description: existing.description || seed.description,
            category: existing.category || seed.category,
            pageHint: existing.pageHint || seed.pageHint,
            accessType: existing.accessType || seed.accessType,
            accessValue: existing.accessValue || seed.accessValue,
            updatedAt: now,
          },
          $setOnInsert: { amount: seed.amount, active: seed.active !== false, purchaseCount: 0, createdAt: now },
        }
      );
    } else {
      await collection.insertOne({
        id: `pay-${seed.slug}`,
        ...seed,
        active: seed.active !== false,
        buttonLabel: "Pay Now",
        successMessage: "Payment received successfully.",
        purchaseCount: 0,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
}

