// Chakra Analyzer — derives a 7-chakra energy profile from the Vedic natal chart.
// Mapping follows Tantric-Jyotish correspondences (Shiva Samhita, Sat-Chakra-
// Nirupana, and Parashara's planetary dignity system).
//
//   • Each planet contributes to one or more chakras.
//   • Contribution is scaled by planetary dignity (own / exalted / debilitated).
//   • Ascendant lord contributes an extra boost to the Muladhara (embodiment).
//   • Moon nakshatra lord modulates the Anahata (emotional heart) axis.

import type { KundliChart, PlanetName } from "./vedic";
import { RASHI_LORDS } from "./vedic";

export const CHAKRAS = [
  "Muladhara",
  "Svadhisthana",
  "Manipura",
  "Anahata",
  "Vishuddha",
  "Ajna",
  "Sahasrara",
] as const;
export type Chakra = (typeof CHAKRAS)[number];

export type ChakraProfile = {
  key: Chakra;
  sanskrit: string;
  english: string;
  element: string;
  color: string;         // tailwind class fragment
  hex: string;
  bija: string;          // seed mantra
  petals: number;
  location: string;
  gemstone: string;
  mantras: string[];
  affirmation: string;
  imbalance: string;
  practices: string[];
};

export const CHAKRA_META: Record<Chakra, ChakraProfile> = {
  Muladhara: {
    key: "Muladhara", sanskrit: "मूलाधार", english: "Root",
    element: "Earth", color: "from-rose-500 to-red-600", hex: "#DC2626",
    bija: "LAM", petals: 4, location: "Base of spine · perineum",
    gemstone: "Red Jasper · Hematite · Garnet",
    mantras: ["Om Lam Namah", "Om Gam Ganapataye Namah"],
    affirmation: "I am safe. I am grounded. I belong to the earth.",
    imbalance: "Anxiety, financial fear, restlessness, low vitality.",
    practices: ["Walk barefoot on earth", "Mountain pose · Malasana", "Root breathing (Mula Bandha)", "Wear red / carry hematite"],
  },
  Svadhisthana: {
    key: "Svadhisthana", sanskrit: "स्वाधिष्ठान", english: "Sacral",
    element: "Water", color: "from-orange-400 to-amber-500", hex: "#F59E0B",
    bija: "VAM", petals: 6, location: "Two fingers below navel",
    gemstone: "Carnelian · Moonstone · Orange Calcite",
    mantras: ["Om Vam Namah", "Om Chandraya Namah"],
    affirmation: "I flow with life. I honour my desires and creativity.",
    imbalance: "Creative block, guilt, intimacy issues, hormonal drift.",
    practices: ["Hip openers · Baddha Konasana", "Moonlight walk", "Dance & fluid movement", "Sip warm water with honey"],
  },
  Manipura: {
    key: "Manipura", sanskrit: "मणिपूर", english: "Solar Plexus",
    element: "Fire", color: "from-yellow-300 to-amber-500", hex: "#EAB308",
    bija: "RAM", petals: 10, location: "Solar plexus · navel",
    gemstone: "Citrine · Yellow Sapphire · Tiger's Eye",
    mantras: ["Om Ram Namah", "Om Suryaya Namah"],
    affirmation: "I am powerful. My will is aligned with dharma.",
    imbalance: "Low confidence, digestive fire weak, indecision, anger.",
    practices: ["Kapalabhati · Agnisara", "Sun salutations at dawn", "Warrior poses", "Turmeric · ginger · trikatu"],
  },
  Anahata: {
    key: "Anahata", sanskrit: "अनाहत", english: "Heart",
    element: "Air", color: "from-emerald-400 to-green-500", hex: "#10B981",
    bija: "YAM", petals: 12, location: "Center of chest",
    gemstone: "Emerald · Rose Quartz · Green Aventurine",
    mantras: ["Om Yam Namah", "Om Mani Padme Hum"],
    affirmation: "I love and am loved. My heart is open and radiant.",
    imbalance: "Grief, jealousy, isolation, shallow breathing.",
    practices: ["Anahata mudra · Camel pose", "Metta / loving-kindness meditation", "Bhramari pranayama", "Rose oil · gratitude journal"],
  },
  Vishuddha: {
    key: "Vishuddha", sanskrit: "विशुद्ध", english: "Throat",
    element: "Ether", color: "from-sky-400 to-blue-500", hex: "#0EA5E9",
    bija: "HAM", petals: 16, location: "Throat · vocal cords",
    gemstone: "Aquamarine · Blue Kyanite · Lapis",
    mantras: ["Om Ham Namah", "Om Namah Shivaya"],
    affirmation: "I speak truth with grace. My voice is heard.",
    imbalance: "Fear of speaking, thyroid drift, dishonesty, gossip.",
    practices: ["Chanting · Ujjayi pranayama", "Neck rolls · Fish pose", "Blue tea · silver water", "Journal difficult truths"],
  },
  Ajna: {
    key: "Ajna", sanskrit: "आज्ञा", english: "Third Eye",
    element: "Light", color: "from-indigo-400 to-violet-500", hex: "#6366F1",
    bija: "OM", petals: 2, location: "Between the eyebrows",
    gemstone: "Amethyst · Lapis Lazuli · Sodalite",
    mantras: ["Om", "Om Aim Hreem Kleem"],
    affirmation: "I see clearly. My intuition is my compass.",
    imbalance: "Overthinking, headaches, foggy dreams, lack of vision.",
    practices: ["Trataka (candle gazing)", "Bhramari · Nadi shodhana", "Sandalwood tilak", "Sleep in darkness, wake before dawn"],
  },
  Sahasrara: {
    key: "Sahasrara", sanskrit: "सहस्रार", english: "Crown",
    element: "Consciousness", color: "from-fuchsia-400 to-purple-500", hex: "#A855F7",
    bija: "AH", petals: 1000, location: "Crown of the head",
    gemstone: "Clear Quartz · Selenite · Diamond",
    mantras: ["Om Aim Sarasvatyai Namah", "So Ham"],
    affirmation: "I am one with the infinite. I surrender to the divine.",
    imbalance: "Spiritual disconnection, cynicism, insomnia, existential fatigue.",
    practices: ["Silent meditation at Brahma Muhurta", "Sirsasana (headstand)", "Fasting from screens", "Devotional study (Svadhyaya)"],
  },
};

