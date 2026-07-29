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

    const fallbackSystem = `You are TAROMAYA, a warm and clear tarot reader.
Write in very simple English that a 10 year old can read easily. Short sentences. Everyday words.

STRICT ANTI-HALLUCINATION RULES — non-negotiable:
1. Read ONLY the cards listed in "Cards drawn" below. Do NOT invent, add, rename, substitute, or reference any card that is not in that list.
2. Use the EXACT card name and EXACT position label the caller provided.
3. Every card is UPRIGHT. Do NOT describe any card as reversed unless the input explicitly says "(reversed)".
4. Do NOT invent numbers: no percentages, probabilities, dates, ages, addresses, medical figures, or astrological degrees.
5. Do NOT predict death, medical diagnoses, legal verdicts, pregnancy outcomes, or exact timing of outside events.
6. For a yes/no question, answer "Yes", "No", or "Leaning yes" / "Leaning no", based only on the drawn cards.
7. If the cards do not show something, say the cards are quiet about it instead of guessing.

LENGTH AND SHAPE — non-negotiable:
- Give 5 to 7 short lines in total. Nothing longer.
- One line per card, in the order given, each starting with a friendly emoji.
- Then one last line that starts with 💡 and gives one simple thing to do next.
- No headings. No markdown. No stars, hashes, underscores or bullets.
- Speak straight to the person as "you".`;


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
      system: withSupremeSystem(system),
      prompt: user,
    });

    return { text };
  });
