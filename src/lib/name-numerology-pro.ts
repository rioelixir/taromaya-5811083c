// Professional name numerology: Chaldean letter chart with compound (Cheiro)
// numbers, Pythagorean chart, name-versus-birth harmony, and spelling
// correction candidates.
//
// Methodology (deterministic, documented):
//   * Chaldean values 1..8 (9 is never assigned to a letter, it is sacred).
//   * The COMPOUND total is kept as-is and read from the classical 10..52
//     table; the single digit is the reduced root (masters not preserved in
//     Chaldean practice — Chaldean always reduces to 1..9).
//   * Pythagorean values 1..9 with master numbers preserved on reduction.
//   * Word-by-word totals are shown because Chaldean reads first name, middle
//     name(s), surname and the whole signature separately.

import { reduce } from "./numerology";

const CHALDEAN: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 8, G: 3, H: 5, I: 1,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 7, P: 8, Q: 1, R: 2,
  S: 3, T: 4, U: 6, V: 6, W: 6, X: 5, Y: 1, Z: 7,
};
const PYTHAGOREAN: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
};

export type NameSystem = "Chaldean" | "Pythagorean";

const clean = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z ]/g, " ");

/** Chaldean reduction: plain digit sum to 1..9, never keeping 11/22/33. */
function chaldeanRoot(total: number): number {
  return total <= 0 ? 0 : reduce(total, false);
}

export type LetterCell = { letter: string; value: number; isVowel: boolean };
export type WordChart = {
  word: string;
  cells: LetterCell[];
  compound: number;
  root: number;
  compoundMeaning: string;
};

export type NameChart = {
  system: NameSystem;
  fullName: string;
  words: WordChart[];
  cells: LetterCell[];
  compound: number;
  root: number;
  compoundMeaning: string;
  vowelTotal: number;   // soul urge input
  vowelRoot: number;
  consonantTotal: number;  // personality input
  consonantRoot: number;
  letterCounts: Record<string, number>;
  missingValues: number[];   // 1..9 values not present in the name
  repeatedValues: { value: number; count: number }[];
};

/**
 * Classical compound-number readings (Cheiro / Chaldean tradition), 10..52.
 * Numbers above 52 are read by their reduced root plus the nearest classical
 * compound of the same root, so no total is ever left without a meaning.
 */
