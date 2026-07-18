// Horoscope engine — Western + Vedic Rashiphal + Nakshatra + Chinese year forecast.
import * as A from "astronomy-engine";
import { TAROT_DECK, type TarotCard } from "./tarot-deck";
import { SIGN_NAMES } from "./western";
import { NAKSHATRAS, RASHIS, RASHI_LORDS, lahiriAyanamsa } from "./vedic";
import { CHINESE_ANIMALS, CHINESE_ELEMENTS, chineseSign } from "./chinese-zodiac";

export type Period = "Daily" | "Weekly" | "Monthly" | "Yearly";

const norm360 = (x: number) => ((x % 360) + 360) % 360;

// Tropical longitude of a body (ecliptic-of-date via EQJ→ECT rotation).
function tropicalLon(body: A.Body, date: Date): number {
  const g = A.GeoVector(body, date, true);
  const rot = A.Rotation_EQJ_ECT(date);
  const e = A.RotateVector(rot, g);
  return norm360(Math.atan2(e.y, e.x) * 180 / Math.PI);
}
function siderealLon(body: A.Body, date: Date): number {
  return norm360(tropicalLon(body, date) - lahiriAyanamsa(date));
}

// ---------- Sun / Moon signs ----------
export function sunSign(date: Date): string {
  return SIGN_NAMES[Math.floor(tropicalLon(A.Body.Sun, date) / 30)];
}
export function moonSign(date: Date): string {
  return SIGN_NAMES[Math.floor(tropicalLon(A.Body.Moon, date) / 30)];
}
export function moonRashi(date: Date): { index: number; name: string } {
  const idx = Math.floor(siderealLon(A.Body.Moon, date) / 30);
  return { index: idx, name: RASHIS[idx] };
}
export function sunRashi(date: Date): { index: number; name: string } {
  const idx = Math.floor(siderealLon(A.Body.Sun, date) / 30);
  return { index: idx, name: RASHIS[idx] };
}

// ---------- Moon phase ----------
export type MoonPhaseInfo = {
  illumination: number;
  phaseAngle: number;
  name: string;
  emoji: string;
  waxing: boolean;
};
export function moonPhaseInfo(date: Date): MoonPhaseInfo {
  const illum = A.Illumination(A.Body.Moon, date);
  const angle = A.MoonPhase(date);
  const waxing = angle < 180;
  const names: [number, string, string][] = [
    [22.5, "New Moon", "🌑"], [67.5, "Waxing Crescent", "🌒"],
    [112.5, "First Quarter", "🌓"], [157.5, "Waxing Gibbous", "🌔"],
    [202.5, "Full Moon", "🌕"], [247.5, "Waning Gibbous", "🌖"],
    [292.5, "Last Quarter", "🌗"], [337.5, "Waning Crescent", "🌘"],
  ];
  let name = "New Moon", emoji = "🌑";
  for (const [limit, n, e] of names) {
    if (angle < limit) { name = n; emoji = e; break; }
  }
  if (angle >= 337.5) { name = "New Moon"; emoji = "🌑"; }
  return { illumination: illum.phase_fraction, phaseAngle: angle, name, emoji, waxing };
}

// ---------- Nakshatra of the day ----------
const NAK_LORDS = ["Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"];
const NAK_DEITY: Record<string, string> = {
  Ashwini: "Ashwini Kumaras", Bharani: "Yama", Krittika: "Agni", Rohini: "Brahma",
  Mrigashira: "Soma", Ardra: "Rudra", Punarvasu: "Aditi", Pushya: "Brihaspati",
  Ashlesha: "Naga", Magha: "Pitrs", "Purva Phalguni": "Bhaga", "Uttara Phalguni": "Aryaman",
  Hasta: "Savitr", Chitra: "Vishvakarma", Swati: "Vayu", Vishakha: "Indra-Agni",
  Anuradha: "Mitra", Jyeshtha: "Indra", Mula: "Nirriti", "Purva Ashadha": "Apah",
  "Uttara Ashadha": "Vishvedevas", Shravana: "Vishnu", Dhanishta: "Vasus",
  Shatabhisha: "Varuna", "Purva Bhadrapada": "Aja Ekapada", "Uttara Bhadrapada": "Ahir Budhnya",
  Revati: "Pushan",
};
const NAK_SYMBOL: Record<string, string> = {
  Ashwini: "Horse's head", Bharani: "Yoni", Krittika: "Razor / flame", Rohini: "Cart",
  Mrigashira: "Deer's head", Ardra: "Teardrop", Punarvasu: "Bow & quiver", Pushya: "Cow's udder",
  Ashlesha: "Coiled serpent", Magha: "Royal throne", "Purva Phalguni": "Front of bed",
  "Uttara Phalguni": "Back of bed", Hasta: "Palm of hand", Chitra: "Bright jewel",
  Swati: "Young shoot", Vishakha: "Triumphal arch", Anuradha: "Lotus", Jyeshtha: "Earring",
  Mula: "Bundle of roots", "Purva Ashadha": "Fan", "Uttara Ashadha": "Elephant tusk",
  Shravana: "Ear / three footprints", Dhanishta: "Drum", Shatabhisha: "Empty circle",
  "Purva Bhadrapada": "Front legs of funeral cot", "Uttara Bhadrapada": "Back legs of cot",
  Revati: "Fish",
};
export type NakshatraOfDay = {
  index: number;
  name: string;
  pada: number;
  lord: string;
  deity: string;
  symbol: string;
  moonLon: number;
};
export function nakshatraOfDay(date: Date): NakshatraOfDay {
  const lon = siderealLon(A.Body.Moon, date);
  const index = Math.floor(lon / (360 / 27));
  const pada = Math.floor((lon % (360 / 27)) / ((360 / 27) / 4)) + 1;
  const name = NAKSHATRAS[index];
  return {
    index, name, pada,
    lord: NAK_LORDS[index % 9],
    deity: NAK_DEITY[name] ?? "—",
    symbol: NAK_SYMBOL[name] ?? "—",
    moonLon: lon,
  };
}

