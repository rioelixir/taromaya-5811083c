// Deep Remedies — gemstone Ratti calculator, Rudraksha mukhi mapping,
// Yantra recommendations, and Japa / mala scheduling.
// Traditional formulae drawn from Brihat Samhita, Garuda Purana (Ratna
// Pariksha), Shiva Purana (Rudraksha Jabala Upanishad), and Yantra Chintamani.

import type { PlanetKey } from "./remedies";

// ─── Gemstone Ratti calculator ───────────────────────────────────────────────
// 1 Ratti ≈ 0.1215 grams (classical Indian jeweller unit).
// 1 Carat = 0.2 grams. So 1 Carat ≈ 1.646 Ratti.
// Traditional prescription: body weight (kg) / 10 = Ratti of the primary
// gem, adjusted by planetary strength deficit (weaker → heavier gem, up to
// a classical cap per stone).

export const GRAMS_PER_RATTI = 0.1215;
export const GRAMS_PER_CARAT = 0.2;

export function carats(ratti: number): number {
  return +(ratti * GRAMS_PER_RATTI / GRAMS_PER_CARAT).toFixed(2);
}
export function grams(ratti: number): number {
  return +(ratti * GRAMS_PER_RATTI).toFixed(3);
}

export type GemPrescription = {
  planet: PlanetKey;
  gem: string;
  metal: string;
  finger: string;
  day: string;
  time: string;
  ratti: number;
  carats: number;
  grams: number;
  minRatti: number;
  maxRatti: number;
  mantra: string;
  mantraCount: number;
  activationRitual: string[];
};

const GEM_TABLE: Record<PlanetKey, {
  gem: string; metal: string; finger: string; day: string; time: string;
  mantra: string; mantraCount: number; min: number; max: number;
}> = {
  Sun:     { gem: "Ruby",           metal: "Gold",    finger: "Ring",   day: "Sunday",    time: "Sunrise ± 1 h",         mantra: "Om Hraam Hreem Hraum Sah Suryaya Namah",   mantraCount: 108, min: 3, max: 6 },
  Moon:    { gem: "Pearl",          metal: "Silver",  finger: "Little", day: "Monday",    time: "Evening after moonrise", mantra: "Om Shraam Shreem Shraum Sah Chandraya Namah", mantraCount: 108, min: 4, max: 11 },
  Mars:    { gem: "Red Coral",      metal: "Gold/Copper", finger: "Ring", day: "Tuesday",  time: "Sunrise Tuesday",       mantra: "Om Kraam Kreem Kraum Sah Bhaumaya Namah",   mantraCount: 108, min: 6, max: 12 },
  Mercury: { gem: "Emerald",        metal: "Gold",    finger: "Little", day: "Wednesday", time: "Wednesday morning",     mantra: "Om Braam Breem Braum Sah Budhaya Namah",    mantraCount: 108, min: 3, max: 7 },
  Jupiter: { gem: "Yellow Sapphire",metal: "Gold",    finger: "Index",  day: "Thursday",  time: "Thursday sunrise",      mantra: "Om Gram Greem Graum Sah Gurave Namah",      mantraCount: 108, min: 3, max: 9 },
  Venus:   { gem: "Diamond",        metal: "Platinum/Silver", finger: "Middle", day: "Friday", time: "Friday early morning", mantra: "Om Draam Dreem Draum Sah Shukraya Namah",  mantraCount: 108, min: 0.5, max: 1.5 },
  Saturn:  { gem: "Blue Sapphire",  metal: "Iron/Panchdhatu", finger: "Middle", day: "Saturday", time: "Saturday sunset", mantra: "Om Praam Preem Praum Sah Shanaischaraya Namah", mantraCount: 108, min: 3, max: 7 },
  Rahu:    { gem: "Hessonite Garnet", metal: "Silver/Panchdhatu", finger: "Middle", day: "Saturday", time: "Saturday twilight", mantra: "Om Bhraam Bhreem Bhraum Sah Rahave Namah",  mantraCount: 108, min: 4, max: 8 },
  Ketu:    { gem: "Cat's Eye",      metal: "Silver/Panchdhatu", finger: "Middle", day: "Tuesday", time: "Tuesday twilight", mantra: "Om Straam Streem Straum Sah Ketave Namah",  mantraCount: 108, min: 3, max: 7 },
};

