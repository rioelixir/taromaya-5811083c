// Luxury Vedic Rashi chart renderer — North Indian diamond & South Indian grid.
// Consumes the NormalizedChart shape from the astro provider.

import { navamshaSign } from "@/lib/vargas";

type NP = {
  name: string;
  longitude: number;
  rashi: number;
  house: number;
  retrograde?: boolean;
  combust?: boolean;
  exalted?: boolean;
  debilitated?: boolean;
};

type Chart = {
  ascendant: { rashi: number; degreeInRashi: number };
  planets: NP[];
};

const RASHIS_SHORT = ["Ar","Ta","Ge","Cn","Le","Vi","Li","Sc","Sg","Cp","Aq","Pi"];
const GLYPH: Record<string, string> = {
  Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me", Jupiter: "Ju",
  Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke", Uranus: "Ur",
  Neptune: "Ne", Pluto: "Pl",
};

function planetLabel(p: NP): string {
  const g = GLYPH[p.name] ?? p.name.slice(0, 2);
  const marks: string[] = [];
  if (p.retrograde) marks.push("℞");
  if (p.exalted) marks.push("↑");
  if (p.debilitated) marks.push("↓");
  if (p.combust) marks.push("✦");
  return g + marks.join("");
}

/** Group planets by house index 1..12 (whole-sign). */
function groupByHouse(chart: Chart): Record<number, NP[]> {
  const map: Record<number, NP[]> = {};
  for (let h = 1; h <= 12; h++) map[h] = [];
  for (const p of chart.planets) map[p.house].push(p);
  return map;
}

/** Group planets by absolute sign 0..11 (used for D9). */
function groupBySign(planets: { name: string; sign: number; retrograde?: boolean; exalted?: boolean; debilitated?: boolean; combust?: boolean; longitude: number; }[]): Record<number, NP[]> {
  const m: Record<number, NP[]> = {};
  for (let s = 0; s < 12; s++) m[s] = [];
  for (const p of planets) {
    m[p.sign].push({ name: p.name, longitude: p.longitude, rashi: p.sign, house: 0, retrograde: p.retrograde, exalted: p.exalted, debilitated: p.debilitated, combust: p.combust });
  }
  return m;
}

// North-Indian: 12 diamond cells with fixed positions.
// House 1 is at top-center, going anticlockwise.
const NORTH_CELLS: { x: number; y: number; w: number; h: number }[] = [
  { x: 100, y: 15, w: 90, h: 60 },   // 1
  { x: 15,  y: 15, w: 90, h: 60 },   // 2
  { x: 15,  y: 75, w: 45, h: 60 },   // 3
  { x: 15,  y: 135,w: 90, h: 60 },   // 4
  { x: 15,  y: 195,w: 90, h: 60 },   // 5
  { x: 100, y: 195,w: 90, h: 60 },   // 6
  { x: 190, y: 195,w: 90, h: 60 },   // 7
  { x: 190, y: 135,w: 90, h: 60 },   // 8
  { x: 245, y: 75, w: 45, h: 60 },   // 9
  { x: 190, y: 15, w: 90, h: 60 },   // 10
  { x: 190, y: 75, w: 45, h: 60 },   // 11? — will use diamond overlay, see below
  { x: 60,  y: 75, w: 45, h: 60 },   // 12
];

