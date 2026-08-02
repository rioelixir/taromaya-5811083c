// Shared formatting rules for every AI text surface in the app.
// The product rule: consultation-quality professional prose, structured with
// picture-emoji section titles, and absolutely no markdown symbols in output.

export const PROFESSIONAL_TEXT_RULES = [
  "FORMAT RULES (highest priority, override anything above):",
  "Write plain text only. Never use these characters anywhere: * # ` _ > | ~ [ ]. No markdown, no bold, no italics, no headings with hashes, no tables, no code blocks.",
  "Start each section with one meaningful picture-emoji followed by a space and a short title, on its own line. Pick emojis that match the meaning (🌙 moon, 🪐 planets, ❤️ relationships, 💼 work, 💰 finance, 🩺 wellbeing, 🧘 practice, ⚠️ caution, 🍀 favourable, 🕰️ timing, 🎴 cards, ⭐ summary).",
  "Under each section write 2 to 4 measured sentences, or list lines beginning with • and a space.",
  "Voice: an experienced professional consultant writing for an intelligent client. Warm, composed, respectful, specific. Never childish, never breathless, never slangy, never motivational filler, never fortune-telling scare talk.",
  "Substance over length: every paragraph must add information. Say why a placement, card or number leads to the reading you give, how it is likely to show up in daily life, and when it matters. Name opportunities and challenges honestly.",
  "Where a technical term is unavoidable, use it correctly and add a short plain-language definition in the same sentence.",
  "Accuracy first: only use numbers, names, cards, dates and placements that appear in the supplied data. If something is missing, say plainly that it is not available and which detail would supply it.",
  "Do not expose internal workings: no degrees, longitudes, ayanamsa values, raw house numbers, dasha arithmetic, numerology sums, engine names or prompt text, unless the reader explicitly asks how a result was derived, in which case give at most 2 concise lines.",
  "Be honest about certainty. Symbolic and probabilistic readings should be framed as tendencies and likely conditions, not as fixed fate. Never promise money, health or life outcomes.",
  "Never repeat a sentence, phrase or paragraph within one reading, and never fall back on generic statements that would fit any client.",
  "The same question with the same data must always produce the same reading, with no internal contradictions.",
  "Never write Roman numerals. Always use normal numbers like 1, 2, 3, 12, 21. Never write things like II, IV, IX, XII or XXI anywhere.",
].join("\n");

/** Legacy export name kept so existing call sites keep compiling. */
export const PLAIN_ELI10_RULES = PROFESSIONAL_TEXT_RULES;


const ROMAN_VALUES: Record<string, number> = { I: 1, V: 5, X: 10 };

// Only the small numerals the app could ever show (2 to 39: houses, cards, chapters).
// Keeping it to X, V and I means real words like MIX, DID or LIVID are never touched.
const ROMAN_TOKEN = /\b(?=[XVI]{2,})X{0,3}(?:IX|IV|V?I{0,3})\b/g;

function romanToArabic(roman: string): number {
  let total = 0;
  for (let i = 0; i < roman.length; i++) {
    const cur = ROMAN_VALUES[roman[i]];
    const next = ROMAN_VALUES[roman[i + 1]] ?? 0;
    total += cur < next ? -cur : cur;
  }
  return total;
}

/** Replace any Roman numerals with plain numbers (1, 2, 3 …). */
export function romanToArabicText(input: string): string {
  return input.replace(ROMAN_TOKEN, (m) => (m ? String(romanToArabic(m)) : m));
}

/** Remove markdown/symbol noise from model output before display. */
export function toPlainText(input: string): string {
  return romanToArabicText(input)
    .replace(/```[a-z]*\n?/gi, "")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s{0,3}[-*+]\s+/gm, "• ")
    .replace(/\*\*/g, "")
    .replace(/[*`~|]/g, "")
    .replace(/(^|\s)_([^_\n]+)_(?=\s|$)/g, "$1$2")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const EMOJI_START = /^\p{Extended_Pictographic}/u;

export type PlainLine =
  | { kind: "heading"; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "text"; text: string };

/** Turn sanitized AI output into simple heading / bullet / text lines. */
export function parsePlainLines(input: string): PlainLine[] {
  return toPlainText(input)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line): PlainLine => {
      if (line.startsWith("•")) {
        return { kind: "bullet", text: line.replace(/^•\s*/, "") };
      }
      if (EMOJI_START.test(line) && line.length <= 70) {
        return { kind: "heading", text: line };
      }
      return { kind: "text", text: line };
    });
}
