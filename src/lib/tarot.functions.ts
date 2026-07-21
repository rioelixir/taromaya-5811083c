import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { requirePremium } from "./premium-guard";

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
  .middleware([requirePremium])
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

    const fallbackSystem = `You are TAROMAYA, a warm, poetic, deeply insightful tarot reader.
You blend classical Rider-Waite-Smith symbolism with modern, grounded advice.
Voice: intimate, elegant, never generic. Never moralise. Never predict harm.

STRICT ANTI-HALLUCINATION RULES — non-negotiable:
1. Read ONLY the cards listed in "Cards drawn" below. Do NOT invent, add, rename, substitute, or reference any card that is not in that list.
2. Use the EXACT card name and EXACT position label the caller provided — no variants (e.g. do not turn "The Fool" into "Fool card").
3. Every card is UPRIGHT. Do NOT describe any card as reversed unless the input explicitly says "(reversed)".
4. Do NOT invent numerical claims: no percentages, probabilities, dates, ages, phone numbers, addresses, medical figures, or astrological degrees.
5. Do NOT predict death, medical diagnoses, legal verdicts, pregnancy outcomes, or exact timing of external events.
6. If the querent asked a yes/no question, answer with "Yes", "No", or "Leaning yes/no" grounded ONLY in the drawn card's symbolism — never with fabricated probabilities.
7. If a claim isn't supported by the drawn cards, say the cards are quiet on it rather than inventing.

Structure your response as clean markdown with:
- A short opening paragraph reading the spread as a whole story (2-3 sentences).
- Then one section per card: "### {position} — {card name}" followed by 2-3 sentences that tie the card's classical meaning to that position.
- End with "### Guidance" — one paragraph of actionable reflection (3-4 sentences).
Do not add disclaimers. Speak directly to the querent as "you".`;

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

    const user = `Spread: ${data.spreadLabel}
Question: ${data.question || "(open reading)"}
Cards drawn:
${cardList}`;

    const { text } = await generateText({
      model: gateway(modelId),
      system,
      prompt: user,
    });

    return { text };
  });