// ---------- Transit hits into a rashi/sign ----------
export type TransitHit = { planet: string; house?: number };
const BODIES: [A.Body, string][] = [
  [A.Body.Sun, "Sun"], [A.Body.Moon, "Moon"], [A.Body.Mercury, "Mercury"],
  [A.Body.Venus, "Venus"], [A.Body.Mars, "Mars"], [A.Body.Jupiter, "Jupiter"],
  [A.Body.Saturn, "Saturn"],
];
export function currentTransitsIntoRashi(natalMoonRashiIndex: number, date: Date): TransitHit[] {
  const hits: TransitHit[] = [];
  for (const [body, name] of BODIES) {
    const idx = Math.floor(siderealLon(body, date) / 30);
    if (idx === natalMoonRashiIndex) hits.push({ planet: name });
  }
  return hits;
}

/** Compute house-from-moon for each classical planet — used for Rashiphal per Moon sign. */
export function planetsFromMoon(natalMoonRashiIndex: number, date: Date): Record<string, number> {
  const map: Record<string, number> = {};
  for (const [body, name] of BODIES) {
    const idx = Math.floor(siderealLon(body, date) / 30);
    const house = ((idx - natalMoonRashiIndex + 12) % 12) + 1;
    map[name] = house;
  }
  return map;
}

// ---------- Rashiphal luck (moon-sign) ----------
// Uses house-from-Moon of Jupiter/Saturn/Sun/Mars/Venus/Mercury/Moon to compute Love/Career/Wealth/Health/Emotions/Luck.
const GOOD_HOUSES = new Set([1, 3, 5, 6, 7, 9, 10, 11]);
export function rashiphalScores(natalMoonIndex: number, date: Date): Record<string, number> {
  const fm = planetsFromMoon(natalMoonIndex, date);
  const score = (planets: string[]) => {
    let s = 55;
    for (const p of planets) {
      const h = fm[p];
      if (!h) continue;
      if (GOOD_HOUSES.has(h)) s += 6; else s -= 4;
      if (p === "Jupiter" && [2, 5, 9, 11].includes(h)) s += 6;
      if (p === "Saturn" && [3, 6, 11].includes(h)) s += 5;
      if (p === "Saturn" && [1, 4, 8, 12].includes(h)) s -= 8;
      if (p === "Mars" && [3, 6, 10, 11].includes(h)) s += 4;
      if (p === "Venus" && [1, 4, 5, 7, 10].includes(h)) s += 5;
    }
    return Math.max(15, Math.min(98, s));
  };
  return {
    Love: score(["Venus", "Moon", "Jupiter"]),
    Career: score(["Sun", "Saturn", "Mars"]),
    Wealth: score(["Jupiter", "Mercury", "Venus"]),
    Health: score(["Sun", "Mars", "Moon"]),
    Emotions: score(["Moon", "Venus", "Jupiter"]),
    Luck: score(["Jupiter", "Sun", "Mercury"]),
  };
}

// ---------- Sign polarity / element / modality (Western) ----------
export const SIGN_ELEMENT = ["Fire","Earth","Air","Water","Fire","Earth","Air","Water","Fire","Earth","Air","Water"];
export const SIGN_MODALITY = ["Cardinal","Fixed","Mutable","Cardinal","Fixed","Mutable","Cardinal","Fixed","Mutable","Cardinal","Fixed","Mutable"];
export const SIGN_POLARITY = ["+","-","+","-","+","-","+","-","+","-","+","-"];
export const SIGN_RULER = ["Mars","Venus","Mercury","Moon","Sun","Mercury","Venus","Mars/Pluto","Jupiter","Saturn","Saturn/Uranus","Jupiter/Neptune"];

