export default function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width="38" height="38" viewBox="0 0 40 40" aria-hidden="true">
        <rect width="40" height="40" rx="8" fill="#c8942a" />
        <path d="M9 31V9l11 13V9m0 22V9l11 22V9" fill="none" stroke="#0c1a2e" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <span className="leading-none">
        <span className={`block font-display text-xl font-bold tracking-wide ${dark ? "text-white" : "text-navy-950"}`}>NS INFRA</span>
        <span className={`block text-[10px] uppercase tracking-[0.2em] ${dark ? "text-gold-400" : "text-gold-600"}`}>Civil &amp; Architecture</span>
      </span>
    </span>
  );
}