// Planet → chakra weights. Sum roughly ~1 per planet.
const PLANET_CHAKRA: Record<PlanetName, Partial<Record<Chakra, number>>> = {
  Sun:     { Manipura: 0.6, Ajna: 0.2, Sahasrara: 0.2 },
  Moon:    { Anahata: 0.4, Svadhisthana: 0.4, Ajna: 0.2 },
  Mars:    { Muladhara: 0.5, Manipura: 0.5 },
  Mercury: { Vishuddha: 0.7, Ajna: 0.3 },
  Jupiter: { Anahata: 0.3, Vishuddha: 0.2, Sahasrara: 0.5 },
  Venus:   { Svadhisthana: 0.5, Anahata: 0.5 },
  Saturn:  { Muladhara: 0.7, Vishuddha: 0.3 },
  Rahu:    { Ajna: 0.5, Svadhisthana: 0.5 },
  Ketu:    { Sahasrara: 0.6, Ajna: 0.4 },
};

// Rashi indices where each planet is exalted (0..11 Aries..Pisces)
const EXALT: Partial<Record<PlanetName, number>> = {
  Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6,
};
// Debilitation = 6 signs away
const DEBIL: Partial<Record<PlanetName, number>> = {
  Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0,
};
// Own signs (subset — good enough for weighting)
const OWN: Partial<Record<PlanetName, number[]>> = {
  Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5],
  Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10],
};

function dignity(planet: PlanetName, rashi: number): number {
  if (EXALT[planet] === rashi) return 1.5;
  if (DEBIL[planet] === rashi) return 0.5;
  if (OWN[planet]?.includes(rashi)) return 1.3;
  return 1.0;
}

export type ChakraScore = { chakra: Chakra; value: number; state: "Open" | "Balanced" | "Blocked" };
export type ChakraReading = {
  scores: ChakraScore[];
  dominant: Chakra;
  weakest: Chakra;
  overallBalance: number;   // 0..100
};

export function analyzeChakras(chart: KundliChart): ChakraReading {
  const raw: Record<Chakra, number> = {
    Muladhara: 0, Svadhisthana: 0, Manipura: 0, Anahata: 0,
    Vishuddha: 0, Ajna: 0, Sahasrara: 0,
  };

  for (const p of chart.planets) {
    const w = dignity(p.name, p.rashi);
    const map = PLANET_CHAKRA[p.name];
    for (const [ch, v] of Object.entries(map)) {
      raw[ch as Chakra] += (v as number) * w;
    }
  }

  // Ascendant lord boosts Muladhara (embodiment).
  const lagnaLord = RASHI_LORDS[chart.ascendant.rashi] as PlanetName;
  const lagnaPlanet = chart.planets.find((p) => p.name === lagnaLord);
  if (lagnaPlanet) {
    raw.Muladhara += 0.8 * dignity(lagnaLord, lagnaPlanet.rashi);
  }

  // Normalize to 0..100 per chakra (relative to a nominal max of 3.5).
  const NOMINAL = 3.5;
  const scores: ChakraScore[] = (CHAKRAS as readonly Chakra[]).map((c) => {
    const v = Math.min(100, Math.round((raw[c] / NOMINAL) * 100));
    const state: ChakraScore["state"] =
      v >= 75 ? "Open" : v >= 45 ? "Balanced" : "Blocked";
    return { chakra: c, value: v, state };
  });

  const sorted = [...scores].sort((a, b) => b.value - a.value);
  const dominant = sorted[0].chakra;
  const weakest = sorted[sorted.length - 1].chakra;

  // Balance = 100 - stdev, so more even = higher.
  const mean = scores.reduce((s, x) => s + x.value, 0) / 7;
  const variance = scores.reduce((s, x) => s + (x.value - mean) ** 2, 0) / 7;
  const overallBalance = Math.max(0, Math.round(100 - Math.sqrt(variance)));

  return { scores, dominant, weakest, overallBalance };
}
