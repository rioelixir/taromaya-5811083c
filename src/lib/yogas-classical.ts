// Classical yoga library — Parashari combinations beyond the core set already
// detected in vedic-extended.ts.
//
// References: Brihat Parashara Hora Shastra (chapters on Raja, Dhana, Nabhasa
// and Chandra yogas), Phaladeepika (ch. 6-7), Jataka Parijata.
//
// Every detector returns a Yoga record with present=true/false so the UI can
// show what is absent as well as what is present, and each detail line states
// the reason in plain language.

import type { KundliChart, Planet, PlanetName } from "./vedic";
import { RASHIS, RASHI_LORDS } from "./vedic";
import type { Yoga } from "./vedic-extended";

const BENEFICS: PlanetName[] = ["Jupiter", "Venus", "Mercury", "Moon"];
const MALEFICS: PlanetName[] = ["Sun", "Mars", "Saturn", "Rahu", "Ketu"];

const EXALT: Partial<Record<PlanetName, number>> = {
  Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6,
};
const OWN: Partial<Record<PlanetName, number[]>> = {
  Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5],
  Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10],
};
const MOOLATRIKONA: Partial<Record<PlanetName, number>> = {
  Sun: 4, Moon: 1, Mars: 0, Mercury: 5, Jupiter: 8, Venus: 6, Saturn: 10,
};

const KENDRAS = [1, 4, 7, 10];
const TRIKONAS = [1, 5, 9];
const DUSTHANAS = [6, 8, 12];

// Movable (chara), fixed (sthira), dual (dwisvabhava) signs.
const MOVABLE = [0, 3, 6, 9];
const FIXED = [1, 4, 7, 10];
const DUAL = [2, 5, 8, 11];

const REAL_PLANETS: PlanetName[] = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn",
];

type Ctx = {
  chart: KundliChart;
  asc: number;
  house: (p: PlanetName) => number;
  sign: (p: PlanetName) => number;
  planet: (p: PlanetName) => Planet;
  lordOfHouse: (h: number) => PlanetName;
  houseOfSign: (s: number) => number;
  planetsIn: (h: number) => Planet[];
  dignity: (p: PlanetName) => "exalted" | "moolatrikona" | "own" | "other";
  aspects: (a: PlanetName, b: PlanetName) => boolean;
};

function makeCtx(chart: KundliChart): Ctx {
  const asc = chart.ascendant.rashi;
  const byName = new Map(chart.planets.map((p) => [p.name, p] as const));
  const planet = (n: PlanetName) => byName.get(n)!;
  const sign = (n: PlanetName) => planet(n).rashi;
  const houseOfSign = (s: number) => ((s - asc + 12) % 12) + 1;
  const house = (n: PlanetName) => houseOfSign(sign(n));
  const lordOfHouse = (h: number) => RASHI_LORDS[(asc + h - 1) % 12] as PlanetName;
  const planetsIn = (h: number) => chart.planets.filter((p) => houseOfSign(p.rashi) === h);
  const dignity = (n: PlanetName) => {
    const s = sign(n);
    if (EXALT[n] === s) return "exalted" as const;
    if (MOOLATRIKONA[n] === s) return "moolatrikona" as const;
    if ((OWN[n] ?? []).includes(s)) return "own" as const;
    return "other" as const;
  };
  // Whole-sign Parashari drishti: everyone sees the 7th; Mars 4/8,
  // Jupiter 5/9, Saturn 3/10 in addition.
  const aspects = (a: PlanetName, b: PlanetName) => {
    const from = house(a), to = house(b);
    const rel = ((to - from + 12) % 12) + 1;
    if (rel === 7) return true;
    if (a === "Mars" && (rel === 4 || rel === 8)) return true;
    if (a === "Jupiter" && (rel === 5 || rel === 9)) return true;
    if (a === "Saturn" && (rel === 3 || rel === 10)) return true;
    return false;
  };
  return { chart, asc, house, sign, planet, lordOfHouse, houseOfSign, planetsIn, dignity, aspects };
}

const mk = (
  name: string,
  category: Yoga["category"],
  present: boolean,
  yes: string,
  no: string,
): Yoga => ({ name, category, present, detail: present ? yes : no });

