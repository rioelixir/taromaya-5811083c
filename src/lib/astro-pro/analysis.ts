/**
 * Taromaya Astrology Pro — classical planetary and house analysis.
 *
 * Everything here follows standard Parashari rules: sign dignity, mooltrikona,
 * permanent and temporary friendship, combustion orbs, Baladi avastha,
 * directional strength and functional nature by lagna. No invented content —
 * each verdict is derived from the computed chart so a reading can always
 * name the reason behind it.
 */
import {
  RASHIS,
  RASHI_LORDS,
  NAKSHATRAS,
  formatDegree,
  type KundliChart,
  type Planet,
  type PlanetName,
} from "@/lib/vedic";

const norm12 = (x: number) => ((x % 12) + 12) % 12;

export const PLANET_ORDER: PlanetName[] = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu",
];

/** Signs each planet owns. */
const OWN: Record<PlanetName, number[]> = {
  Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5], Jupiter: [8, 11],
  Venus: [1, 6], Saturn: [9, 10], Rahu: [], Ketu: [],
};

/** Exaltation sign and its exact degree of deepest exaltation. */
const EXALT: Record<PlanetName, { sign: number; deg: number } | null> = {
  Sun: { sign: 0, deg: 10 }, Moon: { sign: 1, deg: 3 }, Mars: { sign: 9, deg: 28 },
  Mercury: { sign: 5, deg: 15 }, Jupiter: { sign: 3, deg: 5 }, Venus: { sign: 11, deg: 27 },
  Saturn: { sign: 6, deg: 20 }, Rahu: { sign: 2, deg: 20 }, Ketu: { sign: 8, deg: 20 },
};

/** Mooltrikona sign with its degree span. */
const MOOL: Record<PlanetName, { sign: number; from: number; to: number } | null> = {
  Sun: { sign: 4, from: 0, to: 20 }, Moon: { sign: 1, from: 4, to: 30 },
  Mars: { sign: 0, from: 0, to: 12 }, Mercury: { sign: 5, from: 16, to: 20 },
  Jupiter: { sign: 8, from: 0, to: 10 }, Venus: { sign: 6, from: 0, to: 15 },
  Saturn: { sign: 10, from: 0, to: 20 }, Rahu: null, Ketu: null,
};

/** Permanent (naisargika) friendship. */
const FRIENDS: Record<PlanetName, PlanetName[]> = {
  Sun: ["Moon", "Mars", "Jupiter"], Moon: ["Sun", "Mercury"],
  Mars: ["Sun", "Moon", "Jupiter"], Mercury: ["Sun", "Venus"],
  Jupiter: ["Sun", "Moon", "Mars"], Venus: ["Mercury", "Saturn"],
  Saturn: ["Mercury", "Venus"], Rahu: ["Venus", "Saturn"], Ketu: ["Mars", "Venus"],
};
const ENEMIES: Record<PlanetName, PlanetName[]> = {
  Sun: ["Venus", "Saturn"], Moon: [], Mars: ["Mercury"],
  Mercury: ["Moon"], Jupiter: ["Mercury", "Venus"], Venus: ["Sun", "Moon"],
  Saturn: ["Sun", "Moon", "Mars"], Rahu: ["Sun", "Moon", "Mars"], Ketu: ["Sun", "Moon"],
};

const COMBUST_ORB: Partial<Record<PlanetName, number>> = {
  Moon: 12, Mars: 17, Mercury: 14, Jupiter: 11, Venus: 10, Saturn: 15,
};

const NATURAL_BENEFIC: PlanetName[] = ["Jupiter", "Venus", "Moon", "Mercury"];

/** Directional strength — the house where each planet is strongest. */
const DIG_BALA_HOUSE: Partial<Record<PlanetName, number>> = {
  Jupiter: 1, Mercury: 1, Sun: 10, Mars: 10, Saturn: 7, Moon: 4, Venus: 4,
};

export const KARAKATWA: Record<PlanetName, string> = {
  Sun: "Soul, father, authority, vitality, government, bone and eyesight",
  Moon: "Mind, mother, emotion, nourishment, fluids, public life and comfort",
  Mars: "Courage, siblings, land, energy, surgery, machinery and competition",
  Mercury: "Intelligence, speech, commerce, contracts, skin, nerves and analysis",
  Jupiter: "Wisdom, teachers, children, wealth, ethics, liver and expansion",
  Venus: "Love, spouse, beauty, art, vehicles, comforts and reproductive health",
  Saturn: "Discipline, delay, labour, longevity, structure, bones and detachment",
  Rahu: "Ambition, foreign matters, technology, sudden rise and obsession",
  Ketu: "Detachment, past mastery, research, moksha and sudden loss",
};

