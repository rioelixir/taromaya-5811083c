// Deep Mangal Dosha (Kuja / Manglik) analysis — checks Mars from Lagna, Moon,
// and Venus (three-fold verification), classifies severity, lists cancellations.
import type { KundliChart, PlanetName } from "./vedic";
import { RASHIS } from "./vedic";

const MANGAL_HOUSES = [1, 2, 4, 7, 8, 12] as const;

const HOUSE_EFFECTS: Record<number, string> = {
  1:  "Aggressive temperament impacting the marriage; sharp words, dominance clashes.",
  2:  "Financial and family friction; harsh speech within kutumba.",
  4:  "Domestic peace disturbed; property disputes and mother-in-law tensions.",
  7:  "Direct spouse conflict, delayed marriage, separation risk (most severe).",
  8:  "Chronic disagreement, spouse health issues, longevity concerns.",
  12: "Bedroom / intimacy conflict, expenditure through partner.",
};

const CANCELLATION_RULES = [
  "Mars in own sign (Aries/Scorpio) or exalted (Capricorn) reduces dosha significantly.",
  "Mars in a friendly sign (Leo, Sagittarius, Pisces) softens the dosha.",
  "Jupiter or Venus aspects Mars — auspicious counterbalance.",
  "Mars conjunct or aspected by Moon in the same nakshatra pada — cancels.",
  "Both partners are equally Manglik — the doshas neutralise.",
  "Mars in 2nd in Gemini/Virgo; in 4th in Aries/Scorpio; in 7th in Cancer/Capricorn/Pisces — reduced.",
  "After age 28, native's Mars matures (Karaka Bhava Nashaya); intensity fades.",
];

const REMEDIES = [
  "Recite Mangal Kavach or Hanuman Chalisa on Tuesdays (108 times).",
  "Fast on Tuesdays; eat only red-lentil khichdi at sunset.",
  "Kumbh Vivah / Peepal Vivah before marriage if severity is high.",
  "Marry a Mangalik partner or one whose Mars matches ashtakoot.",
  "Donate red masoor dal, jaggery, red cloth, copper on Tuesdays.",
  "Wear a red coral (Munga) 6-8 ratti set in copper on the ring finger (with astrologer's verification).",
  "Chant 'Om Angarakaya Namah' 108 times daily for 40 days.",
  "Visit Kartikeya / Hanuman / Subrahmanya temples on 8 consecutive Tuesdays.",
];

export type MangalReading = {
  isManglik: boolean;
  severity: "None" | "Mild" | "Moderate" | "Severe" | "High";
  score: number; // 0-100
  fromLagna: boolean;
  fromMoon: boolean;
  fromVenus: boolean;
  marsHouseFromLagna: number;
  marsHouseFromMoon: number;
  marsHouseFromVenus: number;
  marsSign: string;
  marsRetrograde: boolean;
  effects: string[];
  cancellations: string[];
  applicableRemedies: string[];
  matchingGuidance: string;
  summary: string;
};

function houseFrom(chart: KundliChart, planetSignIdx: number, referenceSignIdx: number): number {
  return ((planetSignIdx - referenceSignIdx + 12) % 12) + 1;
}