export function prescribeGemstone(
  planet: PlanetKey,
  opts: { bodyWeightKg?: number; deficit?: number } = {},
): GemPrescription {
  const g = GEM_TABLE[planet];
  const base = opts.bodyWeightKg ? opts.bodyWeightKg / 10 : (g.min + g.max) / 2;
  // deficit 0..1 pushes toward maxRatti
  const deficit = Math.max(0, Math.min(1, opts.deficit ?? 0.5));
  const target = base * (0.75 + deficit * 0.5);
  const ratti = Math.min(g.max, Math.max(g.min, Math.round(target * 4) / 4)); // 0.25 step
  return {
    planet,
    gem: g.gem,
    metal: g.metal,
    finger: g.finger,
    day: g.day,
    time: g.time,
    ratti,
    carats: carats(ratti),
    grams: grams(ratti),
    minRatti: g.min,
    maxRatti: g.max,
    mantra: g.mantra,
    mantraCount: g.mantraCount,
    activationRitual: [
      `Soak the ${g.gem.toLowerCase()} in raw milk, Ganga jal, honey, ghee & curd (Panchamrit) for one night before wearing.`,
      `On ${g.day}, at ${g.time}, chant the bija mantra ${g.mantraCount} times over the gem.`,
      `Wear on the ${g.finger.toLowerCase()} finger of the working hand while still chanting.`,
      `Do not remove for at least 40 days for the karmic imprint to settle.`,
    ],
  };
}

// ─── Rudraksha mukhi mapping ─────────────────────────────────────────────────

export type Rudraksha = {
  mukhi: number;
  ruling: string;                 // ruling deity / planet
  benefit: string;
  wearOn: "Monday" | "Thursday" | "Any";
  mantra: string;
  count: 108 | 27 | 21;
  malaCount: number;
};

export const RUDRAKSHA: Rudraksha[] = [
  { mukhi: 1,  ruling: "Shiva / Sun",           benefit: "Concentration, leadership, moksha",         wearOn: "Monday", mantra: "Om Hreem Namah",                     count: 108, malaCount: 108 },
  { mukhi: 2,  ruling: "Ardhanarishvara / Moon",benefit: "Harmony in relationships, unity",           wearOn: "Monday", mantra: "Om Namah",                           count: 108, malaCount: 108 },
  { mukhi: 3,  ruling: "Agni / Mars",           benefit: "Confidence, release of past karma",         wearOn: "Any",    mantra: "Om Kleem Namah",                     count: 108, malaCount: 108 },
  { mukhi: 4,  ruling: "Brahma / Mercury",      benefit: "Creativity, learning, speech",              wearOn: "Any",    mantra: "Om Hreem Namah",                     count: 108, malaCount: 108 },
  { mukhi: 5,  ruling: "Kalagni Rudra / Jupiter",benefit: "General wellbeing, purity, calm",          wearOn: "Any",    mantra: "Om Hreem Namah",                     count: 108, malaCount: 108 },
  { mukhi: 6,  ruling: "Kartikeya / Venus",     benefit: "Charisma, courage, marital harmony",        wearOn: "Any",    mantra: "Om Hreem Hoom Namah",                count: 108, malaCount: 108 },
  { mukhi: 7,  ruling: "Mahalakshmi / Saturn",  benefit: "Wealth, freedom from Shani troubles",       wearOn: "Any",    mantra: "Om Hoom Namah",                      count: 108, malaCount: 108 },
  { mukhi: 8,  ruling: "Ganesha / Rahu",        benefit: "Removes obstacles, calms Rahu",             wearOn: "Any",    mantra: "Om Hoom Namah",                      count: 108, malaCount: 108 },
  { mukhi: 9,  ruling: "Durga / Ketu",          benefit: "Fearlessness, spiritual strength",          wearOn: "Any",    mantra: "Om Hreem Hoom Namah",                count: 108, malaCount: 108 },
  { mukhi: 10, ruling: "Vishnu / All planets",  benefit: "Shield from negativity, all-planet balance",wearOn: "Any",    mantra: "Om Hreem Namah",                     count: 108, malaCount: 108 },
  { mukhi: 11, ruling: "Hanuman / Rudra",       benefit: "Courage, strength, protection",             wearOn: "Any",    mantra: "Om Hreem Hoom Namah",                count: 108, malaCount: 108 },
  { mukhi: 12, ruling: "Surya",                 benefit: "Radiance, authority, health",               wearOn: "Any",    mantra: "Om Krom Sroum Roum Namah",           count: 108, malaCount: 108 },
  { mukhi: 13, ruling: "Kamadeva / Indra",      benefit: "Fulfilment of desires, magnetism",          wearOn: "Any",    mantra: "Om Hreem Namah",                     count: 108, malaCount: 108 },
  { mukhi: 14, ruling: "Hanuman / Ajna Chakra", benefit: "Intuition, sixth-sense awareness",          wearOn: "Any",    mantra: "Om Namah Shivaya",                   count: 108, malaCount: 108 },
];

// Suggest 1-3 rudraksha choices for a given planet's affliction.
export function rudrakshaFor(planet: PlanetKey): Rudraksha[] {
  const map: Record<PlanetKey, number[]> = {
    Sun: [12, 1],
    Moon: [2],
    Mars: [3, 11],
    Mercury: [4, 10],
    Jupiter: [5],
    Venus: [6, 13],
    Saturn: [7, 14],
    Rahu: [8, 9],
    Ketu: [9, 3],
  };
  return map[planet].map((m) => RUDRAKSHA[m - 1]).filter(Boolean);
}

