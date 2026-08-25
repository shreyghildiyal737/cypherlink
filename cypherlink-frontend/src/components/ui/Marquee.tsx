import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface MarqueeProps {
  children: ReactNode;
  className?: string;
  speed?: number;
  reverse?: boolean;
}

export function Marquee({ children, className, speed = 30, reverse = false }: MarqueeProps) {
  return (
    <div className={cn("flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]", className)}>
      <motion.div
        className="flex shrink-0 gap-6 pr-6"
        animate={{ x: reverse ? ["0%", "100%"] : ["0%", "-100%"] }}
        transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
      >
        {children}
        {children}
      </motion.div>
      <motion.div
        className="flex shrink-0 gap-6 pr-6"
        animate={{ x: reverse ? ["0%", "100%"] : ["0%", "-100%"] }}
        transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
        aria-hidden
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}
