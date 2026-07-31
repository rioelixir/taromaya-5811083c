// Ashtakoot Milan (Guna Milan) — 8 kootas totaling 36 points.
import { NAKSHATRAS, type KundliChart } from "./vedic";

// Varna order: Brahmin (0, highest), Kshatriya (1), Vaishya (2), Shudra (3, lowest).
// Aries..Pisces (index 0..11).
const VARNA_BY_RASHI = [1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0];

// Vashya groups: 0=Chatushpada (4-legged), 1=Manav (human), 2=Jalachar (aquatic),
// 3=Vanachar (wild), 4=Keet (insect). Aries..Pisces.
const VASHYA_BY_RASHI = [0, 0, 1, 2, 3, 1, 1, 4, 0, 0, 1, 2];

// Standard 5x5 Vashya score matrix (0..2), symmetric.
const VASHYA_MATRIX: number[][] = [
  //        Chatushpada Manav Jalachar Vanachar Keet
  /*Chatushpada*/ [2,    1,    1,       0,       0.5],
  /*Manav*/       [1,    2,    1,       0.5,     0.5],
  /*Jalachar*/    [1,    1,    2,       0,       0.5],
  /*Vanachar*/    [0,    0.5,  0,       2,       0],
  /*Keet*/        [0.5,  0.5,  0.5,     0,       2],
];

// Yoni for each of the 27 nakshatras (14 yoni animals).
// 0 Horse, 1 Elephant, 2 Sheep, 3 Serpent, 4 Dog, 5 Cat, 6 Rat, 7 Cow,
// 8 Buffalo, 9 Tiger, 10 Deer, 11 Monkey, 12 Mongoose, 13 Lion.
const YONI_BY_NAK = [
  0, 1, 2, 3, 3, 4, 5, 2, 5, 6, 6, 7, 8, 9, 8, 9, 10, 10, 4, 11, 12, 11, 13, 0, 13, 7, 1,
];