// ---------- Card of the day (deterministic) ----------
export function tarotCardOfTheDay(date: Date): { card: TarotCard; reversed: boolean } {
  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  let h = 2166136261 >>> 0;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const idx = h % TAROT_DECK.length;
  const reversed = ((h >>> 16) & 1) === 1;
  return { card: TAROT_DECK[idx], reversed };
}
export function cardGuidance(card: TarotCard, reversed: boolean): string {
  const kws = reversed ? card.keywordsReversed : card.keywords;
  return `${reversed ? "Reversed — " : ""}${kws.slice(0, 3).join(" · ")}`;
}

// ---------- Chinese year forecast ----------
export type ChineseYearForecast = {
  animal: string;
  yearElement: typeof CHINESE_ELEMENTS[number];
  yearAnimal: typeof CHINESE_ANIMALS[number];
  yinYang: "Yang" | "Yin";
  overallScore: number;
  loveScore: number;
  careerScore: number;
  wealthScore: number;
  healthScore: number;
  luckyColors: string[];
  luckyNumbers: number[];
  luckyDirection: string;
  theme: string;
};

const ANIMAL_HARMONY: Record<string, string[]> = {
  Rat: ["Dragon","Monkey","Ox"], Ox: ["Snake","Rooster","Rat"],
  Tiger: ["Horse","Dog","Pig"], Rabbit: ["Goat","Pig","Dog"],
  Dragon: ["Rat","Monkey","Rooster"], Snake: ["Ox","Rooster","Monkey"],
  Horse: ["Tiger","Goat","Dog"], Goat: ["Rabbit","Horse","Pig"],
  Monkey: ["Rat","Dragon","Snake"], Rooster: ["Ox","Snake","Dragon"],
  Dog: ["Tiger","Rabbit","Horse"], Pig: ["Rabbit","Goat","Tiger"],
};
const ANIMAL_CLASH: Record<string, string> = {
  Rat: "Horse", Ox: "Goat", Tiger: "Monkey", Rabbit: "Rooster",
  Dragon: "Dog", Snake: "Pig", Horse: "Rat", Goat: "Ox",
  Monkey: "Tiger", Rooster: "Rabbit", Dog: "Dragon", Pig: "Snake",
};
const ELEMENT_COLORS: Record<string, string[]> = {
  Wood: ["Emerald","Forest Green","Teal"],
  Fire: ["Ruby","Crimson","Rose Gold"],
  Earth: ["Ochre","Sand","Warm Beige"],
  Metal: ["Silver","Platinum","Pearl White"],
  Water: ["Sapphire","Deep Navy","Aqua"],
};
const ELEMENT_DIRECTIONS: Record<string, string> = {
  Wood: "East", Fire: "South", Earth: "Centre",
  Metal: "West", Water: "North",
};

export function chineseYearForecast(personAnimal: string, year: number): ChineseYearForecast {
  const yearSign = chineseSign(year);
  const harmony = ANIMAL_HARMONY[personAnimal] ?? [];
  const clash = ANIMAL_CLASH[personAnimal];
  const isBenSign = personAnimal === yearSign.animal; // Ben Ming Nian
  const inHarmony = harmony.includes(yearSign.animal);
  const isClashed = clash === yearSign.animal;

  let base = 65;
  if (inHarmony) base += 15;
  if (isBenSign) base -= 8;
  if (isClashed) base -= 20;

  // Deterministic per-domain jitter
  const seed = (personAnimal + year).split("").reduce((a, c) => (a * 33 + c.charCodeAt(0)) >>> 0, 5381);
  const r = (i: number) => (((seed >>> (i * 5)) & 0x1f) - 15);
  return {
    animal: personAnimal,
    yearAnimal: yearSign.animal,
    yearElement: yearSign.element,
    yinYang: yearSign.yinYang,
    overallScore: Math.max(20, Math.min(98, base + r(0))),
    loveScore: Math.max(20, Math.min(98, base + r(1))),
    careerScore: Math.max(20, Math.min(98, base + r(2))),
    wealthScore: Math.max(20, Math.min(98, base + r(3))),
    healthScore: Math.max(20, Math.min(98, base + r(4))),
    luckyColors: ELEMENT_COLORS[yearSign.element] ?? [],
    luckyNumbers: [((seed >>> 3) % 9) + 1, ((seed >>> 8) % 9) + 1],
    luckyDirection: ELEMENT_DIRECTIONS[yearSign.element] ?? "East",
    theme: isBenSign
      ? "Ben Ming Nian — a year of self-refinement. Wear red, honour ancestors."
      : isClashed
      ? "A clash year — move carefully, avoid major risks, cultivate patience."
      : inHarmony
      ? "A harmony year — doors open, alliances thrive, momentum builds."
      : "A steady year — quiet growth, deep work, disciplined progress.",
  };
}

// ---------- Rashi metadata ----------
export function rashiLord(index: number): string {
  return RASHI_LORDS[index];
}