export const PLANET_NATURE: Record<PlanetName, { element: string; gender: string; direction: string }> = {
  Sun: { element: "Fire", gender: "Masculine", direction: "East" },
  Moon: { element: "Water", gender: "Feminine", direction: "North-west" },
  Mars: { element: "Fire", gender: "Masculine", direction: "South" },
  Mercury: { element: "Earth", gender: "Neutral", direction: "North" },
  Jupiter: { element: "Ether", gender: "Masculine", direction: "North-east" },
  Venus: { element: "Water", gender: "Feminine", direction: "South-east" },
  Saturn: { element: "Air", gender: "Neutral", direction: "West" },
  Rahu: { element: "Air", gender: "Neutral", direction: "South-west" },
  Ketu: { element: "Fire", gender: "Neutral", direction: "South-west" },
};

export type Dignity =
  | "Exalted" | "Mooltrikona" | "Own sign" | "Friendly sign"
  | "Neutral sign" | "Enemy sign" | "Debilitated";

export type Avastha = "Bala" | "Kumara" | "Yuva" | "Vriddha" | "Mrita";

export type PlanetReport = {
  planet: PlanetName;
  rashi: number;
  rashiName: string;
  degree: string;
  house: number;
  nakshatra: string;
  pada: number;
  retrograde: boolean;
  combust: boolean;
  dignity: Dignity;
  avastha: Avastha;
  ownsHouses: number[];
  naturalBenefic: boolean;
  functional: "Benefic" | "Malefic" | "Mixed";
  permanentRelation: string;
  temporaryRelation: string;
  digBala: number; // 0..60
  strength: number; // 0..100 composite
  motion: string;
  lifeAreas: { area: string; note: string }[];
  positive: string;
  negative: string;
  lesson: string;
  remedy: string;
};

function dignityOf(p: Planet): Dignity {
  const ex = EXALT[p.name];
  if (ex && ex.sign === p.rashi) return "Exalted";
  if (ex && norm12(ex.sign + 6) === p.rashi) return "Debilitated";
  const mt = MOOL[p.name];
  if (mt && mt.sign === p.rashi && p.degreeInRashi >= mt.from && p.degreeInRashi <= mt.to) {
    return "Mooltrikona";
  }
  if (OWN[p.name].includes(p.rashi)) return "Own sign";
  const lord = RASHI_LORDS[p.rashi] as PlanetName;
  if (FRIENDS[p.name].includes(lord)) return "Friendly sign";
  if (ENEMIES[p.name].includes(lord)) return "Enemy sign";
  return "Neutral sign";
}

function avasthaOf(p: Planet): Avastha {
  const band = Math.min(4, Math.floor(p.degreeInRashi / 6));
  const order: Avastha[] = ["Bala", "Kumara", "Yuva", "Vriddha", "Mrita"];
  // Odd signs run forward, even signs run in reverse (Baladi avastha).
  const idx = p.rashi % 2 === 0 ? band : 4 - band;
  return order[idx] ?? "Yuva";
}

function combustOf(p: Planet, sun: Planet | undefined): boolean {
  const orb = COMBUST_ORB[p.name];
  if (!orb || !sun || p.name === "Sun") return false;
  const diff = Math.abs(((p.longitude - sun.longitude + 540) % 360) - 180);
  return 180 - diff <= orb;
}

/** Functional nature by lagna: lords of 1/5/9 help, lords of 6/8/12 obstruct. */
function functionalOf(name: PlanetName, ascSign: number): "Benefic" | "Malefic" | "Mixed" {
  if (name === "Rahu" || name === "Ketu") return "Mixed";
  const houses = OWN[name].map((s) => norm12(s - ascSign) + 1);
  const good = houses.some((h) => [1, 5, 9].includes(h));
  const bad = houses.some((h) => [6, 8, 12].includes(h));
  if (good && !bad) return "Benefic";
  if (bad && !good) return "Malefic";
  if (good && bad) return "Mixed";
  return houses.some((h) => [4, 7, 10, 2].includes(h)) ? "Benefic" : "Mixed";
}