// Classic enemy (shatru) yoni pairs.
const YONI_ENEMIES: [number, number][] = [
  [7, 9],   // Cow - Tiger
  [1, 13],  // Elephant - Lion
  [0, 8],   // Horse - Buffalo
  [3, 12],  // Serpent - Mongoose
  [4, 10],  // Dog - Deer
  [6, 5],   // Rat - Cat
  [2, 11],  // Sheep(Goat) - Monkey
];
// Broad temperament grouping used only to grant the "friendly" tier (3) when
// two different, non-enemy yonis share a gentle/fierce nature.
const YONI_GENTLE = new Set([0, 1, 2, 7, 8, 10, 12]); // Horse, Elephant, Sheep, Cow, Buffalo, Deer, Mongoose
function yoniScore(a: number, b: number): number {
  if (a === b) return 4;
  if (YONI_ENEMIES.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return 0;
  const sameGroup = YONI_GENTLE.has(a) === YONI_GENTLE.has(b);
  return sameGroup ? 3 : 2;
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

// Gana by nakshatra: 0=Deva, 1=Manushya, 2=Rakshasa (9 each of the 27).
const GANA_BY_NAK = [
  0, 1, 2, 1, 0, 1, 0, 0, 2, 2, 1, 1, 0, 2, 0, 2, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0,
];

// Nadi: 0=Aadi, 1=Madhya, 2=Antya — a simple repeating pattern every 3 nakshatras.
const NADI_BY_NAK = Array.from({ length: 27 }, (_, i) => i % 3);

const YONI_NAMES = ["Horse","Elephant","Sheep","Serpent","Dog","Cat","Rat","Cow","Buffalo","Tiger","Deer","Monkey","Mongoose","Lion"];
const GANA_NAMES = ["Deva (Divine)","Manushya (Human)","Rakshasa (Demonic)"];
const NADI_NAMES = ["Aadi","Madhya","Antya"];
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

  // Varna (1) — groom's varna must be equal to or higher (lower index) than bride's.
  const bV = VARNA_BY_RASHI[bMoon], gV = VARNA_BY_RASHI[gMoon];
  const varnaScore = bV <= gV ? 1 : 0;
  // Vashya (2)
  const bVa = VASHYA_BY_RASHI[bMoon], gVa = VASHYA_BY_RASHI[gMoon];
  const vashyaScore = VASHYA_MATRIX[bVa][gVa];
  // Tara (3) — count from janma nakshatra in both directions, mapped to the 9 taras;
  // taras 1,3,5,7 (Janma, Sampat, Kshema, Sadhana counted mod 9 as 1..9) are inauspicious
  // in the classical scheme it's actually taras 2,4,6,8,9 (1-indexed) that are auspicious.
  const taraIndex = (from: number, to: number) => (((to - from + 27) % 27) % 9) + 1; // 1..9
  const auspiciousTara = [2, 4, 6, 8, 9];
  const taraForward = taraIndex(bNak, gNak);
  const taraBack = taraIndex(gNak, bNak);
  const taraScore = (auspiciousTara.includes(taraForward) ? 1.5 : 0) + (auspiciousTara.includes(taraBack) ? 1.5 : 0);
  // Yoni (4)
  const bYoni = YONI_BY_NAK[bNak], gYoni = YONI_BY_NAK[gNak];
  const yoniS = yoniScore(bYoni, gYoni);
  // Graha Maitri (5)
  const bLord = RASHI_LORD[bMoon], gLord = RASHI_LORD[gMoon];
  const rel = FRIENDSHIP[bLord]?.[gLord] ?? "neutral";
  const grahaScore = rel === "friend" ? 5 : rel === "neutral" ? 3 : 0;
  // Gana (6)
  const bG = GANA_BY_NAK[bNak], gG = GANA_BY_NAK[gNak];
  const ganaScore =
    bG === gG ? 6
    : (bG === 0 && gG === 1) || (bG === 1 && gG === 0) ? 5
    : 0; // Deva-Rakshasa or Manushya-Rakshasa (either order) = 0
  // Bhakoot (7) — count of rashis from one Moon sign to the other (1..12), both ways.
  const rashiCount = (from: number, to: number) => (((to - from + 12) % 12) + 1); // 1..12
  const c1 = rashiCount(bMoon, gMoon);
  const c2 = rashiCount(gMoon, bMoon);
  const doshaPairs = new Set([`${6}-${8}`, `${8}-${6}`, `${9}-${5}`, `${5}-${9}`, `${12}-${2}`, `${2}-${12}`]);
  const bhakootDosha = doshaPairs.has(`${c1}-${c2}`);
  const bhakootScore = bhakootDosha ? 0 : 7;
  // Nadi (8)
  const bN = NADI_BY_NAK[bNak], gN = NADI_BY_NAK[gNak];
  const nadiScore = bN === gN ? 0 : 8;

  const kootas: Koota[] = [
    { name: "Varna", score: varnaScore, max: 1, boy: VARNA_NAMES[bV], girl: VARNA_NAMES[gV],
      detail: varnaScore ? "Spiritual harmony." : "Difference in temperament levels." },
    { name: "Vashya", score: vashyaScore, max: 2, boy: VASHYA_NAMES[bVa], girl: VASHYA_NAMES[gVa],
      detail: vashyaScore >= 2 ? "Balanced mutual attraction." : vashyaScore >= 1 ? "Moderate control." : "Unequal magnetism." },
    { name: "Tara", score: taraScore, max: 3, boy: `Nak ${bNak+1}`, girl: `Nak ${gNak+1}`,
      detail: taraScore >= 2 ? "Auspicious energy exchange." : "Life force may need care." },
    { name: "Yoni", score: yoniS, max: 4, boy: YONI_NAMES[bYoni], girl: YONI_NAMES[gYoni],
      detail: yoniS === 4 ? "Perfect physical & sexual compatibility." : yoniS === 0 ? "Instinctive natures may clash." : "Workable sensual match." },
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
    bhakoot: bhakootDosha ? 0 : 1,
    interpretation,
  };
}

void NAKSHATRAS;
