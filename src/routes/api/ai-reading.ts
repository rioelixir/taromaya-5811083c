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

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway(modelId),
          system: effectiveSystem.slice(0, 8000),
          prompt: prompt.slice(0, 4000),
        });
        return result.toTextStreamResponse();
      },
    },
  },
});
