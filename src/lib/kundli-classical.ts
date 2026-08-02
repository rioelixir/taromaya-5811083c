// Classical Kundali layers: Prahar, sign syllables (Rashi Aksha), the
// composite five-fold planetary friendship table, the Ascendant report and
// the Sudarshana Chakra (Lagna, Surya and Chandra charts read together).
import { RASHIS, RASHI_LORDS, type KundliChart, type PlanetName } from "./vedic";

// ── Prahar ──────────────────────────────────────────────────────────────────
const PRAHAR_DAY = ["First day Prahar", "Second day Prahar", "Third day Prahar", "Fourth day Prahar"];
const PRAHAR_NIGHT = ["First night Prahar", "Second night Prahar", "Third night Prahar", "Fourth night Prahar"];

/**
 * Prahar: the day from sunrise to sunset and the night from sunset to sunrise
 * are each split into four watches.
 */
export function praharOfBirth(birth: Date, sunrise: Date | null, sunset: Date | null, nextSunrise: Date | null) {
  if (!sunrise || !sunset) return { name: "Unavailable", index: 0, partOfDay: "day" as const };
  const t = birth.getTime();
  if (t >= sunrise.getTime() && t < sunset.getTime()) {
    const step = (sunset.getTime() - sunrise.getTime()) / 4;
    const i = Math.min(3, Math.floor((t - sunrise.getTime()) / step));
    return { name: PRAHAR_DAY[i], index: i + 1, partOfDay: "day" as const };
  }
  const end = nextSunrise ?? new Date(sunset.getTime() + 12 * 3600000);
  const start = t >= sunset.getTime() ? sunset : new Date(sunrise.getTime() - 12 * 3600000);
  const step = Math.max(1, (end.getTime() - start.getTime()) / 4);
  const i = Math.min(3, Math.max(0, Math.floor((t - start.getTime()) / step)));
  return { name: PRAHAR_NIGHT[i], index: i + 1, partOfDay: "night" as const };
}

// ── Rashi Aksha (sign syllables) ────────────────────────────────────────────
export const RASHI_AKSHARA: string[] = [
  "A, La, I", "U, Va, E, O", "Ka, Chha, Gha", "Da, Ha", "Ma, Ta", "Pa, Tha, Na",
  "Ra, Ta", "Na, Ya", "Bha, Dha, Pha, Dha", "Kha, Ja", "Ga, Sa, Sha", "Da, Cha, Jha, Tha",
];

