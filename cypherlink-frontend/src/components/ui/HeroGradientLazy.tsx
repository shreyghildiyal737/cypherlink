/**
 * HeroGradientLazy — lazy-loaded ShaderGradient wrapper for the Landing hero.
 *
 * Three.js is code-split via React.lazy(). The heavy WebGL bundle is only
 * fetched when the Landing page is rendered and the performance guards pass.
 *
 * Performance guards (shows CSS fallback if any are true):
 *  1. prefers-reduced-motion is set
 *  2. WebGL is unavailable (canvas.getContext returns null)
 *  3. Mobile viewport (< 768 px) — saves battery; swap to slower speed instead
 *     if you later want to enable it on mobile too
 */
import { lazy, Suspense, Component } from "react";
import type { ReactNode } from "react";

// ─── CSS Fallback ───────────────────────────────────────────────────────────

const fallbackStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(ellipse at 50% 40%, rgba(124,58,237,0.18) 0%, transparent 65%), linear-gradient(to bottom, #0c0a14, #0e0e10)",
  zIndex: 0,
  pointerEvents: "none",
};

function CSSFallback() {
  return <div aria-hidden style={fallbackStyle} />;
}

// ─── Performance Guards ──────────────────────────────────────────────────────

function shouldUseCSSFallback(): boolean {
  // Guard 1: reduced-motion preference
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return true;
  }

  // Guard 2: mobile viewport — skip WebGL to save battery
  if (typeof window !== "undefined" && window.innerWidth < 768) {
    return true;
  }

  // Guard 3: WebGL unavailable
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return true;
  } catch {
    return true;
  }

  return false;
}

// ─── Lazy-loaded ShaderGradient ──────────────────────────────────────────────

const LazyHeroGradient = lazy(() => import("./HeroGradient"));

// ─── Error Boundary ──────────────────────────────────────────────────────────

interface ErrorBoundaryState {
  hasError: boolean;
}

class GradientErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <CSSFallback />;
    }
    return this.props.children;
  }
}

// ─── Public component ─────────────────────────────────────────────────────────

export function HeroGradientLazy() {
  // Run guards synchronously — they're cheap DOM checks
  if (shouldUseCSSFallback()) {
    return <CSSFallback />;
  }

  return (
    <GradientErrorBoundary>
      <Suspense fallback={<div className="absolute inset-0 bg-[#0c0a14]" />}>
        <LazyHeroGradient />
      </Suspense>
    </GradientErrorBoundary>
  );
}
