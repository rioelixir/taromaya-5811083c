// Numerology engines: Pythagorean, Chaldean, and Mobile Number system.

const PYTHAGOREAN: Record<string, number> = {
  A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,
  J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,
  S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8,
};
const CHALDEAN: Record<string, number> = {
  A:1,B:2,C:3,D:4,E:5,F:8,G:3,H:5,I:1,
  J:1,K:2,L:3,M:4,N:5,O:7,P:8,Q:1,R:2,
  S:3,T:4,U:6,V:6,W:6,X:5,Y:1,Z:7,
};
const VOWELS = new Set("AEIOU");

const MASTER = new Set([11, 22, 33]);
const KARMIC = new Set([13, 14, 16, 19]);

function letters(name: string) {
  return name.toUpperCase().replace(/[^A-Z]/g, "").split("");
}
function sum(a: number[]) { return a.reduce((s, x) => s + x, 0); }

export function reduce(n: number, keepMaster = true): number {
  let x = n;
  while (x > 9) {
    if (keepMaster && MASTER.has(x)) return x;
    x = String(x).split("").reduce((s, d) => s + Number(d), 0);
  }
  return x;
}

function nameValue(name: string, map: Record<string, number>, filter?: (l: string) => boolean): number {
  const ls = letters(name).filter((l) => (filter ? filter(l) : true));
  return sum(ls.map((l) => map[l] ?? 0));
}

export type NumerologyInput = {
  fullName: string;    // used name / birth name
  birthDate: string;   // yyyy-mm-dd
};

export type NumerologyReport = {
  system: "Pythagorean" | "Chaldean";
  lifePath: number;
  destiny: number;   // expression
  soulUrge: number;
  personality: number;
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
  6: "Venus", 7: "Ketu", 8: "Saturn", 9: "Mars", 11: "Moon", 22: "Master builder", 33: "Master teacher",
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

export function computeNumerology(
  { fullName, birthDate }: NumerologyInput,
  system: "Pythagorean" | "Chaldean" = "Pythagorean",
): NumerologyReport {
  const map = system === "Chaldean" ? CHALDEAN : PYTHAGOREAN;
  const [y, m, d] = birthDate.split("-").map(Number);
  const now = new Date();

  const digitsSum = (n: number) => String(n).split("").reduce((s, c) => s + Number(c), 0);

  const lifePathRaw = digitsSum(y) + digitsSum(m) + digitsSum(d);
  const lifePath = reduce(lifePathRaw);
  const destiny = reduce(nameValue(fullName, map));
  const soulUrge = reduce(nameValue(fullName, map, (l) => VOWELS.has(l)));
  const personality = reduce(nameValue(fullName, map, (l) => !VOWELS.has(l)));
  const birthday = reduce(d);
  const maturity = reduce(lifePath + destiny);

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  const personalYear = reduce(reduce(digitsSum(m) + digitsSum(d) + digitsSum(currentYear), false));
  const personalMonth = reduce(personalYear + currentMonth);
  const personalDay = reduce(personalMonth + currentDay);

  // Pinnacles & Challenges
  const rm = reduce(m, false), rd = reduce(d, false), ry = reduce(y, false);
  const pinnacles = [reduce(rm + rd), reduce(rd + ry), reduce(reduce(rm + rd) + reduce(rd + ry)), reduce(rm + ry)];
  const challenges = [
    reduce(Math.abs(rm - rd), false),
    reduce(Math.abs(rd - ry), false),
    reduce(Math.abs(reduce(Math.abs(rm - rd), false) - reduce(Math.abs(rd - ry), false)), false),
    reduce(Math.abs(rm - ry), false),
  ];

  const karmicDebts: number[] = [];
  const checkKarmic = (n: number) => { if (KARMIC.has(n)) karmicDebts.push(n); };
  checkKarmic(lifePathRaw); checkKarmic(nameValue(fullName, map));
  const masterNumbers: number[] = [];
  [lifePath, destiny, soulUrge, personality, maturity].forEach((n) => {
    if (MASTER.has(n)) masterNumbers.push(n);
  });

  const luckyNumbers = uniq([lifePath, birthday, destiny, reduce(lifePath + destiny)]);
  const luckyColors = NUMBER_TO_COLORS[lifePath] ?? [];
  const luckyDays = NUMBER_TO_DAYS[lifePath] ?? [];
  const compatibleNumbers = NUMBER_TO_COMPAT[lifePath] ?? [];
  const planetRuler = NUMBER_TO_PLANET[lifePath] ?? "—";

  return {
    system,
    lifePath, destiny, soulUrge, personality, birthday, maturity,
    personalYear, personalMonth, personalDay,
    karmicDebts, masterNumbers,
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
  const digits = number.replace(/[^0-9]/g, "").split("").map(Number);
  const total = sum(digits);
  const reduced = reduce(total);
  const digitFrequency: Record<string, number> = {};
  digits.forEach((d) => { digitFrequency[d] = (digitFrequency[d] ?? 0) + 1; });
  const goodBase = [1, 3, 5, 6, 9];
  return {
    raw: number,
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
