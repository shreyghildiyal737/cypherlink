import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

// ─── Variant definitions ──────────────────────────────────────────────────────

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
};

export const staggerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

// ─── Shared prop shape ────────────────────────────────────────────────────────

interface MotionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

// ─── FadeUp ───────────────────────────────────────────────────────────────────

export function FadeUp({ children, className, delay = 0, duration = 0.35 }: MotionProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : "hidden"}
      animate="visible"
      variants={fadeUpVariants}
      transition={{ duration: reduced ? 0 : duration, delay: reduced ? 0 : delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// ─── FadeIn ───────────────────────────────────────────────────────────────────

export function FadeIn({ children, className, delay = 0, duration = 0.3 }: MotionProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : "hidden"}
      animate="visible"
      variants={fadeInVariants}
      transition={{ duration: reduced ? 0 : duration, delay: reduced ? 0 : delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// ─── ScaleIn ──────────────────────────────────────────────────────────────────

export function ScaleIn({ children, className, delay = 0, duration = 0.25 }: MotionProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : "hidden"}
      animate="visible"
      variants={scaleInVariants}
      transition={{ duration: reduced ? 0 : duration, delay: reduced ? 0 : delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// ─── StaggerChildren ──────────────────────────────────────────────────────────

export function StaggerChildren({ children, className, delay = 0 }: MotionProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : "hidden"}
      animate="visible"
      variants={staggerVariants}
      transition={{ delay: reduced ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}
