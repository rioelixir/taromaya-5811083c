// Nadi astrology layer (Nadi Amsa / Nadi Jyotisha classification).
//
// Nadi Jyotisha classifies a birth by very fine divisions of the zodiac. The
// engine below computes the divisions that can be derived mathematically from a
// birth chart, and stops where the tradition depends on physical palm-leaf
// bundles rather than calculation.
//
// Methodology (deterministic, documented):
//   * Nadi Amsa: each sign of 30 degrees is divided into 150 parts of 12
//     minutes of arc each, so the zodiac holds 1800 nadi amsas. The Moon's
//     sidereal longitude gives the birth nadi amsa; the leaf group of the
//     tradition is indexed from it.
//   * Nadi (Adi, Madhya, Antya) comes from the birth Nakshatra in the standard
//     Ashtakoot order, and is the basis of Nadi Dosha in matching.
//   * Chandra Kala Nadi uses 150 divisions of a sign as well; the Chandra Kala
//     part number is reported so a practitioner can locate the classical verse.
//   * Bhrigu Bindu is the midpoint of Rahu and the Moon, used in Nadi and
//     Bhrigu reading to time events.
//   * Nadi Nakshatra pada and the Ascendant nadi amsa are also given because
//     leaf identification traditionally cross-checks Lagna with the Moon.

import { computeKundli, type KundliInput, type KundliChart, NAKSHATRAS, RASHIS } from "./vedic";

const norm360 = (x: number) => ((x % 360) + 360) % 360;

/** Nadi type from Nakshatra index (0..26): Adi (Vata), Madhya (Pitta), Antya (Kapha). */
const NADI_BY_NAKSHATRA: ("Adi" | "Madhya" | "Antya")[] = [
  "Adi", "Madhya", "Antya", "Antya", "Madhya", "Adi", "Adi", "Madhya", "Antya",
  "Antya", "Madhya", "Adi", "Adi", "Madhya", "Antya", "Antya", "Madhya", "Adi",
  "Adi", "Madhya", "Antya", "Antya", "Madhya", "Adi", "Adi", "Madhya", "Antya",
];

export const NADI_MEANING: Record<string, { dosha: string; body: string; nature: string }> = {
  Adi: {
    dosha: "Vata",
    body: "Air and movement dominate: quick metabolism, dry skin, restless sleep.",
    nature: "Fast thinking, many interests, needs routine and warmth to settle.",
  },
  Madhya: {
    dosha: "Pitta",
    body: "Fire dominates: strong digestion, sharp eyes, tendency to heat and acidity.",
    nature: "Decisive and competitive, needs cooling habits and fair play.",
  },
  Antya: {
    dosha: "Kapha",
    body: "Water and earth dominate: steady build, calm sleep, slow metabolism.",
    nature: "Patient and loyal, needs movement and variety to avoid heaviness.",
  },
};

export type NadiAmsa = {
  /** 1..1800 across the whole zodiac. */
  zodiacIndex: number;
  /** 1..150 inside the sign. */
  inSignIndex: number;
  sign: string;
  signIndex: number;
  startDeg: number;   // sidereal longitude where this amsa starts
  endDeg: number;
  arcMinutes: number; // always 12
};

function nadiAmsaOf(longitude: number): NadiAmsa {
  const lon = norm360(longitude);
  const signIndex = Math.floor(lon / 30);
  const inSign = lon - signIndex * 30;
  const inSignIndex = Math.floor(inSign / 0.2) + 1;     // 0.2 degrees = 12 arc minutes
  const zodiacIndex = signIndex * 150 + inSignIndex;
  const startDeg = signIndex * 30 + (inSignIndex - 1) * 0.2;
  return {
    zodiacIndex,
    inSignIndex,
    sign: RASHIS[signIndex] ?? String(signIndex + 1),
    signIndex,
    startDeg,
    endDeg: startDeg + 0.2,
    arcMinutes: 12,
  };
}

export type NadiReading = {
  chart: KundliChart;
  moonLongitude: number;
  ascendantLongitude: number;
  nakshatra: string;
  nakshatraIndex: number;
  pada: number;
  nadi: "Adi" | "Madhya" | "Antya";
  nadiDosha: string;
  bodyNote: string;
  natureNote: string;
  moonAmsa: NadiAmsa;
  lagnaAmsa: NadiAmsa;
  chandraKalaPart: number;      // 1..150 in the Moon's sign
  leafGroup: string;            // classical bundle label derived from the amsa
  bhriguBindu: { longitude: number; sign: string; degreeInSign: number; nakshatra: string };
  agreement: string;
  timing: { label: string; note: string }[];
  method: string[];
};

/**
 * Leaf-bundle labels follow the traditional grouping of 1800 nadi amsas into
 * 12 sets of 150 by sign, each set named after the sign and split into five
 * kandams of 30 amsas so a reader can narrow the bundle.
 */