export const COMPOUND_MEANINGS: Record<number, string> = {
  10: "The Wheel of Fortune. Self-made results. Whatever you begin tends to complete itself, for good or ill, so choose the beginning carefully.",
  11: "A test number. Hidden trials and people who lean on you. Strong intuition, but you must not carry other people's decisions.",
  12: "The sacrifice. You learn through being used or overlooked once, then you become very hard to fool.",
  13: "Upheaval that clears ground. Not unlucky, but it forces change of place, work or partner. Power comes after the disruption.",
  14: "Movement, media, dealings with the public, money that comes in waves. Risk in speculation, travel and written agreements.",
  15: "Magnetism and persuasion. Gifts, patrons and favours arrive easily. Guard the ethics of how you use influence.",
  16: "A warning of sudden falls from a good position. Plan for accidents in career and travel, avoid over-confidence.",
  17: "The star of the Magi. Difficulty early, lasting name later. Spiritual rise above material loss.",
  18: "Material conflict. Family quarrels, deception, war-like competition. Success possible, peace expensive.",
  19: "The Prince of Heaven. Honour, victory, recognition after effort. One of the strongest compounds.",
  20: "The awakening. A call to a new purpose that delays worldly plans. Patience beats force.",
  21: "The crown of the Magi. Advancement after long struggle, victory that endures.",
  22: "Caution against illusion. Good ideas built on soft ground. Verify facts and paperwork.",
  23: "The royal star of the lion. Help from superiors, protection, success in dealings with people in power.",
  24: "Gain through love, partners and the opposite sex. Assistance from those above you in position.",
  25: "Strength gained through experience and trial. Judgement improves after mistakes; not lucky in early life.",
  26: "Grave warning in partnerships, speculation and other people's advice. Charitable work redeems it.",
  27: "The sceptre. Reward for creative and intellectual work. Carry out your own plans, not borrowed ones.",
  28: "Promise that repeats itself. Great gains lost and rebuilt. Protect contracts and insurance.",
  29: "Uncertainty from people. Betrayal, gossip and unreliable friends. Choose company with care.",
  30: "Thoughtful retrospection. Mental superiority over money. Success on your own terms, indifferent to wealth.",
  31: "Self-contained and isolated. Deep thinker, often alone or ahead of the crowd.",
  32: "Magical power of communication with crowds. Success if you hold to your own judgement against advisers.",
  33: "Same reading as 24. Gain through affection, partnership and influential goodwill.",
  34: "Same reading as 25. Strength forged by trial and honest self-review.",
  35: "Same reading as 26. Caution in partnership and other people's money.",
  36: "Same reading as 27. Authority earned by original creative work.",
  37: "Good fortune in partnerships and love, especially long friendships and shared enterprise.",
  38: "Same reading as 29. Careful about promises made to you and by you.",
  39: "Same reading as 30. Prefer the reward of understanding to the reward of noise.",
  40: "Same reading as 31. Independence, research, and a private inner world.",
  41: "Same reading as 32. Persuasive with groups; keep your own counsel.",
  42: "Same reading as 24. Support arrives through people who like you.",
  43: "Revolution and unrest. Warning number; success only through disciplined ethics.",
  44: "Same reading as 26. Repeat caution on advice, guarantees and joint funds.",
  45: "Same reading as 27. Command through skill and clear thinking.",
  46: "Same reading as 37. Fortunate for alliances and durable friendships.",
  47: "Same reading as 29. Watch for false friends and quiet opposition.",
  48: "Same reading as 30. Mental achievement outweighs money.",
  49: "Same reading as 31. Solitary strength and specialised knowledge.",
  50: "Same reading as 32. Reach large audiences; do not be talked out of your plan.",
  51: "The warrior. Sudden advancement and power, but it draws enemies. Protect yourself in public roles.",
  52: "Same reading as 43. Unrest unless purpose stays honest.",
};

const ROOT_MEANINGS: Record<number, string> = {
  1: "Sun energy. Lead, decide, be visible. Works badly under close supervision.",
  2: "Moon energy. Sense the mood, pair up, negotiate. Needs emotional steadiness.",
  3: "Jupiter energy. Teach, expand, express. Needs discipline with money and words.",
  4: "Rahu energy. Systems, unusual routes, technology. Needs paperwork done properly.",
  5: "Mercury energy. Trade, speech, quick learning. Needs rest from constant motion.",
  6: "Venus energy. Beauty, comfort, care of family and clients. Needs limits on indulgence.",
  7: "Ketu energy. Research, faith, detachment. Needs practical grounding.",
  8: "Saturn energy. Structure, endurance, delayed reward. Needs honesty and patience.",
  9: "Mars energy. Drive, courage, defence of others. Needs an outlet for heat.",
};

function compoundMeaning(total: number): string {
  if (COMPOUND_MEANINGS[total]) return COMPOUND_MEANINGS[total]!;
  const r = chaldeanRoot(total);
  const sameRoot = Object.keys(COMPOUND_MEANINGS)
    .map(Number)
    .filter((k) => chaldeanRoot(k) === r)
    .sort((a, b) => b - a)[0];
  const extra = sameRoot ? ` Nearest classical reading is ${sameRoot}: ${COMPOUND_MEANINGS[sameRoot]}` : "";
  return `Total ${total} reduces to ${r}. ${ROOT_MEANINGS[r] ?? ""}${extra}`;
}

const VOWELS = new Set("AEIOU");

