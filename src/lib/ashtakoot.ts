// Ashtakoot Milan (Guna Milan) — 8 kootas totaling 36 points.
import { NAKSHATRAS, type KundliChart } from "./vedic";

// Varna order: Brahmin (highest), Kshatriya, Vaishya, Shudra
const VARNA_BY_RASHI = [
  1, // Aries — Kshatriya
  2, // Taurus — Vaishya
  0, // Gemini — Brahmin (some traditions)... simplifying:
  0, 1, 2, 0, 1, 2, 0, 1, 2,
];

// Vashya groups: 0=Chatushpada (4-legged), 1=Manav (Human), 2=Jalachar (aquatic), 3=Vanachar (wild), 4=Keet (insect)
const VASHYA_BY_RASHI = [3, 0, 1, 2, 3, 1, 1, 4, 1, 0, 1, 2];

// Yoni for each nakshatra (14 yoni animals, indices 0..13)
const YONI_BY_NAK = [
  0, 8, 5, 6, 10, 2, 2, 1, 1, 12, 12, 3, 3, 3, 4, 4, 11, 11, 5, 7, 7, 13, 13, 9, 9, 4, 4,
];
// Yoni compatibility (14x14 basic 4-tier matrix simplified): same=4, friend=3, neutral=2, enemy=1, worst=0.
// Simplified: same yoni = 4, else 2 as neutral. Full matrix omitted for size.
function yoniScore(a: number, b: number): number {
  if (a === b) return 4;
  return 2;
}

// Rashi lord friendship: naisargika (natural)
const RASHI_LORD = ["Mars","Venus","Mercury","Moon","Sun","Mercury","Venus","Mars","Jupiter","Saturn","Saturn","Jupiter"];
const FRIENDSHIP: Record<string, Record<string, "friend"|"neutral"|"enemy">> = {
  Sun:    { Sun:"friend", Moon:"friend", Mars:"friend", Mercury:"neutral", Jupiter:"friend", Venus:"enemy", Saturn:"enemy" },
  Moon:   { Sun:"friend", Moon:"friend", Mars:"neutral", Mercury:"friend", Jupiter:"neutral", Venus:"neutral", Saturn:"neutral" },
  Mars:   { Sun:"friend", Moon:"friend", Mars:"friend", Mercury:"enemy", Jupiter:"friend", Venus:"neutral", Saturn:"neutral" },
  Mercury:{ Sun:"friend", Moon:"enemy", Mars:"neutral", Mercury:"friend", Jupiter:"neutral", Venus:"friend", Saturn:"neutral" },
  Jupiter:{ Sun:"friend", Moon:"friend", Mars:"friend", Mercury:"enemy", Jupiter:"friend", Venus:"enemy", Saturn:"neutral" },
  Venus:  { Sun:"enemy", Moon:"enemy", Mars:"neutral", Mercury:"friend", Jupiter:"neutral", Venus:"friend", Saturn:"friend" },
  Saturn: { Sun:"enemy", Moon:"enemy", Mars:"enemy", Mercury:"friend", Jupiter:"neutral", Venus:"friend", Saturn:"friend" },
};

// Gana by nakshatra: 0=Deva, 1=Manushya, 2=Rakshasa
const GANA_BY_NAK = [
  0, 1, 2, 1, 0, 2, 0, 0, 2, 2, 1, 1, 0, 1, 0, 2, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0,
];

// Nadi: 0=Adi, 1=Madhya, 2=Antya
const NADI_BY_NAK = [
  0, 1, 2, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0,
];

const YONI_NAMES = ["Horse","Elephant","Sheep","Serpent","Dog","Cat","Rat","Cow","Buffalo","Tiger","Deer","Monkey","Mongoose","Lion"];
const GANA_NAMES = ["Deva (Divine)","Manushya (Human)","Rakshasa (Demonic)"];
const NADI_NAMES = ["Adi","Madhya","Antya"];
const VASHYA_NAMES = ["Chatushpada","Manav","Jalachar","Vanachar","Keet"];
const VARNA_NAMES = ["Brahmin","Kshatriya","Vaishya","Shudra"];

export type Person = {
  chart: KundliChart;
  name?: string;
  gender?: "male" | "female";
};

export type Koota = {
  name: string; score: number; max: number;
  boy: string; girl: string;
  detail: string;
};
export type AshtakootResult = {
  total: number;
  max: 36;
  kootas: Koota[];
  manglik: { boy: boolean; girl: boolean; cancelled: boolean };
  bhakoot: number;
  interpretation: string;
};

