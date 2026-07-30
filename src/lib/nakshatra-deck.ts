// Maps the 27 birth stars (nakshatras) to the admin-uploaded Nakshatra deck.
// Nothing here is hardcoded to an image: cards are matched by name, and an
// admin can override the picture, title, keywords and meaning at any time.

import { NAKSHATRAS } from "./vedic";
import type { UploadedCard } from "./tarot-decks";

/** Admin-editable extras for one birth star. Stored in app_settings. */
export type NakshatraCardMeta = {
  /** Storage path of the picture the admin picked (overrides name matching). */
  path?: string;
  title?: string;
  keywords?: string[];
  meaning?: string;
  enabled?: boolean;
  order?: number;
};

export type NakshatraMetaMap = Record<string, NakshatraCardMeta>;

export const NAKSHATRA_META_KEY = "decks.nakshatra.meta";

/** Other spellings people use for the same star. */
const ALIASES: Record<string, string[]> = {
  Mrigashira: ["mrigashirsha", "mrigasira", "mrugashira"],
  Ardra: ["arudra", "thiruvathira"],
  Ashlesha: ["aslesha", "ayilyam"],
  "Purva Phalguni": ["purvaphalguni", "pubba", "poorva phalguni"],
  "Uttara Phalguni": ["uttaraphalguni", "uttara falguni"],
  Mula: ["moola", "mool"],
  "Purva Ashadha": ["purvashadha", "poorva ashadha", "purva shadha"],
  "Uttara Ashadha": ["uttarashadha", "uttara shadha"],
  Dhanishta: ["dhanishtha", "avittam", "sravishta"],
  Shatabhisha: ["satabhisha", "shatataraka", "sathayam"],
  "Purva Bhadrapada": ["purvabhadrapada", "poorva bhadra", "purva bhadra"],
  "Uttara Bhadrapada": ["uttarabhadrapada", "uttara bhadra"],
  Shravana: ["sravana", "thiruvonam"],
  Krittika: ["kritika", "karthika", "kartika"],
  Punarvasu: ["punarvasu", "punarpoosam"],
  Vishakha: ["visakha", "vishaka"],
  Jyeshtha: ["jyeshta", "jyestha", "kettai"],
  Chitra: ["chitta", "chithira"],
  Hasta: ["hastha"],
  Revati: ["revathi"],
  Ashwini: ["aswini", "ashvini"],
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Every name form that should count as this birth star. */
function nameForms(index: number): string[] {
  const name = NAKSHATRAS[index];
  const list = [name, ...(ALIASES[name] ?? [])].map(norm);
  // also the squashed form ("purva phalguni" -> "purvaphalguni")
  return Array.from(new Set([...list, ...list.map((s) => s.replace(/ /g, ""))]));
}

/**
 * Find the one uploaded card that belongs to a birth star.
 * Order: admin picture choice, then exact name, then a contains match,
 * then the card sitting at that position in the deck.
 */
export function cardForNakshatra(
  index: number,
  cards: UploadedCard[],
  meta?: NakshatraCardMeta,
): UploadedCard | null {
  if (!cards.length) return null;
  if (meta?.path) {
    const byPath = cards.find((c) => c.id === meta.path);
    if (byPath) return byPath;
  }
  const forms = nameForms(index);
  const exact = cards.find((c) => forms.includes(norm(c.name)));
  if (exact) return exact;
  const partial = cards.find((c) => {
    const n = norm(c.name).replace(/ /g, "");
    return forms.some((f) => n.includes(f.replace(/ /g, "")));
  });
  if (partial) return partial;
  return cards.length === 27 ? (cards[index] ?? null) : null;
}

/** Title shown to the user: admin title first, else the star's name. */
export function nakshatraTitle(index: number, meta?: NakshatraCardMeta): string {
  return meta?.title?.trim() || NAKSHATRAS[index];
}
