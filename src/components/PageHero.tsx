export default function PageHero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="blueprint-grid bg-navy-950 py-16 text-center text-white md:py-20">
      <div className="mx-auto max-w-3xl px-5">
        <h1 className="font-display text-4xl font-bold md:text-5xl">{title}</h1>
        <div className="mx-auto mt-4 h-1 w-16 rounded bg-gold-500" />
        <p className="mt-5 text-base text-slate-300 md:text-lg">{subtitle}</p>
      </div>
    </section>
  );
}