/** Temporary friendship: planets within 6 houses of each other are friendly. */
function temporaryRelation(p: Planet, chart: KundliChart): string {
  const near = chart.planets
    .filter((o) => o.name !== p.name)
    .filter((o) => {
      const gap = Math.abs(norm12(o.rashi - p.rashi));
      return gap <= 3 || gap >= 9;
    })
    .map((o) => o.name);
  return near.length ? `Temporary friend of ${near.join(", ")}` : "No temporary friendships formed";
}

function permanentRelation(name: PlanetName): string {
  const f = FRIENDS[name].join(", ") || "none";
  const e = ENEMIES[name].join(", ") || "none";
  return `Friends: ${f}. Enemies: ${e}.`;
}

const DIGNITY_SCORE: Record<Dignity, number> = {
  Exalted: 100, Mooltrikona: 92, "Own sign": 85, "Friendly sign": 70,
  "Neutral sign": 55, "Enemy sign": 35, Debilitated: 20,
};

const AVASTHA_ADJ: Record<Avastha, number> = {
  Bala: -6, Kumara: 2, Yuva: 8, Vriddha: -4, Mrita: -12,
};

const LIFE_AREAS: Record<PlanetName, { area: string; note: string }[]> = {
  Sun: [
    { area: "Career", note: "Recognition, leadership roles and dealings with authority." },
    { area: "Health", note: "Vitality, heart, spine and eyesight." },
    { area: "Family", note: "Relationship with the father and with paternal lineage." },
  ],
  Moon: [
    { area: "Mind", note: "Emotional steadiness, sleep and how safety is felt." },
    { area: "Family", note: "The mother, home atmosphere and nurture received." },
    { area: "Public life", note: "Popularity and the ability to read a room." },
  ],
  Mars: [
    { area: "Career", note: "Drive, competition, engineering, defence and surgery." },
    { area: "Property", note: "Land, construction and immovable assets." },
    { area: "Relationships", note: "Assertion, temper and physical passion." },
  ],
  Mercury: [
    { area: "Education", note: "Analysis, writing, calculation and study capacity." },
    { area: "Business", note: "Trade, negotiation, contracts and communication work." },
    { area: "Health", note: "Nerves, skin and speech." },
  ],
  Jupiter: [
    { area: "Finance", note: "Growth of savings, advisers and lawful gain." },
    { area: "Children", note: "Progeny, mentorship and teaching." },
    { area: "Spiritual growth", note: "Ethics, faith and higher learning." },
  ],
  Venus: [
    { area: "Marriage", note: "Attraction, harmony and the quality of partnership." },
    { area: "Comforts", note: "Vehicles, art, luxury and aesthetics." },
    { area: "Health", note: "Reproductive system, kidneys and hormonal balance." },
  ],
  Saturn: [
    { area: "Career", note: "Endurance, service, systems and slow but lasting rise." },
    { area: "Timing", note: "Where life asks for patience before results arrive." },
    { area: "Health", note: "Bones, joints, teeth and chronic patterns." },
  ],
  Rahu: [
    { area: "Foreign settlement", note: "Travel abroad, immigration and unfamiliar systems." },
    { area: "Career", note: "Technology, media, speculation and unconventional routes." },
    { area: "Life lesson", note: "Where desire can outrun judgement." },
  ],
  Ketu: [
    { area: "Spiritual growth", note: "Detachment, research and inherited mastery." },
    { area: "Health", note: "Undiagnosed complaints and nervous sensitivity." },
    { area: "Life lesson", note: "Where letting go produces more than holding on." },
  ],
};

const REMEDY: Record<PlanetName, string> = {
  Sun: "Rise early, offer water to the Sun, and take responsibility publicly rather than avoiding it.",
  Moon: "Protect sleep, keep a steady daily rhythm and care for the mother figure in your life.",
  Mars: "Channel energy into physical training and disciplined work instead of confrontation.",
  Mercury: "Write things down, verify facts before speaking and keep accounts current.",
  Jupiter: "Study a classical text weekly, honour teachers and give to education.",
  Venus: "Keep agreements with your partner, maintain cleanliness and support the arts.",
  Saturn: "Serve labourers and the elderly, work steadily and avoid shortcuts.",
  Rahu: "Keep ambition inside stated ethics and avoid speculative shortcuts.",
  Ketu: "Practise regular meditation and finish what has been left incomplete.",
};

