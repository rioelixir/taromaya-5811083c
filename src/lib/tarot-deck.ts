// Rider-Waite–Smith 78-card tarot deck.
export type TarotCard = {
  id: string;
  name: string;
  arcana: "major" | "minor";
  suit?: "wands" | "cups" | "swords" | "pentacles";
  number?: number;
  keywords: string[];
  keywordsReversed: string[];
};

const major: TarotCard[] = [
  { id: "m0",  name: "The Fool",            arcana: "major", number: 0,  keywords: ["beginnings", "innocence", "leap of faith"], keywordsReversed: ["recklessness", "hesitation", "naivety"] },
  { id: "m1",  name: "The Magician",        arcana: "major", number: 1,  keywords: ["manifestation", "willpower", "skill"], keywordsReversed: ["manipulation", "illusion", "wasted talent"] },
  { id: "m2",  name: "The High Priestess",  arcana: "major", number: 2,  keywords: ["intuition", "mystery", "inner voice"], keywordsReversed: ["secrets", "disconnection", "repressed feelings"] },
  { id: "m3",  name: "The Empress",         arcana: "major", number: 3,  keywords: ["abundance", "nurture", "creativity"], keywordsReversed: ["dependence", "creative block", "smothering"] },
  { id: "m4",  name: "The Emperor",         arcana: "major", number: 4,  keywords: ["authority", "structure", "leadership"], keywordsReversed: ["tyranny", "rigidity", "lack of control"] },
  { id: "m5",  name: "The Hierophant",      arcana: "major", number: 5,  keywords: ["tradition", "guidance", "learning"], keywordsReversed: ["rebellion", "unconventional", "dogma"] },
  { id: "m6",  name: "The Lovers",          arcana: "major", number: 6,  keywords: ["union", "choice", "harmony"], keywordsReversed: ["imbalance", "disharmony", "misalignment"] },
  { id: "m7",  name: "The Chariot",         arcana: "major", number: 7,  keywords: ["victory", "willpower", "determination"], keywordsReversed: ["loss of control", "aggression", "obstacles"] },
  { id: "m8",  name: "Strength",            arcana: "major", number: 8,  keywords: ["courage", "compassion", "inner strength"], keywordsReversed: ["self-doubt", "weakness", "insecurity"] },
  { id: "m9",  name: "The Hermit",          arcana: "major", number: 9,  keywords: ["introspection", "solitude", "guidance"], keywordsReversed: ["isolation", "loneliness", "withdrawal"] },
  { id: "m10", name: "Wheel of Fortune",    arcana: "major", number: 10, keywords: ["cycles", "destiny", "turning points"], keywordsReversed: ["bad luck", "resistance", "breaking cycles"] },
  { id: "m11", name: "Justice",             arcana: "major", number: 11, keywords: ["fairness", "truth", "cause and effect"], keywordsReversed: ["dishonesty", "injustice", "avoidance"] },
  { id: "m12", name: "The Hanged Man",      arcana: "major", number: 12, keywords: ["surrender", "new perspective", "pause"], keywordsReversed: ["stalling", "resistance", "indecision"] },
  { id: "m13", name: "Death",               arcana: "major", number: 13, keywords: ["endings", "transformation", "transition"], keywordsReversed: ["resistance to change", "stagnation", "decay"] },
  { id: "m14", name: "Temperance",          arcana: "major", number: 14, keywords: ["balance", "moderation", "patience"], keywordsReversed: ["imbalance", "excess", "self-healing"] },
  { id: "m15", name: "The Devil",           arcana: "major", number: 15, keywords: ["attachment", "shadow self", "restriction"], keywordsReversed: ["release", "breaking free", "reclaiming power"] },
  { id: "m16", name: "The Tower",           arcana: "major", number: 16, keywords: ["upheaval", "revelation", "awakening"], keywordsReversed: ["averted disaster", "fear of change", "delay"] },
  { id: "m17", name: "The Star",            arcana: "major", number: 17, keywords: ["hope", "inspiration", "renewal"], keywordsReversed: ["despair", "disconnection", "self-doubt"] },
  { id: "m18", name: "The Moon",            arcana: "major", number: 18, keywords: ["illusion", "intuition", "the subconscious"], keywordsReversed: ["confusion cleared", "release of fear", "misinterpretation"] },
  { id: "m19", name: "The Sun",             arcana: "major", number: 19, keywords: ["joy", "vitality", "success"], keywordsReversed: ["temporary setback", "clouded joy", "ego"] },
  { id: "m20", name: "Judgement",           arcana: "major", number: 20, keywords: ["reckoning", "awakening", "renewal"], keywordsReversed: ["self-doubt", "avoiding calling", "harsh judgement"] },
  { id: "m21", name: "The World",           arcana: "major", number: 21, keywords: ["completion", "wholeness", "fulfilment"], keywordsReversed: ["unfinished business", "delay", "lack of closure"] },
];

