// Only the authentic Rider–Waite–Smith 78-card deck is supported.
// Legacy decks (Nakshatra, Health, Lost & Found, Soulmates) were removed.

import { TAROT_DECK, type TarotCard } from "./tarot-deck";

export type DeckKey = "rider-waite";

export type DeckMeta = {
  key: DeckKey;
  name: string;
  shortName: string;
  tagline: string;
  count: number;
  accent: string;
  glyph: string;
};

export const DECKS: Record<DeckKey, TarotCard[]> = {
  "rider-waite": TAROT_DECK,
};

export const DECK_LIST: DeckMeta[] = [
  {
    key: "rider-waite",
    name: "Rider–Waite",
    shortName: "Rider–Waite",
    tagline: "the classic 78-card deck",
    count: TAROT_DECK.length,
    accent: "#F5C56B",
    glyph: "✦",
  },
];
