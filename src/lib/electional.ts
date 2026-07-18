// Electional depth helpers: Tarabala, Chandrabala, Panchaka, Hora affinity.
// Layered on top of scanMuhurats when the user supplies their birth nakshatra & rashi.

import { NAKSHATRAS, RASHIS } from "./vedic";
import { CHALDEAN_ORDER, type HoraLord } from "./hora";
import type { Activity } from "./muhurat";

export type BirthContext = {
  nakshatra?: (typeof NAKSHATRAS)[number]; // Janma nakshatra
  rashi?: (typeof RASHIS)[number];         // Janma rashi (Moon sign)
};

// Tara names for the 9-fold cycle of nakshatras from the janma nakshatra.
export const TARA_NAMES = [
  "Janma", "Sampat", "Vipat", "Kshema", "Pratyari", "Sadhaka", "Vadha", "Mitra", "Ati Mitra",
] as const;

// Auspicious: Sampat, Kshema, Sadhaka, Mitra, Ati Mitra.
// Inauspicious: Janma, Vipat, Pratyari, Vadha.
const TARA_GOOD = new Set([1, 3, 5, 7, 8]);
const TARA_BAD  = new Set([0, 2, 4, 6]);

export function tarabala(birthNak: string, currentNak: string) {
  const a = NAKSHATRAS.indexOf(birthNak as any);
  const b = NAKSHATRAS.indexOf(currentNak as any);
  if (a < 0 || b < 0) return null;
  const diff = ((b - a) % 27 + 27) % 27;
  const idx = diff % 9;
  return { index: idx, name: TARA_NAMES[idx], good: TARA_GOOD.has(idx), bad: TARA_BAD.has(idx) };
}

// Chandrabala: transit Moon from natal Moon (1..12 houses). Bad: 4, 8, 12.
const CHANDRA_BAD = new Set([4, 8, 12]);
const CHANDRA_GOOD = new Set([1, 3, 6, 7, 10, 11]);

export function chandrabala(birthRashi: string, currentMoonRashi: string) {
  const a = RASHIS.indexOf(birthRashi as any);
  const b = RASHIS.indexOf(currentMoonRashi as any);
  if (a < 0 || b < 0) return null;
  const house = ((b - a) % 12 + 12) % 12 + 1;
  return { house, good: CHANDRA_GOOD.has(house), bad: CHANDRA_BAD.has(house) };
}

// Panchaka: last 5 nakshatras (Dhanishta 2nd half → Revati) trigger different doshas by weekday/type.
// Simplified check: Dhanishta (22), Shatabhisha (23), Purva Bhadrapada (24), Uttara Bhadrapada (25), Revati (26).
const PANCHAKA_NAKS = new Set([22, 23, 24, 25, 26]);

export function panchakaDosha(nakName: string) {
  const idx = NAKSHATRAS.indexOf(nakName as any);
  return PANCHAKA_NAKS.has(idx);
}

// Preferred hora lord(s) per activity — Chaldean planetary hours.
export const HORA_AFFINITY: Record<Activity, HoraLord[]> = {
  marriage:        ["Venus", "Jupiter", "Moon"],
  "griha-pravesh": ["Jupiter", "Mercury", "Venus"],
  vehicle:         ["Venus", "Mercury", "Moon"],
  business:        ["Mercury", "Jupiter", "Sun"],
  travel:          ["Mercury", "Moon", "Jupiter"],
  surgery:         ["Mars", "Saturn"],
  namkaran:        ["Jupiter", "Moon", "Mercury"],
  signing:         ["Mercury", "Jupiter"],
};

export function isFavourableHora(activity: Activity, lord: HoraLord) {
  return HORA_AFFINITY[activity].includes(lord);
}

// Convenience: score adjustments to feed into scanMuhurats layer.
export type ElectionalAdjust = {
  delta: number;
  reasons: string[];
  warnings: string[];
};

export function scoreElectional(input: {
  activity: Activity;
  currentNakshatra: string;
  currentMoonRashi: string;
  horaLord?: HoraLord;
  birth?: BirthContext;
}): ElectionalAdjust {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let delta = 0;

  if (input.birth?.nakshatra) {
    const t = tarabala(input.birth.nakshatra, input.currentNakshatra);
    if (t) {
      if (t.good) { delta += 12; reasons.push(`Tarabala: ${t.name} (favourable)`); }
      else if (t.bad) { delta -= 15; warnings.push(`Tarabala: ${t.name} (unfavourable)`); }
      else reasons.push(`Tarabala: ${t.name}`);
    }
  }
  if (input.birth?.rashi) {
    const c = chandrabala(input.birth.rashi, input.currentMoonRashi);
    if (c) {
      if (c.good) { delta += 10; reasons.push(`Chandrabala: ${c.house}th (strong Moon)`); }
      else if (c.bad) { delta -= 18; warnings.push(`Chandrabala: ${c.house}th house (weak Moon — avoid)`); }
    }
  }
  if (panchakaDosha(input.currentNakshatra)) {
    delta -= 8;
    warnings.push(`Panchaka nakshatra (${input.currentNakshatra}) — extra caution`);
  }
  if (input.horaLord) {
    if (isFavourableHora(input.activity, input.horaLord)) {
      delta += 10;
      reasons.push(`${input.horaLord} hora supports ${input.activity.replace("-", " ")}`);
    } else if (CHALDEAN_ORDER.includes(input.horaLord)) {
      // still name the hora even if neutral/negative
      reasons.push(`${input.horaLord} hora`);
    }
  }
  return { delta, reasons, warnings };
}
