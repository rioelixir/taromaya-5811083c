import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

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
      }),
    )
    .min(1)
    .max(12),
});

export const interpretTarot = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => DrawSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);

    const cardList = data.cards
      .map(
        (c, i) =>
          `${i + 1}. ${c.position} — ${c.name}${c.reversed ? " (reversed)" : ""} · keywords: ${c.keywords.join(", ")}`,
      )
      .join("\n");

    const system = `You are TAROMAYA, a warm, poetic, deeply insightful tarot reader.
You blend classical Rider-Waite-Smith symbolism with modern, grounded advice.
Voice: intimate, elegant, never generic. Never moralise. Never predict harm.
Structure your response as clean markdown with:
- A short opening paragraph reading the spread as a whole story (2-3 sentences).
- Then one section per card: "### {position} — {card name}{ (reversed)}" followed by 2-3 sentences of interpretation that tie the card to that position.
- End with "### Guidance" — one paragraph of actionable reflection (3-4 sentences).
Do not add disclaimers. Do not invent card names. Speak directly to the querent as "you".`;

    const user = `Spread: ${data.spreadLabel}
Question: ${data.question || "(open reading)"}
Cards drawn:
${cardList}`;

    const { text } = await generateText({
      model: gateway("openai/gpt-5.5"),
      system,
      prompt: user,
    });

    return { text };
  });
