// Ayurveda Prakriti analyzer — Vata / Pitta / Kapha derivation from a Vedic
// natal chart. Weighting follows classical Ayurveda-Jyotish correspondences
// (Prashna Marga, Ashtanga Hridayam, Brihat Samhita):
//   • Planets carry dosha signatures (Sun/Mars = Pitta, Sat/Rahu = Vata, etc.)
//   • The Moon nakshatra tattva biases the constitutional dosha.
//   • The ascendant sign's element sets the physical prakriti substrate.

import type { KundliChart, PlanetName } from "./vedic";
import { nakshatraProfile, type Tattva } from "./nakshatra-deep";

export type Dosha = "Vata" | "Pitta" | "Kapha";

export type DoshaScore = { Vata: number; Pitta: number; Kapha: number };

const PLANET_DOSHA: Record<PlanetName, Partial<DoshaScore>> = {
  Sun:     { Pitta: 1.0 },
  Moon:    { Vata: 0.5, Kapha: 0.5 },
  Mars:    { Pitta: 1.0 },
  Mercury: { Vata: 0.33, Pitta: 0.33, Kapha: 0.34 }, // tridoshic
  Jupiter: { Kapha: 1.0 },
  Venus:   { Kapha: 0.5, Vata: 0.5 },
  Saturn:  { Vata: 1.0 },
  Rahu:    { Vata: 1.0 },
  Ketu:    { Pitta: 1.0 },
};

// Rashi element (Aries=0..Pisces=11). Fire=Pitta, Earth=Kapha, Air=Vata, Water=Kapha (with Vata undertone)
const RASHI_DOSHA: Dosha[] = [
  "Pitta","Kapha","Vata","Kapha", // Ari, Tau, Gem, Can
  "Pitta","Kapha","Vata","Kapha", // Leo, Vir, Lib, Sco
  "Pitta","Kapha","Vata","Kapha", // Sag, Cap, Aqu, Pis
];

const TATTVA_DOSHA: Record<Tattva, Dosha[]> = {
  Fire:  ["Pitta"],
  Earth: ["Kapha"],
  Air:   ["Vata"],
  Water: ["Kapha"],
  Ether: ["Vata"],
};

export type PrakritiResult = {
  scores: DoshaScore;           // 0..100 normalized
  dominant: Dosha;
  secondary: Dosha;
  constitution: string;         // e.g. "Vata-Pitta"
  moonTattva: Tattva;
  lagnaDosha: Dosha;
  advice: {
    diet: string[];
    lifestyle: string[];
    yoga: string[];
    herbs: string[];
    avoid: string[];
  };
};

const ADVICE: Record<Dosha, PrakritiResult["advice"]> = {
  Vata: {
    diet: [
      "Warm, moist, oily, well-cooked foods (soups, stews, kitchari).",
      "Sweet, sour, salty tastes; ghee, sesame oil, whole grains, root veg.",
      "Warm milk with cardamom; dates, almonds soaked overnight.",
    ],
    lifestyle: [
      "Fixed daily routine — sleep, meals, work at the same hours.",
      "Warm oil abhyanga (self-massage) with sesame before bath.",
      "Early bed by 10 pm; avoid overstimulation in evening.",
    ],
    yoga: [
      "Slow, grounding asana — Vrikshasana, Tadasana, Balasana.",
      "Nadi Shodhana (alternate nostril) and Bhramari pranayama.",
      "Long, slow exhalations; avoid overly vigorous flows.",
    ],
    herbs: ["Ashwagandha", "Shatavari", "Tulsi", "Triphala (small dose)", "Bala"],
    avoid: [
      "Cold, dry, raw, and light foods (salads, popcorn, crackers).",
      "Erratic sleep, skipped meals, excessive travel or screen time.",
      "Cold showers, exposure to cold wind, over-fasting.",
    ],
  },
  Pitta: {
    diet: [
      "Cooling, sweet, bitter, astringent foods (cucumber, coriander, coconut).",
      "Ghee, milk, sweet fruits, leafy greens, basmati rice.",
      "Mint / rose / fennel tea; avoid coffee on empty stomach.",
    ],
    lifestyle: [
      "Moonlit walks, swim, gardens — cooling environments.",
      "Sheetali / Sheetkari pranayama midday.",
      "Do not skip lunch (Pitta peak 10 am – 2 pm).",
    ],
    yoga: [
      "Moon-salutation, forward folds, twists (gentle).",
      "Shitali breath; avoid Bhastrika and Kapalabhati at midday.",
      "Practice with soft effort — avoid competitive intensity.",
    ],
    herbs: ["Amalaki", "Neem", "Shatavari", "Brahmi", "Guduchi"],
    avoid: [
      "Chillies, deep-fried, fermented, and salty processed foods.",
      "Midday sun, anger, over-scheduling, alcohol.",
      "Skipping meals — leads to acidity and irritability.",
    ],
  },
  Kapha: {
    diet: [
      "Warm, light, dry, pungent foods (millet, barley, legumes).",
      "Bitter, pungent, astringent tastes; ginger tea; honey (unheated).",
      "Steamed veg, light soups; avoid dairy and heavy sweets.",
    ],
    lifestyle: [
      "Rise before sunrise (before 6 am); avoid daytime naps.",
      "Vigorous dry-brushing (garshana) before bath.",
      "Regular cardiovascular activity — brisk walking, cycling.",
    ],
    yoga: [
      "Sun-salutation series with pace; Bhastrika, Kapalabhati.",
      "Standing asana — Warrior series, Utkatasana.",
      "Sweat-inducing practice, then cooling shavasana.",
    ],
    herbs: ["Trikatu", "Punarnava", "Guggulu", "Tulsi", "Ginger"],
    avoid: [
      "Heavy, oily, cold, sweet foods (cheese, ice cream, wheat excess).",
      "Sedentary evenings, oversleeping, emotional stagnation.",
      "Sweet drinks, heavy dairy at night.",
    ],
  },
};

