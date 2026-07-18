// Lal Kitab engine (browser-safe, ChartLite input).
//
// Provides:
//   • House-based planet condition + reading + remedy (Strong / Weak / Mixed).
//   • Rin (karmic debts): Pitra, Matra, Stri, Self, Ancestral — flagged from
//     classical Lal Kitab conditions.
//   • Varshphal (annual) chart: age-N house map derived by Lal Kitab
//     age-rotation (each year advances the natal grid by one house).

export type ChartLite = {
  ascendant: { rashi: number; degreeInRashi: number };
  planets: Array<{
    name: string;
    longitude: number;
    rashi: number;
    house: number;
    degreeInRashi: number;
    retrograde: boolean;
  }>;
};

export const LK_RASHIS = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces",
] as const;

type PN =
  | "Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter" | "Venus" | "Saturn"
  | "Rahu" | "Ketu";

const STRONG: Record<PN, number[]> = {
  Sun:[1,3,4,10,11], Moon:[2,4,9,10], Mars:[3,6,10,11],
  Mercury:[1,4,5,9,10,11], Jupiter:[1,2,4,5,9,10,11],
  Venus:[2,3,4,5,7,11,12], Saturn:[2,3,7,10,11,12],
  Rahu:[3,6,10,11], Ketu:[3,6,9,12],
};
const WEAK: Record<PN, number[]> = {
  Sun:[6,8,12], Moon:[6,8,10], Mars:[4,7,8],
  Mercury:[3,6,7,8], Jupiter:[3,6,7,8], Venus:[6,8,9],
  Saturn:[1,4,5,8], Rahu:[1,5,8,9], Ketu:[1,2,4,5,7,8],
};

const REMEDY: Record<PN, string> = {
  Sun: "Offer water to the rising Sun daily; keep a copper coin in a red cloth; respect your father and elders.",
  Moon: "Serve your mother; keep silver in your pocket; drink milk from a silver vessel; avoid grey on Mondays.",
  Mars: "Feed sweetened rice to birds; keep a tandoori roti under your pillow briefly, then feed it to a dog; wear red on Tuesdays.",
  Mercury: "Feed green fodder to cows; keep a whole green cardamom in your wallet; avoid pure green on Wednesdays if Mercury is weak.",
  Jupiter: "Apply a saffron tilak; donate turmeric or gram-flour laddoos on Thursdays; respect teachers and gurus.",
  Venus: "Serve cows; donate curd or white cloth on Fridays; keep a small silver coin; maintain sensory cleanliness.",
  Saturn: "Feed crows and dogs; keep an iron nail with you; light a mustard-oil lamp on Saturdays; serve labourers and the elderly.",
  Rahu: "Donate coconut in flowing water; keep a silver square; avoid alcohol and non-veg where possible.",
  Ketu: "Feed dogs; keep a two-coloured blanket for cold nights; wear silver on the right hand; care for stray animals.",
};

export type LKRow = {
  planet: string;
  house: number;
  rashi: number;
  status: "Strong" | "Weak" | "Mixed";
  reading: string;
  remedy: string;
};

