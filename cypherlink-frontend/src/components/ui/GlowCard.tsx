import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "live" | "project" | "amber" | "purple" | "red" | "none";
  grain?: boolean;
  onClick?: () => void;
  as?: "article" | "div" | "section";
}

const glowColors: Record<string, string> = {
  default:
    "hover:border-[#8B5CF6]/35 hover:shadow-[0_8px_32px_rgba(139,92,246,0.15)]",
  purple:
    "hover:border-[#8B5CF6]/35 hover:shadow-[0_8px_32px_rgba(139,92,246,0.15)]",
  live:
    "hover:border-[#C084FC]/45 hover:shadow-[0_8px_32px_rgba(192,132,252,0.22)]",
  red:
    "hover:border-[#EC4899]/45 hover:shadow-[0_8px_32px_rgba(236,72,153,0.20)]",
  project:
    "hover:border-[#34D399]/35 hover:shadow-[0_8px_32px_rgba(52,211,153,0.12)]",
  amber:
    "hover:border-[#F472B6]/45 hover:shadow-[0_8px_32px_rgba(244,114,182,0.15)]",
  none: "",
};

export function GlowCard({
  children,
  className,
  variant = "default",
  grain = false,
  onClick,
  as: Tag = "div",
}: GlowCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.012 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#8B5CF6]/10",
        "bg-gradient-to-br from-[rgba(255,255,255,0.03)] to-[rgba(255,255,255,0.01)] backdrop-blur-md",
        "shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]",
        "transition-all duration-200",
        glowColors[variant],
        className,
      )}
    >
      {grain && (
        <div
          className="pointer-events-none absolute inset-0 z-[1] opacity-[0.030]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
          }}
        />
      )}
      <Tag className="relative z-[2] h-full">{children}</Tag>
    </motion.div>
  );
}
