import { useEffect, useRef } from "react";

export function TubeCursor() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only on pointer devices — don't show on touch-only
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let raf = 0;
    let ringX = window.innerWidth  / 2;
    let ringY = window.innerHeight / 2;
    let dotX  = ringX;
    let dotY  = ringY;
    let targetX = ringX;
    let targetY = ringY;
    let visible = false;

    function loop() {
      // Ring follows with spring (lerp)
      ringX += (targetX - ringX) * 0.14;
      ringY += (targetY - ringY) * 0.14;
      // Dot snaps instantly
      dotX = targetX;
      dotY = targetY;

      const dot  = dotRef.current;
      const ring = ringRef.current;
      if (dot && ring) {
        dot.style.transform  = `translate(${dotX}px, ${dotY}px)`;
        ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
      }
      raf = requestAnimationFrame(loop);
    }

    function onMove(e: MouseEvent) {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!visible) {
        visible = true;
        dotRef.current?.style.setProperty("opacity", "1");
        ringRef.current?.style.setProperty("opacity", "1");
      }
    }

    function onLeave() {
      visible = false;
      dotRef.current?.style.setProperty("opacity", "0");
      ringRef.current?.style.setProperty("opacity", "0");
    }

    raf = requestAnimationFrame(loop);
    document.addEventListener("mousemove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <>
      {/* Inner dot */}
      <div
        ref={dotRef}
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          marginLeft: -3,
          marginTop: -3,
          borderRadius: "50%",
          background: "rgba(210, 187, 255, 0.95)",
          pointerEvents: "none",
          zIndex: 9999,
          opacity: 0,
          transition: "opacity 0.2s ease",
          boxShadow: "0 0 8px 2px rgba(124, 58, 237, 0.7)",
          willChange: "transform",
        }}
      />
      {/* Outer ring */}
      <div
        ref={ringRef}
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 32,
          height: 32,
          marginLeft: -16,
          marginTop: -16,
          borderRadius: "50%",
          border: "1.5px solid rgba(124, 58, 237, 0.55)",
          pointerEvents: "none",
          zIndex: 9998,
          opacity: 0,
          transition: "opacity 0.2s ease",
          boxShadow: "0 0 16px 4px rgba(124, 58, 237, 0.12), inset 0 0 8px rgba(124, 58, 237, 0.06)",
          backdropFilter: "none",
          willChange: "transform",
        }}
      />
    </>
  );
}
