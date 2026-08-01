import { createFileRoute } from "@tanstack/react-router";
import { guideById } from "@/lib/help-guides";
import { LANGUAGE_LIST } from "@/lib/i18n";
import { MODEL_EVERYDAY } from "@/lib/ai-models";
import { aiFetch, aiModel, aiSource } from "@/lib/ai-provider.server";

/**
 * Reads one help guide out loud, in any language the app supports.
 * Public on purpose: help must work before sign in. Only the fixed guide
 * scripts can be spoken, so no free text reaches the voice model.
 */
export const Route = createFileRoute("/api/public/help-audio")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const id = url.searchParams.get("id") ?? "";
        const langCode = url.searchParams.get("lang") ?? "en";
        const guide = guideById(id);
        if (!guide) return new Response("Unknown guide", { status: 404 });
        const language = LANGUAGE_LIST.find((l) => l.code === langCode);
        if (!language) return new Response("Unknown language", { status: 400 });

        if (!aiSource()) return new Response("Voice is not set up", { status: 500 });

        let spoken = `${guide.title}. ${guide.script}`;

        // Non-English listeners hear the same guide in their own language.
        if (language.code !== "en") {
          const t = await aiFetch("chat/completions", {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: aiModel("text", MODEL_EVERYDAY),
              messages: [
                {
                  role: "system",
                  content:
                    `Translate the text into ${language.ai}. Keep it very simple, as if explaining to a ten year old. Return only the translated words, plain sentences, no symbols, no stars, no hashes, no numbering.`,
                },
                { role: "user", content: spoken },
              ],
            }),
          });
          if (t.ok) {
            const data = (await t.json()) as { choices?: { message?: { content?: string } }[] };
            const out = data.choices?.[0]?.message?.content?.trim();
            if (out) spoken = out;
          } else {
            console.error(`Help translate failed [${t.status}]: ${await t.text().catch(() => "")}`);
          }
        }

        // The phone can read the words out itself for free. When the page asks
        // for text only we stop here, which is the normal path.
        if (url.searchParams.get("text") === "1") {
          return new Response(JSON.stringify({ text: spoken }), {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=2592000, immutable",
            },
          });
        }

        const res = await aiFetch("audio/speech", {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: aiModel("tts"),
            voice: "alloy",
            input: spoken,
            response_format: "mp3",
            instructions: `Speak in ${language.ai}. Speak slowly, warmly and clearly, as if explaining to a ten year old who has never used an app before.`,
          }),
        });

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          console.error(`Help audio failed [${res.status}]: ${body}`);
          return new Response(body || "Could not make the audio", { status: res.status });
        }

        return new Response(res.body, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=2592000, immutable",
          },
        });
      },
    },
  },
});