export function ashtakootMilan(boy: Person, girl: Person): AshtakootResult {
  const b = boy.chart, g = girl.chart;
  const bMoon = b.planets[1].rashi, gMoon = g.planets[1].rashi;
  const bNak = b.moonNakshatra.index, gNak = g.moonNakshatra.index;

  // Varna (1)
  const bV = VARNA_BY_RASHI[bMoon], gV = VARNA_BY_RASHI[gMoon];
  const varnaScore = bV <= gV ? 1 : 0; // boy varna equal or higher (lower index) than girl
  // Vashya (2)
  const bVa = VASHYA_BY_RASHI[bMoon], gVa = VASHYA_BY_RASHI[gMoon];
  const vashyaScore = bVa === gVa ? 2 : Math.abs(bVa - gVa) === 1 ? 1 : 0;
  // Tara (3)
  const taraForward = ((gNak - bNak + 27) % 27) % 9;
  const taraBack = ((bNak - gNak + 27) % 27) % 9;
  const auspicious = [1, 3, 5, 7]; // simplified auspicious tara indices
  const taraScore = (auspicious.includes(taraForward) ? 1.5 : 0) + (auspicious.includes(taraBack) ? 1.5 : 0);
  // Yoni (4)
  const bYoni = YONI_BY_NAK[bNak], gYoni = YONI_BY_NAK[gNak];
  const yoniS = yoniScore(bYoni, gYoni);
  // Graha Maitri (5)
  const bLord = RASHI_LORD[bMoon], gLord = RASHI_LORD[gMoon];
  const rel = FRIENDSHIP[bLord]?.[gLord] ?? "neutral";
  const grahaScore = rel === "friend" ? 5 : rel === "neutral" ? 3 : 0;
  // Gana (6)
  const bG = GANA_BY_NAK[bNak], gG = GANA_BY_NAK[gNak];
  const ganaScore = bG === gG ? 6
    : (bG === 0 && gG === 1) || (bG === 1 && gG === 0) ? 5
    : (bG === 1 && gG === 2) || (bG === 2 && gG === 1) ? 1
    : 0;
  // Bhakoot (7)
  const bhakootDiff = Math.abs(bMoon - gMoon);
  const bhakootSafe = ![5, 6, 7, 8].includes(bhakootDiff) && ![4, 5, 6, 7].includes(12 - bhakootDiff);
  const bhakootScore = bhakootSafe ? 7 : 0;
  // Nadi (8)
  const bN = NADI_BY_NAK[bNak], gN = NADI_BY_NAK[gNak];
  const nadiScore = bN === gN ? 0 : 8;

  const kootas: Koota[] = [
    { name: "Varna", score: varnaScore, max: 1, boy: VARNA_NAMES[bV], girl: VARNA_NAMES[gV],
      detail: varnaScore ? "Spiritual harmony." : "Difference in temperament levels." },
    { name: "Vashya", score: vashyaScore, max: 2, boy: VASHYA_NAMES[bVa], girl: VASHYA_NAMES[gVa],
      detail: vashyaScore === 2 ? "Balanced mutual attraction." : vashyaScore === 1 ? "Moderate control." : "Unequal magnetism." },
    { name: "Tara", score: taraScore, max: 3, boy: `Nak ${bNak+1}`, girl: `Nak ${gNak+1}`,
      detail: taraScore >= 2 ? "Auspicious energy exchange." : "Life force may need care." },
    { name: "Yoni", score: yoniS, max: 4, boy: YONI_NAMES[bYoni], girl: YONI_NAMES[gYoni],
      detail: yoniS === 4 ? "Perfect physical & sexual compatibility." : "Neutral sensual match." },
    { name: "Graha Maitri", score: grahaScore, max: 5, boy: bLord, girl: gLord,
      detail: `Rashi-lord relation: ${rel}.` },
    { name: "Gana", score: ganaScore, max: 6, boy: GANA_NAMES[bG], girl: GANA_NAMES[gG],
      detail: ganaScore >= 5 ? "Mental frequencies align." : "Different temperaments." },
    { name: "Bhakoot", score: bhakootScore, max: 7, boy: `Rashi ${bMoon+1}`, girl: `Rashi ${gMoon+1}`,
      detail: bhakootScore ? "Prosperity and health flow." : "Bhakoot dosha — needs attention." },
    { name: "Nadi", score: nadiScore, max: 8, boy: NADI_NAMES[bN], girl: NADI_NAMES[gN],
      detail: nadiScore ? "Genetic and health compatibility." : "Nadi dosha — same nadi." },
  ];

  const total = kootas.reduce((s, k) => s + k.score, 0);

  // Manglik check
  const marsHouseB = ((b.planets[2].rashi - b.ascendant.rashi + 12) % 12) + 1;
  const marsHouseG = ((g.planets[2].rashi - g.ascendant.rashi + 12) % 12) + 1;
  const manglik = (h: number) => [1,2,4,7,8,12].includes(h);
  const boyM = manglik(marsHouseB);
  const girlM = manglik(marsHouseG);
  const cancelled = boyM && girlM; // both manglik cancels

  const interpretation =
    total >= 28 ? "Excellent match — deeply harmonious."
    : total >= 24 ? "Very good match — favourable union."
    : total >= 18 ? "Acceptable match — with conscious effort."
    : total >= 12 ? "Below-average — requires remedies and understanding."
    : "Not recommended without significant remedies.";

  return {
    total: Math.round(total * 10) / 10,
    max: 36,
    kootas,
    manglik: { boy: boyM, girl: girlM, cancelled },
    bhakoot: bhakootDiff,
    interpretation,
  };
}

void NAKSHATRAS;
