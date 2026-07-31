import { createFileRoute } from "@tanstack/react-router";
import { requireHttpAuth } from "@/lib/http-auth.server";

/** Turns a short recording into text. Used only when the browser has no built-in listener. */
export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireHttpAuth(request);
        if (auth instanceof Response) return auth;

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return new Response("Send the recording as form data.", { status: 400 });
        }

        const file = form.get("file");
        if (!(file instanceof File) || file.size < 2048) {
          return new Response("That recording was empty — please try again.", { status: 400 });
        }
        if (file.size > 20 * 1024 * 1024) {
          return new Response("That recording is too long — please try a shorter one.", { status: 413 });
        }

        const language = form.get("language");

        const upstream = new FormData();
        upstream.append("model", "openai/gpt-4o-mini-transcribe");
        upstream.append("file", file, "recording.wav");
        if (typeof language === "string" && /^[a-z]{2}$/.test(language)) {
          upstream.append("language", language);
        }

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: upstream,
        });

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          console.error(`Transcription failed [${res.status}]: ${body}`);
          return new Response(body || "Voice input failed. Please type instead.", {
            status: res.status,
          });
        }

        const data = (await res.json()) as { text?: string };
        return new Response(JSON.stringify({ text: data.text ?? "" }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
