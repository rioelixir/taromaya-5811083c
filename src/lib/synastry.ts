import type { WesternChart } from "./western";
import { ASPECTS, type AspectType, houseOfLongitude } from "./western";
import type { PlanetName } from "./vedic";

const norm360 = (x: number) => ((x % 360) + 360) % 360;

export type SynastryHit = {
  a: PlanetName;      // planet from chart A
  b: PlanetName;      // planet from chart B
  type: AspectType;
  angle: number;
  orb: number;
  applying: boolean;
};

// Cross-aspects: every planet in chart A vs every planet in chart B.
export function synastryAspects(chartA: WesternChart, chartB: WesternChart): SynastryHit[] {
  const hits: SynastryHit[] = [];
  for (const pa of chartA.tropicalPlanets) {
    for (const pb of chartB.tropicalPlanets) {
      let diff = Math.abs(pa.tropicalLongitude - pb.tropicalLongitude);
      if (diff > 180) diff = 360 - diff;
      for (const [name, def] of Object.entries(ASPECTS) as [AspectType, typeof ASPECTS[AspectType]][]) {
        const orb = Math.abs(diff - def.angle);
        // Tighter orbs for synastry — 60% of natal orbs
        const allowed = def.orb * 0.6;
        if (orb <= allowed) {
          hits.push({
            a: pa.name, b: pb.name, type: name,
            angle: diff, orb,
            applying: !pa.retrograde && !pb.retrograde,
          });
        }
      }
    }
  }
  return hits.sort((x, y) => x.orb - y.orb);
}

// Which house of chart A does each planet of chart B fall into?
export function houseOverlay(chartA: WesternChart, chartB: WesternChart) {
  return chartB.tropicalPlanets.map((p) => ({
    planet: p.name,
    longitude: p.tropicalLongitude,
    houseInA: houseOfLongitude(p.tropicalLongitude, chartA.cusps) + 1,
  }));
}

// Composite midpoint chart: average longitudes (shortest arc) planet-by-planet.
export type CompositePoint = { name: PlanetName; longitude: number };
export function compositeChart(chartA: WesternChart, chartB: WesternChart): {
  planets: CompositePoint[]; ascendant: number; midheaven: number;
} {
  const midpoint = (a: number, b: number) => {
    let d = b - a;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return norm360(a + d / 2);
  };
  const planets: CompositePoint[] = chartA.tropicalPlanets.map((pa) => {
    const pb = chartB.tropicalPlanets.find((p) => p.name === pa.name)!;
    return { name: pa.name, longitude: midpoint(pa.tropicalLongitude, pb.tropicalLongitude) };
  });
  return {
    planets,
    ascendant: midpoint(chartA.tropicalAscendant, chartB.tropicalAscendant),
    midheaven: midpoint(chartA.midheaven, chartB.midheaven),
  };
}

// Overall compatibility score based on synastry aspect quality.
export function synastryScore(hits: SynastryHit[]): { score: number; label: string; positive: number; challenging: number } {
  const weights: Partial<Record<AspectType, number>> = {
    conjunction: 3, trine: 3, sextile: 2,
    square: -2, opposition: -1, quincunx: -1,
    quintile: 1, "semi-sextile": 0.5, "semi-square": -0.5, sesquiquadrate: -0.5,
  };
  let positive = 0, challenging = 0, total = 0;
  for (const h of hits) {
    const w = weights[h.type] ?? 0;
    // Weight venus/moon/sun/asc aspects extra
    const heavy = ["Sun", "Moon", "Venus", "Mars"].includes(h.a) || ["Sun", "Moon", "Venus", "Mars"].includes(h.b);
    const factor = heavy ? 1.5 : 1;
    const value = w * factor * (1 - h.orb / 8);
    total += value;
    if (w > 0) positive += value;
    else if (w < 0) challenging += Math.abs(value);
  }
  const raw = 50 + total * 3;
  const score = Math.max(15, Math.min(98, Math.round(raw)));
  const label = score >= 85 ? "Soulmate resonance"
    : score >= 70 ? "Deeply harmonious"
    : score >= 55 ? "Growth-oriented match"
    : score >= 40 ? "Karmic — requires work"
    : "Challenging alignment";
  return { score, label, positive: Math.round(positive * 10) / 10, challenging: Math.round(challenging * 10) / 10 };
}
