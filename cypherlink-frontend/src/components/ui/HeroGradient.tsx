/**
 * HeroGradient — ShaderGradient canvas for the Landing hero.
 *
 * THIS FILE is the lazy-loaded target. It must NOT be imported directly.
 * Import via HeroGradientLazy.tsx which wraps it in React.lazy().
 *
 * Three.js is code-split: it will NOT appear in the main JS bundle.
 */
import { ShaderGradient, ShaderGradientCanvas } from "shadergradient";

const CSS_FALLBACK_STYLE: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(ellipse at 40% 50%, rgba(109,40,217,0.22) 0%, transparent 55%), radial-gradient(ellipse at 75% 30%, rgba(15,160,145,0.10) 0%, transparent 50%), linear-gradient(to bottom, #08081a, #080810)",
  zIndex: 0,
};

export default function HeroGradient() {
  return (
    <ShaderGradientCanvas
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: 0.85,
        zIndex: 0,
        pointerEvents: "none",
      }}
      pixelDensity={1}
    >
      <ShaderGradient
        control="props"
        type="waterPlane"
        animate="on"
        uTime={0.3}
        uSpeed={0.08}
        uStrength={2.2}
        uDensity={1.2}
        uFrequency={4.0}
        uAmplitude={4.5}
        color1="#180840"
        color2="#060d1e"
        color3="#0a1a28"
        lightType="3d"
        envPreset="city"
        reflection={0.35}
        shader="defaults"
        cAzimuthAngle={210}
        cPolarAngle={85}
        cDistance={3.2}
        cameraZoom={1}
        positionX={0.2}
        positionY={0.1}
        positionZ={0}
        rotationX={0}
        rotationY={0}
        rotationZ={200}
        grain="off"
      />
    </ShaderGradientCanvas>
  );
}

export { CSS_FALLBACK_STYLE };
