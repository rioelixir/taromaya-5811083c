import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { requirePremium } from "./premium-guard";

const Input = z.object({
  gender: z.enum(["Boy", "Girl", "Unisex"]),
  tradition: z.enum(["Hindu", "Sanskrit", "Sikh", "Muslim", "Christian", "Modern", "Any"]),
  syllables: z.array(z.string().min(1).max(6)).max(8).default([]),
  meaningTheme: z.string().max(200).optional(),
  nakshatraName: z.string().max(40).optional(),
  targetLifePath: z.number().int().min(1).max(33).optional(),
  count: z.number().int().min(6).max(30).default(20),
});

type Suggestion = {
  name: string;
  meaning: string;
  origin: string;
  gender: "Boy" | "Girl" | "Unisex";
  syllable: string;
};

export const suggestBabyNames = createServerFn({ method: "POST" })
  .middleware([requirePremium])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);

    const syllableLine = data.syllables.length
      ? `Names MUST START with one of these Sanskrit syllables (case-insensitive): ${data.syllables.join(", ")}.`
      : `Any starting syllable is acceptable.`;
    const nak = data.nakshatraName
      ? `The child's birth Nakshatra is ${data.nakshatraName} — honor its deity/quality where natural.`
      : "";
    const lp = data.targetLifePath
      ? `Prefer names whose Pythagorean expression number reduces to ${data.targetLifePath}.`
      : "";
    const theme = data.meaningTheme
      ? `Meaning theme: ${data.meaningTheme}.`
      : "";

    const system = `You are a Vedic Namakarana expert and etymologist.
Return ONLY a JSON array (no prose, no code fences) of ${data.count} baby name objects.
Each object has: name (string, properly capitalized), meaning (concise, <14 words),
origin (one of ${data.tradition === "Any" ? "Sanskrit/Hindu/Sikh/Muslim/Christian/Modern" : data.tradition}),
gender ("${data.gender}"), syllable (the starting Sanskrit syllable, e.g. "Chu").
Use authentic names only. Do not invent. No duplicates. No offensive terms.`;

    const prompt = `Tradition: ${data.tradition}. Gender: ${data.gender}.
${syllableLine}
${nak}
${lp}
${theme}
Return exactly ${data.count} entries.`;

    const { text } = await generateText({
      model: gateway("openai/gpt-5.5"),
      system,
      prompt,
    });

    // Robust JSON extraction
    let list: Suggestion[] = [];
    try {
      const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
      const start = cleaned.indexOf("[");
      const end = cleaned.lastIndexOf("]");
      const jsonStr = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) list = parsed as Suggestion[];
    } catch {
      // fall through — return empty; UI will show a retry state
    }

    // Sanitize
    const seen = new Set<string>();
    const clean = list
      .filter((n) => n && typeof n.name === "string" && n.name.length > 0)
      .map((n) => ({
        name: String(n.name).trim(),
        meaning: String(n.meaning ?? "").trim(),
        origin: String(n.origin ?? data.tradition).trim(),
        gender: (["Boy","Girl","Unisex"].includes(String(n.gender)) ? n.gender : data.gender) as Suggestion["gender"],
        syllable: String(n.syllable ?? "").trim(),
      }))
      .filter((n) => {
        const k = n.name.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

    return { names: clean };
  });
