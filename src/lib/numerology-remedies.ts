// Practical remedies and suggested changes for mobile numbers and names.
// Everything here is deterministic: the same input always gives the same plan,
// so no AI credits are used and the advice never drifts.

import { reduce } from "@/lib/numerology";
import { mobileDobMatch } from "@/lib/name-spelling";
import { nameChart, nameHarmony, spellingOptions, type NameSystem } from "@/lib/name-numerology-pro";

const PLANET: Record<number, string> = {
  1: "Sun", 2: "Moon", 3: "Jupiter", 4: "Rahu", 5: "Mercury",
  6: "Venus", 7: "Ketu", 8: "Saturn", 9: "Mars",
};

/** Which vibrations sit comfortably with each birth vibration. */
const FRIENDLY: Record<number, number[]> = {
  1: [1, 2, 3, 5, 6, 9],
  2: [1, 2, 3, 5, 7],
  3: [1, 3, 5, 6, 9],
  4: [1, 5, 6, 7, 8],
  5: [1, 2, 3, 4, 5, 6, 7, 9],
  6: [1, 3, 4, 5, 6, 8, 9],
  7: [2, 4, 5, 7, 9],
  8: [4, 5, 6, 8],
  9: [1, 2, 3, 5, 6, 7, 9],
};

/** Everyday, non-medical support for each vibration. */
const SUPPORT: Record<number, { day: string; colour: string; habit: string; caution: string }> = {
  1: { day: "Sunday", colour: "warm gold or amber", habit: "start the day with one clear decision made before ten in the morning", caution: "avoid deciding for others when you are tired" },
  2: { day: "Monday", colour: "pearl white or silver", habit: "keep a short evening note of how the day felt", caution: "avoid saying yes to keep the peace" },
  3: { day: "Thursday", colour: "yellow or saffron", habit: "study or teach something for twenty minutes daily", caution: "avoid over-promising in conversation" },
  4: { day: "Saturday", colour: "grey or deep blue", habit: "write tomorrow's three tasks the night before", caution: "avoid last-minute paperwork and unread agreements" },
  5: { day: "Wednesday", colour: "green", habit: "reply to pending messages in one fixed slot each day", caution: "avoid starting more than two new things at once" },
  6: { day: "Friday", colour: "cream or soft pink", habit: "keep one unhurried meal with family or a close friend weekly", caution: "avoid taking on the whole family's load alone" },
  7: { day: "Tuesday", colour: "smoky grey", habit: "keep fifteen quiet minutes without a screen before sleep", caution: "avoid deciding important matters while withdrawn" },
  8: { day: "Saturday", colour: "black or dark blue", habit: "check money and commitments on a fixed weekday", caution: "avoid informal lending and verbal-only deals" },
  9: { day: "Tuesday", colour: "red or terracotta", habit: "spend energy in movement before hard conversations", caution: "avoid acting on the first flash of anger" },
};

export type MobileCandidate = {
  number: string;
  reduced: number;
  changes: number;         // how many digits differ from the current number
  changedAt: number[];     // 0-based positions that changed
  score: number;           // 0..100 fit with the birth blueprint
  why: string;
};

export type MobileRemedyPlan = {
  current: { number: string; reduced: number; planet: string; score: number; verdict: string };
  lifePath: number;
  driver: number;
  targets: number[];             // vibrations that suit this person
  needsChange: boolean;
  candidates: MobileCandidate[]; // suggested edited numbers, closest first
  favourDigits: number[];
  reduceDigits: number[];
  steps: string[];               // do this
  cautions: string[];            // watch this
};

function reducedOfDigits(digits: string): number {
  const sum = digits.split("").reduce((s, c) => s + Number(c), 0);
  return reduce(sum, false);
}

/**
 * Suggested mobile-number edits. Only the last few digits are touched, so the
 * number stays close to the one already in use and is easy to request from an
 * operator.
 */
