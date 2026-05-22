import { ButtonHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
type Variant = "primary" | "secondary" | "ghost" | "danger";
export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "rounded-full px-5 py-3 text-sm font-semibold transition active:scale-[.98] disabled:opacity-50",
        variant === "primary" &&
          "bg-white text-ink hover:bg-cyan-100 shadow-glow",
        variant === "secondary" && "glass text-white hover:border-white/25",
        variant === "ghost" &&
          "text-white/80 hover:text-white hover:bg-white/5",
        variant === "danger" &&
          "bg-red-500/15 text-red-200 border border-red-400/30",
        className,
      )}
      {...props}
    />
  );
}