function ordinal(n: number) {
  const s = ["th","st","nd","rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function lalKitabTable(chart: ChartLite): LKRow[] {
  return chart.planets.map((p) => {
    const name = p.name as PN;
    const h = p.house;
    const strong = STRONG[name]?.includes(h) ?? false;
    const weak = WEAK[name]?.includes(h) ?? false;
    const status: LKRow["status"] = strong && !weak ? "Strong" : weak && !strong ? "Weak" : "Mixed";
    const reading =
      status === "Strong"
        ? `${p.name} works on its higher octave from the ${ordinal(h)} house — its themes flourish and support you.`
        : status === "Weak"
        ? `${p.name} struggles in the ${ordinal(h)} house — its karmas generate friction until remedy is applied.`
        : `${p.name} in the ${ordinal(h)} shows a mixed signature — situationally rewarding, situationally testing.`;
    return {
      planet: p.name, house: h, rashi: p.rashi, status, reading,
      remedy: REMEDY[name] ?? "",
    };
  });
}

// -------- Rin (Karmic Debts) --------

export type Rin = {
  key: "pitra" | "matra" | "stri" | "self" | "ancestral";
  name: string;
  present: boolean;
  reason: string;
  remedy: string;
};

function houseOf(chart: ChartLite, name: string): number | null {
  const p = chart.planets.find((pl) => pl.name === name);
  return p ? p.house : null;
}

export function lalKitabRins(chart: ChartLite): Rin[] {
  const out: Rin[] = [];
  const sun = houseOf(chart, "Sun");
  const jup = houseOf(chart, "Jupiter");
  const rahu = houseOf(chart, "Rahu");
  const ketu = houseOf(chart, "Ketu");
  const moon = houseOf(chart, "Moon");
  const mars = houseOf(chart, "Mars");
  const ven = houseOf(chart, "Venus");
  const mer = houseOf(chart, "Mercury");
  const sat = houseOf(chart, "Saturn");

  // Pitra Rin — Sun with Rahu or Ketu, or in 12th; Jupiter afflicted in 5/9.
  const pitraFlags: string[] = [];
  if (sun !== null && rahu !== null && sun === rahu) pitraFlags.push("Sun conjunct Rahu");
  if (sun !== null && ketu !== null && sun === ketu) pitraFlags.push("Sun conjunct Ketu");
  if (sun === 12) pitraFlags.push("Sun in 12th");
  if (jup !== null && rahu !== null && jup === rahu) pitraFlags.push("Jupiter afflicted by Rahu");
  out.push({
    key: "pitra", name: "Pitra Rin (Ancestral / Fathers)",
    present: pitraFlags.length > 0,
    reason: pitraFlags.join(" · ") || "No classical marker present.",
    remedy: "Perform Tarpan or Pind-Daan on new moon and Pitru Paksha. Feed brahmins and the elderly. Plant a peepal tree and water it.",
  });

  // Matra Rin — Moon with Rahu/Ketu/Saturn, or in 6/8/10 weakly.
  const matraFlags: string[] = [];
  if (moon !== null && rahu !== null && moon === rahu) matraFlags.push("Moon conjunct Rahu");
  if (moon !== null && ketu !== null && moon === ketu) matraFlags.push("Moon conjunct Ketu");
  if (moon !== null && sat !== null && moon === sat) matraFlags.push("Moon conjunct Saturn");
  if (moon !== null && [6, 8, 10].includes(moon)) matraFlags.push(`Moon in ${ordinal(moon)}`);
  out.push({
    key: "matra", name: "Matra Rin (Mother)",
    present: matraFlags.length > 0,
    reason: matraFlags.join(" · ") || "No classical marker present.",
    remedy: "Serve your mother and elderly women. Donate milk, rice, and white flowers on Mondays. Keep silver on your person.",
  });

  // Stri Rin — Venus with Rahu/Ketu/Saturn; Venus in 6/8.
  const striFlags: string[] = [];
  if (ven !== null && rahu !== null && ven === rahu) striFlags.push("Venus conjunct Rahu");
  if (ven !== null && ketu !== null && ven === ketu) striFlags.push("Venus conjunct Ketu");
  if (ven !== null && sat !== null && ven === sat) striFlags.push("Venus conjunct Saturn");
  if (ven !== null && [6, 8].includes(ven)) striFlags.push(`Venus in ${ordinal(ven)}`);
  out.push({
    key: "stri", name: "Stri Rin (Spouse / Feminine)",
    present: striFlags.length > 0,
    reason: striFlags.join(" · ") || "No classical marker present.",
    remedy: "Never disrespect women in the family. Donate curd, sugar, and white cloth on Fridays. Feed and shelter a cow.",
  });

  // Self Rin — Ascendant lord weak, Mars/Merc afflicted.
  const selfFlags: string[] = [];
  if (mars !== null && sat !== null && mars === sat) selfFlags.push("Mars conjunct Saturn");
  if (mer !== null && rahu !== null && mer === rahu) selfFlags.push("Mercury conjunct Rahu");
  out.push({
    key: "self", name: "Rin of Self (Aatm-Rin)",
    present: selfFlags.length > 0,
    reason: selfFlags.join(" · ") || "No classical marker present.",
    remedy: "Take responsibility. Avoid deceit and gambling. Serve labourers and give unattributed charity on Saturdays.",
  });

  // Ancestral / Karmic — Rahu-Ketu axis across 1-7 or 4-10.
  const ancFlags: string[] = [];
  if (rahu !== null && [1, 4, 7, 10].includes(rahu)) ancFlags.push(`Rahu in ${ordinal(rahu)}`);
  if (ketu !== null && [1, 4, 7, 10].includes(ketu)) ancFlags.push(`Ketu in ${ordinal(ketu)}`);
  out.push({
    key: "ancestral", name: "Ancestral Karma (Kul-Rin)",
    present: ancFlags.length >= 2,
    reason: ancFlags.join(" · ") || "No axial affliction on angles.",
    remedy: "Perform Kul-Devta puja. Maintain family rituals. Donate a coconut into flowing water on new moons.",
  });

  return out;
}

// -------- Varshphal (Lal Kitab annual chart) --------
// Age-N chart: each planet's house shifts forward by (N-1) houses from natal.
// Simplified but faithful to the age-rotation model used across Lal Kitab
// annual predictions.

export type VarshphalPosition = {
  planet: string;
  natalHouse: number;
  annualHouse: number;
  natalRashi: number;
  status: "Strong" | "Weak" | "Mixed";
};

export function lalKitabVarshphal(chart: ChartLite, age: number): VarshphalPosition[] {
  const shift = ((age - 1) % 12 + 12) % 12;
  return chart.planets.map((p) => {
    const annual = ((p.house - 1 + shift) % 12) + 1;
    const name = p.name as PN;
    const strong = STRONG[name]?.includes(annual) ?? false;
    const weak = WEAK[name]?.includes(annual) ?? false;
    const status: VarshphalPosition["status"] =
      strong && !weak ? "Strong" : weak && !strong ? "Weak" : "Mixed";
    return { planet: p.name, natalHouse: p.house, annualHouse: annual, natalRashi: p.rashi, status };
  });
}
