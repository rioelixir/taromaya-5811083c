import { getCardDetails, type CardDetails } from "./tarot-details";
import { TAROT_DECK, type TarotCard } from "./tarot-deck";

/** Finds the card book entry for a card name, whichever deck it came from. */
function detailsFor(name: string, keywords: string[], reversed: boolean): CardDetails | null {
  const known = TAROT_DECK.find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (known) return getCardDetails(known);
  if (!keywords.length) return null;
  const custom: TarotCard = {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    arcana: "minor",
    keywords,
    keywordsReversed: keywords,
  };
  void reversed;
  return getCardDetails(custom);
}

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

/** Little joining words so the pulls read as one story, not a list. */
const LINKS = [
  "",
  "Then the story moves on.",
  "Next to that,",
  "Underneath it all,",
  "Alongside that,",
  "And there is more.",
  "Close to the end,",
  "Last of all,",
];

export function offlineTarotReading(draw: OfflineDraw): string {
  const n = seed(draw.cards.map((c) => `${c.name}${c.reversed}`).join("|") + (draw.question ?? ""));
  const lines: string[] = [];

  lines.push(OPENERS[n % OPENERS.length]);

  const question = (draw.question ?? "").trim();
  const wantsYesNo = !!question && YES_WORDS.test(question);
  const votes: number[] = [];
  const said = new Set<string>();

  const chosen = draw.cards.slice(0, 10);
  const reversedCount = chosen.filter((c) => c.reversed).length;

  chosen.forEach((card, i) => {
    const keywordList = (card.keywords ?? []).filter(Boolean).slice(0, 3);
    const keywords = keywordList.join(", ");
    const d = detailsFor(card.name, keywordList, card.reversed);
    let body = "";
    if (d) {
      const core = card.reversed ? d.reversed : d.upright;
      const flavour = /love|relationship|marriage|partner|him|her|crush|husband|wife/i.test(question)
        ? d.love
        : /job|work|money|career|business|study|exam|salary/i.test(question)
          ? d.career
          : /health|body|sleep|tired|illness/i.test(question)
            ? d.spiritual
            : i === chosen.length - 1
              ? d.spiritual
              : "";
      body = [speak(core), flavour ? speak(flavour) : ""].filter(Boolean).join(" ");
      const yn = d.yesNo?.toLowerCase() ?? "";
      votes.push(
        card.reversed
          ? yn.startsWith("yes")
            ? -1
            : yn.startsWith("no")
              ? 1
              : 0
          : yn.startsWith("yes")
            ? 1
            : yn.startsWith("no")
              ? -1
              : 0,
      );
    } else if (keywords) {
      body = `The words on this one point to ${keywords}${card.reversed ? ", and it comes softened or delayed" : ""}.`;
    } else {
      body = card.reversed
        ? "This one asks you to slow down before you push."
        : "This one says the way ahead is open if you take it.";
    }

    // Never repeat the same sentence twice in one reading.
    const key = body.slice(0, 60).toLowerCase();
    if (said.has(key)) return;
    said.add(key);

    const link = i === 0 ? "" : LINKS[i % LINKS.length];
    lines.push(link ? `${link} ${body}`.replace(/\s+/g, " ").trim() : body);
  });

  // The overall weather of the pull, from how much came out reversed.
  if (chosen.length > 2) {
    const share = reversedCount / chosen.length;
    lines.push(
      share === 0
        ? "Taken together, the road here is fairly open, so the main risk is waiting too long."
        : share < 0.4
          ? "Taken together, most of this flows, with one or two places that need patience."
          : share < 0.7
            ? "Taken together, this is a mixed patch: real progress, but it comes slower than you would like."
            : "Taken together, a lot of this is held back for now, so pushing harder will only tire you out.",
    );
  }

  const stars = [
    draw.birthNakshatra ? "Your birth star adds a steady thread through all of this" : "",
    draw.placeNakshatra
      ? `and where you are sitting right now colours today's mood${draw.placeName ? ` in ${draw.placeName}` : ""}`
      : "",
  ].filter(Boolean);
  if (stars.length) lines.push(`${stars.join(" ")}. Trust that quiet feeling in your chest.`);

  if (wantsYesNo) {
    const score = votes.reduce((a, b) => a + b, 0);
    const answer =
      score >= 2
        ? "Yes."
        : score === 1
          ? "Leaning yes."
          : score === 0
            ? "It is not settled yet, so wait a little."
            : score === -1
              ? "Leaning no."
              : "No.";
    lines.push(`On your question, the answer here is ${answer}`);
  } else if (question) {
    lines.push("On what you asked, the honest answer is that this is still being shaped by what you do next.");
  }

  lines.push(
    [
      "One simple next step: write down the first thought you had while looking at these, and act on it today.",
      "One simple next step: pick the easiest kind thing you can do about this before tonight.",
      "One simple next step: say the true thing out loud to the one person who needs to hear it.",
      "One simple next step: choose the smallest job you have been avoiding and finish it today.",
    ][n % 4],
  );

  return lines.join("\n");
}

