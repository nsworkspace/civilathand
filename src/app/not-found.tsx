import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl px-5 py-32 text-center">
      <h1 className="font-display text-6xl font-bold text-navy-950">404</h1>
      <p className="mt-4 text-slate-600">This page could not be found.</p>
      <Link href="/" className="mt-8 inline-block rounded-lg bg-gold-500 px-7 py-3 font-semibold text-navy-950">Back to Home</Link>
    </section>
  );
}
