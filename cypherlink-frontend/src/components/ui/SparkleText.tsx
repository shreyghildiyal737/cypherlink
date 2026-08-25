import { useState, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface SparkleTextProps {
  children: ReactNode;
  className?: string;
}

function SparkleItem({ sparkle }: { sparkle: Sparkle }) {
  return (
    <motion.svg
      key={sparkle.id}
      className="pointer-events-none absolute"
      style={{ left: sparkle.x, top: sparkle.y, zIndex: 10 }}
      width={sparkle.size}
      height={sparkle.size}
      viewBox="0 0 160 160"
      initial={{ scale: 0, opacity: 1, rotate: 0 }}
      animate={{ scale: 1, opacity: 0, rotate: 45 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <path
        d="M80 0 C80 40 80 40 80 80 C80 40 80 40 80 0 Z"
        fill="#F59E0B"
        opacity={0.9}
      />
      <path
        d="M0 80 C40 80 40 80 80 80 C40 80 40 80 0 80 Z"
        fill="#F59E0B"
        opacity={0.9}
      />
    </motion.svg>
  );
}

export function SparkleText({ children, className }: SparkleTextProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const containerRef = useRef<HTMLSpanElement>(null);
  const counterRef = useRef(0);

  function addSparkle(e: React.MouseEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const id = counterRef.current++;
    const size = 12 + Math.random() * 10;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    setSparkles((s) => [...s, { id, x, y, size }]);
    setTimeout(() => setSparkles((s) => s.filter((sp) => sp.id !== id)), 650);
  }

  return (
    <span
      ref={containerRef}
      className={cn("relative inline-block", className)}
      onMouseMove={addSparkle}
    >
      <AnimatePresence>
        {sparkles.map((sp) => <SparkleItem key={sp.id} sparkle={sp} />)}
      </AnimatePresence>
      {children}
    </span>
  );
}
