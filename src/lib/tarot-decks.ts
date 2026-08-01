// Five admin-curated decks. All card art is uploaded by admins (JPG) in
// Admin → Assets and stored in the app-assets bucket; nothing is bundled.

export type DeckKey =
  | "rider-waite"
  | "soulmates"
  | "lost-and-found"
  | "nakshatra"
  | "health";

export type DeckMeta = {
  key: DeckKey;
  name: string;
  shortName: string;
  tagline: string;
  accent: string;
  glyph: string;
  expected: number;
};

export const DECK_LIST: DeckMeta[] = [
  { key: "rider-waite",    name: "Rider Waite",     shortName: "Rider Waite", tagline: "the classic 78-card deck",     accent: "#F5C56B", glyph: "✦", expected: 78 },
  { key: "soulmates",      name: "Soulmates Deck",  shortName: "Soulmates",   tagline: "love, union and connection",   accent: "#F08FA8", glyph: "❥", expected: 90 },
  { key: "lost-and-found", name: "Lost & Found Deck", shortName: "Lost & Found", tagline: "what's missing, what returns", accent: "#8FC7F0", glyph: "❂", expected: 78 },
  { key: "nakshatra",      name: "Nakshatra Deck",  shortName: "Nakshatra",   tagline: "27 lunar mansions",            accent: "#B79CF0", glyph: "☾", expected: 27 },
  { key: "health",         name: "Health Deck",     shortName: "Health",      tagline: "body, breath and vitality",    accent: "#8FE0B4", glyph: "❦", expected: 78 },
];

export const DECK_KEYS = DECK_LIST.map((d) => d.key);

// Decks a user can pull from on the tarot board. The Nakshatra deck is kept
// out of the board on purpose — it stays available to admins and to the AI
// star panel only.
export const BOARD_DECK_LIST: DeckMeta[] = DECK_LIST.filter((d) => d.key !== "nakshatra");

export function deckMeta(key: string): DeckMeta | undefined {
  return DECK_LIST.find((d) => d.key === key);
}

// A single uploaded card image.
export type UploadedCard = {
  id: string;     // storage path — stable unique id
  name: string;   // human label derived from the uploaded file name
  image: string;  // signed URL
  deckKey: DeckKey;
};

export function prettyCardName(raw: string): string {
  return raw
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase()) || "Card";
}

// ---------- Card groups (works for every deck: Rider Waite, Soulmates,
// Lost & Found, Health) ----------
// Users can choose to pull only big-picture cards (major), only everyday
// cards (minor) or only the people cards (court). Grouping is read from the
// file name the admin uploaded, so it needs no extra metadata.

export type CardGroup = "all" | "major" | "minor" | "court";

export const CARD_GROUPS: { key: CardGroup; label: string }[] = [
  { key: "all", label: "All cards" },
  { key: "major", label: "Major only" },
  { key: "minor", label: "Minor only" },
  { key: "court", label: "Court only" },
];

const COURT_WORDS = /\b(page|knight|queen|king|prince|princess|jack|knave)\b/;
const SUIT_WORDS = /\b(wand|wands|cup|cups|sword|swords|pentacle|pentacles|coin|coins|disk|disks|rod|rods)\b/;
const RANK_WORDS =
  /\b(ace|one|two|three|four|five|six|seven|eight|nine|ten|1|2|3|4|5|6|7|8|9|10)\b/;

const MAJOR_NAMES = [
  "fool", "magician", "high priestess", "priestess", "empress", "emperor",
  "hierophant", "lovers", "chariot", "strength", "hermit", "wheel of fortune",
  "wheel", "justice", "hanged man", "death", "temperance", "devil", "tower",
  "star", "moon", "sun", "judgement", "judgment", "world",
];

export function cardGroupOf(name: string): Exclude<CardGroup, "all"> {
  const n = name.toLowerCase();
  if (/\bmajor\b/.test(n)) return "major";
  if (COURT_WORDS.test(n)) return "court";
  if (/\bcourt\b/.test(n)) return "court";
  if (/\bminor\b/.test(n)) return "minor";
  if (MAJOR_NAMES.some((m) => n.includes(m))) return "major";
  if (SUIT_WORDS.test(n) && RANK_WORDS.test(n)) return "minor";
  if (SUIT_WORDS.test(n)) return "minor";
  // Numbered-only files (0-21) are usually the big-picture cards.
  const num = n.match(/\b(\d{1,2})\b/);
  if (num && Number(num[1]) <= 21) return "major";
  return "minor";
}

export function filterCardsByGroup<T extends { name: string }>(
  cards: T[],
  group: CardGroup,
): T[] {
  if (group === "all") return cards;
  const picked = cards.filter((c) => cardGroupOf(c.name) === group);
  // Never hand back an empty stack when the deck simply isn't labelled that
  // way — fall back to the full deck so the board always works.
  return picked.length > 0 ? picked : [];
}
