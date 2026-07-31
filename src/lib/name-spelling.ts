// Name Spelling Checker, Missing Alphabets, Deeper Name Meaning,
// and Mobile ↔ Date-of-Birth frequency match utilities.

import { computeNumerology, reduce, analyzeMobile } from "@/lib/numerology";

const PYTH: Record<string, number> = {
  A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,
  J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,
  S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8,
};

export const DIGIT_TO_LETTERS: Record<number, string[]> = {
  1: ["A","J","S"],
  2: ["B","K","T"],
  3: ["C","L","U"],
  4: ["D","M","V"],
  5: ["E","N","W"],
  6: ["F","O","X"],
  7: ["G","P","Y"],
  8: ["H","Q","Z"],
  9: ["I","R"],
};

const VOWELS = new Set("AEIOU");

export type SpellingCheck = {
  input: string;
  cleaned: string;
  letterValues: Array<{ letter: string; value: number; vowel: boolean }>;
  destiny: number;
  soulUrge: number;
  personality: number;
  vowelSum: number;
  consonantSum: number;
  totalRaw: number;
  balancedVowels: boolean;
  compoundConsonantRuns: string[];   // 3+ consonants in a row
  doubledLetters: string[];          // e.g. "LL", "NN"
  suggestions: string[];             // human-readable spelling tips
};

/**
 * Detailed spelling report for a single name.
 */
export function spellingCheck(fullName: string): SpellingCheck {
  const cleaned = fullName.trim().replace(/\s+/g, " ");
  const compact = cleaned.toUpperCase().replace(/[^A-Z]/g, "");
  const letterValues = compact.split("").map((l) => ({
    letter: l,
    value: PYTH[l] ?? 0,
    vowel: VOWELS.has(l),
  }));
  const vowelSum = letterValues.filter((x) => x.vowel).reduce((s, x) => s + x.value, 0);
  const consonantSum = letterValues.filter((x) => !x.vowel).reduce((s, x) => s + x.value, 0);
  const totalRaw = vowelSum + consonantSum;

  const destiny = reduce(totalRaw);
  const soulUrge = reduce(vowelSum);
  const personality = reduce(consonantSum);

  // Balanced vowels: ratio between 0.30 and 0.50 of letters
  const vowelCount = letterValues.filter((x) => x.vowel).length;
  const ratio = compact.length ? vowelCount / compact.length : 0;
  const balancedVowels = ratio >= 0.3 && ratio <= 0.5;

  // Compound consonant runs (3+ consonants)
  const compoundConsonantRuns: string[] = [];
  let run = "";
  for (const l of compact) {
    if (!VOWELS.has(l)) {
      run += l;
    } else {
      if (run.length >= 3) compoundConsonantRuns.push(run);
      run = "";
    }
  }
  if (run.length >= 3) compoundConsonantRuns.push(run);

  // Doubled letters
  const doubledLetters: string[] = [];
  for (let i = 0; i < compact.length - 1; i++) {
    if (compact[i] === compact[i + 1]) doubledLetters.push(compact[i] + compact[i + 1]);
  }

  const suggestions: string[] = [];
  if (!balancedVowels) {
    suggestions.push(
      ratio < 0.3
        ? "Your name is consonant-heavy — energy feels dense; consider adding a soft vowel (A, I, or E) if you use a nickname."
        : "Your name is vowel-heavy — energy feels light and drifting; a firm consonant anchor stabilises it.",
    );
  }
  if (compoundConsonantRuns.length) {
    suggestions.push(
      `Consonant clusters (${compoundConsonantRuns.join(", ")}) can create friction in speech and vibration.`,
    );
  }
  if (doubledLetters.length) {
    suggestions.push(
      `Doubled letters (${doubledLetters.join(", ")}) amplify that number's vibration — powerful, but must be handled with awareness.`,
    );
  }
  if (!suggestions.length) suggestions.push("Spelling is phonetically and numerically balanced.");

  return {
    input: fullName,
    cleaned,
    letterValues,
    destiny,
    soulUrge,
    personality,
    vowelSum,
    consonantSum,
    totalRaw,
    balancedVowels,
    compoundConsonantRuns,
    doubledLetters,
    suggestions,
  };
}