function chartWord(word: string, map: Record<string, number>, system: NameSystem): WordChart {
  const ls = word.split("").filter((c) => c >= "A" && c <= "Z");
  const cells: LetterCell[] = ls.map((letter, i) => {
    let isVowel = VOWELS.has(letter);
    if (letter === "Y") {
      const prev = ls[i - 1];
      const next = ls[i + 1];
      isVowel = !((prev && VOWELS.has(prev)) || (next && VOWELS.has(next)));
    }
    return { letter, value: map[letter] ?? 0, isVowel };
  });
  const compound = cells.reduce((s, c) => s + c.value, 0);
  return {
    word,
    cells,
    compound,
    root: system === "Chaldean" ? chaldeanRoot(compound) : reduce(compound),
    compoundMeaning: compoundMeaning(compound),
  };
}

export function nameChart(fullName: string, system: NameSystem = "Chaldean"): NameChart {
  const map = system === "Chaldean" ? CHALDEAN : PYTHAGOREAN;
  const words = clean(fullName).split(/\s+/).filter(Boolean).map((w) => chartWord(w, map, system));
  const cells = words.flatMap((w) => w.cells);
  const compound = cells.reduce((s, c) => s + c.value, 0);
  const root = system === "Chaldean" ? chaldeanRoot(compound) : reduce(compound);
  const vowelTotal = cells.filter((c) => c.isVowel).reduce((s, c) => s + c.value, 0);
  const consonantTotal = compound - vowelTotal;

  const letterCounts: Record<string, number> = {};
  for (const c of cells) letterCounts[c.letter] = (letterCounts[c.letter] ?? 0) + 1;

  const valueCounts = new Map<number, number>();
  for (const c of cells) valueCounts.set(c.value, (valueCounts.get(c.value) ?? 0) + 1);
  const maxValue = system === "Chaldean" ? 8 : 9;
  const missingValues: number[] = [];
  for (let v = 1; v <= maxValue; v++) if (!valueCounts.has(v)) missingValues.push(v);
  const repeatedValues = [...valueCounts.entries()]
    .filter(([, n]) => n >= 3)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);

  return {
    system,
    fullName: fullName.trim(),
    words,
    cells,
    compound,
    root,
    compoundMeaning: compoundMeaning(compound),
    vowelTotal,
    vowelRoot: chaldeanRoot(vowelTotal),
    consonantTotal,
    consonantRoot: chaldeanRoot(consonantTotal),
    letterCounts,
    missingValues,
    repeatedValues,
  };
}

// ── Name versus birth harmony ────────────────────────────────────────────────

const FRIENDS: Record<number, number[]> = {
  1: [1, 2, 3, 5, 9], 2: [1, 2, 3, 5, 7], 3: [1, 2, 3, 5, 6, 7, 9],
  4: [1, 5, 6, 7, 8], 5: [1, 2, 3, 5, 6, 9], 6: [3, 4, 5, 6, 8, 9],
  7: [2, 3, 4, 6, 7], 8: [4, 5, 6, 8], 9: [1, 3, 5, 6, 9],
};
const ENEMIES: Record<number, number[]> = {
  1: [4, 8], 2: [4, 8, 9], 3: [8], 4: [2, 3, 9], 5: [8],
  6: [1, 2], 7: [1, 5, 8, 9], 8: [1, 2, 3, 7, 9], 9: [2, 4, 7, 8],
};

export type NameHarmony = {
  namank: number;
  mulank: number;
  bhagyank: number;
  withMulank: "friend" | "neutral" | "enemy";
  withBhagyank: "friend" | "neutral" | "enemy";
  score: number;      // 0..100
  verdict: string;
  strengths: string[];
  weaknesses: string[];
};

function relation(a: number, b: number): "friend" | "neutral" | "enemy" {
  if (ENEMIES[a]?.includes(b)) return "enemy";
  if (FRIENDS[a]?.includes(b)) return "friend";
  return "neutral";
}