export function mobileRemedyPlan(mobile: string, birthDate: string): MobileRemedyPlan | null {
  const digits = mobile.replace(/\D/g, "");
  if (digits.length < 6 || !birthDate) return null;
  const match = mobileDobMatch(digits, birthDate);
  if (!match) return null;

  const lifePath = match.conductorDob;
  const driver = match.driverDob;
  const targets = Array.from(
    new Set([lifePath, driver, ...(FRIENDLY[lifePath] ?? [])]),
  ).filter((n) => n >= 1 && n <= 9);

  const dobDigits = new Set(birthDate.replace(/\D/g, "").split(""));
  const tail = Math.min(4, digits.length - 1); // never touch the leading digit

  const seen = new Set<string>([digits]);
  const candidates: MobileCandidate[] = [];

  const consider = (next: string, changedAt: number[]) => {
    if (seen.has(next)) return;
    const r = reducedOfDigits(next);
    if (!targets.includes(r)) return;
    seen.add(next);
    const overlap = next.split("").filter((d) => dobDigits.has(d)).length;
    const exact = r === lifePath ? 45 : r === driver ? 35 : 25;
    const score = Math.max(0, Math.min(100, exact + Math.min(30, overlap * 4) + (changedAt.length === 1 ? 15 : 5)));
    candidates.push({
      number: next,
      reduced: r,
      changes: changedAt.length,
      changedAt,
      score,
      why:
        r === lifePath
          ? `Adds up to ${r}, the same vibration as your life path.`
          : r === driver
            ? `Adds up to ${r}, the same vibration as your birth day.`
            : `Adds up to ${r} (${PLANET[r]}), which works easily with your life path ${lifePath}.`,
    });
  };

  // Single-digit edits in the tail.
  for (let i = digits.length - tail; i < digits.length; i++) {
    for (let d = 0; d <= 9; d++) {
      if (String(d) === digits[i]) continue;
      consider(digits.slice(0, i) + d + digits.slice(i + 1), [i]);
    }
  }
  // Two-digit edits on the last two places, for people who want a rounder tail.
  if (digits.length >= 3) {
    const a = digits.length - 2;
    for (let d1 = 0; d1 <= 9; d1++) {
      for (let d2 = 0; d2 <= 9; d2++) {
        const next = digits.slice(0, a) + d1 + d2;
        consider(next, [a, a + 1]);
      }
    }
  }

  candidates.sort((x, y) => y.score - x.score || x.changes - y.changes);

  const favourDigits = targets.slice(0, 4);
  const reduceDigits = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => !targets.includes(n)).slice(0, 4);
  const s = SUPPORT[lifePath] ?? SUPPORT[1]!;
  const needsChange = !(match.matchesLifePath || match.matchesDriver || match.compatible);

  const steps = [
    needsChange
      ? `Ask your operator for one of the numbers below, or pick a new SIM whose digits add up to ${targets.slice(0, 3).join(", ")}.`
      : `Keep this number. It already adds up to ${match.reducedMobile} (${match.planetMobile}), which suits your chart.`,
    `Use the number for calls and payments for a full month before judging the change, and note how work replies and money timing feel.`,
    `Keep one number for work and one for family if you can: mixing both on a discordant number is what usually feels heavy.`,
    `On ${s.day}, review pending calls and messages on this number; ${s.habit}.`,
    `When choosing a new number, prefer more of the digits ${favourDigits.join(", ")} and fewer of ${reduceDigits.join(", ")}.`,
  ];
  const cautions = [
    `A number change supports timing and habit; it does not replace the work itself.`,
    s.caution.charAt(0).toUpperCase() + s.caution.slice(1) + ".",
    `Do not change numbers repeatedly. One considered change, then at least six months of steady use.`,
  ];

  return {
    current: {
      number: digits,
      reduced: match.reducedMobile,
      planet: match.planetMobile,
      score: match.score,
      verdict: match.verdict,
    },
    lifePath,
    driver,
    targets,
    needsChange,
    candidates: candidates.slice(0, 6),
    favourDigits,
    reduceDigits,
    steps,
    cautions,
  };
}

