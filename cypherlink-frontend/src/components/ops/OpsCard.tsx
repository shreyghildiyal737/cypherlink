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
        "glass-card rounded-2xl border border-white/[0.06] p-5",
        className,
      )}
    >
      {eyebrow && (
        <p className="mb-2 font-label-sm text-[10px] font-semibold uppercase tracking-widest text-primary/70">
          {eyebrow}
        </p>
      )}
      <h2 className="font-headline-lg-mobile text-xl text-on-surface">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
