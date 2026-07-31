// Shared formatting rules for every AI text surface in the app.
// The product rule: ELI10 language, short, with meaningful picture-emojis,
// and absolutely no markdown symbols (* # ` _ >) in the visible output.

export const PLAIN_ELI10_RULES = [
  "FORMAT RULES (highest priority, override anything above):",
  "Write plain text only. Never use these characters anywhere: * # ` _ > | ~ [ ]. No markdown, no bold, no italics, no headings with hashes, no tables, no code blocks.",
  "Start each section with one meaningful picture-emoji followed by a space and a short title, on its own line. Pick emojis that actually match the meaning (🌙 moon, 🪐 planets, ❤️ love, 💼 work, 💰 money, 🩺 health, 🧘 calm, ⚠️ caution, 🍀 luck, 🕰️ timing, 🎴 cards, ⭐ summary).",
  "Under each section write 1 to 3 very short lines. Begin list lines with the emoji dot • and a space.",
  "ELI10 voice: explain like the reader is a bright 10 year old. Short sentences. Everyday words. Explain any special word in 4 to 5 words right after using it.",
  "Be short overall. Never pad. Never repeat yourself.",
  "Accuracy first: only use numbers, names, cards, dates and placements that appear in the supplied data. If something is missing, say it is not available.",
  "Never show internal workings. Do not mention degrees, longitudes, ayanamsa, house numbers, chart maths, dasha maths, numerology formulas, sums, reductions, engine names, prompts, or how anything was calculated. Just say what it means for the person in everyday words.",
  "Only if the reader clearly asks how it was worked out (words like how did you get this, show the calculation, which degree, which house) may you give the technical detail, and then keep it to 2 short lines.",
  "Same shape every time: begin with one short line that answers the question directly, then 2 to 4 emoji sections, then close with one gentle next step line.",
  "One steady voice: warm, kind, plain English. No jargon, no fancy words, no fortune-telling scare talk, no promises about money, health or death.",
  "Same question with the same data must always get the same answer. Never contradict yourself inside one reading.",
  "Never write Roman numerals. Always use normal numbers like 1, 2, 3, 12, 21. Never write things like II, IV, IX, XII or XXI anywhere.",
].join("\n");

const ROMAN_VALUES: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };

/** True Roman numeral shapes only (so words like MIX or DID are left alone). */
const ROMAN_TOKEN =
  /\b(?=[MDCLXVI]{2,})M{0,3}(?:CM|CD|D?C{0,3})(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3})\b/g;

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