function leafGroupLabel(a: NadiAmsa): string {
  const kandam = Math.floor((a.inSignIndex - 1) / 30) + 1;
  return `${a.sign} bundle, kandam ${kandam} of 5, leaf ${a.inSignIndex} of 150`;
}

export function nadiReading(input: KundliInput): NadiReading {
  const chart = computeKundli(input);
  const moon = chart.planets.find((p) => p.name === "Moon")!;
  const rahu = chart.planets.find((p) => p.name === "Rahu")!;
  const nakIndex = chart.moonNakshatra.index;
  const nadi = NADI_BY_NAKSHATRA[nakIndex]!;
  const info = NADI_MEANING[nadi]!;

  const moonAmsa = nadiAmsaOf(moon.longitude);
  const lagnaAmsa = nadiAmsaOf(chart.ascendant.longitude);

  // Bhrigu Bindu: midpoint from Rahu forward to the Moon.
  const arc = norm360(moon.longitude - rahu.longitude);
  const bbLon = norm360(rahu.longitude + arc / 2);
  const bbSign = Math.floor(bbLon / 30);
  const bbNak = Math.floor(bbLon / (360 / 27));

  const agreement =
    moonAmsa.signIndex === lagnaAmsa.signIndex
      ? "The Moon amsa and the Lagna amsa fall in the same sign, so the leaf group is confirmed twice and the reading is considered firm."
      : `The Moon amsa sits in ${moonAmsa.sign} while the Lagna amsa sits in ${lagnaAmsa.sign}. A Nadi reader would open both bundles and match the one that agrees with the parents' names.`;

  return {
    chart,
    moonLongitude: moon.longitude,
    ascendantLongitude: chart.ascendant.longitude,
    nakshatra: NAKSHATRAS[nakIndex] ?? String(nakIndex + 1),
    nakshatraIndex: nakIndex,
    pada: chart.moonNakshatra.pada,
    nadi,
    nadiDosha: info.dosha,
    bodyNote: info.body,
    natureNote: info.nature,
    moonAmsa,
    lagnaAmsa,
    chandraKalaPart: moonAmsa.inSignIndex,
    leafGroup: leafGroupLabel(moonAmsa),
    bhriguBindu: {
      longitude: bbLon,
      sign: RASHIS[bbSign] ?? String(bbSign + 1),
      degreeInSign: bbLon - bbSign * 30,
      nakshatra: NAKSHATRAS[bbNak] ?? String(bbNak + 1),
    },
    agreement,
    timing: [
      {
        label: "Bhrigu Bindu transits",
        note: `Events cluster when Jupiter or Saturn crosses ${RASHIS[bbSign] ?? bbSign + 1} near ${(bbLon - bbSign * 30).toFixed(1)} degrees, or the opposite point.`,
      },
      {
        label: "Moon amsa activation",
        note: `The Sun crosses your Moon nadi amsa once a year, around the same calendar dates each year, which is when Nadi readers expect news on the theme of the leaf.`,
      },
      {
        label: "Nakshatra of the Moon",
        note: `${NAKSHATRAS[nakIndex] ?? nakIndex + 1} pada ${chart.moonNakshatra.pada} gives the running dasha lord, so the leaf statements are dated against that ladder.`,
      },
    ],
    method: [
      "Each sign of 30 degrees is divided into 150 nadi amsas of 12 arc minutes, giving 1800 divisions of the zodiac.",
      "The Moon's sidereal longitude selects the birth nadi amsa; the Ascendant amsa is used as a cross-check.",
      "Nadi type Adi, Madhya or Antya comes from the birth Nakshatra and is the same value used for Nadi Dosha in matching.",
      "Bhrigu Bindu is the midpoint from Rahu to the Moon and is used for timing.",
      "Physical palm-leaf verses are not calculated. The engine identifies the bundle, kandam and leaf number a reader would search, not the verse text itself.",
    ],
  };
}

/** Nadi Dosha check for matching: same nadi is a classical objection. */
export function nadiDoshaCheck(brideNak: number, groomNak: number): { bride: string; groom: string; dosha: boolean; note: string } {
  const b = NADI_BY_NAKSHATRA[brideNak]!;
  const g = NADI_BY_NAKSHATRA[groomNak]!;
  const dosha = b === g;
  return {
    bride: b,
    groom: g,
    dosha,
    note: dosha
      ? `Both charts carry ${b} nadi, which the tradition reads as Nadi Dosha: the same constitution on both sides, so health and fertility need medical attention rather than assumption. The objection is cancelled when both share the same Nakshatra with different padas, or the same sign with different Nakshatras.`
      : `Nadi differs (${b} and ${g}), so the eight-fold matching awards the full nadi score and no Nadi Dosha applies.`,
  };
}

export { nadiAmsaOf, NADI_BY_NAKSHATRA };