/** Render North-Indian diamond chart with proper 12-cell layout. */
export function NorthIndianChart({
  chart, title, size = 320,
}: { chart: Chart; title?: string; size?: number }) {
  const asc = chart.ascendant.rashi;
  const houses = groupByHouse(chart);
  const S = size;
  // 4x4 grid with diamond in center. Cells (house→coords) — standard layout.
  // Coords are label anchor points (cx, cy).
  const P: Record<number, [number, number, string]> = {
    1:  [S/2,     S*0.18, "middle"],
    2:  [S*0.22,  S*0.18, "middle"],
    3:  [S*0.15,  S*0.35, "middle"],
    4:  [S*0.22,  S*0.5,  "middle"],
    5:  [S*0.15,  S*0.65, "middle"],
    6:  [S*0.22,  S*0.82, "middle"],
    7:  [S/2,     S*0.82, "middle"],
    8:  [S*0.78,  S*0.82, "middle"],
    9:  [S*0.85,  S*0.65, "middle"],
    10: [S*0.78,  S*0.5,  "middle"],
    11: [S*0.85,  S*0.35, "middle"],
    12: [S*0.78,  S*0.18, "middle"],
  };
  // Sign label offsets (small, gold)
  const SL: Record<number, [number, number]> = {
    1:  [S/2,     S*0.08],
    2:  [S*0.22,  S*0.08],
    3:  [S*0.08,  S*0.35],
    4:  [S*0.22,  S*0.42],
    5:  [S*0.08,  S*0.65],
    6:  [S*0.22,  S*0.92],
    7:  [S/2,     S*0.92],
    8:  [S*0.78,  S*0.92],
    9:  [S*0.92,  S*0.65],
    10: [S*0.78,  S*0.42],
    11: [S*0.92,  S*0.35],
    12: [S*0.78,  S*0.08],
  };

  const RASHI_FULL = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
  const hitR = S * 0.09;

  return (
    <div className="glass-card p-3">
      {title && <div className="mb-2 text-center font-serif text-sm text-primary">{title}</div>}
      <svg
        viewBox={`0 0 ${S} ${S}`}
        className="w-full"
        role="img"
        aria-label={`${title ?? "North Indian chart"} — Ascendant in ${RASHI_FULL[asc]}, ${chart.planets.length} planets across 12 houses`}
      >
        {/* frame */}
        <rect x={2} y={2} width={S-4} height={S-4} fill="none" stroke="currentColor" strokeOpacity={0.35} />
        {/* diagonals */}
        <line x1={2} y1={2} x2={S-2} y2={S-2} stroke="currentColor" strokeOpacity={0.35} />
        <line x1={S-2} y1={2} x2={2} y2={S-2} stroke="currentColor" strokeOpacity={0.35} />
        {/* inner diamond */}
        <polygon points={`${S/2},2 ${S-2},${S/2} ${S/2},${S-2} 2,${S/2}`} fill="none" stroke="currentColor" strokeOpacity={0.35} />
        {/* labels + planets */}
        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
          const sign = (asc + h - 1) % 12;
          const [cx, cy] = P[h];
          const [lx, ly] = SL[h];
          const planets = houses[h] ?? [];
          const planetNames = planets.map((p) => p.name).join(", ") || "empty";
          const label = `House ${h} in ${RASHI_FULL[sign]}${h === 1 ? " (Lagna)" : ""}: ${planetNames}`;
          return (
            <g key={h} role="button" tabIndex={0} aria-label={label} className="chart-hit" data-chart-hit>
              <title>{label}</title>
              <circle cx={cx} cy={cy} r={hitR} fill="transparent" />
              <text x={lx} y={ly} textAnchor="middle" fontSize={S*0.028} className="fill-primary/80" fontFamily="serif">
                {RASHIS_SHORT[sign]}
              </text>
              {planets.map((p, idx) => (
                <text key={p.name} x={cx} y={cy + idx * S * 0.035} textAnchor="middle" fontSize={S*0.032}
                  className="fill-foreground">
                  {planetLabel(p)}
                </text>
              ))}
              {h === 1 && (
                <text x={cx} y={cy - S*0.045} textAnchor="middle" fontSize={S*0.024} className="fill-primary" fontFamily="serif">
                  Lagna
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}


/** Render South-Indian fixed-sign grid (4x4 with Aries top-left corner of outer ring). */
export function SouthIndianChart({
  chart, title, size = 320,
}: { chart: Chart; title?: string; size?: number }) {
  // Sign positions in a 4x4 grid (Aries=col1,row0 clockwise).
  // Standard South-Indian: Pisces top-left, Aries top-2, Taurus top-3, Gemini top-right;
  // then clockwise: Cancer, Leo, Virgo down right; Libra, Scorpio, Sagittarius bottom right→left; Capricorn, Aquarius up left.
  const CELLS: Record<number, [number, number]> = {
    // sign : [col, row]  0..3 each
    11: [0, 0], 0: [1, 0], 1: [2, 0], 2: [3, 0],
    10: [0, 1],                            3: [3, 1],
    9:  [0, 2],                            4: [3, 2],
    8:  [0, 3], 7: [1, 3], 6: [2, 3], 5: [3, 3],
  };
  const S = size;
  const cell = S / 4;
  const asc = chart.ascendant.rashi;
  const planetsBySign: Record<number, NP[]> = {};
  for (let s = 0; s < 12; s++) planetsBySign[s] = [];
  for (const p of chart.planets) planetsBySign[p.rashi].push(p);

  const RASHI_FULL_S = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];

  return (
    <div className="glass-card p-3">
      {title && <div className="mb-2 text-center font-serif text-sm text-primary">{title}</div>}
      <svg
        viewBox={`0 0 ${S} ${S}`}
        className="w-full"
        role="img"
        aria-label={`${title ?? "South Indian chart"} — Ascendant in ${RASHI_FULL_S[asc]}, ${chart.planets.length} planets`}
      >
        {/* outer frame */}
        <rect x={0} y={0} width={S} height={S} fill="none" stroke="currentColor" strokeOpacity={0.35} />
        {/* inner void (center 2x2) */}
        <rect x={cell} y={cell} width={cell*2} height={cell*2} fill="none" stroke="currentColor" strokeOpacity={0.35} />
        {/* cell grid lines on outer ring */}
        {[1,2,3].map(i => (
          <g key={i} aria-hidden="true">
            <line x1={i*cell} y1={0} x2={i*cell} y2={cell} stroke="currentColor" strokeOpacity={0.35} />
            <line x1={i*cell} y1={S-cell} x2={i*cell} y2={S} stroke="currentColor" strokeOpacity={0.35} />
            <line x1={0} y1={i*cell} x2={cell} y2={i*cell} stroke="currentColor" strokeOpacity={0.35} />
            <line x1={S-cell} y1={i*cell} x2={S} y2={i*cell} stroke="currentColor" strokeOpacity={0.35} />
          </g>
        ))}
        {Object.entries(CELLS).map(([sStr, [c, r]]) => {
          const s = Number(sStr);
          const x = c * cell;
          const y = r * cell;
          const planets = planetsBySign[s] ?? [];
          const isLagna = s === asc;
          const planetNames = planets.map((p) => p.name).join(", ") || "empty";
          const label = `${RASHI_FULL_S[s]}${isLagna ? " (Ascendant)" : ""}: ${planetNames}`;
          return (
            <g key={s} role="button" tabIndex={0} aria-label={label} className="chart-hit" data-chart-hit>
              <title>{label}</title>
              <rect x={x} y={y} width={cell} height={cell} fill="transparent" />
              <text x={x + 4} y={y + 12} fontSize={S*0.028} className="fill-primary/80" fontFamily="serif">
                {RASHIS_SHORT[s]}{isLagna ? " · As" : ""}
              </text>
              {planets.map((p, idx) => (
                <text key={p.name} x={x + cell/2} y={y + cell/2 + idx*S*0.035 - (planets.length-1)*S*0.017}
                  textAnchor="middle" fontSize={S*0.032} className="fill-foreground">
                  {planetLabel(p)}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}


/** Compute a D9 Navamsha chart from the D1 normalized chart. */
export function toNavamsha(chart: Chart): Chart {
  const ascD9 = navamshaSign(chart.ascendant.rashi * 30 + chart.ascendant.degreeInRashi);
  const planets: NP[] = chart.planets.map((p) => {
    const s9 = navamshaSign(p.longitude);
    const house = ((s9 - ascD9 + 12) % 12) + 1;
    return { ...p, rashi: s9, house };
  });
  return {
    ascendant: { rashi: ascD9, degreeInRashi: 0 },
    planets,
  };
}

// re-export helper for consumers
export { groupBySign };
