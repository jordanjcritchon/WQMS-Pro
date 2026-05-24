import React from "react";

const ID = {
  stroke: "wq-cloud-stroke",
  wGold:  "wq-w-gold",
  lens:   "wq-lens-silver",
  handle: "wq-handle-gold",
  glow:   "wq-outer-glow",
};

interface WQLogoProps { size?: number; }

/*
  Cloud shape — 3 smooth circular bumps, mathematically constructed:

  Centre dome : cx=50 cy=50 r=32  (tallest, top at y=18)
  Left  bump  : cx=14 cy=60 r=22  (peak ~y=38, leftmost x=0 at y=60)
  Right bump  : cx=86 cy=60 r=22  (peak ~y=38, rightmost x=108→clipped)

  The outline is traced clockwise using:
    • Cubic beziers for the valleys (where bumps meet) so the transition
      is smooth — control pts are computed from the circle tangents.
    • SVG arc commands for each bump (guaranteeing perfect circles).

  Base closes with a gentle rounded-rectangle bottom.

  ViewBox: -6 14 112 80  (adds 6 px margin each side for the stroke/glow)
*/

// Arc-based cloud: each bump is a true circular arc; valleys are cubic beziers.
// All coordinates are in the internal "0 0 100 88" canvas before the viewBox shift.
const CLOUD =
  // Start at top of centre dome
  "M50 18" +
  // ── Centre dome right arc (clockwise, r=32) to junction with right bump ──
  // Junction point with right bump: computed from circle intersection ~(72,30)
  "A32 32 0 0 1 76 34" +
  // ── Bezier valley between centre and right bump ──
  // Incoming tangent from centre (perpendicular to radius at junction) ≈ (0.36,0.93)
  // Outgoing tangent to right bump top ≈ right-and-up
  "C79 42 84 36 86 38" +
  // ── Right bump arc (clockwise, r=22) ──
  // From join (~86,38) around the right bump to the base on right side (~98,60)
  "A22 22 0 0 1 98 62" +
  // ── Right side of cloud curving to base ──
  "C99 72 94 80 86 82" +
  // ── Flat base ──
  "L14 82" +
  // ── Left side of cloud curving from base ──
  "C6 80 1 72 2 62" +
  // ── Left bump arc (clockwise, r=22) ──
  "A22 22 0 0 1 14 38" +
  // ── Bezier valley between left bump and centre ──
  "C16 36 21 42 24 34" +
  // ── Centre dome left arc (clockwise, r=32) back to top ──
  "A32 32 0 0 1 50 18" +
  "Z";

export const WQLogo: React.FC<WQLogoProps> = ({ size = 40 }) => (
  <svg
    width={size}
    height={Math.round(size * 0.84)}
    viewBox="-6 12 112 82"
    fill="none"
    style={{ flexShrink: 0, display: "block", overflow: "visible" }}
  >
    <defs>
      {/* Gold border — bright at top, dark amber at base */}
      <linearGradient id={ID.stroke} x1="50" y1="12" x2="50" y2="94" gradientUnits="userSpaceOnUse">
        <stop offset="0%"   stopColor="#ffe898" />
        <stop offset="30%"  stopColor="#e8a020" />
        <stop offset="100%" stopColor="#7a4206" />
      </linearGradient>

      {/* W — gold metallic */}
      <linearGradient id={ID.wGold} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#fff4b0" />
        <stop offset="28%"  stopColor="#d49018" />
        <stop offset="68%"  stopColor="#b07010" />
        <stop offset="100%" stopColor="#7a4008" />
      </linearGradient>

      {/* Magnifying glass lens — silver/chrome */}
      <linearGradient id={ID.lens} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#f0f6ff" />
        <stop offset="40%"  stopColor="#b8cede" />
        <stop offset="100%" stopColor="#3a5870" />
      </linearGradient>

      {/* Handle — gold diagonal */}
      <linearGradient id={ID.handle} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%"   stopColor="#ffe070" />
        <stop offset="100%" stopColor="#8a4e08" />
      </linearGradient>

      {/* Blur for outer amber glow */}
      <filter id={ID.glow} x="-35%" y="-35%" width="170%" height="170%">
        <feGaussianBlur stdDeviation="5" />
      </filter>
    </defs>

    {/* 1 — drop shadow */}
    <path d={CLOUD} fill="rgba(0,0,0,0.5)" transform="translate(0,6)" />

    {/* 2 — outer amber halo */}
    <path
      d={CLOUD}
      fill="none"
      stroke="#d48010"
      strokeWidth="18"
      opacity="0.28"
      filter={`url(#${ID.glow})`}
    />

    {/* 3 — cloud body: gold border behind navy fill */}
    <path
      d={CLOUD}
      fill="#09141f"
      stroke={`url(#${ID.stroke})`}
      strokeWidth="7"
      paintOrder="stroke fill"
    />

    {/* 4 — inner bright rim */}
    <path
      d={CLOUD}
      fill="none"
      stroke="rgba(255,224,80,0.2)"
      strokeWidth="1.4"
    />

    {/* ── W (gold metallic) ── */}
    <text x="35" y="63" textAnchor="middle" dominantBaseline="middle"
          fontFamily="Inter,'Arial Black',sans-serif"
          fontWeight="900" fontSize="36" fill="rgba(0,0,0,0.5)" letterSpacing="-0.5">W</text>
    <text x="33" y="61" textAnchor="middle" dominantBaseline="middle"
          fontFamily="Inter,'Arial Black',sans-serif"
          fontWeight="900" fontSize="36" fill={`url(#${ID.wGold})`} letterSpacing="-0.5">W</text>

    {/* ── Magnifying glass = Q ──
        Circle centre (67, 58), r=14.5
        45° rim point: (67+10.3, 58+10.3) = (77.3, 68.3)
        Handle tip (10 units further): (84.4, 75.4)
    */}

    {/* Lens shadow */}
    <circle cx="67.8" cy="58.8" r="14.7" fill="none"
            stroke="rgba(0,0,0,0.45)" strokeWidth="5.5" />
    {/* Handle shadow */}
    <line x1="77.8" y1="68.8" x2="84.8" y2="75.8"
          stroke="rgba(0,0,0,0.45)" strokeWidth="7" strokeLinecap="round" />

    {/* Lens ring — silver chrome */}
    <circle cx="67" cy="58" r="14.5"
            fill="rgba(9,20,31,0.45)"
            stroke={`url(#${ID.lens})`}
            strokeWidth="5" />

    {/* Specular highlight top-left of lens */}
    <ellipse cx="62.5" cy="52.5" rx="5" ry="3.2" fill="rgba(255,255,255,0.15)" />

    {/* Handle — gold bar */}
    <line x1="77.3" y1="68.3" x2="84.4" y2="75.4"
          stroke={`url(#${ID.handle})`} strokeWidth="6.5" strokeLinecap="round" />
  </svg>
);