// ─────────────────────────────────────────────────────────────
// 1. Panch Mahapurusha yogas — a planet in own sign, moolatrikona or
//    exaltation while occupying a kendra from the ascendant.
// ─────────────────────────────────────────────────────────────
const MAHAPURUSHA: { planet: PlanetName; name: string; gift: string }[] = [
  { planet: "Mars",    name: "Ruchaka Yoga", gift: "physical courage, command and a competitive career" },
  { planet: "Mercury", name: "Bhadra Yoga",  gift: "sharp intelligence, trade sense and articulate speech" },
  { planet: "Jupiter", name: "Hamsa Yoga",   gift: "moral authority, teaching ability and respected counsel" },
  { planet: "Venus",   name: "Malavya Yoga", gift: "comfort, refinement, artistic taste and marital happiness" },
  { planet: "Saturn",  name: "Sasa Yoga",    gift: "administrative endurance, land and long-term authority" },
];

function panchMahapurusha(c: Ctx): Yoga[] {
  return MAHAPURUSHA.map(({ planet, name, gift }) => {
    const dig = c.dignity(planet);
    const h = c.house(planet);
    const present = dig !== "other" && KENDRAS.includes(h);
    return mk(name, "royal", present,
      `${planet} sits ${dig} in ${RASHIS[c.sign(planet)]} in house ${h} (an angle) — grants ${gift}.`,
      `${planet} is not both dignified and in an angle (currently ${dig}, house ${h}).`);
  });
}

// ─────────────────────────────────────────────────────────────
// 2. Chandra yogas from the Moon — Sunapha, Anapha, Durudhura.
// ─────────────────────────────────────────────────────────────
function chandraYogas(c: Ctx): Yoga[] {
  const moonHouse = c.house("Moon");
  const rel = (h: number) => ((h - moonHouse + 12) % 12) + 1;
  const others = c.chart.planets.filter((p) => p.name !== "Moon" && p.name !== "Rahu" && p.name !== "Ketu");
  const second = others.filter((p) => rel(c.houseOfSign(p.rashi)) === 2);
  const twelfth = others.filter((p) => rel(c.houseOfSign(p.rashi)) === 12);

  return [
    mk("Sunapha Yoga", "wealth", second.length > 0 && twelfth.length === 0,
      `${second.map((p) => p.name).join(", ")} in the 2nd from the Moon — earnings build steadily from the person's own effort.`,
      "No planet stands alone in the 2nd from the Moon."),
    mk("Anapha Yoga", "auspicious", twelfth.length > 0 && second.length === 0,
      `${twelfth.map((p) => p.name).join(", ")} in the 12th from the Moon — a generous, well-regarded nature with comfort in later life.`,
      "No planet stands alone in the 12th from the Moon."),
    mk("Durudhura Yoga", "wealth", second.length > 0 && twelfth.length > 0,
      `Planets flank the Moon on both sides (${second.map((p) => p.name).join(", ")} and ${twelfth.map((p) => p.name).join(", ")}) — money arrives and leaves in equal measure, so saving must be deliberate.`,
      "The Moon is not flanked on both sides."),
    mk("Kemadruma (both sides empty)", "challenging", second.length === 0 && twelfth.length === 0,
      "Both the 2nd and 12th from the Moon are empty — support has to be built consciously rather than inherited.",
      "The Moon has company on at least one side, so Kemadruma does not apply."),
  ];
}

// ─────────────────────────────────────────────────────────────
// 3. Solar yogas — Vesi, Vasi, Ubhayachari.
// ─────────────────────────────────────────────────────────────
function solarYogas(c: Ctx): Yoga[] {
  const sunHouse = c.house("Sun");
  const rel = (h: number) => ((h - sunHouse + 12) % 12) + 1;
  const others = c.chart.planets.filter(
    (p) => p.name !== "Sun" && p.name !== "Moon" && p.name !== "Rahu" && p.name !== "Ketu");
  const second = others.filter((p) => rel(c.houseOfSign(p.rashi)) === 2);
  const twelfth = others.filter((p) => rel(c.houseOfSign(p.rashi)) === 12);
  return [
    mk("Vesi Yoga", "auspicious", second.length > 0,
      `${second.map((p) => p.name).join(", ")} in the 2nd from the Sun — steady speech and a truthful public reputation.`,
      "The 2nd from the Sun is empty."),
    mk("Vasi Yoga", "auspicious", twelfth.length > 0,
      `${twelfth.map((p) => p.name).join(", ")} in the 12th from the Sun — skill, charity and recognition through service.`,
      "The 12th from the Sun is empty."),
    mk("Ubhayachari Yoga", "royal", second.length > 0 && twelfth.length > 0,
      "The Sun is flanked on both sides — balanced strength, wide contacts and a well-rounded public life.",
      "The Sun is not flanked on both sides."),
  ];
}