const suitMeta: Record<
  NonNullable<TarotCard["suit"]>,
  { theme: string }
> = {
  wands:      { theme: "passion, action, creativity" },
  cups:       { theme: "emotion, love, intuition" },
  swords:     { theme: "intellect, conflict, truth" },
  pentacles:  { theme: "material, work, body" },
};

const ranks: { n: number; name: string; kw: [string, string] }[] = [
  { n: 1,  name: "Ace",   kw: ["new spark",       "blocked spark"] },
  { n: 2,  name: "Two",   kw: ["choice",           "imbalance"] },
  { n: 3,  name: "Three", kw: ["expansion",        "delay"] },
  { n: 4,  name: "Four",  kw: ["stability",        "stagnation"] },
  { n: 5,  name: "Five",  kw: ["challenge",        "recovery"] },
  { n: 6,  name: "Six",   kw: ["harmony",          "loss"] },
  { n: 7,  name: "Seven", kw: ["reflection",       "deception"] },
  { n: 8,  name: "Eight", kw: ["movement",         "restriction"] },
  { n: 9,  name: "Nine",  kw: ["fulfilment",       "worry"] },
  { n: 10, name: "Ten",   kw: ["completion",       "burden"] },
  { n: 11, name: "Page",  kw: ["message",          "immaturity"] },
  { n: 12, name: "Knight",kw: ["pursuit",          "impatience"] },
  { n: 13, name: "Queen", kw: ["mastery",          "shadow of power"] },
  { n: 14, name: "King",  kw: ["authority",        "misuse of power"] },
];

const minor: TarotCard[] = (Object.keys(suitMeta) as (keyof typeof suitMeta)[])
  .flatMap((suit) =>
    ranks.map<TarotCard>((r) => ({
      id: `${suit}-${r.n}`,
      name: `${r.name} of ${suit[0].toUpperCase() + suit.slice(1)}`,
      arcana: "minor",
      suit,
      number: r.n,
      keywords: [r.kw[0], suitMeta[suit].theme],
      keywordsReversed: [r.kw[1], `blocked ${suitMeta[suit].theme}`],
    })),
  );

export const TAROT_DECK: TarotCard[] = [...major, ...minor];

export type DrawnCard = { card: TarotCard; reversed: boolean; position: string };

export function shuffleAndDraw(count: number, positions: string[]): DrawnCard[] {
  const deck = [...TAROT_DECK];
  // Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, count).map((card, i) => ({
    card,
    reversed: Math.random() < 0.3,
    position: positions[i] ?? `Card ${i + 1}`,
  }));
}

export const SPREADS: Record<string, { label: string; positions: string[]; blurb: string }> = {
  "one":    { label: "One Card",     positions: ["Guidance"], blurb: "A focused pulse of insight for right now." },
  "three":  { label: "Past · Present · Future", positions: ["Past", "Present", "Future"], blurb: "See the arc of your situation across time." },
  "five":   { label: "Five Card Cross", positions: ["You", "Challenge", "Foundation", "Advice", "Outcome"], blurb: "A grounded look at the forces at play." },
  "celtic": { label: "Celtic Cross", positions: ["Present", "Challenge", "Foundation", "Past", "Crown", "Future", "Self", "Environment", "Hopes/Fears", "Outcome"], blurb: "The classic 10-card deep-dive." },
  "love":   { label: "Love Spread", positions: ["You", "Them", "Connection", "Advice", "Outcome"], blurb: "Illuminate the heart of a relationship." },
  "career": { label: "Career Spread", positions: ["Current path", "Hidden strength", "Obstacle", "Action", "Outcome"], blurb: "Clarify direction and momentum in your work." },
};