export function nameHarmony(namank: number, mulank: number, bhagyank: number): NameHarmony {
  const withMulank = relation(mulank, namank);
  const withBhagyank = relation(bhagyank, namank);
  const pts = (r: string) => (r === "friend" ? 100 : r === "neutral" ? 62 : 28);
  const score = Math.round(pts(withMulank) * 0.55 + pts(withBhagyank) * 0.45);
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (withMulank === "friend") strengths.push("The name supports your day number, so people meet you as you actually are.");
  if (withBhagyank === "friend") strengths.push("The name supports your destiny number, so long projects gather help.");
  if (withMulank === "enemy") weaknesses.push("The name argues with your day number: effort is often misread by others.");
  if (withBhagyank === "enemy") weaknesses.push("The name argues with your destiny number: results arrive later than the work deserves.");
  if (!strengths.length) strengths.push("The name is neutral, so results depend mostly on habit and timing rather than on the spelling.");
  if (!weaknesses.length) weaknesses.push("No serious clash. Keep the spelling consistent across documents so the vibration is not split.");
  const verdict =
    score >= 85 ? "Strong name. No change advised."
      : score >= 65 ? "Workable name. Small spelling consistency fixes are enough."
        : score >= 45 ? "Mixed name. A minor spelling adjustment can help."
          : "Weak name for this birth date. A considered spelling correction is worth studying.";
  return { namank, mulank, bhagyank, withMulank, withBhagyank, score, verdict, strengths, weaknesses };
}

// ── Spelling correction candidates ──────────────────────────────────────────

export type SpellingOption = {
  spelling: string;
  compound: number;
  root: number;
  score: number;
  note: string;
  change: string;
};

const DOUBLE_SAFE = "AEIOULNRSTMD";
const SILENT_ADD = ["H", "E", "A", "N", "S", "Y", "I", "L", "R", "T"];

/**
 * Generate realistic spelling variants (letter doubling, one added letter, one
 * dropped repeated letter) and score them against the birth numbers. Nothing
 * is invented beyond the given name: the base letters always stay recognisable.
 */
export function spellingOptions(
  fullName: string,
  mulank: number,
  bhagyank: number,
  system: NameSystem = "Chaldean",
  limit = 8,
): { current: SpellingOption; better: SpellingOption[]; avoid: SpellingOption[] } {
  const base = clean(fullName).trim().replace(/\s+/g, " ");
  const evaluate = (spelling: string, change: string): SpellingOption => {
    const c = nameChart(spelling, system);
    const h = nameHarmony(c.root, mulank, bhagyank);
    return {
      spelling,
      compound: c.compound,
      root: c.root,
      score: h.score,
      note: c.compoundMeaning,
      change,
    };
  };

  const current = evaluate(base || "NAME", "current spelling");
  const seen = new Set([base]);
  const variants: SpellingOption[] = [];

  const words = base.split(" ");
  words.forEach((word, wi) => {
    if (!word) return;
    // Double an existing safe letter.
    for (let i = 0; i < word.length; i++) {
      const ch = word[i]!;
      if (!DOUBLE_SAFE.includes(ch)) continue;
      if (word[i + 1] === ch) continue;
      const w = word.slice(0, i + 1) + ch + word.slice(i + 1);
      const next = [...words]; next[wi] = w;
      const s = next.join(" ");
      if (seen.has(s)) continue;
      seen.add(s);
      variants.push(evaluate(s, `double the ${ch} in ${word}`));
    }
    // Add one letter at the end of the word.
    for (const add of SILENT_ADD) {
      if (word.endsWith(add)) continue;
      const next = [...words]; next[wi] = word + add;
      const s = next.join(" ");
      if (seen.has(s)) continue;
      seen.add(s);
      variants.push(evaluate(s, `add ${add} after ${word}`));
    }
    // Drop one doubled letter.
    for (let i = 1; i < word.length; i++) {
      if (word[i] !== word[i - 1]) continue;
      const w = word.slice(0, i) + word.slice(i + 1);
      const next = [...words]; next[wi] = w;
      const s = next.join(" ");
      if (seen.has(s)) continue;
      seen.add(s);
      variants.push(evaluate(s, `remove one ${word[i]} from ${word}`));
    }
  });

  const better = variants
    .filter((v) => v.score > current.score)
    .sort((a, b) => b.score - a.score || a.spelling.length - b.spelling.length)
    .slice(0, limit);
  const avoid = variants
    .filter((v) => v.score < current.score - 15)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);
  return { current, better, avoid };
}

export { CHALDEAN, PYTHAGOREAN, ROOT_MEANINGS };