// ─────────────────────────────────────────────────────────────
// 4. Raja yogas from house-lord relationships.
// ─────────────────────────────────────────────────────────────
function rajaYogas(c: Ctx): Yoga[] {
  const out: Yoga[] = [];

  // Kendra-Trikona: a kendra lord and a trikona lord conjunct, exchange
  // signs, or aspect each other.
  {
    const pairs: string[] = [];
    for (const k of KENDRAS) {
      for (const t of TRIKONAS) {
        if (k === t) continue; // the 1st is both; needs two distinct houses
        const kl = c.lordOfHouse(k), tl = c.lordOfHouse(t);
        if (kl === tl) continue;
        const conj = c.house(kl) === c.house(tl);
        const exch = c.houseOfSign(c.sign(kl)) === t && c.houseOfSign(c.sign(tl)) === k;
        const asp = c.aspects(kl, tl) || c.aspects(tl, kl);
        if (conj || exch || asp) {
          pairs.push(`${kl} (lord of ${k}) with ${tl} (lord of ${t}) by ${conj ? "conjunction" : exch ? "sign exchange" : "aspect"}`);
        }
      }
    }
    out.push(mk("Kendra-Trikona Raja Yoga", "royal", pairs.length > 0,
      `${pairs.slice(0, 3).join("; ")} — status rises through recognised competence rather than luck alone.`,
      "No angle lord and triangle lord are linked, so status is built one step at a time."));
  }

  // Dharma-Karmadhipati: 9th and 10th lords linked.
  {
    const l9 = c.lordOfHouse(9), l10 = c.lordOfHouse(10);
    const conj = l9 !== l10 && c.house(l9) === c.house(l10);
    const exch = c.houseOfSign(c.sign(l9)) === 10 && c.houseOfSign(c.sign(l10)) === 9;
    const asp = l9 !== l10 && (c.aspects(l9, l10) || c.aspects(l10, l9));
    const present = conj || exch || asp || l9 === l10;
    out.push(mk("Dharma-Karmadhipati Yoga", "royal", present,
      l9 === l10
        ? `${l9} rules both the 9th and the 10th — fortune and profession advance together.`
        : `${l9} (9th lord) and ${l10} (10th lord) are linked by ${conj ? "conjunction" : exch ? "exchange" : "aspect"} — ethical work brings lasting position.`,
      `${l9} and ${l10} are unconnected — luck and career progress on separate tracks.`));
  }

  // Amala Yoga — a natural benefic in the 10th from Lagna or from the Moon.
  {
    const fromLagna = c.planetsIn(10).filter((p) => BENEFICS.includes(p.name));
    const moonHouse = c.house("Moon");
    const tenthFromMoon = ((moonHouse + 9 - 1) % 12) + 1;
    const fromMoon = c.planetsIn(tenthFromMoon).filter((p) => BENEFICS.includes(p.name));
    const hits = [...fromLagna, ...fromMoon].map((p) => p.name);
    out.push(mk("Amala Yoga", "auspicious", hits.length > 0,
      `${Array.from(new Set(hits)).join(", ")} occupies the 10th from the ascendant or the Moon — a clean reputation that survives scrutiny.`,
      "No benefic holds the 10th from the ascendant or the Moon."));
  }

  // Chatussagara — planets in all four kendras.
  {
    const filled = KENDRAS.filter((h) => c.planetsIn(h).length > 0);
    out.push(mk("Chatussagara Yoga", "royal", filled.length === 4,
      "All four angles are occupied — wide reach, travel and durable prosperity.",
      `Only angles ${filled.join(", ") || "none"} are occupied, so influence is concentrated rather than wide.`));
  }

  // Kalanidhi — Jupiter in the 2nd or 5th, in or aspected by Venus/Mercury signs.
  {
    const jh = c.house("Jupiter");
    const inPlace = jh === 2 || jh === 5;
    const withVenMerc = c.house("Venus") === jh || c.house("Mercury") === jh
      || c.aspects("Venus", "Jupiter") || c.aspects("Mercury", "Jupiter");
    const present = inPlace && withVenMerc;
    out.push(mk("Kalanidhi Yoga", "wealth", present,
      `Jupiter in house ${jh} joined or aspected by Venus or Mercury — learning converts into income and social grace.`,
      "Jupiter is not placed in the 2nd or 5th with Venus or Mercury support."));
  }

  // Lagnadhi Yoga — benefics in the 7th and 8th from the Moon.
  {
    const mh = c.house("Moon");
    const h7 = ((mh + 6 - 1) % 12) + 1, h8 = ((mh + 7 - 1) % 12) + 1;
    const a = c.planetsIn(h7).filter((p) => BENEFICS.includes(p.name));
    const b = c.planetsIn(h8).filter((p) => BENEFICS.includes(p.name));
    out.push(mk("Lagnadhi Yoga", "auspicious", a.length > 0 && b.length > 0,
      "Benefics hold the 7th and 8th from the Moon — peace of mind, a supportive partner and freedom from enemies.",
      "The 7th and 8th from the Moon are not both held by benefics."));
  }

  return out;
}

