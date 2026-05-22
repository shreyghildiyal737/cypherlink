import { cn } from "../../utils/cn";
export function Badge({
  children,
  tone = "purple",
}: {
  children: React.ReactNode;
  tone?: "purple" | "cyan" | "orange" | "green" | "muted";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border",
        tone === "purple" &&
          "bg-purpleGlow/10 text-purple-100 border-purpleGlow/25",
        tone === "cyan" && "bg-cyanGlow/10 text-cyan-100 border-cyanGlow/25",
        tone === "orange" &&
          "bg-orangeGlow/10 text-orange-100 border-orangeGlow/25",
        tone === "green" &&
          "bg-emerald-400/10 text-emerald-100 border-emerald-300/25",
        tone === "muted" && "bg-white/5 text-white/70 border-white/10",
      )}
    >
      {children}
    </span>
  );
}
