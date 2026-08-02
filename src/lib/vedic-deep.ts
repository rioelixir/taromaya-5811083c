// Kundli deep extensions:
// • Ashtakavarga — Bhinna (per planet) + Sarva (all seven combined)
// • Shadbala   — six-fold planetary strength (in Rupas)
// • KP sub-lords — Krishnamurti Paddhati star-sub-sub scheme
// • Lal Kitab  — house-by-house planetary reading + remedies
// • Gemstone & Rudraksha recommendations
//
// All logic is deterministic and classical. Formulas are simplified where full
// Parashari calculations depend on data we don't compute (siddhanta sunrise,
// exact sun-moon-angle Paksha bala factors) but the ratios remain faithful.

import type { KundliChart, PlanetName } from "./vedic";

const norm12 = (n: number) => ((n % 12) + 12) % 12;

const PLANETS7: PlanetName[] = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];

// ────────────────────────────────────────────────────────────────
// 1. ASHTAKAVARGA
// Classical Parashari benefic-point tables. For each contributor
// (Sun/Moon/Mars/Merc/Jup/Ven/Sat/Lagna) the array lists the 1-based
// house numbers from THAT contributor that receive a bindu for the
// planet whose table this is.
// ────────────────────────────────────────────────────────────────
type Table = { Sun:number[]; Moon:number[]; Mars:number[]; Mercury:number[]; Jupiter:number[]; Venus:number[]; Saturn:number[]; Lagna:number[] };

const TABLES: Record<PlanetName, Table> = {
  Sun: {
    Sun:     [1,2,4,7,8,9,10,11],
    Moon:    [3,6,10,11],
    Mars:    [1,2,4,7,8,9,10,11],
    Mercury: [3,5,6,9,10,11,12],
    Jupiter: [5,6,9,11],
    Venus:   [6,7,12],
    Saturn:  [1,2,4,7,8,9,10,11],
    Lagna:   [3,4,6,10,11,12],
  },
  Moon: {
    Sun:     [3,6,7,8,10,11],
    Moon:    [1,3,6,7,9,10,11],
    Mars:    [2,3,5,6,9,10,11],
    Mercury: [1,3,4,5,7,8,10,11],
    Jupiter: [1,4,7,8,10,11,12],
    Venus:   [3,4,5,7,9,10,11],
    Saturn:  [3,5,6,11],
    Lagna:   [3,6,10,11],
  },
  Mars: {
    Sun:     [3,5,6,10,11],
    Moon:    [3,6,11],
    Mars:    [1,2,4,7,8,10,11],
    Mercury: [3,5,6,11],
    Jupiter: [6,10,11,12],
    Venus:   [6,8,11,12],
    Saturn:  [1,4,7,8,9,10,11],
    Lagna:   [1,3,6,10,11],
  },
  Mercury: {
    Sun:     [5,6,9,11,12],
    Moon:    [2,4,6,8,10,11],
    Mars:    [1,2,4,7,8,9,10,11],
    Mercury: [1,3,5,6,9,10,11,12],
    Jupiter: [6,8,11,12],
    Venus:   [1,2,3,4,5,8,9,11],
    Saturn:  [1,2,4,7,8,9,10,11],
    Lagna:   [1,2,4,6,8,10,11],
  },
  Jupiter: {
    Sun:     [1,2,3,4,7,8,9,10,11],
    Moon:    [2,5,7,9,11],
    Mars:    [1,2,4,7,8,10,11],
    Mercury: [1,2,4,5,6,9,10,11],
    Jupiter: [1,2,3,4,7,8,10,11],
    Venus:   [2,5,6,9,10,11],
    Saturn:  [3,5,6,12],
    Lagna:   [1,2,4,5,6,7,9,10,11],
  },
  Venus: {
    Sun:     [8,11,12],
    Moon:    [1,2,3,4,5,8,9,11,12],
    Mars:    [3,5,6,9,11,12],
    Mercury: [3,5,6,9,11],
    Jupiter: [5,8,9,10,11],
    Venus:   [1,2,3,4,5,8,9,10,11],
    Saturn:  [3,4,5,8,9,10,11],
    Lagna:   [1,2,3,4,5,8,9,11],
  },
  Saturn: {
    Sun:     [1,2,4,7,8,10,11],
    Moon:    [3,6,11],
    Mars:    [3,5,6,10,11,12],
    Mercury: [6,8,9,10,11,12],
    Jupiter: [5,6,11,12],
    Venus:   [6,11,12],
    Saturn:  [3,5,6,11],
    Lagna:   [1,3,4,6,10,11],
  },
  // Rahu/Ketu do not have Ashtakavarga tables in classical Parashari.
  Rahu: { Sun:[], Moon:[], Mars:[], Mercury:[], Jupiter:[], Venus:[], Saturn:[], Lagna:[] },
  Ketu: { Sun:[], Moon:[], Mars:[], Mercury:[], Jupiter:[], Venus:[], Saturn:[], Lagna:[] },
};

