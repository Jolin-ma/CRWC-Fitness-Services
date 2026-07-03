export default function StatTile({ label, value, tone = "default" }) {
  const toneClasses = {
    default: "text-brand-ink",
    accent: "text-brand-green",
  };

  return (
    <div className="border border-brand-ink/12 bg-white px-6 py-5">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-brand-ink/45">
        {label}
      </p>
      <p className={`mt-2 font-editorial text-4xl ${toneClasses[tone]}`}>{value}</p>
    </div>
  );
}