// ─────────────────────────────────────────────────────────────
// 5. Named Vipreet yogas — Harsha, Sarala, Vimala.
// ─────────────────────────────────────────────────────────────
function vipreetNamed(c: Ctx): Yoga[] {
  const spec: { house: number; name: string; gift: string }[] = [
    { house: 6,  name: "Harsha Yoga", gift: "victory over rivals, good health and gains through competition" },
    { house: 8,  name: "Sarala Yoga", gift: "longevity, fearlessness and benefit from other people's resources" },
    { house: 12, name: "Vimala Yoga", gift: "low expenses, independence and a private, self-directed life" },
  ];
  return spec.map(({ house, name, gift }) => {
    const lord = c.lordOfHouse(house);
    const lh = c.house(lord);
    const present = DUSTHANAS.includes(lh);
    return mk(name, "royal", present,
      `${lord}, lord of the ${house}th, sits in house ${lh} — a difficulty cancelling another difficulty, which yields ${gift}.`,
      `${lord}, lord of the ${house}th, sits in house ${lh}, so this reversal yoga does not form.`);
  });
}

// ─────────────────────────────────────────────────────────────
// 6. Nabhasa yogas from sign distribution.
// ─────────────────────────────────────────────────────────────
function nabhasaYogas(c: Ctx): Yoga[] {
  const signs = REAL_PLANETS.map((p) => c.sign(p));
  const all = (set: number[]) => signs.every((s) => set.includes(s));
  const housesUsed = Array.from(new Set(REAL_PLANETS.map((p) => c.house(p)))).sort((a, b) => a - b);

  const out: Yoga[] = [
    mk("Rajju Yoga", "auspicious", all(MOVABLE),
      "Every planet occupies a movable sign — a mobile life with travel, relocation and frequent fresh starts.",
      "Planets are spread across sign types, so Rajju does not form."),
    mk("Musala Yoga", "royal", all(FIXED),
      "Every planet occupies a fixed sign — steadiness, honour and slow, permanent accumulation.",
      "Planets are spread across sign types, so Musala does not form."),
    mk("Nala Yoga", "auspicious", all(DUAL),
      "Every planet occupies a dual sign — adaptability, skill in two trades and success through negotiation.",
      "Planets are spread across sign types, so Nala does not form."),
  ];

  // Mala / Srak — benefics in three angles.
  const beneficKendras = KENDRAS.filter((h) =>
    c.planetsIn(h).some((p) => BENEFICS.includes(p.name)));
  out.push(mk("Mala Yoga", "auspicious", beneficKendras.length >= 3,
    `Benefics occupy angles ${beneficKendras.join(", ")} — continuous comfort and pleasant company.`,
    `Benefics occupy only ${beneficKendras.length} angle(s), so Mala does not form.`));

  // Gola / Yupa / Shoola / Kedara family — planet spread across houses.
  const span = housesUsed.length;
  out.push(mk("Gola Yoga (single-house cluster)", "challenging", span === 1,
    "All seven planets fall in one house — intense focus on a single area of life, with little spread of resources.",
    `Planets are spread over ${span} houses, so Gola does not form.`));

  return out;
}

