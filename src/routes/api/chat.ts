import { createFileRoute } from "@tanstack/react-router";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { withSupremeSystem } from "@/lib/ai-system";
import { createClient } from "@supabase/supabase-js";
import { MODEL_EVERYDAY } from "@/lib/ai-models";
import { offlineReading } from "@/lib/offline-reading";
import { AI_OFFLINE } from "@/lib/offline-mode";

type Body = {
  messages?: UIMessage[];
  context?: string;
  system?: string;
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // --- Auth: verify bearer via Supabase publishable client ---
        const auth = request.headers.get("authorization") || "";
        const token = auth.toLowerCase().startsWith("bearer ")
          ? auth.slice(7).trim()
          : "";
        if (!token) return new Response("Unauthorized", { status: 401 });

        const supaUrl = process.env.SUPABASE_URL!;
        const supaKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const supa = createClient(supaUrl, supaKey, {
          auth: { persistSession: false },
          global: {
            fetch: (input, init) => {
              const h = new Headers(init?.headers);
              if (supaKey.startsWith("sb_") && h.get("Authorization") === `Bearer ${supaKey}`) {
                h.delete("Authorization");
              }
              h.set("apikey", supaKey);
              return fetch(input, { ...init, headers: h });
            },
          },
        });
        const { data: userData, error: userErr } = await supa.auth.getUser(token);
        if (userErr || !userData?.user) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json()) as Body;
        const messages = body.messages;
        if (!Array.isArray(messages)) return new Response("messages required", { status: 400 });

        if (AI_OFFLINE) {
          const last = [...messages].reverse().find((m) => m.role === "user");
          const question = (last?.parts ?? [])
            .map((p: any) => (p?.type === "text" ? p.text : ""))
            .join(" ")
            .trim();
          const answer = offlineReading({
            system: body.context ?? "",
            prompt: question || "Give me a short reading for today.",
          });
          const stream = createUIMessageStream({
            execute: ({ writer }) => {
              const id = "offline-1";
              writer.write({ type: "text-start", id });
              writer.write({ type: "text-delta", id, delta: answer });
              writer.write({ type: "text-end", id });
            },
          });
          return createUIMessageStreamResponse({ stream });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const systemBase =
          body.system?.trim() ||
          "You are Taromaya's personal AI Guide — a warm, precise Vedic astrologer and Tarot reader. Use markdown.";
        const contextual = body.context
          ? `${systemBase}\n\n=== CONTEXT (grounding facts — trust these) ===\n${body.context}\n=== END CONTEXT ===`
          : systemBase;
        const system = withSupremeSystem(contextual);

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway(MODEL_EVERYDAY);

        try {
          const result = streamText({
            model,
            system,
            messages: await convertToModelMessages(messages),
          });
          return result.toUIMessageStreamResponse({ originalMessages: messages });
        } catch (err: any) {
          const msg = err?.message ?? "AI gateway error";
          return new Response(msg, { status: 500 });
        }
      },
    },
  },
});