/**
 * Deeper meaning per letter — occult / numerological archetype.
 */
export const LETTER_MEANING: Record<string, string> = {
  A: "Leader, initiator, courageous — the pioneer's spark (1).",
  B: "Sensitive, cooperative, nurturing — the peacemaker (2).",
  C: "Expressive, joyful, creative — the artist's voice (3).",
  D: "Grounded, disciplined, builder — the foundation-layer (4).",
  E: "Freedom-loving, curious, communicative — the traveller (5).",
  F: "Loving, responsible, home-oriented — the guardian (6).",
  G: "Introspective, spiritual, seeker — the mystic (7).",
  H: "Ambitious, executive, karmic — the wealth-carrier (8).",
  I: "Compassionate, humanitarian, wise — the closer of cycles (9).",
  J: "Just, principled, service-minded — the wise leader (1).",
  K: "Illuminator, intuitive, master vibration — visionary (11 / 2).",
  L: "Expressive, magnetic, uplifting — the muse (3).",
  M: "Master-builder, tireless, structural — the manifester (4 / 22).",
  N: "Original, adventurous, restless — the seeker (5).",
  O: "Devoted, faithful, moral — the caretaker (6).",
  P: "Analytical, philosophical, private — the thinker (7).",
  Q: "Magnetic, mysterious, powerful — the enigma (8).",
  R: "Compassionate leader, tolerant — the humanitarian (9).",
  S: "Charismatic, dramatic, emotional — the star (1).",
  T: "Cooperative, faithful, artistic — the partner (2).",
  U: "Creative, generous, sometimes indecisive — the vessel (3).",
  V: "Master-manifestor, intuitive — the great architect (4 / 22).",
  W: "Adventurous, communicative, impulsive — the wanderer (5).",
  X: "Sensual, unpredictable, transformative — the alchemist (6).",
  Y: "Independent, mystical, decisive — the seer (7).",
  Z: "Confident, wise, prosperous — the sage (8).",
};

export type NameDeepMeaning = {
  cornerstone: { letter: string; meaning: string };  // first letter of first name
  capstone:    { letter: string; meaning: string };  // last letter of first name
  firstVowel:  { letter: string; meaning: string } | null;
  letterBreakdown: Array<{ letter: string; meaning: string; value: number }>;
};
export function nameDeepMeaning(fullName: string): NameDeepMeaning | null {
  const first = fullName.trim().split(/\s+/)[0]?.toUpperCase().replace(/[^A-Z]/g, "");
  if (!first) return null;
  const cornerstone = { letter: first[0], meaning: LETTER_MEANING[first[0]] ?? "" };
  const capstone    = { letter: first[first.length - 1], meaning: LETTER_MEANING[first[first.length - 1]] ?? "" };
  const fv = first.split("").find((l) => VOWELS.has(l));
  const firstVowel = fv ? { letter: fv, meaning: LETTER_MEANING[fv] ?? "" } : null;
  const compact = fullName.toUpperCase().replace(/[^A-Z]/g, "");
  const seen = new Set<string>();
  const letterBreakdown = compact.split("").filter((l) => (seen.has(l) ? false : (seen.add(l), true)))
    .map((l) => ({ letter: l, meaning: LETTER_MEANING[l] ?? "", value: PYTH[l] ?? 0 }));
  return { cornerstone, capstone, firstVowel, letterBreakdown };
}

/**
 * Which alphabets are MISSING from the user's name — grouped by numerology digit.
 */
