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
          className="rounded-2xl bg-white/5 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-bold">{item.title}</p>
            <span className="text-xs text-white/45">{item.time}</span>
          </div>
          <p className="mt-1 text-sm text-white/60">{item.body}</p>
        </div>
      ))}
    </div>
  );
}
