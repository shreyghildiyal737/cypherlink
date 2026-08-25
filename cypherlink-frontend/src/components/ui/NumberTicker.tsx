import { useEffect, useRef, useState } from "react";
import { useInView, motion } from "framer-motion";
import { cn } from "../../utils/cn";

interface NumberTickerProps {
  value: number;
  className?: string;
  duration?: number;
  suffix?: string;
}

export function NumberTicker({ value, className, duration = 1.4, suffix = "" }: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const startTime = performance.now();
    const durationMs = duration * 1000;

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * value);
      setDisplayed(start);
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }, [isInView, value, duration]);

  return (
    <motion.span
      ref={ref}
      className={cn("tabular-nums", className)}
      initial={{ opacity: 0, y: 8 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4 }}
    >
      {displayed.toLocaleString()}{suffix}
    </motion.span>
  );
}
