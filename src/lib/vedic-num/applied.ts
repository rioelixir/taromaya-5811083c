/**
 * Applied numerology: mobile numbers, business names, vehicle numbers and
 * house / flat / office numbers. All four share one scoring core so results
 * stay consistent across the product.
 */
import { reduce } from "@/lib/numerology";
import { numberRelation, VEDIC_PLANETS } from "@/lib/vedic-numerology";
import { reducedName } from "@/lib/numerology";

const ENERGY: Record<number, { money: number; talk: number; love: number; career: number; business: number; health: number }> = {
  1: { money: 72, talk: 78, love: 60, career: 88, business: 82, health: 74 },
  2: { money: 58, talk: 70, love: 90, career: 62, business: 55, health: 66 },
  3: { money: 80, talk: 92, love: 78, career: 82, business: 84, health: 76 },
  4: { money: 62, talk: 58, love: 54, career: 74, business: 66, health: 58 },
  5: { money: 86, talk: 90, love: 72, career: 84, business: 92, health: 70 },
  6: { money: 82, talk: 80, love: 92, career: 78, business: 86, health: 80 },
  7: { money: 56, talk: 64, love: 58, career: 70, business: 54, health: 64 },
  8: { money: 90, talk: 60, love: 52, career: 86, business: 80, health: 56 },
  9: { money: 76, talk: 74, love: 70, career: 80, business: 72, health: 72 },
};

const DIGIT_NOTE: Record<number, string> = {
  0: "Zero amplifies whatever digit stands beside it, for better or worse.",
  1: "One brings authority and self-direction.",
  2: "Two softens the number and helps partnership.",
  3: "Three adds speech, teaching and visibility.",
  4: "Four adds structure but slows momentum.",
  5: "Five adds movement, trade and quick contact.",
  6: "Six adds comfort, beauty and client goodwill.",
  7: "Seven adds depth but reduces outward flow.",
  8: "Eight adds weight, money and scrutiny.",
  9: "Nine adds drive and closure.",
};

export type AppliedKind = "mobile" | "vehicle" | "house" | "business";

export type AppliedResult = {
  kind: AppliedKind;
  input: string;
  cleaned: string;
  total: number;
  reduced: number;
  lastFour: { value: string; reduced: number } | null;
  planet: string;
  relationToOwner: "friend" | "neutral" | "enemy" | null;
  score: number;
  energies: { label: string; value: number }[];
  strongDigits: number[];
  weakDigits: number[];
  frequency: { digit: number; count: number; note: string }[];
  direction: string;
  colour: string;
  recommendation: string;
  suggestions: string[];
  remedies: string[];
};

const DIRECTION: Record<number, string> = {
  1: "East facing", 2: "North West facing", 3: "North East facing", 4: "South West facing",
  5: "North facing", 6: "South East facing", 7: "West facing", 8: "South facing", 9: "South facing",
};
const COLOUR: Record<number, string> = {
  1: "Golden or copper", 2: "Pearl white or cream", 3: "Yellow or saffron", 4: "Graphite grey or steel blue",
  5: "Silver or light green", 6: "Pearl white or rose", 7: "Sea green or smoke grey", 8: "Deep blue or charcoal", 9: "Red or maroon",
};

const digitsOf = (s: string) => s.replace(/[^0-9]/g, "");

function scoreFor(reducedValue: number, relation: AppliedResult["relationToOwner"], kind: AppliedKind): number {
  const e = ENERGY[reducedValue] ?? ENERGY[9]!;
  const base = kind === "mobile" ? (e.talk + e.money) / 2
    : kind === "business" ? (e.business + e.money) / 2
    : kind === "vehicle" ? (e.career + e.health) / 2
    : (e.health + e.love) / 2;
  const bonus = relation === "friend" ? 10 : relation === "enemy" ? -14 : 0;
  return Math.max(20, Math.min(99, Math.round(base + bonus)));
}

/** Analyse any number string (mobile, vehicle, house, flat, office). */
export function analyseNumber(
  kind: AppliedKind,
  input: string,
  ownerDriver: number | null = null,
): AppliedResult | null {
  const cleaned = digitsOf(input);
  if (!cleaned) return null;
  const digits = [...cleaned].map(Number);
  const total = digits.reduce((s, d) => s + d, 0);
  const reducedValue = reduce(total, false);
  const relation = ownerDriver ? numberRelation(reducedValue, ownerDriver) : null;
  const e = ENERGY[reducedValue] ?? ENERGY[9]!;
  const tally = new Map<number, number>();
  for (const d of digits) tally.set(d, (tally.get(d) ?? 0) + 1);
  const lastFourRaw = cleaned.length >= 4 ? cleaned.slice(-4) : null;

  const strong = [1, 3, 5, 6, 9];
  const score = scoreFor(reducedValue, relation, kind);

  return {
    kind,
    input,
    cleaned,
    total,
    reduced: reducedValue,
    lastFour: lastFourRaw
      ? { value: lastFourRaw, reduced: reduce([...lastFourRaw].reduce((s, c) => s + Number(c), 0), false) }
      : null,
    planet: VEDIC_PLANETS[reducedValue] ?? "—",
    relationToOwner: relation,
    score,
    energies: [
      { label: "Money energy", value: e.money },
      { label: "Communication energy", value: e.talk },
      { label: "Relationship energy", value: e.love },
      { label: "Career energy", value: e.career },
      { label: "Business energy", value: e.business },
      { label: "Health energy", value: e.health },
    ],
    strongDigits: [...tally.keys()].filter((d) => strong.includes(d)).sort((a, b) => a - b),
    weakDigits: [...tally.keys()].filter((d) => !strong.includes(d) && d !== 0).sort((a, b) => a - b),
    frequency: [...tally.entries()]
      .sort((a, b) => b[1] - a[1] || a[0] - b[0])
      .map(([digit, count]) => ({ digit, count, note: DIGIT_NOTE[digit] ?? "" })),
    direction: DIRECTION[reducedValue] ?? "—",
    colour: COLOUR[reducedValue] ?? "—",
    recommendation:
      score >= 78 ? "Strongly favourable. Keep this number as it is."
        : score >= 62 ? "Workable. It supports you once the remedies below are in place."
        : "Weak for your chart. Consider an alternative, or use the remedies consistently.",
    suggestions: suggestionsFor(kind, reducedValue, relation),
    remedies: remediesFor(kind, reducedValue),
  };
}

