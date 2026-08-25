export function RouteFallback() {
  return (
    <div
      className="flex min-h-[calc(100vh-4rem)] items-center justify-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="space-y-3 text-center">
        <div className="motion-safe:animate-pulse-soft h-1 w-24 rounded-full bg-white/[0.10]" />
        <p className="font-label-sm text-xs text-on-surface-variant/28">Loading…</p>
      </div>
    </div>
  );
}
