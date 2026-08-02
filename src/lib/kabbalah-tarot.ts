// Kabbalistic numerology: the 22 Hebrew letters, their gematria values, the
// Tree of Life path each letter rules, and the Major Arcana card traditionally
// assigned to that path (Golden Dawn attribution, as used by Waite).
//
// Methodology (deterministic, documented):
//   * Gematria of a Latin-letter name is taken through the standard
//     transliteration table below (the same table used by Western Kabbalistic
//     numerology schools). Final-form values (sofit) are noted but not used in
//     the sum, matching mainstream practice.
//   * Name value is reduced modulo 22 for the ruling path/card, because the
//     Tree of Life has 22 paths; a remainder of 0 maps to path 22.
//   * The single-digit root is also given for cross-reading with Pythagorean
//     and Chaldean charts.

export type HebrewLetter = {
  order: number;        // 1..22
  name: string;         // Aleph
  hebrew: string;       // א
  value: number;        // gematria
  sofit?: number;       // final form value where it exists
  translit: string[];   // Latin letters mapped to it
  meaning: string;      // literal meaning
  path: number;         // Tree of Life path 11..32 (classical numbering)
  card: string;         // Major Arcana card
  cardNumber: number;   // 0..21
  element: string;      // element, planet or sign attribution
  lesson: string;
};

export const HEBREW_LETTERS: HebrewLetter[] = [
  { order: 1, name: "Aleph", hebrew: "א", value: 1, translit: ["A"], meaning: "ox, breath", path: 11, card: "The Fool", cardNumber: 0, element: "Air", lesson: "Begin without a guarantee; trust the first breath of an idea." },
  { order: 2, name: "Beth", hebrew: "ב", value: 2, translit: ["B", "V"], meaning: "house", path: 12, card: "The Magician", cardNumber: 1, element: "Mercury", lesson: "Skill is only power once it is practised in one fixed place." },
  { order: 3, name: "Gimel", hebrew: "ג", value: 3, translit: ["G"], meaning: "camel", path: 13, card: "The High Priestess", cardNumber: 2, element: "Moon", lesson: "Carry knowledge quietly across dry ground before you speak it." },
  { order: 4, name: "Daleth", hebrew: "ד", value: 4, translit: ["D"], meaning: "door", path: 14, card: "The Empress", cardNumber: 3, element: "Venus", lesson: "Fertility needs a threshold: decide what you let in." },
  { order: 5, name: "Heh", hebrew: "ה", value: 5, translit: ["E", "H"], meaning: "window", path: 15, card: "The Emperor", cardNumber: 4, element: "Aries", lesson: "Authority is the ability to see clearly and then set the frame." },
  { order: 6, name: "Vav", hebrew: "ו", value: 6, translit: ["U", "V", "W"], meaning: "nail, hook", path: 16, card: "The Hierophant", cardNumber: 5, element: "Taurus", lesson: "Tradition joins one generation to the next; hold it, do not worship it." },
  { order: 7, name: "Zayin", hebrew: "ז", value: 7, translit: ["Z"], meaning: "sword", path: 17, card: "The Lovers", cardNumber: 6, element: "Gemini", lesson: "Every real choice cuts something away." },
  { order: 8, name: "Cheth", hebrew: "ח", value: 8, translit: ["Ch"], meaning: "fence, field", path: 18, card: "The Chariot", cardNumber: 7, element: "Cancer", lesson: "Protection is what lets you advance without leaking energy." },
  { order: 9, name: "Teth", hebrew: "ט", value: 9, translit: ["T"], meaning: "serpent", path: 19, card: "Strength", cardNumber: 8, element: "Leo", lesson: "Strength is the calm handling of your own appetite." },
  { order: 10, name: "Yod", hebrew: "י", value: 10, translit: ["I", "J", "Y"], meaning: "hand", path: 20, card: "The Hermit", cardNumber: 9, element: "Virgo", lesson: "One small precise act, done alone, changes the whole design." },
  { order: 11, name: "Kaph", hebrew: "כ", value: 20, sofit: 500, translit: ["K", "C"], meaning: "palm", path: 21, card: "Wheel of Fortune", cardNumber: 10, element: "Jupiter", lesson: "Fortune turns; keep your hand open so it can move." },
  { order: 12, name: "Lamed", hebrew: "ל", value: 30, translit: ["L"], meaning: "ox goad, to teach", path: 22, card: "Justice", cardNumber: 11, element: "Libra", lesson: "Correction, given kindly, is the highest form of teaching." },
  { order: 13, name: "Mem", hebrew: "מ", value: 40, sofit: 600, translit: ["M"], meaning: "water", path: 23, card: "The Hanged Man", cardNumber: 12, element: "Water", lesson: "Reverse the view; water finds the way that force cannot." },
  { order: 14, name: "Nun", hebrew: "נ", value: 50, sofit: 700, translit: ["N"], meaning: "fish, sprout", path: 24, card: "Death", cardNumber: 13, element: "Scorpio", lesson: "Endings are the seed of the next form; nothing is wasted." },
  { order: 15, name: "Samekh", hebrew: "ס", value: 60, translit: ["S"], meaning: "support, prop", path: 25, card: "Temperance", cardNumber: 14, element: "Sagittarius", lesson: "Blend opposites slowly and they will hold each other up." },
  { order: 16, name: "Ayin", hebrew: "ע", value: 70, translit: ["O"], meaning: "eye", path: 26, card: "The Devil", cardNumber: 15, element: "Capricorn", lesson: "What you refuse to look at will run you." },
  { order: 17, name: "Peh", hebrew: "פ", value: 80, sofit: 800, translit: ["P", "F"], meaning: "mouth", path: 27, card: "The Tower", cardNumber: 16, element: "Mars", lesson: "Speech can break a structure faster than a hammer." },
  { order: 18, name: "Tzaddi", hebrew: "צ", value: 90, sofit: 900, translit: ["Tz", "X"], meaning: "fish hook", path: 28, card: "The Star", cardNumber: 17, element: "Aquarius", lesson: "Hope is the hook that pulls you out of the water." },
  { order: 19, name: "Qoph", hebrew: "ק", value: 100, translit: ["Q"], meaning: "back of the head", path: 29, card: "The Moon", cardNumber: 18, element: "Pisces", lesson: "The oldest part of the mind speaks at night; listen without panic." },
  { order: 20, name: "Resh", hebrew: "ר", value: 200, translit: ["R"], meaning: "head", path: 30, card: "The Sun", cardNumber: 19, element: "Sun", lesson: "Clarity is warmth; be understandable and people follow." },
  { order: 21, name: "Shin", hebrew: "ש", value: 300, translit: ["Sh"], meaning: "tooth, fire", path: 31, card: "Judgement", cardNumber: 20, element: "Fire", lesson: "Fire decides. What survives it is real." },
  { order: 22, name: "Tav", hebrew: "ת", value: 400, translit: ["Th"], meaning: "mark, cross", path: 32, card: "The World", cardNumber: 21, element: "Saturn", lesson: "Completion is a signature at the end of long work." },
];

