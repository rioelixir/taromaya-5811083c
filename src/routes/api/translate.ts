import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { requireHttpAuth } from "@/lib/http-auth.server";
import { LANGUAGE_LIST } from "@/lib/i18n";
import { MODEL_EVERYDAY } from "@/lib/ai-models";

type Body = { lang?: string; strings?: string[] };

export const Route = createFileRoute("/api/translate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireHttpAuth(request);
        if (auth instanceof Response) return auth;
        const body = ((await request.json()) as Body) ?? {};
        const lang = body.lang;
        const strings = Array.isArray(body.strings) ? body.strings.slice(0, 200) : [];
        if (!lang || strings.length === 0) {
          return new Response(JSON.stringify({ translations: [] }), {
            headers: { "Content-Type": "application/json" },
          });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const target = LANGUAGE_LIST.find((l) => l.code === lang)?.ai;
        if (!target || lang === "en") {
          return new Response(JSON.stringify({ translations: strings }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        const system =
          `You are a professional translator. Translate each item from English to ${target}. ` +
          `Return ONLY a strict JSON array of the same length, no prose, no keys, no numbering. ` +
          `Preserve numbers, dates, punctuation, emojis, and proper nouns like Taromaya. ` +
          `Keep translations short, simple and natural for a mobile UI, easy enough for a 10-year-old. ` +
          `If an item is already non-English, a symbol, or a single number, return it unchanged.`;

        const prompt =
          `Translate this JSON array (${strings.length} items) and reply with ONLY the JSON array:\n` +
          JSON.stringify(strings);

        const gateway = createLovableAiGatewayProvider(key);
        const { text } = await generateText({
          model: gateway(MODEL_EVERYDAY),
          system,
          prompt,
        });

        let translations: string[] = strings;
        try {
          const start = text.indexOf("[");
          const end = text.lastIndexOf("]");
          if (start >= 0 && end > start) {
            const parsed = JSON.parse(text.slice(start, end + 1));
            if (Array.isArray(parsed) && parsed.length === strings.length) {
              translations = parsed.map((v, i) =>
                typeof v === "string" && v.trim() ? v : strings[i],
              );
            }
          }
        } catch {
          /* fall back to originals */
        }

        return new Response(JSON.stringify({ translations }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
