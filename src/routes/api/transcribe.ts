import { createFileRoute } from "@tanstack/react-router";
import { requireHttpAuth } from "@/lib/http-auth.server";
import { aiFetch, aiModel, aiSource } from "@/lib/ai-provider.server";
import { AI_OFFLINE } from "@/lib/offline-mode";

/** Turns a short recording into text. Used only when the browser has no built-in listener. */
export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireHttpAuth(request);
        if (auth instanceof Response) return auth;

        if (!aiSource()) return new Response("Voice input is not set up", { status: 500 });

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return new Response("Send the recording as form data.", { status: 400 });
        }

        // Offline mode: speech is handled by the phone or browser itself, so no
        // paid speech model is called here.
        if (AI_OFFLINE) {
          return new Response("Voice typing works right on your device here.", { status: 501 });
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
        upstream.append("model", aiModel("stt"));
        upstream.append("file", file, "recording.wav");
        if (typeof language === "string" && /^[a-z]{2}$/.test(language)) {
          upstream.append("language", language);
        }

        const res = await aiFetch("audio/transcriptions", { body: upstream });

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
