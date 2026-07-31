// Numerology engines: Pythagorean, Chaldean, and Mobile Number system.
//
// Methodology (documented + deterministic):
//   * Only Arabic numerals are used anywhere (1..9, plus master numbers 11/22/33).
//   * Life Path: reduce birth-month, birth-day, and birth-year SEPARATELY,
//     preserving master numbers (11/22/33) at each step, then sum and reduce
//     the total, again preserving masters. This is the canonical / most widely
//     taught method and matches reference cases below.
//   * Expression / Destiny: full-name letter sum, reduced with masters preserved.
//   * Soul Urge: vowels only. Personality: consonants only.
//   * Personal Year: reduce(birthMonth) + reduce(birthDay) + reduce(currentYear),
//     then reduce (masters preserved).
//   * Pinnacles / Challenges: standard Pythagorean method.
//
// Reference tests live in `src/lib/numerology.test.ts` — do not change the
// formulas without updating those cases first.

const PYTHAGOREAN: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
};
const CHALDEAN: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 8, G: 3, H: 5, I: 1,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 7, P: 8, Q: 1, R: 2,
  S: 3, T: 4, U: 6, V: 6, W: 6, X: 5, Y: 1, Z: 7,
};
const VOWELS = new Set("AEIOU");

const MASTER = new Set([11, 22, 33]);
const KARMIC = new Set([13, 14, 16, 19]);

function letters(name: string): string[] {
  // Strip diacritics safely (NFD → drop combining marks), then keep A-Z only.
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toUpperCase().replace(/[^A-Z]/g, "").split("");
}
function sum(a: number[]): number { return a.reduce((s, x) => s + x, 0); }
function digitsSum(n: number): number {
  let x = Math.abs(Math.trunc(n));
  let s = 0;
  while (x > 0) { s += x % 10; x = Math.floor(x / 10); }
  return s;
}

/**
 * Reduce a non-negative integer to a single digit, optionally preserving
 * master numbers (11, 22, 33) whenever they appear during reduction.
 */
export function reduce(n: number, keepMaster = true): number {
  let x = Math.abs(Math.trunc(n));
  while (x > 9) {
    if (keepMaster && MASTER.has(x)) return x;
    x = digitsSum(x);
  }
  return x;
}

function nameValue(name: string, map: Record<string, number>, filter?: (l: string) => boolean): number {
  const ls = letters(name).filter((l) => (filter ? filter(l) : true));
  return sum(ls.map((l) => map[l] ?? 0));
}

/** Reduced letter-value of a name, master-preserving. */
export function reducedName(name: string, system: "Pythagorean" | "Chaldean" = "Pythagorean", filter?: (l: string) => boolean): number {
  const map = system === "Chaldean" ? CHALDEAN : PYTHAGOREAN;
  return reduce(nameValue(name, map, filter));
}

export type NumerologyInput = {
  fullName: string;    // used name / birth name
  birthDate: string;   // yyyy-mm-dd
  /** Optional "today" override — makes personal year/month/day deterministic. */
  now?: Date;
};

export type NumerologyReport = {
  system: "Pythagorean" | "Chaldean";
  lifePath: number;
  destiny: number;   // expression
  destinyCompound: number;  // pre-reduction total (meaningful in Chaldean)
  soulUrge: number;
  soulUrgeCompound: number;
  personality: number;
  personalityCompound: number;
  birthday: number;
  maturity: number;
  personalYear: number;
  personalMonth: number;
  personalDay: number;
  karmicDebts: number[];
  masterNumbers: number[];
  pinnacles: number[];
  challenges: number[];
  luckyNumbers: number[];
  luckyColors: string[];
  luckyDays: string[];
  compatibleNumbers: number[];
  planetRuler: string;
};


