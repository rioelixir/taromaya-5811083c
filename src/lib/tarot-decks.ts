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
  { key: "soulmates",      name: "Soulmates Deck",  shortName: "Soulmates",   tagline: "love, union and connection",   accent: "#F08FA8", glyph: "❥", expected: 44 },
  { key: "lost-and-found", name: "Lost & Found Deck", shortName: "Lost & Found", tagline: "what's missing, what returns", accent: "#8FC7F0", glyph: "❂", expected: 44 },
  { key: "nakshatra",      name: "Nakshatra Deck",  shortName: "Nakshatra",   tagline: "27 lunar mansions",            accent: "#B79CF0", glyph: "☾", expected: 27 },
  { key: "health",         name: "Health Deck",     shortName: "Health",      tagline: "body, breath and vitality",    accent: "#8FE0B4", glyph: "❦", expected: 44 },
];

export const DECK_KEYS = DECK_LIST.map((d) => d.key);

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
