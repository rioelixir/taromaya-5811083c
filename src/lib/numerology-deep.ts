// Deep numerology engines: Lo Shu grid, Chinese Nine Star Ki,
// Kabbalah (Hebrew gematria via transliteration), Essence & Letter Transits,
// Life cycles (Formative, Productive, Harvest), Hidden Passion, Balance,
// Karmic Lessons, and Sub-conscious Self.

import { reduce, NUMBER_MEANINGS } from "@/lib/numerology";

const digitsOf = (n: number | string) =>
  String(n).replace(/\D/g, "").split("").map(Number);
const dsum = (n: number) => digitsOf(n).reduce((s, x) => s + x, 0);
const letters = (name: string) =>
  name.toUpperCase().replace(/[^A-Z]/g, "").split("");

const PYTH: Record<string, number> = {
  A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,
  S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8,
};

// ─────────────────────────────────────────────────────────────
// LO SHU GRID (Chinese numerology from date of birth)
// ─────────────────────────────────────────────────────────────
// Traditional 3×3 magic square positions:
//   4 9 2
//   3 5 7
//   8 1 6
export type LoShuGrid = {
  counts: Record<number, number>;  // 1..9 occurrences in DOB digits (with driver+conductor)
  driver: number;                  // day-of-month reduced (mulank)
  conductor: number;               // full-DOB reduced (bhagyank)
  missing: number[];
  strong: number[];                // 3+ occurrences
  planes: {
    mind: { line: [3, 9, 5]; count: number; complete: boolean };
    soul: { line: [2, 5, 8]; count: number; complete: boolean };
    practical: { line: [1, 5, 9]; count: number; complete: boolean };
    thought: { line: [4, 9, 2]; count: number; complete: boolean };
    will: { line: [3, 5, 7]; count: number; complete: boolean };
    action: { line: [8, 1, 6]; count: number; complete: boolean };
    golden: { line: [4, 3, 8]; count: number; complete: boolean };
    silver: { line: [2, 7, 6]; count: number; complete: boolean };
  };
  interpretation: { number: number; strength: "missing" | "weak" | "balanced" | "strong"; note: string }[];
};
const NOTES: Record<number, string> = {
  1: "Sun — identity, willpower, leadership.",
  2: "Moon — intuition, sensitivity, partnership.",
  3: "Jupiter — expression, wisdom, imagination.",
  4: "Rahu / Uranus — practicality, mental sharpness, discipline.",
  5: "Mercury — communication, adaptability, freedom.",
  6: "Venus — love, artistry, harmony.",
  7: "Ketu / Neptune — spirituality, introspection, sacrifice.",
  8: "Saturn — responsibility, karma, wealth cycles.",
  9: "Mars — courage, ambition, completion.",
};
export function loShuGrid(birthDate: string): LoShuGrid {
  const [y, m, d] = birthDate.split("-").map(Number);
  const driver = reduce(d);
  const conductor = reduce(dsum(y) + dsum(m) + dsum(d));
  const digits = [
    ...digitsOf(d),
    ...digitsOf(m),
    ...digitsOf(y),
    ...digitsOf(driver),
    ...digitsOf(conductor),
  ].filter((x) => x >= 1 && x <= 9);
  const counts: Record<number, number> = {};
  for (let i = 1; i <= 9; i++) counts[i] = 0;
  digits.forEach((n) => (counts[n] = (counts[n] ?? 0) + 1));
  const missing = Object.entries(counts).filter(([, v]) => v === 0).map(([k]) => Number(k));
  const strong = Object.entries(counts).filter(([, v]) => v >= 3).map(([k]) => Number(k));
  const line = (a: number, b: number, c: number) => counts[a] + counts[b] + counts[c];
  const planes = {
    mind:      { line: [3, 9, 5] as [3,9,5], count: line(3,9,5), complete: counts[3]>0 && counts[9]>0 && counts[5]>0 },
    soul:      { line: [2, 5, 8] as [2,5,8], count: line(2,5,8), complete: counts[2]>0 && counts[5]>0 && counts[8]>0 },
    practical: { line: [1, 5, 9] as [1,5,9], count: line(1,5,9), complete: counts[1]>0 && counts[5]>0 && counts[9]>0 },
    thought:   { line: [4, 9, 2] as [4,9,2], count: line(4,9,2), complete: counts[4]>0 && counts[9]>0 && counts[2]>0 },
    will:      { line: [3, 5, 7] as [3,5,7], count: line(3,5,7), complete: counts[3]>0 && counts[5]>0 && counts[7]>0 },
    action:    { line: [8, 1, 6] as [8,1,6], count: line(8,1,6), complete: counts[8]>0 && counts[1]>0 && counts[6]>0 },
    golden:    { line: [4, 3, 8] as [4,3,8], count: line(4,3,8), complete: counts[4]>0 && counts[3]>0 && counts[8]>0 },
    silver:    { line: [2, 7, 6] as [2,7,6], count: line(2,7,6), complete: counts[2]>0 && counts[7]>0 && counts[6]>0 },
  };
  const interpretation = Array.from({ length: 9 }, (_, i) => {
    const n = i + 1;
    const c = counts[n];
    const strength = c === 0 ? "missing" : c === 1 ? "weak" : c === 2 ? "balanced" : "strong";
    const notePrefix =
      strength === "missing" ? "Karmic gap — cultivate consciously. " :
      strength === "strong"  ? "Amplified vibration — channel wisely. " :
      strength === "balanced"? "Balanced expression. " : "Present but subtle. ";
    return { number: n, strength: strength as LoShuGrid["interpretation"][number]["strength"], note: notePrefix + NOTES[n] };
  });
  return { counts, driver, conductor, missing, strong, planes, interpretation };
}