const NUMBER_TO_PLANET: Record<number, string> = {
  1: "Sun", 2: "Moon", 3: "Jupiter", 4: "Rahu", 5: "Mercury",
  6: "Venus", 7: "Ketu", 8: "Saturn", 9: "Mars",
  11: "Moon", 22: "Master builder", 33: "Master teacher",
};
const NUMBER_TO_COLORS: Record<number, string[]> = {
  1: ["Gold", "Orange", "Yellow"],
  2: ["White", "Silver", "Pale Green"],
  3: ["Yellow", "Violet", "Purple"],
  4: ["Grey", "Electric Blue", "Sky Blue"],
  5: ["Green", "Ash", "Silver"],
  6: ["Pink", "Rose", "Cream"],
  7: ["Sea Green", "Turquoise", "Iridescent"],
  8: ["Deep Blue", "Black", "Indigo"],
  9: ["Red", "Crimson", "Blood Red"],
  11: ["Silver", "White", "Pearl"],
  22: ["Coral", "Gold", "Emerald"],
  33: ["Pink", "Gold", "Rose"],
};
const NUMBER_TO_DAYS: Record<number, string[]> = {
  1: ["Sunday", "Monday"], 2: ["Monday", "Friday"], 3: ["Thursday"],
  4: ["Saturday", "Sunday"], 5: ["Wednesday", "Friday"], 6: ["Friday", "Wednesday"],
  7: ["Sunday", "Monday"], 8: ["Saturday"], 9: ["Tuesday"],
  11: ["Monday"], 22: ["Saturday"], 33: ["Friday"],
};
const NUMBER_TO_COMPAT: Record<number, number[]> = {
  1: [1, 5, 7, 3], 2: [2, 6, 9, 7], 3: [3, 6, 9, 1],
  4: [1, 5, 7, 8], 5: [1, 5, 6, 7], 6: [3, 6, 9, 2],
  7: [1, 4, 5, 7], 8: [4, 5, 6, 8], 9: [2, 3, 6, 9],
  11: [2, 6, 22], 22: [4, 8, 22], 33: [6, 9, 33],
};

