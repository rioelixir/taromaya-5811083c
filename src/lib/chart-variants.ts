// Chart reference-point variants: Lagna, Chandra (Moon) lagna, Surya (Sun)
// lagna and Bhava Chalit (equal-house cusp) charts, all derived from the
// normalized D1 chart so every renderer can consume the same shape.

export type VariantPlanet = {
  name: string;
  longitude: number;
  rashi: number;
  house: number;
  degreeInRashi?: number;
  retrograde?: boolean;
  combust?: boolean;
  exalted?: boolean;
  debilitated?: boolean;
};

export type VariantChart = {
  ascendant: { rashi: number; degreeInRashi: number };
  planets: VariantPlanet[];
};

export type ChartVariant = "lagna" | "moon" | "sun" | "chalit";

export const CHART_VARIANTS: { key: ChartVariant; label: string; note: string }[] = [
  { key: "lagna", label: "Lagna", note: "Rising sign as the first house — the standard reference for body, self and life direction." },
  { key: "moon", label: "Moon", note: "Chandra lagna: the Moon's sign becomes the first house, showing mind, emotion and inner response." },
  { key: "sun", label: "Sun", note: "Surya lagna: the Sun's sign becomes the first house, showing vitality, authority and public role." },
  { key: "chalit", label: "Bhava Chalit", note: "Equal-house cusps measured from the exact ascendant degree, so planets sit in the house they truly influence." },
];

const norm12 = (x: number) => ((x % 12) + 12) % 12;
const norm360 = (x: number) => ((x % 360) + 360) % 360;

/** Re-seat the chart so the given sign is the first house (whole-sign). */
function fromSign(chart: VariantChart, sign: number): VariantChart {
  return {
    ascendant: { rashi: sign, degreeInRashi: 0 },
    planets: chart.planets.map((p) => ({
      ...p,
      house: norm12(p.rashi - sign) + 1,
    })),
  };
}

/**
 * Bhava Chalit — equal houses of 30° each starting at the exact ascendant
 * degree minus 15° (the ascendant degree is the mid-point of house one).
 * Signs are unchanged; only house membership shifts.
 */
export function toBhavaChalit(chart: VariantChart): VariantChart {
  const ascLon = chart.ascendant.rashi * 30 + chart.ascendant.degreeInRashi;
  const firstCusp = norm360(ascLon - 15);
  return {
    ascendant: chart.ascendant,
    planets: chart.planets.map((p) => ({
      ...p,
      house: Math.floor(norm360(p.longitude - firstCusp) / 30) + 1,
    })),
  };
}

export function toVariant(chart: VariantChart, variant: ChartVariant): VariantChart {
  if (variant === "lagna") return chart;
  if (variant === "chalit") return toBhavaChalit(chart);
  const anchor = chart.planets.find((p) => p.name === (variant === "moon" ? "Moon" : "Sun"));
  if (!anchor) return chart;
  return fromSign(chart, anchor.rashi);
}