// ─────────────────────────────────────────────────────────────
// CHINESE NINE STAR KI ASTROLOGY
// ─────────────────────────────────────────────────────────────
export type NineStarKi = {
  principal: number;      // year star (birth year, solar cutoff ~Feb 4)
  character: number;      // month star
  energetic: number;      // annual axis (adjustment)
  element: string;
  direction: string;
  season: string;
  yearNote: string;
  personality: string;
};
const KI_ELEMENTS: Record<number, { el: string; dir: string; season: string; note: string }> = {
  1: { el: "Water",       dir: "North",      season: "Winter",     note: "Deep, adaptable, philosophical — the still lake." },
  2: { el: "Earth",       dir: "Southwest",  season: "Late Summer", note: "Nurturing, service-oriented, receptive — the mother." },
  3: { el: "Wood (Tree)", dir: "East",       season: "Spring",     note: "Rising, pioneering, impatient — thunder & new shoots." },
  4: { el: "Wood (Wind)", dir: "Southeast",  season: "Late Spring", note: "Diplomatic, communicative, flexible — the wind." },
  5: { el: "Earth",       dir: "Center",     season: "All",         note: "Magnetic core — extreme charisma or turbulence." },
  6: { el: "Metal",       dir: "Northwest",  season: "Late Autumn", note: "Authoritative, dignified, paternal — heaven." },
  7: { el: "Metal",       dir: "West",       season: "Autumn",     note: "Joyful, expressive, sensual — the lake at sunset." },
  8: { el: "Earth",       dir: "Northeast",  season: "Late Winter", note: "Still, reflective, mountainous — inheritance & change." },
  9: { el: "Fire",        dir: "South",      season: "Summer",     note: "Illuminating, passionate, visible — the sun." },
};
export function nineStarKi(birthDate: string): NineStarKi {
  const [y, m, d] = birthDate.split("-").map(Number);
  // Chinese solar year begins ~Feb 4 (Lichun). Before that, use prior year.
  const solarYear = (m < 2 || (m === 2 && d < 4)) ? y - 1 : y;
  const principal = ((11 - (dsum(solarYear) > 9 ? reduce(dsum(solarYear)) : dsum(solarYear))) % 9) || 9;
  // Month Star table (approximate) based on Principal Star (year):
  //  simplified formula: monthStar = (11 - ((monthAdj + yearGroup) % 9)) mod 9
  const yearGroup = ((principal - 1) % 3);
  const monthOffsets = [8, 5, 2]; // Group 1,4,7 / 2,5,8 / 3,6,9
  const monthStar = ((monthOffsets[yearGroup] - (m - 1)) % 9 + 9) % 9 || 9;
  const nowY = new Date().getFullYear();
  const energetic = ((11 - (dsum(nowY) > 9 ? reduce(dsum(nowY)) : dsum(nowY))) % 9) || 9;
  const info = KI_ELEMENTS[principal];
  return {
    principal, character: monthStar, energetic,
    element: info.el, direction: info.dir, season: info.season, yearNote: info.note,
    personality: `Your outer self is ${principal} (${info.el}, ${info.dir}); your emotional core is ${monthStar} (${KI_ELEMENTS[monthStar].el}). This year's cosmic climate is ${energetic} (${KI_ELEMENTS[energetic].el}).`,
  };
}

