export function OpsTimeline({
  items,
}: {
  items: Array<{ time: string; title: string; body: string }>;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={`${item.time}-${item.title}`}
          className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-body-md font-semibold text-on-surface">{item.title}</p>
            <span className="font-label-sm font-mono text-xs text-on-surface-variant/40">{item.time}</span>
          </div>
          <p className="mt-1 font-label-sm font-mono text-sm text-on-surface-variant/50">{item.body}</p>
        </div>
      ))}
    </div>
  );
}
