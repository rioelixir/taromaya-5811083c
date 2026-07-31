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
// LO SHU GRID (Vedic numerology from date of birth)
// ─────────────────────────────────────────────────────────────
// Traditional 3×3 magic square (every row, column & diagonal = 15):
//   4 9 2
//   3 5 7
//   8 1 6
//
// Ruleset used throughout the app (fixed for internal consistency):
//   • Digits pooled from DOB (day + month + full year) PLUS the mulank
//     (driver = reduced day) and bhagyank (conductor = reduced full DOB).
//     This is the widely taught Vedic Lo Shu convention. Other schools use
//     only raw DOB digits — noted here so results are reproducible, not
//     presented as the only valid rule.
//   • Only digits 1..9 are placed (0 is ignored — it has no cell).
//   • Strength buckets:   0 → missing • 1 → weak • 2 → balanced • ≥3 → strong.
//   • An "arrow" line is any of the 8 magic-square lines (3 rows, 3 columns,
//     2 diagonals). A line is a STRENGTH arrow if all three cells are
//     present, a WEAKNESS arrow if all three cells are missing.
export type LoShuStrength = "missing" | "weak" | "balanced" | "strong";
export type LoShuLineKey =
  | "thought" | "emotion" | "action"
  | "intellect" | "will" | "feelings"
  | "prosperity" | "spirituality";
export type LoShuLine = {
  line: [number, number, number];
  count: number;      // total digit occurrences across the three cells
  present: number;    // how many of the three cells have ≥1 occurrence
  strength: boolean;  // all three present → strength arrow
  weakness: boolean;  // all three missing → weakness arrow
  label: string;
  // Back-compat with older UI code that read `.complete`.
  complete: boolean;
};
export type LoShuGrid = {
  counts: Record<number, number>;
  driver: number;
  conductor: number;
  missing: number[];
  strong: number[];
  planes: Record<LoShuLineKey, LoShuLine>;
  arrows: { strengths: LoShuLineKey[]; weaknesses: LoShuLineKey[] };
  interpretation: { number: number; strength: LoShuStrength; note: string }[];
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

const LINE_DEFS: { key: LoShuLineKey; line: [number, number, number]; label: string }[] = [
  { key: "thought",      line: [4, 9, 2], label: "Mental plane (row): thinking & memory" },
  { key: "emotion",      line: [3, 5, 7], label: "Emotional plane (row): feelings & will" },
  { key: "action",       line: [8, 1, 6], label: "Practical plane (row): doing & manifesting" },
  { key: "intellect",    line: [4, 3, 8], label: "Plane of intellect (column): analytical mind" },
  { key: "will",         line: [9, 5, 1], label: "Plane of will (column): determination" },
  { key: "feelings",     line: [2, 7, 6], label: "Plane of feelings (column): sensitivity" },
  { key: "prosperity",   line: [4, 5, 6], label: "Plane of prosperity (diagonal): work & wealth" },
  { key: "spirituality", line: [2, 5, 8], label: "Plane of spirituality (diagonal): soul path" },
];

function parseBirthDate(birthDate: string): { y: number; m: number; d: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate.trim());
  if (!match) throw new Error("Lo Shu: birthDate must be YYYY-MM-DD");
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12) throw new Error("Lo Shu: month out of range");
  // Validate against actual calendar (rejects 31 Feb, 29 Feb non-leap, etc.)
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== m - 1 ||
    probe.getUTCDate() !== d
  ) throw new Error("Lo Shu: invalid calendar date");
  return { y, m, d };
}

export function loShuGrid(birthDate: string): LoShuGrid {
  const { y, m, d } = parseBirthDate(birthDate);
  // Vedic Lo Shu uses fully reduced 1-9 values; master numbers do not apply here.
  const driver = reduce(d, false);
  const conductor = reduce(dsum(y) + dsum(m) + dsum(d), false);
  const digits = [
    ...digitsOf(d),
    ...digitsOf(m),
    ...digitsOf(y),
    ...digitsOf(driver),
    ...digitsOf(conductor),
  ].filter((x) => x >= 1 && x <= 9);
  const counts: Record<number, number> = {};
  for (let i = 1; i <= 9; i++) counts[i] = 0;
  digits.forEach((n) => { counts[n] += 1; });
  const missing = Object.entries(counts).filter(([, v]) => v === 0).map(([k]) => Number(k));
  const strong = Object.entries(counts).filter(([, v]) => v >= 3).map(([k]) => Number(k));

  const planes = {} as Record<LoShuLineKey, LoShuLine>;
  const strengths: LoShuLineKey[] = [];
  const weaknesses: LoShuLineKey[] = [];
  for (const def of LINE_DEFS) {
    const [a, b, c] = def.line;
    const count = counts[a] + counts[b] + counts[c];
    const present = (counts[a] > 0 ? 1 : 0) + (counts[b] > 0 ? 1 : 0) + (counts[c] > 0 ? 1 : 0);
    const isStrength = present === 3;
    const isWeakness = present === 0;
    planes[def.key] = {
      line: def.line,
      count,
      present,
      strength: isStrength,
      weakness: isWeakness,
      label: def.label,
      complete: isStrength,
    };
    if (isStrength) strengths.push(def.key);
    if (isWeakness) weaknesses.push(def.key);
  }

  const interpretation = Array.from({ length: 9 }, (_, i) => {
    const n = i + 1;
    const c = counts[n];
    const strength: LoShuStrength =
      c === 0 ? "missing" : c === 1 ? "weak" : c === 2 ? "balanced" : "strong";
    const notePrefix =
      strength === "missing"  ? "Karmic gap — cultivate consciously. " :
      strength === "strong"   ? "Amplified vibration — channel wisely. " :
      strength === "balanced" ? "Balanced expression. " :
                                "Present but subtle. ";
    return { number: n, strength, note: notePrefix + NOTES[n] };
  });

  return { counts, driver, conductor, missing, strong, planes, arrows: { strengths, weaknesses }, interpretation };
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