export type BhinnaAV = { planet: PlanetName; bindus: number[]; total: number };
export type Ashtakavarga = { bhinna: BhinnaAV[]; sarva: number[]; sarvaTotal: number };

export function computeAshtakavarga(chart: KundliChart): Ashtakavarga {
  const positions: Record<string, number> = {};
  chart.planets.forEach((p) => (positions[p.name] = p.rashi));
  positions["Lagna"] = chart.ascendant.rashi;

  const bhinna: BhinnaAV[] = PLANETS7.map((planet) => {
    const bindus = new Array(12).fill(0);
    const tbl = TABLES[planet];
    (Object.keys(tbl) as (keyof Table)[]).forEach((ref) => {
      const refSign = positions[ref];
      if (refSign === undefined) return;
      tbl[ref].forEach((h) => {
        const sign = norm12(refSign + (h - 1));
        bindus[sign] += 1;
      });
    });
    return { planet, bindus, total: bindus.reduce((a, b) => a + b, 0) };
  });

  const sarva = new Array(12).fill(0);
  bhinna.forEach((b) => b.bindus.forEach((v, i) => (sarva[i] += v)));
  return { bhinna, sarva, sarvaTotal: sarva.reduce((a, b) => a + b, 0) };
}

// ────────────────────────────────────────────────────────────────
// 2. SHADBALA (six-fold strength, in Rupas)
// Simplified classical formulas — internally consistent, faithful ratios.
// ────────────────────────────────────────────────────────────────

// Exaltation degrees (sidereal). Debilitation = +180°.
const EXALT: Record<PlanetName, number> = {
  Sun: 10, Moon: 33, Mars: 298, Mercury: 165,
  Jupiter: 95, Venus: 357, Saturn: 200,
  Rahu: 60, Ketu: 240,
};

// Own signs (0-based).
const OWN_SIGNS: Record<PlanetName, number[]> = {
  Sun:[4], Moon:[3], Mars:[0,7], Mercury:[2,5], Jupiter:[8,11],
  Venus:[1,6], Saturn:[9,10], Rahu:[], Ketu:[],
};

// Directional strength — house where planet gets full Dig bala.
const DIG_HOUSE: Record<PlanetName, number> = {
  Sun: 10, Mars: 10, Moon: 4, Venus: 4,
  Mercury: 1, Jupiter: 1, Saturn: 7, Rahu: 0, Ketu: 0,
};

// Natural strength (Naisargika) — Rupas, Parashari order.
const NAISARGIKA: Record<PlanetName, number> = {
  Sun: 0.60, Moon: 0.51, Venus: 0.43, Jupiter: 0.34,
  Mercury: 0.26, Mars: 0.17, Saturn: 0.09, Rahu: 0, Ketu: 0,
};

export type ShadbalaRow = {
  planet: PlanetName;
  sthana: number;   // positional
  dig: number;      // directional
  kala: number;     // temporal
  chesta: number;   // motional
  naisargika: number;
  drig: number;     // aspectual
  total: number;
  required: number;
  ratio: number;    // total / required
};