// ─────────────────────────────────────────────────────────────
// KABBALAH (Hebrew gematria via Latin transliteration)
// ─────────────────────────────────────────────────────────────
// Uses a well-known Kabbalistic name-only cipher (birthdate ignored).
// Result reduced mod 22 → mapped to path meaning of the Tree of Life.
const KAB: Record<string, number> = {
  A:1,I:1,J:1,Q:1,Y:1,
  B:2,K:2,R:2,
  C:3,G:3,L:3,S:3,
  D:4,M:4,T:4,
  E:5,H:5,N:5,X:5,
  U:6,V:6,W:6,
  O:7,Z:7,
  F:8,P:8,
};
const KAB_PATHS: Record<number, { name: string; meaning: string }> = {
  0:  { name: "The Fool",          meaning: "Beginner's soul; leap of faith; new incarnation." },
  1:  { name: "The Magician",      meaning: "Willed creation; channel of the four elements." },
  2:  { name: "The High Priestess",meaning: "Silent knowing; lunar wisdom." },
  3:  { name: "The Empress",       meaning: "Abundance, fertility, sensual creativity." },
  4:  { name: "The Emperor",       meaning: "Order, sovereignty, structure." },
  5:  { name: "The Hierophant",    meaning: "Sacred tradition; teacher–student lineage." },
  6:  { name: "The Lovers",        meaning: "Union, sacred choice, resonance." },
  7:  { name: "The Chariot",       meaning: "Directed force; victory through discipline." },
  8:  { name: "Strength",          meaning: "Compassionate power; taming the beast." },
  9:  { name: "The Hermit",        meaning: "Inner light; solitary seeker." },
  10: { name: "Wheel of Fortune",  meaning: "Karmic cycles; timing, luck, evolution." },
  11: { name: "Justice",           meaning: "Balance, truth, ethical accounting." },
  12: { name: "Hanged One",        meaning: "Surrender, initiation, perspective shift." },
  13: { name: "Death",             meaning: "Transformation; ego death & rebirth." },
  14: { name: "Temperance",        meaning: "Alchemy, blending opposites, moderation." },
  15: { name: "The Devil",         meaning: "Bondage & release; shadow integration." },
  16: { name: "The Tower",         meaning: "Sudden revelation; false structure collapses." },
  17: { name: "The Star",          meaning: "Hope, inspiration, cosmic guidance." },
  18: { name: "The Moon",          meaning: "Illusion & intuition; dream initiation." },
  19: { name: "The Sun",           meaning: "Radiant clarity, joy, vitality." },
  20: { name: "Judgement",         meaning: "Awakening call; karmic verdict." },
  21: { name: "The World",         meaning: "Completion, integration, cosmic dance." },
};
export function kabbalah(fullName: string): { value: number; path: number; name: string; meaning: string } {
  const total = letters(fullName).reduce((s, l) => s + (KAB[l] ?? 0), 0);
  const path = ((total - 1) % 22 + 22) % 22;
  const info = KAB_PATHS[path];
  return { value: total, path, name: info?.name ?? "—", meaning: info?.meaning ?? "" };
}