// ── Composite friendship ────────────────────────────────────────────────────
export const FRIENDSHIP_PLANETS: PlanetName[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as PlanetName[];

// Naisargika (natural) friendship, classical Parashari table.
const NATURAL: Record<string, { friends: string[]; neutral: string[]; enemies: string[] }> = {
  Sun: { friends: ["Moon", "Mars", "Jupiter"], neutral: ["Mercury"], enemies: ["Venus", "Saturn"] },
  Moon: { friends: ["Sun", "Mercury"], neutral: ["Mars", "Jupiter", "Venus", "Saturn"], enemies: [] },
  Mars: { friends: ["Sun", "Moon", "Jupiter"], neutral: ["Venus", "Saturn"], enemies: ["Mercury"] },
  Mercury: { friends: ["Sun", "Venus"], neutral: ["Mars", "Jupiter", "Saturn"], enemies: ["Moon"] },
  Jupiter: { friends: ["Sun", "Moon", "Mars"], neutral: ["Saturn"], enemies: ["Mercury", "Venus"] },
  Venus: { friends: ["Mercury", "Saturn"], neutral: ["Mars", "Jupiter"], enemies: ["Sun", "Moon"] },
  Saturn: { friends: ["Mercury", "Venus"], neutral: ["Jupiter"], enemies: ["Sun", "Moon", "Mars"] },
};

export type FriendshipCell = {
  natural: "Friend" | "Neutral" | "Enemy";
  temporary: "Friend" | "Enemy";
  fiveFold: "Adhi Mitra" | "Mitra" | "Sama" | "Shatru" | "Adhi Shatru";
};

function naturalOf(a: string, b: string): FriendshipCell["natural"] {
  const row = NATURAL[a];
  if (!row) return "Neutral";
  if (row.friends.includes(b)) return "Friend";
  if (row.enemies.includes(b)) return "Enemy";
  return "Neutral";
}

/** Temporary friendship: signs 2, 3, 4, 10, 11, 12 from a planet are friendly. */
function temporaryOf(signA: number, signB: number): FriendshipCell["temporary"] {
  const gap = ((signB - signA + 12) % 12) + 1;
  return [2, 3, 4, 10, 11, 12].includes(gap) ? "Friend" : "Enemy";
}

function combine(nat: FriendshipCell["natural"], tmp: FriendshipCell["temporary"]): FriendshipCell["fiveFold"] {
  if (nat === "Friend" && tmp === "Friend") return "Adhi Mitra";
  if (nat === "Friend" && tmp === "Enemy") return "Sama";
  if (nat === "Neutral" && tmp === "Friend") return "Mitra";
  if (nat === "Neutral" && tmp === "Enemy") return "Shatru";
  if (nat === "Enemy" && tmp === "Friend") return "Sama";
  return "Adhi Shatru";
}

export function compositeFriendship(chart: KundliChart) {
  const signOf: Record<string, number> = {};
  for (const p of chart.planets) signOf[p.name as string] = p.rashi;
  const rows = FRIENDSHIP_PLANETS.filter((p) => signOf[p as string] !== undefined);
  const table: Record<string, Record<string, FriendshipCell>> = {};
  for (const a of rows) {
    table[a as string] = {};
    for (const b of rows) {
      if (a === b) continue;
      const nat = naturalOf(a as string, b as string);
      const tmp = temporaryOf(signOf[a as string], signOf[b as string]);
      table[a as string][b as string] = { natural: nat, temporary: tmp, fiveFold: combine(nat, tmp) };
    }
  }
  return { planets: rows as string[], table };
}

// ── Ascendant report ────────────────────────────────────────────────────────
type AscInfo = {
  symbol: string;
  element: string;
  characteristics: string;
  luckyStone: string;
  alternateStone: string;
  fastDay: string;
  luckyNumbers: string;
  luckyColours: string;
  deity: string;
};

const ASC_REPORT: AscInfo[] = [
  { symbol: "The Ram", element: "Fire", characteristics: "Direct, quick to decide and physically restless. You establish authority early and prefer to lead rather than negotiate. The weakness is impatience with slow processes and a tendency to open more fronts than you can finish.", luckyStone: "Red coral", alternateStone: "Carnelian", fastDay: "Tuesday", luckyNumbers: "9, 1", luckyColours: "Red, coral", deity: "Hanuman" },
  { symbol: "The Bull", element: "Earth", characteristics: "Steady, resource-minded and slow to change position once settled. You build value patiently and hold what you gain. The weakness is rigidity, and an attachment to comfort that can delay necessary moves.", luckyStone: "Diamond", alternateStone: "White sapphire", fastDay: "Friday", luckyNumbers: "6, 5", luckyColours: "White, pastel green", deity: "Lakshmi" },
  { symbol: "The Twins", element: "Air", characteristics: "Verbal, adaptable and information-driven. You succeed through communication, trade and negotiation. The weakness is scattered attention and a habit of talking a plan through instead of finishing it.", luckyStone: "Emerald", alternateStone: "Green tourmaline", fastDay: "Wednesday", luckyNumbers: "5, 3", luckyColours: "Green, grey", deity: "Vishnu" },
  { symbol: "The Crab", element: "Water", characteristics: "Protective, memory-driven and strongly attached to home and lineage. You read moods accurately and shelter the people around you. The weakness is withdrawal under pressure and holding grievances too long.", luckyStone: "Pearl", alternateStone: "Moonstone", fastDay: "Monday", luckyNumbers: "2, 7", luckyColours: "White, silver", deity: "Shiva" },
  { symbol: "The Lion", element: "Fire", characteristics: "Dignified, visible and organised around recognition. You take responsibility naturally and expect loyalty in return. The weakness is pride, and difficulty accepting correction in public.", luckyStone: "Ruby", alternateStone: "Red garnet", fastDay: "Sunday", luckyNumbers: "1, 4", luckyColours: "Gold, saffron", deity: "Surya" },
  { symbol: "The Maiden", element: "Earth", characteristics: "Analytical, exact and service-oriented. You improve systems others have left untidy and hold high standards for detail. The weakness is over-correction, worry and criticism directed inward first.", luckyStone: "Emerald", alternateStone: "Peridot", fastDay: "Wednesday", luckyNumbers: "5, 6", luckyColours: "Green, cream", deity: "Vishnu" },
  { symbol: "The Balance", element: "Air", characteristics: "Diplomatic, aesthetic and partnership-centred. You work best in alliance and you read fairness quickly. The weakness is indecision and a reluctance to force an uncomfortable but necessary conclusion.", luckyStone: "Diamond", alternateStone: "White sapphire", fastDay: "Friday", luckyNumbers: "6, 8", luckyColours: "White, sky blue", deity: "Lakshmi" },
  { symbol: "The Scorpion", element: "Water", characteristics: "Intense, private and investigative. You commit completely and recover from reversals that would stop others. The weakness is secrecy and long memory for injury.", luckyStone: "Red coral", alternateStone: "Bloodstone", fastDay: "Tuesday", luckyNumbers: "9, 4", luckyColours: "Maroon, deep red", deity: "Hanuman" },
  { symbol: "The Archer", element: "Fire", characteristics: "Principled, expansive and teaching-minded. You look for meaning and larger frameworks, and you travel or study to find them. The weakness is over-promising and impatience with detail.", luckyStone: "Yellow sapphire", alternateStone: "Yellow topaz", fastDay: "Thursday", luckyNumbers: "3, 9", luckyColours: "Yellow, gold", deity: "Vishnu, Brihaspati" },
  { symbol: "The Crocodile", element: "Earth", characteristics: "Disciplined, structural and long-horizon. You accept delay in exchange for durability and you carry responsibility without complaint. The weakness is austerity, and treating warmth as a luxury.", luckyStone: "Blue sapphire", alternateStone: "Amethyst", fastDay: "Saturday", luckyNumbers: "8, 6", luckyColours: "Blue, black", deity: "Shani, Hanuman" },
  { symbol: "The Water Bearer", element: "Air", characteristics: "Independent, reform-minded and socially wide. You think in systems and networks rather than individuals. The weakness is emotional distance and stubbornness disguised as principle.", luckyStone: "Blue sapphire", alternateStone: "Lapis lazuli", fastDay: "Saturday", luckyNumbers: "8, 4", luckyColours: "Blue, grey", deity: "Shani" },
  { symbol: "The Fishes", element: "Water", characteristics: "Compassionate, intuitive and imaginative. You absorb the atmosphere of a room and work best where meaning matters more than metrics. The weakness is boundary loss and escapism under stress.", luckyStone: "Yellow sapphire", alternateStone: "Citrine", fastDay: "Thursday", luckyNumbers: "3, 7", luckyColours: "Yellow, sea green", deity: "Vishnu" },
];

export function ascendantReport(chart: KundliChart) {
  const sign = chart.ascendant.rashi;
  const info = ASC_REPORT[sign];
  const lord = RASHI_LORDS[sign];
  const lordPlanet = chart.planets.find((p) => (p.name as string) === lord);
  return {
    ascendant: RASHIS[sign],
    degree: chart.ascendant.degreeInRashi,
    planetaryLord: lord,
    lordPlacement: lordPlanet
      ? {
          sign: RASHIS[lordPlanet.rashi],
          house: ((lordPlanet.rashi - sign + 12) % 12) + 1,
          retrograde: lordPlanet.retrograde,
        }
      : null,
    akshara: RASHI_AKSHARA[sign],
    ...info,
  };
}

// ── Sudarshana Chakra ───────────────────────────────────────────────────────
/**
 * The Sudarshana Chakra reads the same planets from three reference points:
 * the Lagna, the Sun's sign and the Moon's sign. A theme confirmed in all
 * three wheels is treated as certain, one confirmed in two as probable.
 */
export function sudarshanaChakra(chart: KundliChart) {
  const sun = chart.planets.find((p) => (p.name as string) === "Sun")!;
  const moon = chart.planets.find((p) => (p.name as string) === "Moon")!;
  const wheel = (base: number) => ({
    base: RASHIS[base],
    houses: Array.from({ length: 12 }, (_, i) => ({
      house: i + 1,
      sign: RASHIS[(base + i) % 12],
      planets: chart.planets.filter((p) => p.rashi === (base + i) % 12).map((p) => p.name as string),
    })),
  });
  const lagna = wheel(chart.ascendant.rashi);
  const surya = wheel(sun.rashi);
  const chandra = wheel(moon.rashi);
  const agreement = Array.from({ length: 12 }, (_, i) => {
    const count = [lagna, surya, chandra].filter((w) => w.houses[i].planets.length > 0).length;
    return {
      house: i + 1,
      wheelsOccupied: count,
      verdict: count === 3 ? "Confirmed in all three wheels" : count === 2 ? "Confirmed in two wheels" : count === 1 ? "Indicated in one wheel" : "Empty in all three wheels",
    };
  });
  return { lagna, surya, chandra, agreement };
}