// ─────────────────────────────────────────────────────────────
// 7. Cautionary combinations.
// ─────────────────────────────────────────────────────────────
function cautionaryYogas(c: Ctx): Yoga[] {
  const out: Yoga[] = [];

  // Shakata — Moon in the 6th, 8th or 12th from Jupiter.
  {
    const rel = ((c.house("Moon") - c.house("Jupiter") + 12) % 12) + 1;
    const present = [6, 8, 12].includes(rel);
    out.push(mk("Shakata Yoga", "challenging", present,
      `The Moon stands ${rel} houses from Jupiter — fortune arrives in waves, so reserves matter more than income.`,
      "The Moon is not in the 6th, 8th or 12th from Jupiter."));
  }

  // Daridra — 11th lord in a dusthana.
  {
    const l11 = c.lordOfHouse(11);
    const h = c.house(l11);
    const present = DUSTHANAS.includes(h);
    out.push(mk("Daridra indication", "challenging", present,
      `${l11}, lord of gains, sits in house ${h} — income leaks into obligations unless spending is tracked.`,
      `${l11}, lord of gains, sits in house ${h} — income channels are sound.`));
  }

  // Papa Kartari / Shubha Kartari on the ascendant.
  {
    const h2 = c.planetsIn(2), h12 = c.planetsIn(12);
    const papa = h2.some((p) => MALEFICS.includes(p.name)) && h12.some((p) => MALEFICS.includes(p.name));
    const shubha = h2.some((p) => BENEFICS.includes(p.name)) && h12.some((p) => BENEFICS.includes(p.name));
    out.push(mk("Papa Kartari on the ascendant", "challenging", papa,
      "Malefics sit on either side of the ascendant — progress feels boxed in until one of those areas is addressed directly.",
      "The ascendant is not hemmed between malefics."));
    out.push(mk("Shubha Kartari on the ascendant", "auspicious", shubha,
      "Benefics sit on either side of the ascendant — protection in health and reputation through most of life.",
      "The ascendant is not flanked by benefics."));
  }

  // Amavasya — Sun and Moon within 12 degrees in the same sign.
  {
    const sun = c.planet("Sun"), moon = c.planet("Moon");
    const diff = Math.abs(((sun.longitude - moon.longitude + 540) % 360) - 180);
    const present = 180 - diff < 12;
    out.push(mk("Amavasya (dark-moon birth)", "challenging", present,
      "Birth falls close to the new Moon — the inner life is private and self-worth needs deliberate building.",
      "Birth is not close to the new Moon."));
  }

  // Grahan (eclipse) contact — Sun or Moon with Rahu/Ketu in the same sign.
  {
    const nodes: PlanetName[] = ["Rahu", "Ketu"];
    const hits: string[] = [];
    for (const lum of ["Sun", "Moon"] as PlanetName[]) {
      for (const nd of nodes) {
        if (c.sign(lum) === c.sign(nd)) hits.push(`${lum} with ${nd}`);
      }
    }
    out.push(mk("Grahan indication", "challenging", hits.length > 0,
      `${hits.join(", ")} in the same sign — clarity comes in cycles, so major decisions are best reviewed twice.`,
      "Neither luminary shares a sign with the nodes."));
  }

  return out;
}

/** Full classical yoga scan. Order: strength-giving first, cautionary last. */
export function detectClassicalYogas(chart: KundliChart): Yoga[] {
  const c = makeCtx(chart);
  return [
    ...panchMahapurusha(c),
    ...rajaYogas(c),
    ...vipreetNamed(c),
    ...chandraYogas(c),
    ...solarYogas(c),
    ...nabhasaYogas(c),
    ...cautionaryYogas(c),
  ];
}
