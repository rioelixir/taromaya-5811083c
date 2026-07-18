// Finance & wealth — 2nd (kutumba, dhana), 11th (labha, gains), 5th (poorva-punya),
// 9th (bhagya) houses and Dhana yogas.
import type { KundliChart, PlanetName } from "./vedic";
import { RASHIS } from "./vedic";

const RASHI_LORDS: PlanetName[] = [
  "Mars","Venus","Mercury","Moon","Sun","Mercury",
  "Venus","Mars","Jupiter","Saturn","Saturn","Jupiter",
];

const PLANET_INCOME_SOURCES: Record<PlanetName, string[]> = {
  Sun:     ["Government income, pension, gold, authority-linked earnings"],
  Moon:    ["Public / mass income, dairy, silver, fluids, hospitality"],
  Mars:    ["Real estate, defence, sports, siblings, engineering contracts"],
  Mercury: ["Trade, commissions, writing, software, brokerage, teaching"],
  Jupiter: ["Advisory, teaching, law, philanthropy return, gold, blessings-based"],
  Venus:   ["Luxury, arts, entertainment, women's markets, vehicles, spouse"],
  Saturn:  ["Labour, mass service, mining, oil, long-term assets, real estate"],
  Rahu:    ["Foreign lands, technology, speculation, unusual gains"],
  Ketu:    ["Occult, medicine, research, inheritance, spiritual patronage"],
};

const HOUSE_WEALTH_QUALITY: Record<number, string> = {
  1: "self-generated wealth", 2: "family & accumulated wealth", 3: "hustle-earned",
  4: "property & inheritance-based", 5: "speculative & creative gains",
  6: "service-income, loans", 7: "partnership & spouse wealth",
  8: "inheritance, occult, sudden gains", 9: "fortune, blessings, dharmic earnings",
  10: "career & status income", 11: "network gains, large surplus",
  12: "foreign income, losses, spiritual expenditure",
};

export type FinanceReading = {
  secondSign: string;
  secondLord: PlanetName;
  secondLordHouse: number;
  eleventhSign: string;
  eleventhLord: PlanetName;
  eleventhLordHouse: number;
  ninthLord: PlanetName;
  ninthLordHouse: number;
  dhanaYogas: string[];
  incomeSources: string[];
  cautions: string[];
  bestInvestments: string[];
  wealthScore: number;
  summary: string;
};

function houseOf(chart: KundliChart, planet: PlanetName): number {
  const p = chart.planets.find((x) => x.name === planet);
  if (!p) return 1;
  return ((p.rashi - chart.ascendant.rashi + 12) % 12) + 1;
}