export function analyzeMangal(chart: KundliChart): MangalReading {
  const mars = chart.planets.find((p) => p.name === "Mars")!;
  const moon = chart.planets.find((p) => p.name === "Moon")!;
  const venus = chart.planets.find((p) => p.name === "Venus")!;

  const hLag = houseFrom(chart, mars.rashi, chart.ascendant.rashi);
  const hMoon = houseFrom(chart, mars.rashi, moon.rashi);
  const hVenus = houseFrom(chart, mars.rashi, venus.rashi);

  const fromLagna = MANGAL_HOUSES.includes(hLag as (typeof MANGAL_HOUSES)[number]);
  const fromMoon  = MANGAL_HOUSES.includes(hMoon as (typeof MANGAL_HOUSES)[number]);
  const fromVenus = MANGAL_HOUSES.includes(hVenus as (typeof MANGAL_HOUSES)[number]);

  const activeCount = [fromLagna, fromMoon, fromVenus].filter(Boolean).length;

  // Effects list
  const effects: string[] = [];
  if (fromLagna)  effects.push(`From Lagna (${hLag}H): ${HOUSE_EFFECTS[hLag]}`);
  if (fromMoon)   effects.push(`From Chandra (${hMoon}H): ${HOUSE_EFFECTS[hMoon]}`);
  if (fromVenus)  effects.push(`From Shukra (${hVenus}H): ${HOUSE_EFFECTS[hVenus]}`);

  // Cancellations detected
  const cancellations: string[] = [];
  const marsOwn = mars.rashi === 0 || mars.rashi === 7;   // Aries / Scorpio
  const marsExalt = mars.rashi === 9;                     // Capricorn
  const marsFriendly = [4, 8, 11].includes(mars.rashi);   // Leo / Sag / Pisces
  const marsDebilitated = mars.rashi === 3;               // Cancer

  if (marsOwn) cancellations.push("Mars is in its own sign — dosha significantly reduced.");
  if (marsExalt) cancellations.push("Mars is exalted in Capricorn — dosha largely cancelled.");
  if (marsFriendly) cancellations.push("Mars in friendly sign — softer expression.");

  // Jupiter/Venus 5th, 7th, 9th aspect on Mars
  ["Jupiter", "Venus"].forEach((benName) => {
    const ben = chart.planets.find((p) => p.name === (benName as PlanetName))!;
    const angle = ((mars.rashi - ben.rashi + 12) % 12) + 1;
    if ([5, 7, 9].includes(angle) || ben.rashi === mars.rashi) {
      cancellations.push(`${benName} aspects/conjoins Mars — benefic softening.`);
    }
  });

  // Score
  let score = activeCount * 25; // 0, 25, 50, 75
  if (hLag === 7 || hMoon === 7) score += 15;
  if (hLag === 8 || hMoon === 8) score += 10;
  if (marsOwn) score -= 25;
  if (marsExalt) score -= 35;
  if (marsFriendly) score -= 12;
  if (marsDebilitated) score += 10;
  if (cancellations.length >= 2) score -= 15;
  score = Math.max(0, Math.min(100, score));

  const isManglik = activeCount > 0 && score > 20;
  const severity: MangalReading["severity"] =
    score === 0 ? "None"
    : score < 25 ? "Mild"
    : score < 50 ? "Moderate"
    : score < 75 ? "High"
    : "Severe";

  const matchingGuidance = isManglik
    ? severity === "Severe" || severity === "High"
      ? "Marry a Manglik partner of matched intensity, or perform Kumbh Vivah before wedding. Avoid non-Manglik partners without pratikar."
      : "Compatible with a mild-Manglik or Mars-strong partner. Standard Ashtakoot matching applies with attention to Mars placement."
    : "No Mangal Dosha adjustments needed in matchmaking.";

  const summary = isManglik
    ? `Mangal Dosha is present with ${severity.toLowerCase()} intensity (${score}/100). Mars in ${RASHIS[mars.rashi]}${mars.retrograde ? " retrograde" : ""} triggers the dosha from ${activeCount} of 3 reference points (Lagna, Moon, Venus).`
    : `You are non-Manglik. Mars in ${RASHIS[mars.rashi]} does not create dosha from the primary reference points.`;

  return {
    isManglik,
    severity,
    score,
    fromLagna,
    fromMoon,
    fromVenus,
    marsHouseFromLagna: hLag,
    marsHouseFromMoon: hMoon,
    marsHouseFromVenus: hVenus,
    marsSign: RASHIS[mars.rashi],
    marsRetrograde: mars.retrograde,
    effects: effects.length ? effects : ["Mars does not sit in any Mangal-triggering house."],
    cancellations: cancellations.length ? cancellations : ["No natural cancellation detected."],
    applicableRemedies: isManglik ? REMEDIES : [],
    matchingGuidance,
    summary,
  };
}

export const MANGAL_CANCELLATION_RULES = CANCELLATION_RULES;
