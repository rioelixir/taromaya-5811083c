import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { liveSkySnapshot, signName } from "./live-sky";
import { requirePremium } from "./premium-guard";
import { withSupremeSystem } from "./ai-system";

const Input = z.object({
  dream: z.string().min(4).max(4000),
  mood: z.string().max(40).optional().nullable(),
  focus: z.enum(["general", "relationships", "career", "spiritual", "shadow"]).default("general"),
});

const FOCUS_PROMPTS: Record<z.infer<typeof Input>["focus"], string> = {
  general: "Give a balanced psycho-spiritual reading covering emotional, symbolic, and karmic themes.",
  relationships: "Emphasize relational archetypes, attachment patterns, and Venus/Moon symbolism.",
  career: "Emphasize vocation, ambition, Saturn/Mars/Sun archetypes, and life-path timing.",
  spiritual: "Emphasize soul evolution, past-life echoes, Ketu/Neptune themes, and inner temple imagery.",
  shadow: "Perform a Jungian shadow reading: name the disowned aspect, the gift it carries, and one integration ritual.",
};

export const interpretDream = createServerFn({ method: "POST" })
  .middleware([requirePremium])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);

    // Live cosmic context for grounding
    const snap = liveSkySnapshot();
    const moon = snap.sky.tropicalPlanets.find(p => p.name === "Moon")!;
    const sun = snap.sky.tropicalPlanets.find(p => p.name === "Sun")!;
    const moonSign = signName(Math.floor(moon.tropicalLongitude / 30));
    const sunSign = signName(Math.floor(sun.tropicalLongitude / 30));
    const retros = snap.retros.filter(r => r.retrograde).map(r => r.planet).join(", ") || "none";

    const system = [
      "You are TAROMAYA's Dream Oracle — a luxurious, precise, poetic interpreter of dreams.",
      "Blend Jungian symbolism, Vedic archetypes (planets, nakshatras), Tarot correspondences, and mythic themes.",
      "Never diagnose. Speak with warmth and clarity.",
      "Return well-formatted markdown with these sections:",
      "## The Central Symbol",
      "## Emotional Landscape",
      "## Archetypes at Play (name specific Tarot cards / planets / nakshatras)",
      "## Message from the Unconscious",
      "## Ritual Response (one small grounded action for today)",
      FOCUS_PROMPTS[data.focus],
    ].join("\n");

    const prompt = [
      `Dream (in the dreamer's words):`,
      data.dream.trim(),
      data.mood ? `\nDreamer's waking mood: ${data.mood}` : "",
      `\nLive cosmic context for grounding:`,
      `- Moon: ${moonSign} · ${snap.moon.name} (${Math.round(snap.moon.illumination * 100)}% illuminated)`,
      `- Sun: ${sunSign}`,
      `- Retrogrades: ${retros}`,
      `\nInterpret with elegance. Keep it under 550 words.`,
    ].join("\n");

    const { text } = await generateText({
      model: gateway("openai/gpt-5.5"),
      system: withSupremeSystem(system),
      prompt,
    });

    return {
      text,
      context: {
        moonSign, sunSign,
        moonPhase: snap.moon.name,
        illumination: snap.moon.illumination,
        retros,
      },
    };
  });