// ─── Yantra recommendations ──────────────────────────────────────────────────

export type Yantra = {
  planet: PlanetKey | "Sri";
  name: string;
  purpose: string;
  metal: string;
  installOn: string;
  faceDirection: "E" | "N" | "NE" | "W" | "S";
  activationMantra: string;
  japaCount: number;
};

export const YANTRAS: Yantra[] = [
  { planet: "Sun",     name: "Surya Yantra",     purpose: "Authority, health, father",      metal: "Copper",       installOn: "Sunday sunrise",  faceDirection: "E",  activationMantra: "Om Suryaya Namah",         japaCount: 7000 },
  { planet: "Moon",    name: "Chandra Yantra",   purpose: "Mind, mother, emotions",         metal: "Silver",       installOn: "Monday moonrise", faceDirection: "NE", activationMantra: "Om Chandraya Namah",       japaCount: 11000 },
  { planet: "Mars",    name: "Mangal Yantra",    purpose: "Courage, property, land",        metal: "Copper",       installOn: "Tuesday sunrise", faceDirection: "S",  activationMantra: "Om Angarakaya Namah",      japaCount: 10000 },
  { planet: "Mercury", name: "Budha Yantra",     purpose: "Intellect, trade, speech",       metal: "Bronze",       installOn: "Wednesday dawn",  faceDirection: "N",  activationMantra: "Om Budhaya Namah",         japaCount: 9000 },
  { planet: "Jupiter", name: "Guru Yantra",      purpose: "Wisdom, marriage, children",     metal: "Gold-plated",  installOn: "Thursday dawn",   faceDirection: "NE", activationMantra: "Om Brihaspataye Namah",    japaCount: 19000 },
  { planet: "Venus",   name: "Shukra Yantra",    purpose: "Love, beauty, vehicles",         metal: "Silver",       installOn: "Friday dawn",     faceDirection: "E",  activationMantra: "Om Shukraya Namah",        japaCount: 16000 },
  { planet: "Saturn",  name: "Shani Yantra",     purpose: "Discipline, longevity, justice", metal: "Iron/Panchdhatu", installOn: "Saturday sunset", faceDirection: "W", activationMantra: "Om Shanaischaraya Namah", japaCount: 23000 },
  { planet: "Rahu",    name: "Rahu Yantra",      purpose: "Removes deception, fear",        metal: "Panchdhatu",   installOn: "Saturday twilight", faceDirection: "SW" as "S", activationMantra: "Om Rahave Namah",   japaCount: 18000 },
  { planet: "Ketu",    name: "Ketu Yantra",      purpose: "Moksha, healing chronic karma",  metal: "Panchdhatu",   installOn: "Tuesday twilight",  faceDirection: "S", activationMantra: "Om Ketave Namah",        japaCount: 17000 },
  { planet: "Sri",     name: "Sri Yantra",       purpose: "Abundance, Lakshmi, all-round",  metal: "Copper/Gold",  installOn: "Friday sunrise",   faceDirection: "E", activationMantra: "Om Shreem Mahalakshmyai Namah", japaCount: 108000 },
];

export function yantraFor(planet: PlanetKey): Yantra | undefined {
  return YANTRAS.find((y) => y.planet === planet);
}

// ─── Japa scheduler ──────────────────────────────────────────────────────────
// A "mala" = 108 beads. Given a total japa target and daily malas the user
// can commit to, compute duration & daily minute-load (assume ~7 min per mala
// at a comfortable pace).

export type JapaPlan = {
  totalJapa: number;
  dailyMalas: number;
  dailyJapa: number;
  daysToComplete: number;
  minutesPerDay: number;
  bestTime: string;
  bestDirection: "E" | "N" | "NE";
};

export function planJapa(opts: {
  totalJapa: number;
  dailyMalas: number;
  planet?: PlanetKey;
}): JapaPlan {
  const daily = Math.max(1, opts.dailyMalas) * 108;
  const days = Math.max(1, Math.ceil(opts.totalJapa / daily));
  const minutes = Math.round(opts.dailyMalas * 7);
  const bestTime =
    opts.planet === "Sun" ? "Brahma muhurta (04:30-06:00)"
    : opts.planet === "Moon" ? "Evening moonrise"
    : opts.planet === "Saturn" ? "Sunset"
    : opts.planet === "Jupiter" ? "Morning 07:00-09:00"
    : "Sunrise or Brahma muhurta";
  const dir: JapaPlan["bestDirection"] =
    opts.planet === "Saturn" ? "N" :
    opts.planet === "Jupiter" || opts.planet === "Moon" ? "NE" : "E";
  return {
    totalJapa: opts.totalJapa,
    dailyMalas: opts.dailyMalas,
    dailyJapa: daily,
    daysToComplete: days,
    minutesPerDay: minutes,
    bestTime,
    bestDirection: dir,
  };
}