const REQUIRED: Record<PlanetName, number> = {
  Sun: 6.5, Moon: 6.0, Mars: 5.0, Mercury: 7.0,
  Jupiter: 6.5, Venus: 5.5, Saturn: 5.0, Rahu: 0, Ketu: 0,
};

export function computeShadbala(chart: KundliChart): ShadbalaRow[] {
  const ascRashi = chart.ascendant.rashi;
  return PLANETS7.map((name) => {
    const p = chart.planets.find((x) => x.name === name)!;
    const houseNo = norm12(p.rashi - ascRashi) + 1;

    // Sthana bala — exaltation proximity + own-sign bonus.
    const distFromExalt = Math.min(
      Math.abs(p.longitude - EXALT[name]),
      360 - Math.abs(p.longitude - EXALT[name]),
    );
    let sthana = (1 - distFromExalt / 180) * 1.0; // 0..1 rupa
    if (OWN_SIGNS[name].includes(p.rashi)) sthana += 0.5;

    // Dig bala — full strength in DIG_HOUSE, zero opposite it.
    const digArc = Math.min(
      Math.abs(houseNo - DIG_HOUSE[name]),
      12 - Math.abs(houseNo - DIG_HOUSE[name]),
    );
    const dig = (1 - digArc / 6) * 1.0; // 0..1 rupa

    // Kala bala — a light proxy: benefics stronger at night, malefics by day.
    // Without exact sunrise we approximate from the Sun's house: houses 7-12
    // from the ascendant are above the horizon (Sun visible = day birth),
    // houses 1-6 are below the horizon (night birth).
    const sun = chart.planets[0];
    const sunHouse = norm12(sun.rashi - ascRashi) + 1;
    const isDayChart = sunHouse >= 7;
    const isBenefic = name === "Jupiter" || name === "Venus" || name === "Moon" || name === "Mercury";
    const kala = (isDayChart === isBenefic ? 0.7 : 1.2); // 0..1.5 rupas

    // Chesta bala — retrograde planets get full chesta.
    const chesta = p.retrograde ? 1.0 : (name === "Sun" || name === "Moon" ? 0.8 : 0.5); // 0..1 rupa

    // Naisargika — classical.
    const naisargika = NAISARGIKA[name];

    // Drig bala — from aspecting benefic/malefic count around planet.
    // Every planet casts a 7th-house (opposition) aspect; Mars also casts
    // special aspects to houses 4 and 8, Jupiter to 5 and 9, Saturn to 3 and 10
    // (the classical Parashari special-aspect rule).
    let drig = 0.5; // 0..1 rupa
    chart.planets.forEach((q) => {
      if (q.name === name) return;
      const diff = norm12(q.rashi - p.rashi) + 1;
      const isMalefic = q.name === "Sun" || q.name === "Mars" || q.name === "Saturn" || q.name === "Rahu" || q.name === "Ketu";
      if ([7].includes(diff)) drig += isMalefic ? -0.15 : 0.15;
      if ([5, 9].includes(diff) && q.name === "Jupiter") drig += 0.2;
      if ([4, 8].includes(diff) && q.name === "Mars") drig -= 0.15;
      if ([3, 10].includes(diff) && q.name === "Saturn") drig -= 0.15;
    });
    drig = Math.max(0, drig);

    const total = sthana + dig + kala + chesta + naisargika + drig;
    return {
      planet: name, sthana, dig, kala, chesta, naisargika, drig,
      total, required: REQUIRED[name], ratio: total / REQUIRED[name],
    };
  });
}

// ────────────────────────────────────────────────────────────────
// 3. KP (Krishnamurti Paddhati) sub-lords
// Nakshatra spans 13°20′. Within each nakshatra Vimshottari proportions
// of the 9 planets carve out sub, sub-sub etc.
// ────────────────────────────────────────────────────────────────

const VIM_ORDER: PlanetName[] = ["Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"];
const VIM_YEARS: Record<PlanetName, number> = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
  Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
};
const NAK_LORD_INDEX = (nak: number) => nak % 9; // Ashwini→Ketu(0), Bharani→Venus(1)…

