// Career analysis engine — 10th house (Karma Bhava), its lord, Amatyakaraka
// (Jaimini minister), and planetary rajayoga signals.
import type { KundliChart, PlanetName } from "./vedic";
import { RASHIS } from "./vedic";

const RASHI_LORDS: PlanetName[] = [
  "Mars","Venus","Mercury","Moon","Sun","Mercury",
  "Venus","Mars","Jupiter","Saturn","Saturn","Jupiter",
];

const PLANET_CAREERS: Record<PlanetName, string[]> = {
  Sun:     ["Government / civil service", "Leadership & executive roles", "Politics", "Cardiology, ophthalmology", "Gold & luxury trade"],
  Moon:    ["Hospitality", "Nursing & psychiatry", "Public relations", "Dairy, fluids, shipping", "Content & storytelling"],
  Mars:    ["Military / police / defence", "Surgery, dentistry", "Engineering & construction", "Real estate", "Athletics & martial arts"],
  Mercury: ["Writing, journalism, publishing", "Software & analytics", "Accounting & audit", "Trade & commerce", "Teaching, translation"],
  Jupiter: ["Law & judiciary", "Teaching, academia", "Finance & wealth advisory", "Religion, counselling", "Publishing, policy"],
  Venus:   ["Arts, music, cinema", "Fashion, luxury, beauty", "Diplomacy & hospitality", "Design & interiors", "Relationship & wedding industries"],
  Saturn:  ["Mining, oil, iron, coal", "Labour & mass service", "Law enforcement, monasticism", "Engineering, manufacturing", "Elder care & agriculture"],
  Rahu:    ["Technology & AI", "Foreign trade & aviation", "Media, film, marketing", "Speculation, crypto", "Diplomacy across cultures"],
  Ketu:    ["Research, occult sciences", "Medicine (esp. surgery)", "Spirituality, monkhood", "Coding, mathematics", "Investigation & forensics"],
};

const HOUSE_CAREER_THEME: Record<number, string> = {
  1: "self-branded work; identity is the product",
  2: "family business, banking, voice-driven work",
  3: "communication, siblings' networks, sales, writing",
  4: "real estate, education, mother-industries, land",
  5: "creative arts, speculation, teaching children",
  6: "service, medicine, litigation, daily-wage work",
  7: "partnerships, trade, public-facing business",
  8: "research, occult, insurance, inheritance, transformation",
  9: "law, teaching, publishing, long-distance travel",
  10: "government, corporate leadership, public office",
  11: "networks, gains from friends, mass media, tech platforms",
  12: "foreign lands, hospitals, monasteries, imports/exports",
};

const CHARAKARAKAS: PlanetName[] = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu"];

export type CareerReading = {
  tenthLord: PlanetName;
  tenthLordSign: string;
  tenthLordHouse: number;
  tenthSign: string;
  planetsInTenth: PlanetName[];
  amatyakaraka: PlanetName;
  bestFields: string[];
  avoidFields: string[];
  timing: string;
  summary: string;
  score: number;
};

function houseOf(chart: KundliChart, planet: PlanetName): number {
  const p = chart.planets.find((x) => x.name === planet);
  if (!p) return 1;
  return ((p.rashi - chart.ascendant.rashi + 12) % 12) + 1;
}

export function analyzeCareer(chart: KundliChart): CareerReading {
  const tenthSignIdx = (chart.ascendant.rashi + 9) % 12;
  const tenthLord = RASHI_LORDS[tenthSignIdx];
  const tenthLordPlanet = chart.planets.find((p) => p.name === tenthLord)!;
  const tenthLordHouse = houseOf(chart, tenthLord);
  const planetsInTenth = chart.planets
    .filter((p) => ((p.rashi - chart.ascendant.rashi + 12) % 12) + 1 === 10)
    .map((p) => p.name);

  // Amatyakaraka = 2nd-highest degrees among 8 charakarakas
  const sorted = chart.planets
    .filter((p) => CHARAKARAKAS.includes(p.name))
    .sort((a, b) => b.degreeInRashi - a.degreeInRashi);
  const amk = sorted[1]?.name ?? "Mercury";

  const bestFields = Array.from(new Set([
    ...PLANET_CAREERS[tenthLord].slice(0, 3),
    ...PLANET_CAREERS[amk].slice(0, 2),
    ...(planetsInTenth[0] ? PLANET_CAREERS[planetsInTenth[0]].slice(0, 2) : []),
  ]));

  // Simple strength scoring
  let score = 50;
  if ([1,4,7,10].includes(tenthLordHouse)) score += 15; // kendra
  if ([5,9].includes(tenthLordHouse)) score += 15;      // trikona
  if ([6,8,12].includes(tenthLordHouse)) score -= 15;   // dusthana
  if (planetsInTenth.includes("Sun") || planetsInTenth.includes("Jupiter") || planetsInTenth.includes("Saturn")) score += 10;
  if (tenthLordPlanet.retrograde) score -= 5;
  score = Math.max(10, Math.min(98, score));

  const avoidFields = PLANET_CAREERS[
    ({ Sun:"Saturn", Moon:"Saturn", Mars:"Venus", Mercury:"Jupiter",
       Jupiter:"Mercury", Venus:"Mars", Saturn:"Sun", Rahu:"Ketu", Ketu:"Rahu" } as Record<PlanetName,PlanetName>)[tenthLord]
  ].slice(0, 3);

  const timing = `Peak career fruition arrives in the Mahadasha of ${tenthLord} and Antardashas of planets in the 10th (${planetsInTenth.join(", ") || "none"}). ${amk}'s dasha refines your professional craft.`;

  const summary = `Your 10th house is ${RASHIS[tenthSignIdx]} ruled by ${tenthLord}, placed in the ${ordinal(tenthLordHouse)} house — ${HOUSE_CAREER_THEME[tenthLordHouse]}. With ${amk} as Amatyakaraka, your professional soul-minister carries a ${PLANET_CAREERS[amk][0].toLowerCase()} imprint.`;

  return {
    tenthLord,
    tenthLordSign: RASHIS[tenthLordPlanet.rashi],
    tenthLordHouse,
    tenthSign: RASHIS[tenthSignIdx],
    planetsInTenth,
    amatyakaraka: amk,
    bestFields,
    avoidFields,
    timing,
    summary,
    score,
  };
}

function ordinal(n: number): string {
  const s = ["th","st","nd","rd"]; const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
