import { TAROT_DETAILS } from "./tarot-details";

/**
 * Writes a tarot reading from the app's own card book, with no AI model.
 *
 * Same house rules as before: one flowing reading, no card names, no position
 * labels, no symbols, and the birth star plus place star blended in silently.
 */

export type OfflineDraw = {
  spreadLabel?: string;
  question?: string;
  cards: Array<{ name: string; position?: string; reversed: boolean; keywords?: string[] }>;
  birthNakshatra?: string;
  placeNakshatra?: string;
  placeName?: string;
  nakshatraCard?: string;
};

function seed(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = ((h ^ text.charCodeAt(i)) * 16777619) >>> 0;
  return h;
}

const OPENERS = [
  "Take a breath. Here is what these pictures are saying.",
  "Let us read this together, slowly and simply.",
  "The cards in front of you tell one clear story.",
  "Here is the story spread out in front of you.",
];

const YES_WORDS = /\b(should i|will i|can i|is it|does he|does she|do they|am i|shall i)\b/i;

/** Turns a meaning sentence into a "talking to you" line. */
function speak(text: string): string {
  return text
    .replace(/[*_#`]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function offlineTarotReading(draw: OfflineDraw): string {
  const n = seed(draw.cards.map((c) => `${c.name}${c.reversed}`).join("|") + (draw.question ?? ""));
  const lines: string[] = [];

  lines.push(OPENERS[n % OPENERS.length]);

  const question = (draw.question ?? "").trim();
  const wantsYesNo = !!question && YES_WORDS.test(question);
  const votes: number[] = [];

  const chosen = draw.cards.slice(0, 8);
  chosen.forEach((card, i) => {
    const d = TAROT_DETAILS[card.name];
    const keywords = (card.keywords ?? []).filter(Boolean).slice(0, 3).join(", ");
    let body = "";
    if (d) {
      const core = card.reversed ? d.reversed : d.upright;
      const flavour = /love|relationship|marriage|partner|him|her|crush/i.test(question)
        ? d.love
        : /job|work|money|career|business|study/i.test(question)
          ? d.career
          : i === chosen.length - 1
            ? d.spiritual
            : "";
      body = [speak(core), flavour ? speak(flavour) : ""].filter(Boolean).join(" ");
      const yn = d.yesNo?.toLowerCase() ?? "";
      votes.push(card.reversed ? (yn.startsWith("yes") ? -1 : yn.startsWith("no") ? 1 : 0) : yn.startsWith("yes") ? 1 : yn.startsWith("no") ? -1 : 0);
    } else if (keywords) {
      body = `The words on this one point to ${keywords}${card.reversed ? ", and it comes softened or delayed" : ""}.`;
    } else {
      body = card.reversed
        ? "This one asks you to slow down before you push."
        : "This one says the way ahead is open if you take it.";
    }
    lines.push(body);
  });

  const stars = [
    draw.birthNakshatra ? `Your birth star adds a steady thread through all of this` : "",
    draw.placeNakshatra
      ? `and where you are sitting right now colours today's mood${draw.placeName ? ` in ${draw.placeName}` : ""}`
      : "",
  ].filter(Boolean);
  if (stars.length) lines.push(`${stars.join(" ")}. Trust that quiet feeling in your chest.`);

  if (wantsYesNo) {
    const score = votes.reduce((a, b) => a + b, 0);
    const answer =
      score >= 2 ? "Yes." : score === 1 ? "Leaning yes." : score === 0 ? "It is not settled yet, so wait a little." : score === -1 ? "Leaning no." : "No.";
    lines.push(`On your question, the answer here is ${answer}`);
  }

  lines.push(
    [
      "One simple next step: write down the first thought you had while looking at these, and act on it today.",
      "One simple next step: pick the easiest kind thing you can do about this before tonight.",
      "One simple next step: say the true thing out loud to the one person who needs to hear it.",
    ][n % 3],
  );

  return lines.join("\n");
}