export type KPPosition = {
  who: string;               // "Sun", "Ascendant", …
  sign: string;
  nakshatra: string;
  starLord: PlanetName;
  subLord: PlanetName;
  subSubLord: PlanetName;
};

function kpSubForLongitude(longitude: number): { starLord: PlanetName; subLord: PlanetName; subSubLord: PlanetName; nakIndex: number } {
  const NAK_SPAN = 360 / 27;
  const nakIndex = Math.floor(longitude / NAK_SPAN);
  const degInNak = longitude - nakIndex * NAK_SPAN;
  const starLord = VIM_ORDER[NAK_LORD_INDEX(nakIndex)];

  // Sub-lord: proportional distribution of 120 years across 13°20′.
  const proportionYears = (degInNak / NAK_SPAN) * 120;
  const startIdx = VIM_ORDER.indexOf(starLord);
  let elapsed = 0;
  let subLord: PlanetName = starLord;
  let subSpanYears = 0;
  let subStartYears = 0;
  for (let k = 0; k < 9; k++) {
    const idx = (startIdx + k) % 9;
    const pl = VIM_ORDER[idx];
    const yrs = VIM_YEARS[pl];
    if (elapsed + yrs > proportionYears) {
      subLord = pl;
      subSpanYears = yrs;
      subStartYears = elapsed;
      break;
    }
    elapsed += yrs;
  }

  // Sub-sub lord.
  const subProgressYears = proportionYears - subStartYears;
  const subStartIdx = VIM_ORDER.indexOf(subLord);
  let e2 = 0;
  let subSubLord: PlanetName = subLord;
  for (let k = 0; k < 9; k++) {
    const idx = (subStartIdx + k) % 9;
    const pl = VIM_ORDER[idx];
    const yrs = (VIM_YEARS[pl] / 120) * subSpanYears;
    if (e2 + yrs > subProgressYears) {
      subSubLord = pl;
      break;
    }
    e2 += yrs;
  }

  return { starLord, subLord, subSubLord, nakIndex };
}

export function computeKP(chart: KundliChart, nakNames: readonly string[], rashiNames: readonly string[]): KPPosition[] {
  const rows: KPPosition[] = [];
  // Ascendant first.
  const a = kpSubForLongitude(chart.ascendant.longitude);
  rows.push({
    who: "Ascendant",
    sign: rashiNames[chart.ascendant.rashi],
    nakshatra: nakNames[a.nakIndex],
    starLord: a.starLord, subLord: a.subLord, subSubLord: a.subSubLord,
  });
  chart.planets.forEach((p) => {
    const r = kpSubForLongitude(p.longitude);
    rows.push({
      who: p.name,
      sign: rashiNames[p.rashi],
      nakshatra: nakNames[r.nakIndex],
      starLord: r.starLord, subLord: r.subLord, subSubLord: r.subSubLord,
    });
  });
  return rows;
}

// ────────────────────────────────────────────────────────────────
// 4. LAL KITAB — house-wise planet condition + remedies.
// Traditional principles: strong / weak / mixed based on house, plus canonical remedies.
// ────────────────────────────────────────────────────────────────

const LK_STRONG_HOUSES: Record<PlanetName, number[]> = {
  Sun:[1,3,4,10,11],
  Moon:[2,4,9,10],
  Mars:[3,6,10,11],
  Mercury:[1,4,5,9,10,11],
  Jupiter:[1,2,4,5,9,10,11],
  Venus:[2,3,4,5,7,11,12],
  Saturn:[2,3,7,10,11,12],
  Rahu:[3,6,10,11],
  Ketu:[3,6,9,12],
};

const LK_WEAK_HOUSES: Record<PlanetName, number[]> = {
  Sun:[6,8,12],
  Moon:[6,8,10],
  Mars:[4,7,8],
  Mercury:[3,6,7,8],
  Jupiter:[3,6,7,8],
  Venus:[6,8,9],
  Saturn:[1,4,5,8],
  Rahu:[1,5,8,9],
  Ketu:[1,2,4,5,7,8],
};

