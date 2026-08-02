import { ARROW_DEFS } from "./arrows";
import { REPEAT_BANDS } from "./numbers";
import {
  DIGITS,
  type ArrowResult,
  type Counts,
  type Digit,
  type LoShuAnalysis,
  type LoShuInput,
  type RepeatBand,
  type RepeatResult,
  type Zone,
  type ZoneKey,
} from "./types";

/** Reduce any positive integer to a single digit 1..9. */
export function reduceToDigit(n: number): Digit {
  let v = Math.abs(Math.trunc(n));
  while (v > 9) {
    v = String(v)
      .split("")
      .reduce((sum, d) => sum + Number(d), 0);
  }
  return (v === 0 ? 9 : v) as Digit;
}

/** Validates an ISO date string and rejects impossible or future dates. */
export function parseBirthDate(iso: string): { year: number; month: number; day: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) throw new Error("Date of birth must be in the format YYYY-MM-DD.");
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    throw new Error("That date does not exist on the calendar.");
  }
  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  if (d.getTime() > todayUtc) throw new Error("Date of birth cannot be in the future.");
  if (year < 1900) throw new Error("Please use a year from 1900 onwards.");
  return { year, month, day };
}

const ZONE_DEFS: readonly { key: ZoneKey; label: string; cells: readonly Digit[]; note: string }[] = [
  { key: "mental", label: "Mental zone", cells: [4, 9, 2], note: "thinking, memory and judgement" },
  { key: "emotional", label: "Emotional zone", cells: [3, 5, 7], note: "feeling, composure and sensitivity" },
  { key: "physical", label: "Physical zone", cells: [8, 1, 6], note: "stamina, material handling and daily doing" },
  { key: "practical", label: "Practical zone", cells: [4, 3, 8], note: "planning, order and structure" },
  { key: "spiritual", label: "Spiritual zone", cells: [2, 5, 8], note: "reflection, faith and inner steadiness" },
  { key: "action", label: "Action zone", cells: [2, 7, 6], note: "initiative, output and visible activity" },
];

function bandFor(count: number): RepeatBand {
  if (count >= 4) return "many";
  if (count === 3) return "triple";
  if (count === 2) return "double";
  return "single";
}

function zoneInterpretation(label: string, note: string, percent: number, missing: Digit[]): string {
  const gap = missing.length
    ? ` The gap sits at ${missing.length === 1 ? `number ${missing[0]}` : `numbers ${missing.join(" and ")}`}.`
    : " Every cell in this zone is filled.";
  if (percent >= 75) {
    return `${label} is strongly charged, so ${note} lead most of your decisions. The care needed here is moderation rather than development.${gap}`;
  }
  if (percent >= 45) {
    return `${label} is workable and balanced. You can rely on ${note} when you use it consciously, though it is not automatic under pressure.${gap}`;
  }
  if (percent > 0) {
    return `${label} is lightly supported, so ${note} needs deliberate practice and external structure.${gap}`;
  }
  return `${label} is empty in your chart. ${label} qualities must be built as skills through routine and support rather than assumed.${gap}`;
}

/** Core Lo Shu computation. Pure function, safe to call anywhere. */
export function analyseLoShu(input: LoShuInput): LoShuAnalysis {
  const { year, month, day } = parseBirthDate(input.birthDate);

  const digitString = `${String(day).padStart(2, "0")}${String(month).padStart(2, "0")}${year}`;
  const digitsUsed = digitString
    .split("")
    .map(Number)
    .filter((d) => d > 0);

  const counts = DIGITS.reduce((acc, d) => {
    acc[d] = 0;
    return acc;
  }, {} as Counts);
  for (const d of digitsUsed) counts[d as Digit] += 1;

  const birthNumber = reduceToDigit(day);
  const lifePathNumber = reduceToDigit(
    digitString.split("").reduce((s, c) => s + Number(c), 0),
  );

  const missing = DIGITS.filter((d) => counts[d] === 0);
  const present = DIGITS.filter((d) => counts[d] > 0);
  const repeated = DIGITS.filter((d) => counts[d] >= 2);
  const totalDigits = digitsUsed.length;

  const strongest = present.reduce<Digit>(
    (best, d) => (counts[d] > counts[best] ? d : best),
    present[0] ?? birthNumber,
  );
  const weakest = present.reduce<Digit>(
    (worst, d) => (counts[d] < counts[worst] ? d : worst),
    present[0] ?? birthNumber,
  );

  const zones: Zone[] = ZONE_DEFS.map((z) => {
    const presentCells = z.cells.filter((c) => counts[c] > 0).length;
    const occurrences = z.cells.reduce((s, c) => s + counts[c], 0);
    const density = totalDigits ? Math.min(1, occurrences / Math.max(1, totalDigits * 0.5)) : 0;
    const percent = Math.round(((presentCells / 3) * 0.7 + density * 0.3) * 100);
    return {
      key: z.key,
      label: z.label,
      cells: z.cells,
      percent,
      presentCells,
      occurrences,
      interpretation: zoneInterpretation(
        z.label,
        z.note,
        percent,
        z.cells.filter((c) => counts[c] === 0),
      ),
    };
  });

  const arrows: ArrowResult[] = ARROW_DEFS.map((def) => {
    const allPresent = def.line.every((c) => counts[c] > 0);
    const allEmpty = def.line.every((c) => counts[c] === 0);
    const formed = def.polarity === "strength" ? allPresent : allEmpty;
    return {
      key: def.key,
      name: def.name,
      line: def.line,
      polarity: def.polarity,
      status: formed ? "formed" : "not-formed",
      meaning: def.meaning,
      strengths: def.strengths,
      weaknesses: def.weaknesses,
      career: def.career,
      relationships: def.relationships,
      money: def.money,
      health: def.health,
      advice: def.advice,
    };
  });

  const repeats: RepeatResult[] = present.map((d) => {
    const band = bandFor(counts[d]);
    const meta = REPEAT_BANDS[band];
    return {
      digit: d,
      count: counts[d],
      band,
      intensity: meta.intensity,
      label: meta.label,
      reading: meta.reading,
    };
  });

  const coverage = present.length / 9;
  const strengthArrows = arrows.filter((a) => a.polarity === "strength" && a.status === "formed").length;
  const cautionArrows = arrows.filter((a) => a.polarity === "caution" && a.status === "formed").length;
  const spread = totalDigits
    ? 1 - Math.min(1, (counts[strongest] - 1) / Math.max(1, totalDigits))
    : 0;
  const energyScore = Math.max(
    5,
    Math.min(
      100,
      Math.round(coverage * 55 + (strengthArrows / 9) * 22 + spread * 23 - cautionArrows * 3),
    ),
  );

  return {
    input,
    digitsUsed,
    digitString,
    counts,
    birthNumber,
    lifePathNumber,
    missing,
    repeated,
    totalDigits,
    strongest,
    weakest,
    energyScore,
    zones,
    arrows,
    repeats,
  };
}