/** Digraphs are matched before single letters so SH, CH, TZ, TH map correctly. */
const DIGRAPHS: { pair: string; letter: HebrewLetter }[] = [
  { pair: "SH", letter: HEBREW_LETTERS[20]! },
  { pair: "CH", letter: HEBREW_LETTERS[7]! },
  { pair: "TZ", letter: HEBREW_LETTERS[17]! },
  { pair: "TH", letter: HEBREW_LETTERS[21]! },
];
const SINGLE: Record<string, HebrewLetter> = {};
for (const l of HEBREW_LETTERS) for (const t of l.translit) if (t.length === 1) SINGLE[t] = l;

export type GematriaCell = { source: string; letter: HebrewLetter };
export type KabbalahReading = {
  fullName: string;
  cells: GematriaCell[];
  total: number;
  root: number;              // 1..9
  pathIndex: number;         // 1..22
  rulingLetter: HebrewLetter;
  rulingCard: string;
  pathTotals: { name: string; total: number; pathIndex: number; card: string }[];
  dominantElements: { element: string; count: number }[];
  missingLetters: string[];
  summary: string;
};

const clean = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z ]/g, " ");

function mapWord(word: string): GematriaCell[] {
  const out: GematriaCell[] = [];
  let i = 0;
  while (i < word.length) {
    const two = word.slice(i, i + 2);
    const dg = DIGRAPHS.find((d) => d.pair === two);
    if (dg) { out.push({ source: two, letter: dg.letter }); i += 2; continue; }
    const one = word[i]!;
    const letter = SINGLE[one];
    if (letter) out.push({ source: one, letter });
    i += 1;
  }
  return out;
}

function root9(n: number): number {
  let x = Math.abs(Math.trunc(n));
  while (x > 9) x = String(x).split("").reduce((s, c) => s + Number(c), 0);
  return x;
}

export function kabbalahReading(fullName: string): KabbalahReading {
  const words = clean(fullName).split(/\s+/).filter(Boolean);
  const cells = words.flatMap(mapWord);
  const total = cells.reduce((s, c) => s + c.letter.value, 0);
  const pathIndex = total === 0 ? 1 : ((total - 1) % 22) + 1;
  const rulingLetter = HEBREW_LETTERS[pathIndex - 1]!;

  const pathTotals = words.map((w) => {
    const t = mapWord(w).reduce((s, c) => s + c.letter.value, 0);
    const pi = t === 0 ? 1 : ((t - 1) % 22) + 1;
    return { name: w, total: t, pathIndex: pi, card: HEBREW_LETTERS[pi - 1]!.card };
  });

  const elCount = new Map<string, number>();
  for (const c of cells) elCount.set(c.letter.element, (elCount.get(c.letter.element) ?? 0) + 1);
  const dominantElements = [...elCount.entries()]
    .map(([element, count]) => ({ element, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const present = new Set(cells.map((c) => c.letter.name));
  const missingLetters = HEBREW_LETTERS.filter((l) => !present.has(l.name)).map((l) => l.name);

  return {
    fullName: fullName.trim(),
    cells,
    total,
    root: root9(total),
    pathIndex,
    rulingLetter,
    rulingCard: rulingLetter.card,
    pathTotals,
    dominantElements,
    missingLetters,
    summary: `The name sums to ${total} in gematria, which falls on path ${rulingLetter.path} ruled by ${rulingLetter.name} (${rulingLetter.hebrew}), the letter of ${rulingLetter.card}. ${rulingLetter.lesson} Reduced to a single digit the name carries ${root9(total)}, so read this path together with your Chaldean and Pythagorean totals rather than in isolation.`,
  };
}

/** Look up the Hebrew letter and gematria behind a Major Arcana card. */
export function letterForCard(cardNumber: number): HebrewLetter | null {
  return HEBREW_LETTERS.find((l) => l.cardNumber === cardNumber) ?? null;
}
