import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { requirePremium } from "./premium-guard";
import { withSupremeSystem } from "./ai-system";

const PlanetSchema = z.object({
  name: z.string(),
  rashi: z.string(),
  house: z.number(),
  degree: z.string(),
  nakshatra: z.string(),
  retrograde: z.boolean(),
});

const KundliInterpretSchema = z.object({
  name: z.string().max(80).optional().default(""),
  ascendant: z.object({ rashi: z.string(), degree: z.string() }),
  moonNakshatra: z.object({ name: z.string(), pada: z.number(), lord: z.string() }),
  planets: z.array(PlanetSchema).min(9).max(9),
});

export const interpretKundli = createServerFn({ method: "POST" })
  .middleware([requirePremium])
  .inputValidator((data: unknown) => KundliInterpretSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);

    const table = data.planets
      .map((p) =>
        `- ${p.name}: ${p.rashi} ${p.degree}, house ${p.house}, nakshatra ${p.nakshatra}${p.retrograde ? " (R)" : ""}`,
      )
      .join("\n");

    const system = `You are TAROMAYA, a grounded, elegant Vedic astrologer.
You read birth charts in the sidereal (Lahiri) tradition, using whole-sign houses.
Voice: warm, precise, poetic — never generic, never fatalistic.
Structure the response as clean markdown:
### Overall
2-3 sentences on the chart's core signature (Lagna + lord + Moon nakshatra).
### Strengths
3 concise bullets (bold key phrase, then a sentence).
### Growth edges
3 concise bullets.
### This life's theme
One short paragraph tying the dominant themes together.
Do not add disclaimers. Address the person directly.`;

    const user = `Native: ${data.name || "the querent"}
Ascendant (Lagna): ${data.ascendant.rashi} ${data.ascendant.degree}
Moon Nakshatra: ${data.moonNakshatra.name} pada ${data.moonNakshatra.pada} (lord ${data.moonNakshatra.lord})
Planets:
${table}`;

    const { text } = await generateText({
      model: gateway("openai/gpt-5.5"),
      system: withSupremeSystem(system),
      prompt: user,
    });

    return { text };
  });
