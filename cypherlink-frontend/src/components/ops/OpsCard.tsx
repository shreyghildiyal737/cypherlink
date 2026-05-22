import { cn } from "../../utils/cn";

export function OpsCard({
  title,
  eyebrow,
  children,
  className,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[2rem] border border-white/10 bg-panel p-5",
        className,
      )}
    >
      {eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[.25em] text-cyanGlow">
          {eyebrow}
        </p>
      )}
      <h2 className="text-xl font-black tracking-tight">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