export function computePrakriti(chart: KundliChart): PrakritiResult {
  const scores: DoshaScore = { Vata: 0, Pitta: 0, Kapha: 0 };

  // Planetary weights — luminaries and lagna lord region carry more weight.
  const PLANET_WEIGHT: Record<PlanetName, number> = {
    Sun: 1.5, Moon: 2.0, Mars: 1.2, Mercury: 1.0, Jupiter: 1.2,
    Venus: 1.0, Saturn: 1.2, Rahu: 0.8, Ketu: 0.8,
  };

  for (const p of chart.planets) {
    const w = PLANET_WEIGHT[p.name];
    const sig = PLANET_DOSHA[p.name];
    for (const [d, v] of Object.entries(sig)) {
      scores[d as Dosha] += (v as number) * w;
    }
    // Sign residency modulates: planet's sign dosha adds ½ weight.
    const signDosha = RASHI_DOSHA[p.rashi];
    scores[signDosha] += 0.5 * w;
  }

  // Ascendant carries strong prakriti signature.
  const lagnaDosha = RASHI_DOSHA[chart.ascendant.rashi];
  scores[lagnaDosha] += 3.0;

  // Moon nakshatra tattva adds constitutional flavor.
  const moonProfile = nakshatraProfile(chart.moonNakshatra.index);
  const tattvaDoshas = TATTVA_DOSHA[moonProfile.tattva];
  for (const d of tattvaDoshas) scores[d] += 2.0;

  // Normalize to 100.
  const total = scores.Vata + scores.Pitta + scores.Kapha || 1;
  const normalized: DoshaScore = {
    Vata: Math.round((scores.Vata / total) * 1000) / 10,
    Pitta: Math.round((scores.Pitta / total) * 1000) / 10,
    Kapha: Math.round((scores.Kapha / total) * 1000) / 10,
  };

  const sorted = (Object.entries(normalized) as [Dosha, number][])
    .sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0][0];
  const secondary = sorted[1][0];
  const gap = sorted[0][1] - sorted[1][1];
  const constitution = gap < 8 ? `${dominant}-${secondary}` : dominant;

  return {
    scores: normalized,
    dominant,
    secondary,
    constitution,
    moonTattva: moonProfile.tattva,
    lagnaDosha,
    advice: ADVICE[dominant],
  };
}

export const DOSHA_META: Record<Dosha, { symbol: string; element: string; qualities: string; season: string }> = {
  Vata:  { symbol: "☴", element: "Air + Ether",   qualities: "Cold, dry, light, mobile, subtle", season: "Autumn / early winter" },
  Pitta: { symbol: "☲", element: "Fire + Water",  qualities: "Hot, sharp, light, oily, liquid",  season: "Summer / late spring" },
  Kapha: { symbol: "☵", element: "Water + Earth", qualities: "Cold, heavy, oily, slow, stable",  season: "Late winter / spring" },
};