function suggestionsFor(kind: AppliedKind, value: number, relation: AppliedResult["relationToOwner"]): string[] {
  const out: string[] = [];
  if (relation === "enemy") out.push("The number's planet is unfriendly to your driver number. Prefer an alternative when you have the choice.");
  if (kind === "mobile") {
    out.push("Keep the last four digits summing to 1, 3, 5, 6 or 9 for smoother communication and payments.");
    out.push("Avoid using two different primary numbers for money; route income through one.");
  }
  if (kind === "business") {
    out.push("Register the trading name in the spelling that was tested here — even one extra letter changes the number.");
    out.push("Prefer invoice and account numbers reducing to your business number for consistency.");
  }
  if (kind === "vehicle") {
    out.push("Take delivery on a date whose reduced value matches your driver or conductor number.");
    out.push(`Keep the exterior close to ${COLOUR[value] ?? "a neutral tone"} for a settled feel.`);
  }
  if (kind === "house") {
    out.push("If the door number is unfavourable, add the block or floor letter to shift the effective value.");
    out.push("Keep the entrance well lit and uncluttered; the number's energy enters with you.");
  }
  return out;
}

function remediesFor(kind: AppliedKind, value: number): string[] {
  const planet = VEDIC_PLANETS[value] ?? "the ruling planet";
  return [
    `Strengthen ${planet} through its weekday: keep that day simple, punctual and honest.`,
    `Wear or keep ${COLOUR[value] ?? "a neutral colour"} near the ${kind === "mobile" ? "phone case" : kind === "vehicle" ? "dashboard" : "entrance"}.`,
    "Give a small monthly donation aligned to the ruling planet; keep it regular rather than large.",
    "Repeat the planetary mantra eleven times before important calls, drives or signings.",
  ];
}

export type BusinessResult = {
  name: string;
  nameNumber: number;
  compound: number;
  planet: string;
  founderRelation: "friend" | "neutral" | "enemy" | null;
  strength: string[];
  weakness: string[];
  launchAdvice: string;
  luckyDates: number[];
  luckyInvoiceEndings: number[];
  luckyAccountEndings: number[];
  score: number;
};

/** Business name analysis, cross-read against the founder's driver number. */
export function analyseBusinessName(name: string, founderDriver: number | null): BusinessResult | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const compound = reducedName(trimmed, "Chaldean");
  const nameNumber = reduce(compound, false);
  const relation = founderDriver ? numberRelation(nameNumber, founderDriver) : null;
  const e = ENERGY[nameNumber] ?? ENERGY[9]!;
  const score = Math.max(25, Math.min(98, Math.round((e.business + e.money) / 2 + (relation === "friend" ? 10 : relation === "enemy" ? -14 : 0))));
  const strengthMap: Record<number, string[]> = {
    1: ["Clear leadership identity", "Works well for a founder-led brand"],
    2: ["Excellent for partnerships and service businesses", "Clients feel heard"],
    3: ["Strong for teaching, media, content and consulting", "Word of mouth travels fast"],
    4: ["Reliable for manufacturing, logistics and compliance work", "Systems hold under load"],
    5: ["Ideal for trading, retail, travel and technology", "Fast sales cycles"],
    6: ["Excellent for beauty, food, hospitality and property", "Repeat customers"],
    7: ["Suits research, analytics, spiritual and niche practice", "Depth over volume"],
    8: ["Strong for finance, real estate and heavy industry", "Scales with structure"],
    9: ["Good for healthcare, defence supply and social enterprise", "Purpose attracts talent"],
  };
  const weaknessMap: Record<number, string[]> = {
    1: ["Bottlenecks at the founder", "Delegation must be deliberate"],
    2: ["Decisions can drift", "Pricing needs firmness"],
    3: ["Overpromising and scattered focus", "Cash discipline needed"],
    4: ["Slow to seize an opening", "Marketing feels heavy"],
    5: ["High churn and constant pivoting", "Documentation lags"],
    6: ["Cost of comfort creeps up", "Over-serving unprofitable clients"],
    7: ["Sales resistance and slow inflow", "Needs a commercial partner"],
    8: ["Regulatory and legal scrutiny", "Burnout at the top"],
    9: ["Emotional decisions", "Endings arrive suddenly"],
  };
  return {
    name: trimmed,
    nameNumber,
    compound,
    planet: VEDIC_PLANETS[nameNumber] ?? "—",
    founderRelation: relation,
    strength: strengthMap[nameNumber] ?? [],
    weakness: weaknessMap[nameNumber] ?? [],
    launchAdvice: `Launch on a date whose reduced value is ${nameNumber} or ${founderDriver ?? nameNumber}. Avoid dates reducing to a number unfriendly to both.`,
    luckyDates: [nameNumber, reduce(nameNumber + 9, false), reduce(nameNumber + 18, false)],
    luckyInvoiceEndings: [nameNumber, reduce(nameNumber + 3, false)],
    luckyAccountEndings: [nameNumber, reduce(nameNumber + 6, false)],
    score,
  };
}