export type MissingAlphabets = {
  missingDigits: number[];
  missingByDigit: Record<number, string[]>;
  presentLetters: string[];
  absentLetters: string[];
  guidance: string;
};
export function missingAlphabets(fullName: string): MissingAlphabets {
  const compact = fullName.toUpperCase().replace(/[^A-Z]/g, "");
  const presentLetters = Array.from(new Set(compact.split("")));
  const allLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const absentLetters = allLetters.filter((l) => !presentLetters.includes(l));

  const missingByDigit: Record<number, string[]> = {};
  const missingDigits: number[] = [];
  for (let d = 1; d <= 9; d++) {
    const group = DIGIT_TO_LETTERS[d];
    const anyPresent = group.some((l) => presentLetters.includes(l));
    if (!anyPresent) {
      missingDigits.push(d);
      missingByDigit[d] = group;
    }
  }
  const guidance = missingDigits.length
    ? `Your name lacks the vibrations of ${missingDigits.join(", ")}. These are your soul lessons — to develop qualities of ${missingDigits.map((d) => LETTER_ARCHETYPE[d]).join(", ")}. Consider consciously cultivating these traits or, if desired, refining your spelling to include a letter from the missing groups.`
    : "Every numerological vibration is present in your name — a rare, complete signature.";
  return { missingDigits, missingByDigit, presentLetters, absentLetters, guidance };
}

const LETTER_ARCHETYPE: Record<number, string> = {
  1: "leadership",
  2: "cooperation",
  3: "expression",
  4: "structure",
  5: "freedom",
  6: "responsibility",
  7: "introspection",
  8: "authority",
  9: "compassion",
};

/**
 * Generate simple, respectful spelling variants and score them
 * against a desired target vibration (e.g. the user's Life Path).
 */
export type SpellingVariant = {
  spelling: string;
  destiny: number;
  soulUrge: number;
  personality: number;
  matchesTarget: boolean;
  delta: string;
};
export function spellingVariants(
  fullName: string,
  birthDate: string,
  targetVibration: number,
): SpellingVariant[] {
  const original = fullName.trim();
  if (!original) return [];
  const variants = new Set<string>([original]);

  // Simple, culturally-neutral transformations on the first (given) name.
  const parts = original.split(/\s+/);
  const first = parts[0];
  const rest = parts.slice(1).join(" ");
  const push = (v: string) => v && variants.add((v + (rest ? " " + rest : "")).trim());

  const upper = first.toUpperCase();
  // 1. Drop trailing "H" / "A"
  if (upper.endsWith("H")) push(first.slice(0, -1));
  if (upper.endsWith("A")) push(first.slice(0, -1));
  // 2. Add trailing "A" / "H"
  push(first + "a");
  push(first + "h");
  // 3. Swap Y ↔ I  (case-preserving simple swap)
  push(first.replace(/y/gi, (m) => (m === "y" ? "i" : "I")));
  push(first.replace(/i/gi, (m) => (m === "i" ? "y" : "Y")));
  // 4. Double first vowel
  const m = first.match(/[aeiouAEIOU]/);
  if (m && m.index !== undefined) {
    push(first.slice(0, m.index + 1) + m[0] + first.slice(m.index + 1));
  }
  // 5. Add "aa" ending (common Sanskrit lengthening)
  if (!upper.endsWith("AA")) push(first + "a");
  // 6. Remove doubled letters
  push(first.replace(/(.)\1+/g, "$1"));

  const scored: SpellingVariant[] = [];
  for (const v of variants) {
    if (!v) continue;
    try {
      const r = computeNumerology({ fullName: v, birthDate }, "Pythagorean");
      scored.push({
        spelling: v,
        destiny: r.destiny,
        soulUrge: r.soulUrge,
        personality: r.personality,
        matchesTarget: r.destiny === targetVibration,
        delta: r.destiny === targetVibration ? "✓ resonates" : `${r.destiny} vs target ${targetVibration}`,
      });
    } catch { /* ignore */ }
  }
  // Sort: matches first, then by shortest delta.
  scored.sort((a, b) => {
    if (a.matchesTarget !== b.matchesTarget) return a.matchesTarget ? -1 : 1;
    return Math.abs(a.destiny - targetVibration) - Math.abs(b.destiny - targetVibration);
  });
  return scored.slice(0, 8);
}

/**
 * Deep frequency match between a mobile number and a date of birth.
 * Returns a score 0-100 plus supporting facts.
 */
export type MobileDobMatch = {
  mobile: string;
  reducedMobile: number;
  totalMobile: number;
  reducedDob: number;
  driverDob: number;
  conductorDob: number;
  planetMobile: string;
  planetDob: string;
  digitOverlap: number;         // digits shared between mobile & DOB
  overlapDigits: string[];
  matchesLifePath: boolean;
  matchesDriver: boolean;
  matchesConductor: boolean;
  compatible: boolean;
  score: number;                // 0..100
  verdict: string;
  advice: string;
};

