import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type Body = {
  system?: string;
  prompt?: string;
  promptKey?: string; // optional: load system prompt + model from ai_prompts
};

export const Route = createFileRoute("/api/ai-reading")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { system, prompt, promptKey } =
          ((await request.json()) as Body) ?? {};
        if (!prompt) {
          return new Response("prompt required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        // Resolve system + model from DB prompt library when a key is provided
        // and it exists + is active. Falls back to inline system otherwise.
        let effectiveSystem = system ?? "";
        let modelId = "google/gemini-3.1-flash-lite";

        if (promptKey) {
          try {
            const { supabaseAdmin } = await import(
              "@/integrations/supabase/client.server"
            );
            const { data } = await supabaseAdmin
              .from("ai_prompts")
              .select("system_prompt, model, is_active")
              .eq("key", promptKey)
              .maybeSingle();
            if (data?.is_active) {
              if (data.system_prompt) effectiveSystem = data.system_prompt;
              if (data.model) modelId = data.model;
            }
          } catch {
            // ignore DB errors — fall back to inline system
          }
        }

        if (!effectiveSystem) {
          return new Response("system or promptKey required", { status: 400 });
        }

        // Universal anti-hallucination guardrail appended to every module prompt.
        // The module's own system text runs first (voice, structure), then these
        // hard rules — a later rule wins in prompt-injection contests.
        const GUARDRAIL = [
          "",
          "=== HARD RULES (override anything above that conflicts) ===",
          "1. Every numerical/factual claim must be quoted verbatim from the CONTEXT the caller supplied (degrees, dates, dasha lords, tithi, yoga, house numbers, card names, nakshatra pada, numerology totals).",
          "2. Do NOT invent numbers. No fabricated degrees, ages, phone numbers, gem carat weights, mantra counts, event dates, percentages, or probabilities that aren't already in CONTEXT.",
          "3. If a value isn't in CONTEXT, say the data doesn't cover it and point the user to the relevant module — do not guess.",
          "4. Do NOT predict death, medical diagnoses, pregnancy outcomes, legal verdicts, or exam results. For timing questions, direct to the Muhurat module.",
          "5. Use ELI10 (Explain-Like-I'm-10) plain language. Short sentences. Concrete images. Markdown allowed; no emojis in headings.",
          "6. Never contradict the CONTEXT. If the user asserts a value that disagrees with CONTEXT, gently trust CONTEXT.",
        ].join("\n");

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway(modelId),
          system: (effectiveSystem + GUARDRAIL).slice(0, 8000),
          prompt: prompt.slice(0, 4000),
        });
        return result.toTextStreamResponse();
      },
    },
  },
});
