import type { WesternChart } from "@/lib/western";
import { SIGN_GLYPHS } from "@/lib/western";
import { PLANET_GLYPHS, type PlanetName } from "@/lib/vedic";

const norm360 = (x: number) => ((x % 360) + 360) % 360;
const deg2rad = (d: number) => (d * Math.PI) / 180;

type OuterPlanet = { name: PlanetName; longitude: number; retrograde?: boolean };

/**
 * Bi-wheel: natal chart on the inner ring, transiting or partner planets on the outer ring.
 * Aspects between inner and outer planets are drawn as connecting lines.
 */
export function BiWheelChart({
  chart,
  outerPlanets,
  outerLabel = "Transits",
  size = 560,
}: {
  chart: WesternChart;
  outerPlanets: OuterPlanet[];
  outerLabel?: string;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size * 0.48;
  const rZodiac = size * 0.42;
  const rOuterPlanet = size * 0.38;
  const rHouseOuter = size * 0.30;
  const rHouseInner = size * 0.24;
  const rInnerPlanet = size * 0.28;
  const rAspect = size * 0.22;

  const rotate = (l: number) => norm360(l - chart.tropicalAscendant + 180);
  const pol = (angle: number, r: number) => {
    const a = deg2rad(180 - angle);
    return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
  };

  const signSegments = Array.from({ length: 12 }, (_, i) => ({
    i, start: rotate(i * 30), mid: rotate(i * 30 + 15),
  }));

  const inner = chart.tropicalPlanets.map((p) => ({
    ...p, theta: rotate(p.tropicalLongitude),
  })).sort((a, b) => a.theta - b.theta);
  for (let i = 1; i < inner.length; i++) {
    if (inner[i].theta - inner[i - 1].theta < 6) inner[i].theta = inner[i - 1].theta + 6;
  }

  const outer = outerPlanets.map((p) => ({
    ...p, theta: rotate(p.longitude),
  })).sort((a, b) => a.theta - b.theta);
  for (let i = 1; i < outer.length; i++) {
    if (outer[i].theta - outer[i - 1].theta < 6) outer[i].theta = outer[i - 1].theta + 6;
  }

  // Inner–outer aspects at natal angles (major, tight orbs).
  const majorAngles: [number, string, number][] = [
    [0, "oklch(0.88 0.09 88 / 0.55)", 6],
    [180, "oklch(0.6 0.22 25 / 0.5)", 6],
    [120, "oklch(0.65 0.15 200 / 0.55)", 5],
    [90, "oklch(0.6 0.22 25 / 0.4)", 5],
    [60, "oklch(0.72 0.12 220 / 0.4)", 4],
  ];
  const links: { a: number; b: number; color: string }[] = [];
  for (const i of inner) {
    for (const o of outer) {
      let d = Math.abs(i.tropicalLongitude - o.longitude);
      if (d > 180) d = 360 - d;
      for (const [ang, color, orb] of majorAngles) {
        if (Math.abs(d - ang) <= orb) links.push({ a: i.theta, b: o.theta, color });
      }
    }
  }

  const RASHI_NAMES = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
  const hitR = size * 0.05;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full h-auto select-none"
      role="img"
      aria-labelledby="biwheel-title biwheel-desc"
    >
      <title id="biwheel-title">Bi-wheel chart: natal with {outerLabel.toLowerCase()}</title>
      <desc id="biwheel-desc">
        Inner ring shows {chart.tropicalPlanets.length} natal planets; outer ring shows {outerPlanets.length} {outerLabel.toLowerCase()} planets.
        Lines between rings mark major aspects. Press Tab to move between planets and signs.
      </desc>


      <circle cx={cx} cy={cy} r={rOuter} fill="url(#biwheelBg)" stroke="oklch(0.82 0.13 85 / 0.5)" strokeWidth="1.2" />
      <circle cx={cx} cy={cy} r={rZodiac} fill="none" stroke="oklch(1 0 0 / 0.15)" strokeWidth="0.8" />
      <circle cx={cx} cy={cy} r={rHouseOuter} fill="none" stroke="oklch(1 0 0 / 0.1)" strokeWidth="0.6" />
      <circle cx={cx} cy={cy} r={rHouseInner} fill="none" stroke="oklch(1 0 0 / 0.08)" strokeWidth="0.5" />

      {/* Zodiac ring + glyphs */}
      {signSegments.map(({ i, start, mid }) => {
        const p1 = pol(start, rZodiac);
        const p2 = pol(start, rOuter);
        const g = pol(mid, (rZodiac + rOuter) / 2);
        const color = ["oklch(0.72 0.15 45)","oklch(0.65 0.12 130)","oklch(0.72 0.12 220)","oklch(0.7 0.13 280)"][i % 4];
        return (
          <g key={i}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="oklch(1 0 0 / 0.2)" strokeWidth="0.6" />
            <text x={g.x} y={g.y} fill={color} fontSize={size * 0.028} textAnchor="middle" dominantBaseline="middle" fontFamily="serif">
              {SIGN_GLYPHS[i]}
            </text>
          </g>
        );
      })}

      {/* House cusps */}
      {chart.cusps.map((c, i) => {
        const rc = rotate(c);
        const p1 = pol(rc, rHouseInner);
        const p2 = pol(rc, rHouseOuter);
        const isAngle = i === 0 || i === 3 || i === 6 || i === 9;
        return (
          <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke={isAngle ? "oklch(0.82 0.13 85 / 0.7)" : "oklch(1 0 0 / 0.2)"}
            strokeWidth={isAngle ? 1.2 : 0.6} />
        );
      })}

      {/* Inner–outer aspect links */}
      {links.map((l, i) => {
        const p1 = pol(l.a, rAspect);
        const p2 = pol(l.b, rAspect);
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={l.color} strokeWidth={0.9} />;
      })}

      {/* Outer planets */}
      {outer.map((p) => {
        const pos = pol(p.theta, rOuterPlanet);
        const tick1 = pol(rotate(p.longitude), rZodiac);
        const tick2 = pol(rotate(p.longitude), rZodiac - size * 0.015);
        return (
          <g key={"o" + p.name}>
            <line x1={tick1.x} y1={tick1.y} x2={tick2.x} y2={tick2.y} stroke="oklch(0.75 0.15 200 / 0.9)" strokeWidth={1} />
            <circle cx={pos.x} cy={pos.y} r={size * 0.017} fill="oklch(0.09 0.03 275)" stroke="oklch(0.75 0.15 200)" strokeWidth={1} />
            <text x={pos.x} y={pos.y + size * 0.005} fill="oklch(0.85 0.12 210)" fontSize={size * 0.022} textAnchor="middle" dominantBaseline="middle" fontFamily="serif">
              {PLANET_GLYPHS[p.name]}
            </text>
            {p.retrograde && (
              <text x={pos.x + size * 0.02} y={pos.y - size * 0.015} fill="oklch(0.65 0.15 200)" fontSize={size * 0.013} textAnchor="middle">℞</text>
            )}
          </g>
        );
      })}

      {/* Inner (natal) planets */}
      {inner.map((p) => {
        const pos = pol(p.theta, rInnerPlanet);
        const tick1 = pol(rotate(p.tropicalLongitude), rHouseOuter);
        const tick2 = pol(rotate(p.tropicalLongitude), rHouseOuter + size * 0.013);
        return (
          <g key={"i" + p.name}>
            <line x1={tick1.x} y1={tick1.y} x2={tick2.x} y2={tick2.y} stroke="oklch(0.82 0.13 85 / 0.85)" strokeWidth={1} />
            <circle cx={pos.x} cy={pos.y} r={size * 0.017} fill="oklch(0.09 0.03 275)" stroke="oklch(0.82 0.13 85)" strokeWidth={1} />
            <text x={pos.x} y={pos.y + size * 0.005} fill="oklch(0.92 0.09 88)" fontSize={size * 0.022} textAnchor="middle" dominantBaseline="middle" fontFamily="serif">
              {PLANET_GLYPHS[p.name]}
            </text>
            {p.retrograde && (
              <text x={pos.x + size * 0.02} y={pos.y - size * 0.015} fill="oklch(0.65 0.15 200)" fontSize={size * 0.013} textAnchor="middle">℞</text>
            )}
          </g>
        );
      })}

      {/* Legend */}
      <g fontSize={size * 0.02} fontFamily="serif">
        <circle cx={cx - size * 0.22} cy={size * 0.05} r={size * 0.011} fill="oklch(0.92 0.09 88)" />
        <text x={cx - size * 0.2} y={size * 0.055} fill="oklch(0.92 0.09 88)" dominantBaseline="middle">Natal</text>
        <circle cx={cx + size * 0.08} cy={size * 0.05} r={size * 0.011} fill="oklch(0.75 0.15 200)" />
        <text x={cx + size * 0.1} y={size * 0.055} fill="oklch(0.85 0.12 210)" dominantBaseline="middle">{outerLabel}</text>
      </g>
    </svg>
  );
}
