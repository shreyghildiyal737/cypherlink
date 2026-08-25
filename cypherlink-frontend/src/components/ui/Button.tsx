import { ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "live";
type Size = "sm" | "md" | "lg";

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl font-bold transition-all duration-300",
        "disabled:cursor-not-allowed disabled:opacity-40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/50 focus-visible:ring-offset-1 focus-visible:ring-offset-surface-container-lowest",
        // Sizes
        size === "sm" && "px-3.5 py-2 font-label-sm text-label-sm tracking-wide",
        size === "md" && "px-5 py-2.5 text-sm font-semibold tracking-wide",
        size === "lg" && "px-7 py-3.5 text-base font-semibold tracking-wide",
        // Variants
        variant === "primary" && [
          "bg-gradient-to-br from-primary-container via-[#6d28d9] to-[#5200b0] text-on-primary-container",
          "border border-primary/25 shadow-primary-glow",
          "hover:border-primary/40 hover:shadow-primary-glow-lg",
          "active:scale-95",
        ],
        variant === "secondary" && [
          "border border-primary-container/15 bg-white/[0.03] text-on-surface-variant/80 backdrop-blur-md",
          "hover:border-primary-container/30 hover:bg-primary-container/06 hover:text-on-surface",
        ],
        variant === "ghost" && [
          "border border-transparent text-on-surface-variant/60",
          "hover:bg-primary-container/08 hover:text-on-surface",
        ],
        variant === "danger" && [
          "bg-gradient-to-br from-secondary-container via-[#6b0015] to-[#410006] text-on-secondary-container",
          "border border-secondary/30 shadow-[0_4px_16px_rgba(255,179,176,0.15)]",
          "hover:border-secondary/50 hover:shadow-[0_0_24px_rgba(255,179,176,0.35)]",
        ],
        variant === "live" && [
          "relative bg-gradient-to-br from-primary to-primary-container text-on-primary-container",
          "border border-primary/30 shadow-primary-glow",
          "hover:shadow-primary-glow-lg",
        ],
        className,
      )}
      disabled={disabled}
      {...(props as any)}
    >
      {variant === "live" && (
        <span className="absolute inset-0 rounded-xl animate-pulse-ring bg-primary opacity-0" />
      )}
      {children}
    </motion.button>
  );
}