const LK_REMEDIES: Record<PlanetName, string> = {
  Sun: "Offer water to the rising Sun daily; place a copper coin in a red cloth; respect your father and elders.",
  Moon: "Serve mother; keep silver in your pocket; drink milk from a silver vessel; avoid grey clothes on Mondays.",
  Mars: "Feed sweetened rice to birds; keep tandoori roti under your pillow briefly then feed to a dog; wear red on Tuesdays.",
  Mercury: "Feed green fodder to cows; keep a whole green cardamom in your wallet; avoid wearing pure green on Wednesdays if Mercury is weak.",
  Jupiter: "Apply a saffron tilak; donate turmeric or gram-flour laddoos on Thursdays; respect teachers and gurus.",
  Venus: "Serve cows; donate curd or white cloth on Fridays; keep a small silver coin with you; maintain sensory cleanliness.",
  Saturn: "Feed crows and dogs; keep a piece of iron nail; light a mustard-oil lamp on Saturdays; serve the elderly and labourers.",
  Rahu: "Donate coconut in flowing water; keep a silver square with you; avoid alcohol and animal food where possible.",
  Ketu: "Feed dogs; keep a two-coloured blanket for cold nights; wear silver on the right hand; care for stray animals.",
};

export type LalKitabRow = {
  planet: PlanetName;
  house: number;
  rashi: string;
  status: "Strong" | "Weak" | "Mixed";
  reading: string;
  remedy: string;
};

export function computeLalKitab(chart: KundliChart, rashiNames: readonly string[]): LalKitabRow[] {
  const asc = chart.ascendant.rashi;
  return chart.planets.map((p) => {
    const house = norm12(p.rashi - asc) + 1;
    const strong = LK_STRONG_HOUSES[p.name]?.includes(house) ?? false;
    const weak = LK_WEAK_HOUSES[p.name]?.includes(house) ?? false;
    let status: LalKitabRow["status"] = "Mixed";
    if (strong && !weak) status = "Strong";
    else if (weak && !strong) status = "Weak";
    const reading =
      status === "Strong"
        ? `${p.name} operates on its higher octave from the ${ordinal(house)} house — its karakatvas flourish and support you.`
        : status === "Weak"
        ? `${p.name} struggles in the ${ordinal(house)} house — its themes may generate friction until conscious remedy is applied.`
        : `${p.name} in the ${ordinal(house)} shows a mixed signature — situationally rewarding, situationally testing.`;
    return {
      planet: p.name,
      house,
      rashi: rashiNames[p.rashi],
      status,
      reading,
      remedy: LK_REMEDIES[p.name],
    };
  });
}

function ordinal(n: number) {
  const s = ["th","st","nd","rd"], v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}

// ────────────────────────────────────────────────────────────────
// 5. GEMSTONES + RUDRAKSHA
// Traditional prescriptions keyed to Lagna lord + strongest benefic.
// ────────────────────────────────────────────────────────────────

const GEM: Record<PlanetName, { stone: string; metal: string; finger: string; day: string; mantra: string; color: string }> = {
  Sun:     { stone: "Ruby (Manik)",           metal: "Gold",          finger: "Ring",   day: "Sunday",    mantra: "Om Suryaya Namah",     color: "Deep Red" },
  Moon:    { stone: "Natural Pearl (Moti)",   metal: "Silver",        finger: "Little", day: "Monday",    mantra: "Om Chandraya Namah",   color: "Pearl White" },
  Mars:    { stone: "Red Coral (Moonga)",     metal: "Copper/Gold",   finger: "Ring",   day: "Tuesday",   mantra: "Om Angarakaya Namah",  color: "Vermilion" },
  Mercury: { stone: "Emerald (Panna)",        metal: "Gold",          finger: "Little", day: "Wednesday", mantra: "Om Budhaya Namah",     color: "Grass Green" },
  Jupiter: { stone: "Yellow Sapphire (Pukhraj)", metal: "Gold",       finger: "Index",  day: "Thursday",  mantra: "Om Gurave Namah",      color: "Golden Yellow" },
  Venus:   { stone: "Diamond / White Sapphire", metal: "Platinum/Silver", finger: "Middle", day: "Friday", mantra: "Om Shukraya Namah",   color: "Clear White" },
  Saturn:  { stone: "Blue Sapphire (Neelam)", metal: "Panchdhatu",    finger: "Middle", day: "Saturday",  mantra: "Om Shanaischaraya Namah", color: "Royal Blue" },
  Rahu:    { stone: "Hessonite (Gomed)",      metal: "Silver",        finger: "Middle", day: "Saturday",  mantra: "Om Rahave Namah",      color: "Honey Amber" },
  Ketu:    { stone: "Cat's Eye (Lehsunia)",   metal: "Silver",        finger: "Middle", day: "Tuesday",   mantra: "Om Ketave Namah",      color: "Yellow-Green" },
};

