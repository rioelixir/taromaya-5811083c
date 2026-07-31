import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { requirePremium } from "./premium-guard";
import { withSupremeSystem } from "./ai-system";

const DrawSchema = z.object({
  spreadLabel: z.string(),
  question: z.string().max(500).optional().default(""),
  cards: z
    .array(
      z.object({
        name: z.string(),
        position: z.string(),
        reversed: z.boolean(),
        keywords: z.array(z.string()),
        /** Signed URL of the uploaded card art — the AI reads the text on it. */
        image: z.string().url().optional(),
      }),
    )
    .min(1)
    .max(12),
  /** Optional star context woven into the same single reading. */
  birthNakshatra: z.string().max(200).optional(),
  placeNakshatra: z.string().max(200).optional(),
  placeName: z.string().max(200).optional(),
  nakshatraCard: z.string().max(200).optional(),
});


export const interpretTarot = createServerFn({ method: "POST" })
  .middleware([requirePremium])
  .inputValidator((data: unknown) => DrawSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);

    // Card names only — no numbering, no position labels are ever exposed.
    const cardList = data.cards
      .map((c) => `- ${c.name}${c.reversed ? " (reversed)" : ""}`)
      .join("\n");

    const fallbackSystem = `You are TAROMAYA, a warm and experienced tarot reader talking to a friend.
Write in very simple English that a 10 year old can read easily. Short sentences. Everyday words.

STRICT ACCURACY RULES — non-negotiable:
1. Use ONLY the cards listed below. Never invent, add, rename or substitute a card.
2. Every card is upright unless the list says "(reversed)".
3. Never invent numbers: no percentages, dates, ages, or degrees.
4. Never predict death, illness, legal results, pregnancy results, or exact dates.
5. For a yes or no question, say Yes, No, Leaning yes, or Leaning no.
6. If the cards are quiet about something, say so instead of guessing.`;

    // Try to load the editable prompt from the admin CMS.
    let system = fallbackSystem;
    let modelId = "openai/gpt-5.5";
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: row } = await supabaseAdmin
        .from("ai_prompts")
        .select("system_prompt, model, is_active")
        .eq("key", "tarot.reading")
        .maybeSingle();
      if (row?.is_active) {
        if (row.system_prompt) system = row.system_prompt;
        if (row.model) modelId = row.model;
      }
    } catch {
      // fall back to defaults
    }

    // Final word: one flowing reading, no labels of any kind.
    const NO_LABELS = `SHAPE OF THE ANSWER — this overrides every other instruction:
- Write ONE flowing reading, 5 to 8 short lines, like a real reader speaking out loud.
- Never write card names, card numbers, or position labels. No "Card 1", no "Past", no "Present", no "Future", no "Position", no "The Fool:".
- Never write section titles such as "Tarot says" or "Nakshatra says". No headings at all.
- Blend the cards, the birth star and the place star into one single story.
- No emojis needed at the start of every line; at most one or two in the whole reading.
- No markdown, no stars, hashes, underscores, bullets or dashes.
- Speak straight to the person as "you". End with one simple thing they can do next.`;

    const starLines = [
      data.birthNakshatra ? `Birth star energy: ${data.birthNakshatra}` : "",
      data.placeNakshatra
        ? `Star energy of where they are now${data.placeName ? ` (${data.placeName})` : ""}: ${data.placeNakshatra}`
        : "",
      data.nakshatraCard ? `Star card in play: ${data.nakshatraCard}` : "",
    ].filter(Boolean);

    const user = `Question: ${data.question || "(open reading)"}
Cards in front of you (do not name them in your answer):
${cardList}${starLines.length ? `\nExtra energy to blend in silently:\n${starLines.join("\n")}` : ""}`;

    const { text } = await generateText({
      model: gateway(modelId),
      system: `${withSupremeSystem(system)}\n\n${NO_LABELS}\n`,
      prompt: user,
    });


    return { text };
  });
