export function OpsMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="glass-card rounded-2xl border border-white/[0.06] p-4">
      <p className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant/40">{label}</p>
      <p className="mt-2 font-headline-lg-mobile text-2xl font-semibold text-on-surface">{value}</p>
      <p className="mt-1 font-label-sm text-xs text-on-surface-variant/40">{helper}</p>
    </div>
  );
}
