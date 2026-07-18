// Vedic medical astrology — 6th house (roga bhava), 1st (body), 8th (chronic),
// afflictions from malefics, and body-part vulnerabilities per rashi.
import type { KundliChart, PlanetName } from "./vedic";
import { RASHIS } from "./vedic";

const RASHI_LORDS: PlanetName[] = [
  "Mars","Venus","Mercury","Moon","Sun","Mercury",
  "Venus","Mars","Jupiter","Saturn","Saturn","Jupiter",
];

const SIGN_BODY_PARTS: Record<number, string> = {
  0: "head, brain, skull",
  1: "face, throat, thyroid, neck",
  2: "shoulders, arms, lungs, hands",
  3: "chest, heart lining, stomach, breasts",
  4: "upper abdomen, heart, spine",
  5: "intestines, bowels, nervous system",
  6: "kidneys, lower back, ovaries",
  7: "reproductive organs, urinary bladder, colon",
  8: "hips, thighs, liver, sciatic nerve",
  9: "knees, joints, bones, skin",
  10: "calves, ankles, circulatory system",
  11: "feet, lymphatic system, immune system",
};

const PLANET_DISEASES: Record<PlanetName, string[]> = {
  Sun:     ["Cardiac strain", "Blood pressure", "Ophthalmic issues", "Fever, inflammation"],
  Moon:    ["Anxiety, mood swings", "Water retention", "Menstrual imbalance", "Anaemia"],
  Mars:    ["Accidents, cuts, surgery", "Inflammatory conditions", "Blood disorders", "Muscular injury"],
  Mercury: ["Skin allergies", "Nervous system, speech", "Respiratory issues", "Digestive irregularity"],
  Jupiter: ["Liver, obesity, diabetes", "Cholesterol", "Pancreatic disorders"],
  Venus:   ["Reproductive / urinary", "Diabetes, kidney sugar", "Throat, cosmetic"],
  Saturn:  ["Chronic pain, arthritis", "Depression", "Bones, teeth, joints", "Slow-degenerative disease"],
  Rahu:    ["Mysterious / undiagnosed", "Toxicity, poisoning", "Skin, phobias", "Cancers, viruses"],
  Ketu:    ["Immunity gaps", "Nerve pain", "Sudden accidents", "Occult / psychosomatic"],
};

const MALEFICS: PlanetName[] = ["Sun","Mars","Saturn","Rahu","Ketu"];

const ELEMENT_BY_SIGN: Record<number, "Fire"|"Earth"|"Air"|"Water"> = {
  0:"Fire",1:"Earth",2:"Air",3:"Water",4:"Fire",5:"Earth",
  6:"Air",7:"Water",8:"Fire",9:"Earth",10:"Air",11:"Water",
};

const ELEMENT_DOSHA: Record<"Fire"|"Earth"|"Air"|"Water", string> = {
  Fire:  "Pitta-dominant · manage heat, acidity, inflammation",
  Earth: "Kapha-dominant · manage sluggish metabolism, congestion",
  Air:   "Vata-dominant · manage anxiety, dryness, insomnia",
  Water: "Kapha-Pitta · manage fluid balance, emotional eating",
};

export type HealthReading = {
  ascSign: string;
  vulnerableBodyParts: string;
  primaryDosha: string;
  sixthLord: PlanetName;
  sixthLordHouse: number;
  afflictedHouses: number[];
  riskAreas: string[];
  strengths: string[];
  vitalityScore: number;
  guidelines: string[];
  summary: string;
};

function houseOf(chart: KundliChart, planet: PlanetName): number {
  const p = chart.planets.find((x) => x.name === planet);
  if (!p) return 1;
  return ((p.rashi - chart.ascendant.rashi + 12) % 12) + 1;
}

export function analyzeHealth(chart: KundliChart): HealthReading {
  const ascRashi = chart.ascendant.rashi;
  const vulnerableBodyParts = SIGN_BODY_PARTS[ascRashi];
  const element = ELEMENT_BY_SIGN[ascRashi];
  const primaryDosha = ELEMENT_DOSHA[element];

  const sixthSign = (ascRashi + 5) % 12;
  const sixthLord = RASHI_LORDS[sixthSign];
  const sixthLordHouse = houseOf(chart, sixthLord);

  // afflicted houses = malefics' houses (1,6,8,12 focus)
  const afflictedHouses = Array.from(new Set(
    chart.planets
      .filter((p) => MALEFICS.includes(p.name))
      .map((p) => ((p.rashi - ascRashi + 12) % 12) + 1)
      .filter((h) => [1, 6, 8, 12].includes(h))
  )).sort();

  const riskPlanets = chart.planets
    .filter((p) => {
      const h = ((p.rashi - ascRashi + 12) % 12) + 1;
      return MALEFICS.includes(p.name) && [1, 6, 8, 12].includes(h);
    })
    .map((p) => p.name);
  if (riskPlanets.length === 0) riskPlanets.push(sixthLord);

  const riskAreas = Array.from(new Set(
    riskPlanets.flatMap((p) => PLANET_DISEASES[p].slice(0, 2))
  )).slice(0, 6);

  // strengths from benefics in kendra/trikona
  const benefics: PlanetName[] = ["Jupiter","Venus","Mercury","Moon"];
  const strengthPlanets = chart.planets
    .filter((p) => {
      const h = ((p.rashi - ascRashi + 12) % 12) + 1;
      return benefics.includes(p.name) && [1,4,5,7,9,10].includes(h);
    })
    .map((p) => p.name);

  const strengths = strengthPlanets.length
    ? strengthPlanets.map((p) =>
        p === "Jupiter" ? "Strong liver, immunity, natural longevity"
        : p === "Venus" ? "Good reproductive vitality, aesthetic constitution"
        : p === "Mercury" ? "Sharp nervous system, quick recovery"
        : "Emotional resilience, hydration balance"
      )
    : ["General resilience — build vitality through discipline"];

  let vitality = 60;
  vitality -= afflictedHouses.length * 6;
  vitality += strengthPlanets.length * 8;
  if (sixthLord && [6,8,12].includes(sixthLordHouse)) vitality += 10; // 6L in dusthana = protective (Vipreet-like)
  if ([1,4,7,10].includes(sixthLordHouse)) vitality -= 6;
  vitality = Math.max(20, Math.min(98, vitality));

  const guidelines = [
    `Body seat to guard: ${vulnerableBodyParts}.`,
    `Constitution: ${primaryDosha}.`,
    "Rise before sunrise; keep 10-hour eating window; avoid stimulants past 6 pm.",
    "Weekly fast on your 8th-house lord's weekday for detoxification.",
    "Pranayama 12 min daily (Nadi Shodhana + Bhramari).",
  ];

  const summary = `With ${RASHIS[ascRashi]} rising, your body-vessel governs ${vulnerableBodyParts}. Your 6th house of health, ruled by ${sixthLord} placed in the ${ordinal(sixthLordHouse)} bhava, ${sixthLordHouse >= 6 && [6,8,12].includes(sixthLordHouse) ? "creates a Vipreet-like protection against illness" : "asks for consistent daily discipline"}.`;

  return {
    ascSign: RASHIS[ascRashi],
    vulnerableBodyParts,
    primaryDosha,
    sixthLord,
    sixthLordHouse,
    afflictedHouses,
    riskAreas,
    strengths,
    vitalityScore: Math.round(vitality),
    guidelines,
    summary,
  };
}

function ordinal(n: number): string {
  const s = ["th","st","nd","rd"]; const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
