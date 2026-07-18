// Baby Names — Vedic pada syllable mapping + numerology alignment.
// The 27 Nakshatras × 4 padas → traditional Sanskrit starting syllables.
// Sources: Brihat Parasara Hora Shastra, Muhurta Chintamani, Namakarana
// Samskara traditions.

import { NAKSHATRAS } from "./vedic";
import { computeNumerology } from "./numerology";

export const PADA_SYLLABLES: string[][] = [
  ["Chu","Che","Cho","La"],       // 1 Ashwini
  ["Li","Lu","Le","Lo"],          // 2 Bharani
  ["A","I","U","E"],              // 3 Krittika
  ["O","Va","Vi","Vu"],           // 4 Rohini
  ["Ve","Vo","Ka","Ki"],          // 5 Mrigashira
  ["Ku","Gha","Nga","Chha"],      // 6 Ardra
  ["Ke","Ko","Ha","Hi"],          // 7 Punarvasu
  ["Hu","He","Ho","Da"],          // 8 Pushya
  ["Di","Du","De","Do"],          // 9 Ashlesha
  ["Ma","Mi","Mu","Me"],          // 10 Magha
  ["Mo","Ta","Ti","Tu"],          // 11 P. Phalguni
  ["Te","To","Pa","Pi"],          // 12 U. Phalguni
  ["Pu","Sha","Na","Tha"],        // 13 Hasta
  ["Pe","Po","Ra","Ri"],          // 14 Chitra
  ["Ru","Re","Ro","Ta"],          // 15 Swati
  ["Ti","Tu","Te","To"],          // 16 Vishakha
  ["Na","Ni","Nu","Ne"],          // 17 Anuradha
  ["No","Ya","Yi","Yu"],          // 18 Jyeshtha
  ["Ye","Yo","Bha","Bhi"],        // 19 Mula
  ["Bu","Dha","Bha","Dha"],       // 20 P. Ashadha
  ["Be","Bo","Ja","Ji"],          // 21 U. Ashadha
  ["Ju","Je","Jo","Gha"],         // 22 Shravana
  ["Ga","Gi","Gu","Ge"],          // 23 Dhanishta
  ["Go","Sa","Si","Su"],          // 24 Shatabhisha
  ["Se","So","Da","Di"],          // 25 P. Bhadrapada
  ["Du","Tha","Jha","Da"],        // 26 U. Bhadrapada
  ["De","Do","Cha","Chi"],        // 27 Revati
];

export type Tradition = "Hindu" | "Sanskrit" | "Sikh" | "Muslim" | "Christian" | "Modern" | "Any";
export type Gender = "Boy" | "Girl" | "Unisex";

export type BabyNameCriteria = {
  gender: Gender;
  tradition: Tradition;
  nakshatraIndex?: number;   // 0..26 — auto-fills syllables when provided
  pada?: 1 | 2 | 3 | 4;      // 1..4
  syllables?: string[];      // manual override
  meaningTheme?: string;     // e.g. "courage, wisdom, light"
  targetLifePath?: number;   // 1..9 (or 11/22/33)
  birthDate?: string;        // yyyy-mm-dd for personal-year / numerology
  count?: number;            // 12..30
};

export function syllablesForNakshatra(nakshatraIndex: number, pada?: 1 | 2 | 3 | 4): string[] {
  const row = PADA_SYLLABLES[nakshatraIndex] || [];
  if (pada) return [row[pada - 1]].filter(Boolean);
  return row;
}

export function nakshatraName(i: number): string {
  return NAKSHATRAS[i] ?? "";
}

export type BabyName = {
  name: string;
  meaning: string;
  origin: string;
  gender: Gender;
  syllable: string;
  numerology?: {
    destiny: number;
    soulUrge: number;
    personality: number;
  };
  alignment?: {
    lifePathMatch?: boolean;
    padaMatch?: boolean;
  };
};

// Given a generated raw name list, compute numerology & alignment.
export function enrichNames(
  names: Array<{ name: string; meaning: string; origin: string; gender: Gender; syllable: string }>,
  criteria: BabyNameCriteria,
): BabyName[] {
  return names.map((n) => {
    let numerology: BabyName["numerology"] | undefined;
    let padaMatch = false;
    let lifePathMatch = false;
    try {
      if (criteria.birthDate) {
        const r = computeNumerology(
          { fullName: n.name, birthDate: criteria.birthDate },
          "Pythagorean",
        );
        numerology = {
          destiny: r.destiny,
          soulUrge: r.soulUrge,
          personality: r.personality,
        };
        if (criteria.targetLifePath && r.destiny === criteria.targetLifePath) {
          lifePathMatch = true;
        }
      }
    } catch { /* ignore */ }

    // pada syllable match — starts-with check, case-insensitive
    if (criteria.syllables?.length) {
      const upper = n.name.trim().toUpperCase();
      padaMatch = criteria.syllables.some((s) => upper.startsWith(s.toUpperCase()));
    }

    return { ...n, numerology, alignment: { padaMatch, lifePathMatch } };
  });
}

// Small hard-coded seed pool so the page renders instantly before AI responds.
export const SEED_NAMES: Array<{ name: string; meaning: string; origin: string; gender: Gender }> = [
  { name: "Aarav",  meaning: "Peaceful, calm",           origin: "Sanskrit", gender: "Boy" },
  { name: "Advait", meaning: "Unique, non-dual",         origin: "Sanskrit", gender: "Boy" },
  { name: "Ishaan", meaning: "Lord Shiva, sun",          origin: "Sanskrit", gender: "Boy" },
  { name: "Vihaan", meaning: "Dawn, morning",            origin: "Sanskrit", gender: "Boy" },
  { name: "Kabir",  meaning: "Great, poet-saint",        origin: "Hindu",    gender: "Boy" },
  { name: "Aanya",  meaning: "Grace, limitless",         origin: "Sanskrit", gender: "Girl" },
  { name: "Anaya",  meaning: "Caring, guardian",         origin: "Sanskrit", gender: "Girl" },
  { name: "Ira",    meaning: "Earth, goddess Saraswati", origin: "Sanskrit", gender: "Girl" },
  { name: "Meera",  meaning: "Devotee, ocean",           origin: "Hindu",    gender: "Girl" },
  { name: "Saanvi", meaning: "Goddess Lakshmi",          origin: "Sanskrit", gender: "Girl" },
];
