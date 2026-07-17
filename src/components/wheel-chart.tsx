import type { WesternChart } from "@/lib/western";
import { PLANET_GLYPHS, RASHIS } from "@/lib/vedic";
import { computeAspects, ASPECTS, SIGN_GLYPHS } from "@/lib/western";

const norm360 = (x: number) => ((x % 360) + 360) % 360;
const deg2rad = (d: number) => (d * Math.PI) / 180;

// Rotates so ascendant is at the 9 o'clock (left) position.
function rotate(chart: WesternChart, longitude: number): number {
  return norm360(longitude - chart.tropicalAscendant + 180);
}

export function WheelChart({ chart, size = 520 }: { chart: WesternChart; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size * 0.48;
  const rZodiac = size * 0.42;
  const rHouseOuter = size * 0.36;
  const rHouseInner = size * 0.28;
  const rPlanet = size * 0.32;
  const rAspect = size * 0.26;

  const pol = (angle: number, r: number) => {
    const a = deg2rad(180 - angle);
    return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
  };

  // Zodiac ring segments (30° each starting from Aries, positioned relative to Asc)
  const signSegments = Array.from({ length: 12 }, (_, i) => {
    const startLon = i * 30;
    const start = rotate(chart, startLon);
    const end = rotate(chart, startLon + 30);
    return { i, start, end, mid: rotate(chart, startLon + 15) };
  });

  // House cusps
  const houseCusps = chart.cusps.map((c) => rotate(chart, c));

  // Planets
  const planets = chart.tropicalPlanets.map((p) => ({
    ...p,
    theta: rotate(chart, p.tropicalLongitude),
  }));

  // De-collision: sort by theta and spread within 6°
  planets.sort((a, b) => a.theta - b.theta);
  for (let i = 1; i < planets.length; i++) {
    const gap = planets[i].theta - planets[i - 1].theta;
    if (gap < 6) planets[i].theta = planets[i - 1].theta + 6;
  }

  const aspects = computeAspects(chart).filter((h) => ASPECTS[h.type].kind === "major");

  const arc = (r: number, a1: number, a2: number) => {
    const p1 = pol(a1, r), p2 = pol(a2, r);
    const largeArc = norm360(a2 - a1) > 180 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} 0 ${p2.x} ${p2.y}`;
  };

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto select-none">
      <defs>
        <radialGradient id="wheelBg" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="oklch(0.15 0.05 275)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="oklch(0.08 0.02 275)" stopOpacity="1" />
        </radialGradient>
      </defs>

      <circle cx={cx} cy={cy} r={rOuter} fill="url(#wheelBg)" stroke="oklch(0.82 0.13 85 / 0.5)" strokeWidth="1.2" />
      <circle cx={cx} cy={cy} r={rZodiac} fill="none" stroke="oklch(1 0 0 / 0.15)" strokeWidth="0.8" />
      <circle cx={cx} cy={cy} r={rHouseOuter} fill="none" stroke="oklch(1 0 0 / 0.1)" strokeWidth="0.6" />
      <circle cx={cx} cy={cy} r={rHouseInner} fill="none" stroke="oklch(1 0 0 / 0.08)" strokeWidth="0.5" />

      {/* Zodiac ring divisions + glyphs */}
      {signSegments.map(({ i, start, mid }) => {
        const p1 = pol(start, rHouseOuter);
        const p2 = pol(start, rOuter);
        const g = pol(mid, (rZodiac + rHouseOuter) / 2);
        const isFire = i % 4 === 0;
        const isEarth = i % 4 === 1;
        const isAir = i % 4 === 2;
        const color = isFire ? "oklch(0.72 0.15 45)"
                    : isEarth ? "oklch(0.65 0.12 130)"
                    : isAir ? "oklch(0.72 0.12 220)"
                    : "oklch(0.7 0.13 280)";
        return (
          <g key={i}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="oklch(1 0 0 / 0.2)" strokeWidth="0.6" />
            <text x={g.x} y={g.y} fill={color} fontSize={size * 0.032} textAnchor="middle" dominantBaseline="middle" fontFamily="serif">
              {SIGN_GLYPHS[i]}
            </text>
          </g>
        );
      })}

      {/* House cusps */}
      {houseCusps.map((c, i) => {
        const p1 = pol(c, rHouseInner);
        const p2 = pol(c, rHouseOuter);
        const isAngle = i === 0 || i === 3 || i === 6 || i === 9;
        return (
          <g key={i}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={isAngle ? "oklch(0.82 0.13 85 / 0.7)" : "oklch(1 0 0 / 0.2)"}
              strokeWidth={isAngle ? 1.2 : 0.6}
            />
            <text
              x={pol(c + 5, rHouseInner - size * 0.02).x}
              y={pol(c + 5, rHouseInner - size * 0.02).y}
              fill="oklch(0.72 0.03 260)"
              fontSize={size * 0.018}
              textAnchor="middle" dominantBaseline="middle"
            >
              {i + 1}
            </text>
          </g>
        );
      })}

      {/* Ascendant / MC labels */}
      {(() => {
        const asc = pol(180, rOuter + size * 0.02);
        const mc = pol(rotate(chart, chart.midheaven), rOuter + size * 0.02);
        return (
          <g fill="oklch(0.92 0.09 88)" fontSize={size * 0.02} fontFamily="serif">
            <text x={asc.x - 8} y={asc.y} textAnchor="end" dominantBaseline="middle">Asc</text>
            <text x={mc.x} y={mc.y - 6} textAnchor="middle" dominantBaseline="middle">MC</text>
          </g>
        );
      })()}

      {/* Aspect lines */}
      {aspects.map((h, i) => {
        const a = planets.find((p) => p.name === h.a)!;
        const b = planets.find((p) => p.name === h.b)!;
        const p1 = pol(a.theta, rAspect);
        const p2 = pol(b.theta, rAspect);
        const color = h.type === "conjunction" ? "oklch(0.88 0.09 88 / 0.6)"
          : h.type === "opposition" ? "oklch(0.6 0.22 25 / 0.5)"
          : h.type === "trine" ? "oklch(0.65 0.15 200 / 0.6)"
          : h.type === "square" ? "oklch(0.6 0.22 25 / 0.4)"
          : "oklch(0.72 0.12 220 / 0.4)";
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={color} strokeWidth={0.8} />;
      })}

      {/* Planets */}
      {planets.map((p) => {
        const pos = pol(p.theta, rPlanet);
        const tick1 = pol(rotate(chart, p.tropicalLongitude), rHouseOuter);
        const tick2 = pol(rotate(chart, p.tropicalLongitude), rHouseOuter + size * 0.015);
        return (
          <g key={p.name}>
            <line x1={tick1.x} y1={tick1.y} x2={tick2.x} y2={tick2.y} stroke="oklch(0.82 0.13 85 / 0.8)" strokeWidth={1} />
            <circle cx={pos.x} cy={pos.y} r={size * 0.018} fill="oklch(0.09 0.03 275)" stroke="oklch(0.82 0.13 85)" strokeWidth={1} />
            <text x={pos.x} y={pos.y + size * 0.006} fill="oklch(0.92 0.09 88)" fontSize={size * 0.024} textAnchor="middle" dominantBaseline="middle" fontFamily="serif">
              {PLANET_GLYPHS[p.name]}
            </text>
            {p.retrograde && (
              <text x={pos.x + size * 0.02} y={pos.y - size * 0.015} fill="oklch(0.65 0.15 200)" fontSize={size * 0.014} textAnchor="middle">
                ℞
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

void RASHIS;