const NUMBER_TO_PLANET: Record<number, string> = {
  1: "Sun", 2: "Moon", 3: "Jupiter", 4: "Rahu", 5: "Mercury",
  6: "Venus", 7: "Ketu", 8: "Saturn", 9: "Mars",
};
const COMPAT: Record<number, number[]> = {
  1: [1, 2, 3, 5, 6, 9],
  2: [1, 2, 3, 5, 7],
  3: [1, 3, 5, 6, 9],
  4: [1, 5, 6, 7, 8],
  5: [1, 2, 3, 4, 5, 6, 7, 9],
  6: [1, 3, 4, 5, 6, 8, 9],
  7: [2, 4, 5, 7, 9],
  8: [4, 5, 6, 8],
  9: [1, 2, 3, 5, 6, 7, 9],
};

const dsum = (n: number) => String(n).split("").reduce((s, c) => s + Number(c), 0);

export function mobileDobMatch(mobile: string, birthDate: string): MobileDobMatch | null {
  const digits = mobile.replace(/\D/g, "");
  if (!digits || !birthDate) return null;
  const { total, reduced } = analyzeMobile(digits);
  const [y, m, d] = birthDate.split("-").map(Number);
  // Vedic driver/conductor reduce fully to 1-9; master numbers do not apply.
  const driverDob = reduce(d, false);
  const conductorDob = reduce(dsum(y) + dsum(m) + dsum(d), false);
  const reducedDob = conductorDob;

  const mobileDigitSet = new Set(digits.split(""));
  const dobDigits = `${y}${m.toString().padStart(2,"0")}${d.toString().padStart(2,"0")}`.split("");
  const overlapDigits = Array.from(new Set(dobDigits.filter((x) => mobileDigitSet.has(x))));
  const digitOverlap = overlapDigits.length;

  const matchesLifePath = reduced === conductorDob;
  const matchesDriver = reduced === driverDob;
  const compatible = (COMPAT[reduced] ?? []).includes(conductorDob);
  const matchesConductor = matchesLifePath;

  // Score: base compatibility + exact matches + digit overlap.
  let score = 0;
  if (matchesLifePath) score += 45;
  else if (matchesDriver) score += 35;
  else if (compatible) score += 25;
  score += Math.min(30, digitOverlap * 5);        // up to 30
  score += Math.min(20, dobDigits.filter((x) => mobileDigitSet.has(x)).length * 2); // up to 20
  score = Math.max(0, Math.min(100, score));

  const verdict =
    score >= 80 ? "Highly resonant — this number amplifies your birth blueprint."
    : score >= 60 ? "Supportive — a favourable everyday number."
    : score >= 40 ? "Neutral — neither friend nor foe, works with intention."
    : "Discordant — this number pulls against your natal frequency.";

  const advice = matchesLifePath
    ? `Mobile reduces to ${reduced} (${NUMBER_TO_PLANET[reduced] ?? "—"}), matching your Life Path ${conductorDob}. Keep this number close.`
    : compatible
    ? `Mobile (${reduced}, ${NUMBER_TO_PLANET[reduced] ?? "—"}) is compatible with your Life Path ${conductorDob}. A helpful current.`
    : `Mobile (${reduced}, ${NUMBER_TO_PLANET[reduced] ?? "—"}) is not naturally aligned with your Life Path ${conductorDob} (${NUMBER_TO_PLANET[conductorDob] ?? "—"}). Consider a number that reduces to one of: ${(COMPAT[conductorDob] ?? []).join(", ")}.`;

  return {
    mobile: digits,
    reducedMobile: reduced,
    totalMobile: total,
    reducedDob,
    driverDob,
    conductorDob,
    planetMobile: NUMBER_TO_PLANET[reduced] ?? "—",
    planetDob: NUMBER_TO_PLANET[conductorDob] ?? "—",
    digitOverlap,
    overlapDigits,
    matchesLifePath,
    matchesDriver,
    matchesConductor,
    compatible,
    score,
    verdict,
    advice,
  };
}
