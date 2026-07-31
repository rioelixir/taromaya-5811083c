import { createFileRoute } from "@tanstack/react-router";
import { guideById } from "@/lib/help-guides";

/**
 * Reads one help guide out loud. Public on purpose: help must work before sign in.
 * Only the fixed guide scripts can be spoken, so no free text reaches the voice model.
 */
export const Route = createFileRoute("/api/public/help-audio")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const id = new URL(request.url).searchParams.get("id") ?? "";
        const guide = guideById(id);
        if (!guide) return new Response("Unknown guide", { status: 404 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Voice is not set up", { status: 500 });

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            voice: "alloy",
            input: `${guide.title}. ${guide.script}`,
            response_format: "mp3",
            instructions:
              "Speak slowly, warmly and clearly, as if explaining to a ten year old who has never used an app before.",
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
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