// ─────────────────────────────────────────────────────────────
// ESSENCE & LETTER TRANSITS (yearly letter cycles from full name)
// ─────────────────────────────────────────────────────────────
// Each letter of a name transits for a period equal to its numeric value.
// Essence for a given age = sum of currently-active letters from first, middle, last names (reduced).
export type EssenceRow = { age: number; year: number; letters: string[]; essence: number };
export function essenceTimeline(fullName: string, birthDate: string, span = 20): EssenceRow[] {
  const parts = fullName.trim().split(/\s+/).filter(Boolean).map((p) => letters(p));
  if (parts.length === 0) return [];
  // Precompute per-name letter start ages.
  const timelines = parts.map((ls) => {
    let running = 0;
    return ls.map((l) => {
      const val = PYTH[l] ?? 0;
      const start = running;
      running += val;
      return { letter: l, start, end: running };
    });
  });
  const cycleLen = Math.max(...timelines.map((t) => (t[t.length - 1]?.end ?? 0)));
  const activeAt = (age: number) => {
    const norm = ((age % (cycleLen || 1)) + (cycleLen || 1)) % (cycleLen || 1);
    return timelines.map((tl) => {
      const hit = tl.find((seg) => norm >= seg.start && norm < seg.end);
      return hit?.letter ?? "";
    }).filter(Boolean);
  };
  const birthY = Number(birthDate.split("-")[0]);
  const nowY = new Date().getFullYear();
  const currentAge = nowY - birthY;
  const rows: EssenceRow[] = [];
  for (let i = 0; i < span; i++) {
    const age = currentAge + i;
    const ltrs = activeAt(age);
    const essence = reduce(ltrs.reduce((s, l) => s + (PYTH[l] ?? 0), 0));
    rows.push({ age, year: birthY + age, letters: ltrs, essence });
  }
  return rows;
}

// ─────────────────────────────────────────────────────────────
// LIFE CYCLES (Formative, Productive, Harvest)
// ─────────────────────────────────────────────────────────────
export type LifeCycles = {
  formative: { from: number; to: number; n: number };
  productive: { from: number; to: number; n: number };
  harvest: { from: number; to: number; n: number };
};
export function lifeCycles(birthDate: string): LifeCycles {
  const [y, m, d] = birthDate.split("-").map(Number);
  const lp = reduce(dsum(y) + dsum(m) + dsum(d));
  const firstEnd = Math.max(28, 36 - lp);
  return {
    formative:  { from: 0,           to: firstEnd,        n: reduce(m) },
    productive: { from: firstEnd,    to: firstEnd + 27,   n: reduce(d) },
    harvest:    { from: firstEnd+27, to: 99,              n: reduce(y) },
  };
}

// ─────────────────────────────────────────────────────────────
// HIDDEN PASSION / KARMIC LESSONS / BALANCE / SUBCONSCIOUS SELF
// ─────────────────────────────────────────────────────────────
export type NameAnalysis = {
  frequency: Record<number, number>;   // count of each digit 1..9 across all letters
  hiddenPassion: number[];             // most frequent
  karmicLessons: number[];             // absent (1..9)
  balance: number;                     // reduced sum of initials
  subconsciousSelf: number;            // 9 − karmic lessons count
};
export function analyseName(fullName: string): NameAnalysis {
  const ls = letters(fullName);
  const freq: Record<number, number> = {};
  for (let i = 1; i <= 9; i++) freq[i] = 0;
  ls.forEach((l) => { const v = PYTH[l]; if (v) freq[v] = (freq[v] ?? 0) + 1; });
  const max = Math.max(...Object.values(freq));
  const hiddenPassion = Object.entries(freq).filter(([, v]) => v === max && v > 0).map(([k]) => Number(k));
  const karmicLessons = Object.entries(freq).filter(([, v]) => v === 0).map(([k]) => Number(k));
  const initials = fullName.trim().split(/\s+/).map((p) => p[0]?.toUpperCase() ?? "").join("");
  const balance = reduce(letters(initials).reduce((s, l) => s + (PYTH[l] ?? 0), 0));
  const subconsciousSelf = 9 - karmicLessons.length;
  return { frequency: freq, hiddenPassion, karmicLessons, balance, subconsciousSelf };
}

export { NUMBER_MEANINGS };