/** Parse `yyyy-mm-dd`, rejecting impossible/future/pre-1600 dates. */
export function parseBirthDate(input: string): { y: number; m: number; d: number } | null {
  if (typeof input !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  if (y < 1600 || y > 2999) return null;
  if (m < 1 || m > 12) return null;
  if (d < 1 || d > 31) return null;
  // Round-trip check: rejects Feb 30, Apr 31, etc.
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  // Reject future dates.
  if (dt.getTime() > Date.now()) return null;
  return { y, m, d };
}

/** Canonical Life Path calculation, master-preserving. */
export function lifePathNumber(birthDate: string): number {
  const parsed = parseBirthDate(birthDate);
  if (!parsed) return 0;
  const rm = reduce(parsed.m, true);
  const rd = reduce(parsed.d, true);
  const ry = reduce(digitsSum(parsed.y), true);
  return reduce(rm + rd + ry, true);
}

export function computeNumerology(
  { fullName, birthDate, now: nowInput }: NumerologyInput,
  system: "Pythagorean" | "Chaldean" = "Pythagorean",
): NumerologyReport {
  const map = system === "Chaldean" ? CHALDEAN : PYTHAGOREAN;
  const parsed = parseBirthDate(birthDate);
  const y = parsed?.y ?? 0;
  const m = parsed?.m ?? 0;
  const d = parsed?.d ?? 0;

  // Master-preserving component reductions.
  const rm = reduce(m, true);
  const rd = reduce(d, true);
  const ry = reduce(digitsSum(y), true);

  const lifePath = parsed ? reduce(rm + rd + ry, true) : 0;

  const destinyRaw = nameValue(fullName, map);
  const destiny = reduce(destinyRaw, true);
  const soulUrgeRaw = nameValue(fullName, map, (l) => VOWELS.has(l));
  const soulUrge = reduce(soulUrgeRaw, true);
  const personalityRaw = nameValue(fullName, map, (l) => !VOWELS.has(l));
  const personality = reduce(personalityRaw, true);
  const birthday = reduce(d, true);
  const maturity = reduce(lifePath + destiny, true);

  // Master-free component reductions (used by cycles, pinnacles, challenges).
  const rmNoMaster = reduce(m, false);
  const rdNoMaster = reduce(d, false);
  const ryNoMaster = reduce(digitsSum(y), false);

  // Personal cycles. Standard practice reduces these to 1..9 (no masters), so
  // the same birth date + same day always yields the same, non-contradictory
  // trio. `now` can be supplied to make the result fully deterministic.
  const now = nowInput ?? new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  const currentYearReduced = reduce(digitsSum(currentYear), false);
  const personalYear = parsed
    ? reduce(rmNoMaster + rdNoMaster + currentYearReduced, false)
    : 0;
  const personalMonth = parsed ? reduce(personalYear + currentMonth, false) : 0;
  const personalDay = parsed ? reduce(personalMonth + currentDay, false) : 0;

  // Pinnacles & Challenges — standard Pythagorean method.
  // Pinnacles: (M+D), (D+Y), (P1+P2), (M+Y). Challenges: absolute differences.
  const p1 = reduce(rmNoMaster + rdNoMaster, true);
  const p2 = reduce(rdNoMaster + ryNoMaster, true);
  const p3 = reduce(reduce(p1, false) + reduce(p2, false), true);
  const p4 = reduce(rmNoMaster + ryNoMaster, true);
  const pinnacles = parsed ? [p1, p2, p3, p4] : [0, 0, 0, 0];

  const c1 = reduce(Math.abs(rmNoMaster - rdNoMaster), false);
  const c2 = reduce(Math.abs(rdNoMaster - ryNoMaster), false);
  const c3 = reduce(Math.abs(c1 - c2), false);
  const c4 = reduce(Math.abs(rmNoMaster - ryNoMaster), false);
  const challenges = parsed ? [c1, c2, c3, c4] : [0, 0, 0, 0];

  // Karmic debts: 13/14/16/19 appearing as the pre-reduction total of a core
  // number, or as the day of birth itself.
  const karmicDebts: number[] = [];
  const lifePathPreReduce = parsed ? rmNoMaster + rdNoMaster + ryNoMaster : 0;
  if (parsed && KARMIC.has(lifePathPreReduce)) karmicDebts.push(lifePathPreReduce);
  if (KARMIC.has(destinyRaw)) karmicDebts.push(destinyRaw);
  if (KARMIC.has(soulUrgeRaw)) karmicDebts.push(soulUrgeRaw);
  if (KARMIC.has(personalityRaw)) karmicDebts.push(personalityRaw);
  if (parsed && KARMIC.has(d)) karmicDebts.push(d);



  const masterNumbers = [lifePath, destiny, soulUrge, personality, maturity]
    .filter((n) => MASTER.has(n));

  const luckyNumbers = uniq([lifePath, birthday, destiny, reduce(lifePath + destiny, true)]).filter(Boolean);
  const luckyColors = NUMBER_TO_COLORS[lifePath] ?? [];
  const luckyDays = NUMBER_TO_DAYS[lifePath] ?? [];
  const compatibleNumbers = NUMBER_TO_COMPAT[lifePath] ?? [];
  const planetRuler = NUMBER_TO_PLANET[lifePath] ?? "—";

  return {
    system,
    lifePath, destiny, destinyCompound: destinyRaw,
    soulUrge, soulUrgeCompound: soulUrgeRaw,
    personality, personalityCompound: personalityRaw,
    birthday, maturity,
    personalYear, personalMonth, personalDay,
    karmicDebts: uniq(karmicDebts),
    masterNumbers: uniq(masterNumbers),
    pinnacles, challenges,
    luckyNumbers, luckyColors, luckyDays, compatibleNumbers, planetRuler,
  };
}

function uniq<T>(a: T[]): T[] { return Array.from(new Set(a)); }

// Mobile Number analysis (digit sum reduced)
export type MobileAnalysis = {
  raw: string;
  total: number;
  reduced: number;
  planetRuler: string;
  favorable: boolean;
  digitFrequency: Record<string, number>;
  advice: string;
};
export function analyzeMobile(number: string): MobileAnalysis {
  const digits = String(number ?? "").replace(/[^0-9]/g, "").split("").map(Number);
  const total = sum(digits);
  const reduced = digits.length ? reduce(total, true) : 0;
  const digitFrequency: Record<string, number> = {};
  digits.forEach((dg) => { digitFrequency[dg] = (digitFrequency[dg] ?? 0) + 1; });
  const goodBase = [1, 3, 5, 6, 9];
  return {
    raw: String(number ?? ""),
    total,
    reduced,
    planetRuler: NUMBER_TO_PLANET[reduced] ?? "—",
    favorable: goodBase.includes(reduced),
    digitFrequency,
    advice: goodBase.includes(reduced)
      ? `A ${reduced}-vibration number amplifies opportunity, communication and clarity.`
      : `A ${reduced}-vibration number carries lessons of discipline. Balance with a supportive number in your circle.`,
  };
}

// Compatibility between two life-path or destiny numbers
export function numerologyCompatibility(a: number, b: number): { score: number; note: string } {
  const compatSet = new Set(NUMBER_TO_COMPAT[a] ?? []);
  const score = compatSet.has(b) ? 90 : compatSet.size > 0 ? 55 : 40;
  return {
    score,
    note: compatSet.has(b)
      ? `Numbers ${a} and ${b} share resonant vibrations — a supportive connection.`
      : `Numbers ${a} and ${b} require conscious effort to harmonise their currents.`,
  };
}

export const NUMBER_MEANINGS: Record<number, string> = {
  1: "Leader. Independent, pioneering, original.",
  2: "Peacemaker. Sensitive, cooperative, intuitive.",
  3: "Artist. Expressive, joyful, communicative.",
  4: "Builder. Grounded, disciplined, structural.",
  5: "Traveller. Free-spirited, curious, adaptable.",
  6: "Nurturer. Responsible, loving, service-oriented.",
  7: "Mystic. Analytical, introspective, spiritual.",
  8: "Executive. Ambitious, powerful, karmic-financial.",
  9: "Humanitarian. Compassionate, wise, closing cycles.",
  11: "Master Illuminator. Visionary insight and inspiration.",
  22: "Master Builder. Practical realisation of grand vision.",
  33: "Master Teacher. Compassionate elevation of others.",
};
