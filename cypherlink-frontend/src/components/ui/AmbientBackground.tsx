/**
 * AmbientBackground — fixed, full-screen atmospheric lighting layer.
 * Renders behind all content (z-0). Five orbs with distinct colors and
 * independent animation phases so they never move in sync.
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* ── Violet — top-right, primary brand anchor ── */}
      <div
        style={{
          position: "absolute",
          top: "-15%",
          right: "-8%",
          width: "58vw",
          height: "58vw",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(109,40,217,0.13) 0%, transparent 62%)",
          filter: "blur(72px)",
          animation: "ambientFloat 28s ease-in-out infinite alternate",
        }}
      />

      {/* ── Midnight teal — bottom-left, underground cool ── */}
      <div
        style={{
          position: "absolute",
          bottom: "-18%",
          left: "-12%",
          width: "52vw",
          height: "52vw",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(15,160,145,0.08) 0%, transparent 62%)",
          filter: "blur(90px)",
          animation: "ambientFloatReverse 36s ease-in-out infinite alternate",
        }}
      />

      {/* ── Deep indigo — mid-left, cool depth ── */}
      <div
        style={{
          position: "absolute",
          top: "38%",
          left: "6%",
          width: "38vw",
          height: "38vw",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(67,56,202,0.09) 0%, transparent 62%)",
          filter: "blur(80px)",
          animation: "ambientFloatReverse 42s ease-in-out infinite alternate",
          animationDelay: "4s",
        }}
      />

      {/* ── Warm crimson — right-center, live-performance energy ── */}
      <div
        style={{
          position: "absolute",
          top: "28%",
          right: "4%",
          width: "34vw",
          height: "34vw",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(190,24,93,0.06) 0%, transparent 62%)",
          filter: "blur(100px)",
          animation: "ambientFloat 50s ease-in-out infinite alternate",
          animationDelay: "8s",
        }}
      />

      {/* ── Amber — top-center, stage-light warmth ── */}
      <div
        style={{
          position: "absolute",
          top: "-8%",
          left: "28%",
          width: "44vw",
          height: "28vw",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(161,73,14,0.05) 0%, transparent 65%)",
          filter: "blur(110px)",
          animation: "ambientFloat 60s ease-in-out infinite alternate",
          animationDelay: "12s",
        }}
      />
    </div>
  );
}