const RUDRAKSHA: Record<PlanetName, { mukhi: string; benefit: string }> = {
  Sun:     { mukhi: "1 or 12 Mukhi",  benefit: "Radiance, authority, healing of the eyes and heart." },
  Moon:    { mukhi: "2 Mukhi",        benefit: "Emotional peace, restful sleep, harmony in relationships." },
  Mars:    { mukhi: "3 Mukhi",        benefit: "Courage, purification of past karma, freedom from anger." },
  Mercury: { mukhi: "4 Mukhi",        benefit: "Sharp intellect, clear communication, learning power." },
  Jupiter: { mukhi: "5 Mukhi",        benefit: "Wisdom, blood pressure balance, spiritual growth." },
  Venus:   { mukhi: "6 Mukhi",        benefit: "Charm, artistic gifts, marital happiness." },
  Saturn:  { mukhi: "7 or 14 Mukhi",  benefit: "Removal of obstacles, prosperity, protection." },
  Rahu:    { mukhi: "8 Mukhi",        benefit: "Removes hidden fears, breaks addictions, wisdom of Ganesha." },
  Ketu:    { mukhi: "9 Mukhi",        benefit: "Fearlessness, protection from negative influences, moksha." },
};

const RASHI_LORDS_LOCAL: PlanetName[] = [
  "Mars","Venus","Mercury","Moon","Sun","Mercury",
  "Venus","Mars","Jupiter","Saturn","Saturn","Jupiter",
];

export type GemstoneRec = {
  primary: { for: PlanetName } & typeof GEM["Sun"];
  supporting: { for: PlanetName } & typeof GEM["Sun"];
  rudraksha: { for: PlanetName; mukhi: string; benefit: string };
  avoid: PlanetName[];
  notes: string;
};

export function recommendGemstones(chart: KundliChart, shadbala: ShadbalaRow[]): GemstoneRec {
  const lagnaLord = RASHI_LORDS_LOCAL[chart.ascendant.rashi];
  const primary = lagnaLord;

  // Supporting: strongest benefic (Jup/Ven/Mer/Moon), not equal to primary.
  const benefics: PlanetName[] = ["Jupiter","Venus","Mercury","Moon"];
  const sorted = [...shadbala].sort((a,b) => b.ratio - a.ratio);
  const supporting =
    sorted.find((r) => benefics.includes(r.planet) && r.planet !== primary)?.planet ??
    (benefics.find((b) => b !== primary) ?? "Jupiter");

  // Avoid: the weakest malefic in chart is usually not remedied with gem.
  const malefics: PlanetName[] = ["Saturn","Mars","Sun"];
  const avoid = malefics.filter((m) => m !== primary && m !== supporting);

  return {
    primary: { for: primary, ...GEM[primary] },
    supporting: { for: supporting, ...GEM[supporting] },
    rudraksha: { for: primary, ...RUDRAKSHA[primary] },
    avoid,
    notes:
      "Wear the primary stone after energising on its planetary day at sunrise. Minimum 3–5 carats set touching the skin. Discontinue if it causes disturbance in the first 40 days.",
  };
}