export function analyzeFinance(chart: KundliChart): FinanceReading {
  const asc = chart.ascendant.rashi;
  const secondSign = (asc + 1) % 12;
  const eleventhSign = (asc + 10) % 12;
  const ninthSign = (asc + 8) % 12;

  const secondLord = RASHI_LORDS[secondSign];
  const eleventhLord = RASHI_LORDS[eleventhSign];
  const ninthLord = RASHI_LORDS[ninthSign];

  const secondLordHouse = houseOf(chart, secondLord);
  const eleventhLordHouse = houseOf(chart, eleventhLord);
  const ninthLordHouse = houseOf(chart, ninthLord);

  // Dhana yoga detection
  const dhanaYogas: string[] = [];
  const combos: Array<[PlanetName, number, string]> = [
    [secondLord, eleventhLordHouse, `${secondLord} (2L) links with 11L via ${eleventhLord}`],
  ];
  void combos;

  // Same-house conjunctions among wealth lords
  const wealthLords: PlanetName[] = [secondLord, eleventhLord, ninthLord];
  const houseMap = new Map<number, PlanetName[]>();
  wealthLords.forEach((l) => {
    const h = houseOf(chart, l);
    houseMap.set(h, [...(houseMap.get(h) ?? []), l]);
  });
  houseMap.forEach((planets, h) => {
    if (planets.length >= 2) dhanaYogas.push(`Dhana Yoga: ${planets.join(" + ")} together in ${ordinal(h)} house`);
  });

  // 5L-9L raja-lakshmi
  const fifthLord = RASHI_LORDS[(asc + 4) % 12];
  if (fifthLord === ninthLord || houseOf(chart, fifthLord) === houseOf(chart, ninthLord)) {
    dhanaYogas.push(`Lakshmi Yoga: 5L (${fifthLord}) with 9L (${ninthLord}) — spontaneous fortune`);
  }

  // Jupiter/Venus in 2 or 11
  chart.planets.forEach((p) => {
    const h = houseOf(chart, p.name);
    if ((p.name === "Jupiter" || p.name === "Venus") && (h === 2 || h === 11)) {
      dhanaYogas.push(`${p.name} enriches the ${ordinal(h)} house directly`);
    }
  });

  if (dhanaYogas.length === 0) dhanaYogas.push("Wealth grows through discipline rather than yoga-formations — steady saving > speculation.");

  const incomeSources = Array.from(new Set([
    ...PLANET_INCOME_SOURCES[secondLord],
    ...PLANET_INCOME_SOURCES[eleventhLord],
  ]));

  const bestInvestments: string[] = [];
  const p2 = chart.planets.find((x) => x.name === secondLord);
  if (p2) {
    const elem = ["Fire","Earth","Air","Water"][p2.rashi % 4];
    if (elem === "Earth") bestInvestments.push("Real estate, gold, index funds");
    if (elem === "Fire") bestInvestments.push("Equity, entrepreneurship, energy");
    if (elem === "Air") bestInvestments.push("Tech stocks, communication, small business");
    if (elem === "Water") bestInvestments.push("Bonds, water/dairy sectors, safe fixed deposits");
  }
  bestInvestments.push(`${eleventhLord}-ruled sectors for surplus growth`);

  const cautions: string[] = [];
  if ([6, 8, 12].includes(secondLordHouse)) cautions.push(`2L ${secondLord} in ${ordinal(secondLordHouse)} — family finance leaks, guard against loans and litigation`);
  if ([6, 8, 12].includes(eleventhLordHouse)) cautions.push(`11L ${eleventhLord} in ${ordinal(eleventhLordHouse)} — delayed gains, avoid speculation`);
  if (chart.planets.find((p) => p.name === "Rahu")) {
    const rahuH = houseOf(chart, "Rahu");
    if ([2,5,8,11].includes(rahuH)) cautions.push(`Rahu in ${ordinal(rahuH)} — beware get-rich-quick schemes and crypto FOMO`);
  }
  if (cautions.length === 0) cautions.push("No major wealth-obstruction signatures — stay diversified.");

  let score = 45;
  score += dhanaYogas.length * 8;
  if ([1,4,7,10].includes(secondLordHouse)) score += 8;
  if ([1,4,7,10].includes(eleventhLordHouse)) score += 8;
  if ([5,9].includes(ninthLordHouse)) score += 10;
  if ([6,8,12].includes(secondLordHouse)) score -= 8;
  if ([6,8,12].includes(eleventhLordHouse)) score -= 6;
  score = Math.max(15, Math.min(98, score));

  const summary = `Your 2nd house (${RASHIS[secondSign]}) rules family wealth, its lord ${secondLord} sits in the ${ordinal(secondLordHouse)} — bringing ${HOUSE_WEALTH_QUALITY[secondLordHouse]}. Gains (11th ${RASHIS[eleventhSign]}, ruled by ${eleventhLord} in the ${ordinal(eleventhLordHouse)}) come through ${HOUSE_WEALTH_QUALITY[eleventhLordHouse]}. Fortune-house (9L ${ninthLord}) sits in the ${ordinal(ninthLordHouse)}.`;

  return {
    secondSign: RASHIS[secondSign],
    secondLord,
    secondLordHouse,
    eleventhSign: RASHIS[eleventhSign],
    eleventhLord,
    eleventhLordHouse,
    ninthLord,
    ninthLordHouse,
    dhanaYogas,
    incomeSources,
    cautions,
    bestInvestments,
    wealthScore: score,
    summary,
  };
}

function ordinal(n: number): string {
  const s = ["th","st","nd","rd"]; const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