const POSITIVE: Record<Dignity, string> = {
  Exalted: "The planet operates at full capacity — its promises arrive with visible force.",
  Mooltrikona: "Strong and well-placed, so its results are dependable across the life span.",
  "Own sign": "Comfortable and self-directed, giving steady rather than dramatic results.",
  "Friendly sign": "Supported by the sign lord, so results come with help from others.",
  "Neutral sign": "Neither helped nor blocked — outcomes follow effort closely.",
  "Enemy sign": "Works against friction, so results need repeated attempts.",
  Debilitated: "Capacity is present but confidence is low, so results arrive late.",
};

const NEGATIVE: Record<Dignity, string> = {
  Exalted: "Can overreach, since strength here rarely accepts correction.",
  Mooltrikona: "May become inflexible about its own method.",
  "Own sign": "Comfort can turn into complacency.",
  "Friendly sign": "Dependence on the support of others.",
  "Neutral sign": "Results fluctuate with circumstances and company.",
  "Enemy sign": "Repeated obstruction in the areas it governs.",
  Debilitated: "Self-doubt and avoidance until the planet is consciously worked with.",
};

export function analysePlanets(chart: KundliChart): PlanetReport[] {
  const ascSign = chart.ascendant.rashi;
  const sun = chart.planets.find((p) => p.name === "Sun");
  return PLANET_ORDER.map((name): PlanetReport | null => {
    const p = chart.planets.find((x) => x.name === name);
    if (!p) return null;
    const dignity = dignityOf(p);
    const avastha = avasthaOf(p);
    const house = norm12(p.rashi - ascSign) + 1;
    const combust = combustOf(p, sun);
    const digHouse = DIG_BALA_HOUSE[name];
    const digBala = digHouse
      ? Math.round(60 - (Math.min(Math.abs(house - digHouse), 12 - Math.abs(house - digHouse)) / 6) * 60)
      : 30;
    let strength = DIGNITY_SCORE[dignity] + AVASTHA_ADJ[avastha] + (digBala - 30) / 4;
    if (combust) strength -= 12;
    if (p.retrograde && name !== "Rahu" && name !== "Ketu") strength += 4;
    strength = Math.max(5, Math.min(100, Math.round(strength)));

    return {
      planet: name,
      rashi: p.rashi,
      rashiName: RASHIS[p.rashi] ?? "",
      degree: formatDegree(p.degreeInRashi),
      house,
      nakshatra: NAKSHATRAS[p.nakshatra] ?? "",
      pada: p.pada,
      retrograde: p.retrograde,
      combust,
      dignity,
      avastha,
      ownsHouses: OWN[name].map((s) => norm12(s - ascSign) + 1),
      naturalBenefic: NATURAL_BENEFIC.includes(name),
      functional: functionalOf(name, ascSign),
      permanentRelation: permanentRelation(name),
      temporaryRelation: temporaryRelation(p, chart),
      digBala,
      strength,
      motion: p.retrograde ? "Retrograde" : name === "Rahu" || name === "Ketu" ? "Always retrograde" : "Direct",
      lifeAreas: LIFE_AREAS[name],
      positive: POSITIVE[dignity],
      negative: NEGATIVE[dignity] + (combust ? " Combustion also hides its visible results." : ""),
      lesson: KARAKATWA[name],
      remedy: REMEDY[name],
    } satisfies PlanetReport;
  }).filter((x): x is PlanetReport => x !== null);
}

/* ------------------------------ houses ------------------------------ */

export const HOUSE_MEANING: string[] = [
  "Self, body, vitality, appearance and the direction life takes",
  "Earned wealth, speech, food, family resources and self-worth",
  "Siblings, courage, short journeys, skill of hand and communication",
  "Mother, home, land, vehicles, inner peace and early schooling",
  "Children, creativity, romance, intelligence and past merit",
  "Competition, debt, disease, service, daily work and discipline",
  "Marriage, partnership, contracts, business dealings and the public",
  "Longevity, upheaval, inheritance, research and hidden matters",
  "Fortune, dharma, higher learning, teachers, long journeys and faith",
  "Career, status, authority, karma in the world and recognition",
  "Gains, network, elder siblings, hopes fulfilled and income",
  "Loss, expense, foreign lands, isolation, sleep and liberation",
];

