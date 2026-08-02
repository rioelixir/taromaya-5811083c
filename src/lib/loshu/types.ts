/** Shared types for the Lo Shu Grid module. Pure data — no React, no Supabase. */

export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export const DIGITS: readonly Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Classic Lo Shu magic square layout, top row first. */
export const GRID_LAYOUT: readonly (readonly Digit[])[] = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
];

export type Counts = Record<Digit, number>;

export type LoShuInput = {
  fullName: string;
  /** ISO date, YYYY-MM-DD. */
  birthDate: string;
  gender?: string;
  notes?: string;
};

export type ZoneKey = "mental" | "emotional" | "physical" | "practical" | "spiritual" | "action";

export type Zone = {
  key: ZoneKey;
  label: string;
  cells: readonly Digit[];
  /** 0 to 100. */
  percent: number;
  presentCells: number;
  occurrences: number;
  interpretation: string;
};

export type ArrowStatus = "formed" | "not-formed";

export type ArrowPolarity = "strength" | "caution";

export type ArrowResult = {
  key: string;
  name: string;
  line: readonly Digit[];
  polarity: ArrowPolarity;
  status: ArrowStatus;
  meaning: string;
  strengths: string;
  weaknesses: string;
  career: string;
  relationships: string;
  money: string;
  health: string;
  advice: string;
};

export type RepeatBand = "single" | "double" | "triple" | "many";

export type RepeatResult = {
  digit: Digit;
  count: number;
  band: RepeatBand;
  /** 0 to 100 meter value. */
  intensity: number;
  label: string;
  reading: string;
};

export type LoShuAnalysis = {
  input: LoShuInput;
  /** Digits used, zeros already removed. */
  digitsUsed: number[];
  digitString: string;
  counts: Counts;
  birthNumber: Digit;
  lifePathNumber: Digit;
  missing: Digit[];
  repeated: Digit[];
  totalDigits: number;
  strongest: Digit;
  weakest: Digit;
  energyScore: number;
  zones: Zone[];
  arrows: ArrowResult[];
  repeats: RepeatResult[];
};
