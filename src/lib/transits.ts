import type { WesternChart } from "./western";
import { ASPECTS, computeWesternChart, houseOfLongitude, type AspectType } from "./western";
import type { PlanetName } from "./vedic";

export type TransitHit = {
  transit: PlanetName;   // moving (sky) planet
  natal: PlanetName;     // natal planet aspected
  type: AspectType;
  angle: number;
  orb: number;
  applying: boolean;
};

// Compute a chart for "now" at the same coordinates as the natal.
export function computeTransitChart(natal: WesternChart, now = new Date()): WesternChart {
  // We reconstruct the input roughly — we only need location & current instant.
  // Recover latitude from natal chart? WesternChart doesn't store it — we accept a location hint.
  // Fallback: use 0/0 which the caller can override with computeCurrentSky().
  return computeCurrentSky(now, 0, 0);
}

export function computeCurrentSky(now: Date, latitude: number, longitude: number): WesternChart {
  return computeWesternChart({
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
    day: now.getUTCDate(),
    hour: now.getUTCHours(),
    minute: now.getUTCMinutes(),
    tzOffsetHours: 0,
    latitude,
    longitude,
  }, "placidus");
}

export function transitAspects(natal: WesternChart, sky: WesternChart): TransitHit[] {
  const hits: TransitHit[] = [];
  for (const t of sky.tropicalPlanets) {
    for (const n of natal.tropicalPlanets) {
      let diff = Math.abs(t.tropicalLongitude - n.tropicalLongitude);
      if (diff > 180) diff = 360 - diff;
      for (const [name, def] of Object.entries(ASPECTS) as [AspectType, typeof ASPECTS[AspectType]][]) {
        const allowed = def.orb * 0.5; // tight orbs for transits
        const orb = Math.abs(diff - def.angle);
        if (orb <= allowed) {
          hits.push({
            transit: t.name, natal: n.name,
            type: name, angle: diff, orb,
            applying: !t.retrograde,
          });
        }
      }
    }
  }
  return hits.sort((a, b) => a.orb - b.orb);
}

// Which house of the natal chart is each transiting planet currently in?
export function transitHouses(natal: WesternChart, sky: WesternChart) {
  return sky.tropicalPlanets.map((p) => ({
    planet: p.name,
    longitude: p.tropicalLongitude,
    house: houseOfLongitude(p.tropicalLongitude, natal.cusps) + 1,
    retrograde: p.retrograde,
  }));
}

// Highlight the "hot" slow-planet transits that shape the year.
const SLOW: PlanetName[] = ["Jupiter", "Saturn", "Rahu", "Ketu"];
export function keyTransits(hits: TransitHit[]) {
  return hits
    .filter((h) => SLOW.includes(h.transit))
    .filter((h) => ["conjunction", "opposition", "square", "trine"].includes(h.type))
    .slice(0, 8);
}