const HOUSE_TIMING: string[] = [
  "Activated by the Dasha of the lagna lord and by transits over the rising sign.",
  "Wealth events cluster in periods of the second lord and Jupiter.",
  "Skill and sibling matters surface in Mercury and Mars periods.",
  "Home and property matters mature in Moon, Venus and fourth-lord periods.",
  "Children and creative results appear in fifth-lord and Jupiter periods.",
  "Health and debt matters peak in sixth-lord, Saturn and Mars periods.",
  "Marriage timing follows seventh-lord, Venus and Jupiter periods.",
  "Sudden change and inheritance follow eighth-lord and Saturn periods.",
  "Fortune and travel open in ninth-lord and Jupiter periods.",
  "Career turning points follow tenth-lord, Saturn and Sun periods.",
  "Income growth follows eleventh-lord and Jupiter periods.",
  "Foreign moves and withdrawal follow twelfth-lord, Rahu and Saturn periods.",
];

export type HouseReport = {
  house: number;
  sign: number;
  signName: string;
  meaning: string;
  lord: PlanetName;
  lordHouse: number;
  lordStrength: number;
  occupants: { name: PlanetName; dignity: Dignity; strength: number }[];
  strength: number;
  verdict: "Strong" | "Workable" | "Needs support";
  positives: string;
  challenges: string;
  timing: string;
  advice: string;
  remedy: string;
};

export function analyseHouses(chart: KundliChart, planets: PlanetReport[]): HouseReport[] {
  const ascSign = chart.ascendant.rashi;
  return Array.from({ length: 12 }, (_, i) => {
    const house = i + 1;
    const sign = norm12(ascSign + i);
    const lord = RASHI_LORDS[sign] as PlanetName;
    const lordReport = planets.find((p) => p.planet === lord);
    const occupants = planets
      .filter((p) => p.house === house)
      .map((p) => ({ name: p.planet, dignity: p.dignity, strength: p.strength }));
    const occAvg = occupants.length
      ? occupants.reduce((s, o) => s + o.strength, 0) / occupants.length
      : 50;
    const benefics = planets.filter((p) => p.house === house && p.naturalBenefic).length;
    const malefics = planets.filter((p) => p.house === house && !p.naturalBenefic).length;
    const strength = Math.max(
      5,
      Math.min(100, Math.round((lordReport?.strength ?? 50) * 0.55 + occAvg * 0.35 + (benefics - malefics) * 5)),
    );
    const verdict = strength >= 70 ? "Strong" : strength >= 50 ? "Workable" : "Needs support";

    return {
      house,
      sign,
      signName: RASHIS[sign] ?? "",
      meaning: HOUSE_MEANING[i] ?? "",
      lord,
      lordHouse: lordReport?.house ?? 0,
      lordStrength: lordReport?.strength ?? 0,
      occupants,
      strength,
      verdict,
      positives:
        `${lord} rules this house from house ${lordReport?.house ?? "-"} in ${lordReport?.dignity.toLowerCase() ?? "unknown"} condition` +
        (occupants.length
          ? `, with ${occupants.map((o) => o.name).join(", ")} placed here.`
          : ", with no planet occupying the house, so results follow the lord alone."),
      challenges:
        malefics > benefics
          ? "Malefic weight here asks for patience and correct process before results appear."
          : benefics > malefics
            ? "Benefic support here reduces friction; the main risk is taking the ease for granted."
            : "Mixed influences, so outcomes track the effort and company kept.",
      timing: HOUSE_TIMING[i] ?? "",
      advice:
        verdict === "Strong"
          ? "Build deliberately on this area — it will carry weight for the rest of the chart."
          : verdict === "Workable"
            ? "Results are available with consistent method rather than intensity."
            : "Treat this area as a training ground: small, repeated, verified steps.",
      remedy: lordReport?.remedy ?? "",
    } satisfies HouseReport;
  });
}

/** Overall chart score used on the dashboard. */
export function chartScore(planets: PlanetReport[]): number {
  if (!planets.length) return 0;
  return Math.round(planets.reduce((s, p) => s + p.strength, 0) / planets.length);
}
