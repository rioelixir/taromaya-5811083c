// TAROMAYA Astrology Provider Adapter
// -----------------------------------------------------------------------------
// A single stable interface every astrology module talks to. Today it is backed
// by our verified Swiss-Ephemeris-grade engine (astronomy-engine + Lahiri).
// Tomorrow, a Divine API adapter can implement the same interface and
// downstream modules (Vargas, Dashas, KP, Jaimini, Panchang, transits, etc.)
// will not need to change.
//
// Runs server-side only (imported by *.functions.ts inside handlers, or by
// server routes). Do not import from client code.

import {
  computeKundli,
  type KundliInput,
  type Planet,
} from "@/lib/vedic";
import type { ChartConfig } from "@/lib/chart-config";

export type AstroBirthInput = KundliInput & {
  name?: string;
  gender?: "unspecified" | "male" | "female" | "neutral" | "other";
  place?: string;
  language?: "en" | "hi" | "hi_roman";
  chartStyle?: "north" | "south" | "east";
};

export type NormalizedPlanet = Planet & {
  house: number;
  signLord: string;
  nakshatraLord: string;
  combust?: boolean;
  exalted?: boolean;
  debilitated?: boolean;
};

export type NormalizedChart = {
  ascendant: {
    longitude: number;
    rashi: number;
    degreeInRashi: number;
    nakshatra: number;
    pada: number;
  };
  planets: NormalizedPlanet[];
  houses: { cusp: number; rashi: number }[]; // 12 whole-sign
  meta: {
    engine: string;
    engineVersion: string;
    ayanamsa: string;
    ayanamsaValue: number;
    houseSystem: string;
    nodeType: string;
    zodiac: "sidereal" | "tropical";
    utcISO: string;
    julianDay: number;
    computedAt: string;
  };
};

export interface AstroProvider {
  readonly id: string;
  readonly version: string;
  computeRashi(
    input: AstroBirthInput,
    config: ChartConfig,
  ): Promise<NormalizedChart>;
}

// -----------------------------------------------------------------------------
// Swiss-Ephemeris-grade adapter (astronomy-engine + Lahiri).
// -----------------------------------------------------------------------------
const NAKSHATRA_LORDS_9 = [
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
];
const RASHI_LORDS_12 = [
  "Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury",
  "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter",
];
const EXALTATION: Record<string, number> = {
  Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6,
};
const DEBILITATION: Record<string, number> = {
  Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0,
};

class SwissAdapter implements AstroProvider {
  readonly id = "swiss";
  readonly version = "astronomy-engine@2.x+lahiri";

  async computeRashi(
    input: AstroBirthInput,
    config: ChartConfig,
  ): Promise<NormalizedChart> {
    const raw = computeKundli(input, config);

    // Whole-sign houses from ascendant sign.
    const ascSign = raw.ascendant.rashi;
    const houses = Array.from({ length: 12 }, (_, i) => ({
      cusp: ((ascSign + i) % 12) * 30,
      rashi: (ascSign + i) % 12,
    }));

    // House index (1..12) for each planet under whole-sign.
    const sunLon = raw.planets.find((p) => p.name === "Sun")?.longitude ?? 0;
    const planets: NormalizedPlanet[] = raw.planets.map((p) => {
      const house = ((p.rashi - ascSign + 12) % 12) + 1;
      // Combustion: within 8° of Sun (skip Sun/Moon nodes)
      const arc = Math.min(
        Math.abs(p.longitude - sunLon),
        360 - Math.abs(p.longitude - sunLon),
      );
      const combust =
        p.name !== "Sun" && p.name !== "Rahu" && p.name !== "Ketu" && arc < 8;
      return {
        ...p,
        house,
        signLord: RASHI_LORDS_12[p.rashi],
        nakshatraLord: NAKSHATRA_LORDS_9[p.nakshatra % 9],
        combust,
        exalted: EXALTATION[p.name] === p.rashi,
        debilitated: DEBILITATION[p.name] === p.rashi,
      };
    });

    return {
      ascendant: raw.ascendant,
      planets,
      houses,
      meta: {
        engine: this.id,
        engineVersion: this.version,
        ayanamsa: config.ayanamsa,
        ayanamsaValue: raw.ayanamsa,
        houseSystem: config.houseSystem,
        nodeType: config.nodeType,
        zodiac: "sidereal",
        utcISO: raw.utcISO,
        julianDay: raw.jd,
        computedAt: new Date().toISOString(),
      },
    };
  }
}

// Registry — future: Divine API adapter registered under id="divine".
const providers = new Map<string, AstroProvider>();
providers.set("swiss", new SwissAdapter());

export function getAstroProvider(id: string = "swiss"): AstroProvider {
  const p = providers.get(id);
  if (!p) throw new Error(`Unknown astrology provider: ${id}`);
  return p;
}

// Deterministic config hash — used as cache key in chart_calculations.
export function hashCalcRequest(
  input: AstroBirthInput,
  config: ChartConfig,
  moduleId: string,
): string {
  const canon = JSON.stringify({
    moduleId,
    year: input.year, month: input.month, day: input.day,
    hour: input.hour, minute: input.minute, seconds: input.seconds ?? 0,
    tz: input.tzOffsetHours,
    lat: Math.round(input.latitude * 1e5) / 1e5,
    lon: Math.round(input.longitude * 1e5) / 1e5,
    elev: input.elevation ?? 0,
    ayanamsa: config.ayanamsa,
    houseSystem: config.houseSystem,
    nodeType: config.nodeType,
  });
  // Simple stable 32-char hex hash (FNV-1a 64-bit style, no crypto deps).
  let h1 = 0xcbf29ce4, h2 = 0x84222325;
  for (let i = 0; i < canon.length; i++) {
    h1 = Math.imul(h1 ^ canon.charCodeAt(i), 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ canon.charCodeAt(canon.length - 1 - i), 0x01000193) >>> 0;
  }
  return (h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0")).padEnd(16, "0");
}