export type NameRemedyPlan = {
  name: string;
  system: NameSystem;
  compound: number;
  root: number;
  harmonyScore: number;
  harmonyVerdict: string;
  targets: number[];
  needsChange: boolean;
  better: Array<{ spelling: string; root: number; compound: number; score: number; change: string; note: string }>;
  avoid: Array<{ spelling: string; root: number; score: number; change: string }>;
  addLetters: string[];
  easeLetters: string[];
  steps: string[];
  cautions: string[];
};

const LETTERS_FOR: Record<number, string[]> = {
  1: ["A", "I", "J", "Q", "Y"],
  2: ["B", "K", "R"],
  3: ["C", "G", "L", "S"],
  4: ["D", "M", "T"],
  5: ["E", "H", "N", "X"],
  6: ["U", "V", "W"],
  7: ["O", "Z"],
  8: ["F", "P"],
  9: ["I", "R"],
};

/**
 * Suggested name changes: which spellings sit better with the birth numbers,
 * which letters to lean on, and how to actually put the change into use.
 */
export function nameRemedyPlan(
  fullName: string,
  mulank: number,
  bhagyank: number,
  system: NameSystem = "Chaldean",
): NameRemedyPlan | null {
  const name = fullName.trim().replace(/\s+/g, " ");
  if (name.length < 2) return null;

  const chart = nameChart(name, system);
  const harmony = nameHarmony(chart.root, mulank, bhagyank);
  const options = spellingOptions(name, mulank, bhagyank, system, 8);

  const targets = Array.from(
    new Set([bhagyank, mulank, ...(FRIENDLY[bhagyank] ?? [])]),
  ).filter((n) => n >= 1 && n <= 9);
  const needsChange = harmony.score < 65 && !targets.includes(chart.root);

  const addLetters = Array.from(new Set(targets.slice(0, 3).flatMap((n) => LETTERS_FOR[n] ?? [])));
  const easeLetters = Array.from(
    new Set(
      [1, 2, 3, 4, 5, 6, 7, 8, 9]
        .filter((n) => !targets.includes(n))
        .slice(0, 2)
        .flatMap((n) => LETTERS_FOR[n] ?? []),
    ),
  );

  const best = options.better[0];
  const steps = [
    needsChange && best
      ? `Try the spelling "${best.spelling}" (${best.change}). It carries ${best.root}, which agrees with your birth numbers ${mulank} and ${bhagyank}.`
      : `Keep your present spelling. It carries ${chart.root}, which already works with your birth numbers ${mulank} and ${bhagyank}.`,
    `Change the name where it is actually used, not on paper alone: email signature, social handles, how you introduce yourself, and how you sign.`,
    `Say the new spelling aloud for a week before committing. If it feels awkward to speak, choose the next option instead.`,
    `Leave legal documents alone unless a lawyer guides the change. Numerology works on the name in daily use.`,
    `Lean on the letters ${addLetters.slice(0, 6).join(", ")} when picking a short form or a business name.`,
  ];
  const cautions = [
    `One spelling change at a time, then three months of steady use before judging it.`,
    `Do not change a name that carries family meaning purely for a number. A supportive short form is often enough.`,
    easeLetters.length > 0
      ? `Go lighter on ${easeLetters.slice(0, 4).join(", ")} in new spellings; they pull away from your birth vibration.`
      : `Keep the spelling simple; extra silent letters rarely help.`,
  ];

  return {
    name,
    system,
    compound: chart.compound,
    root: chart.root,
    harmonyScore: harmony.score,
    harmonyVerdict: harmony.verdict,
    targets,
    needsChange,
    better: options.better.slice(0, 5).map((o) => ({
      spelling: o.spelling, root: o.root, compound: o.compound, score: o.score, change: o.change, note: o.note,
    })),
    avoid: options.avoid.slice(0, 3).map((o) => ({
      spelling: o.spelling, root: o.root, score: o.score, change: o.change,
    })),
    addLetters,
    easeLetters,
    steps,
    cautions,
  };
}
