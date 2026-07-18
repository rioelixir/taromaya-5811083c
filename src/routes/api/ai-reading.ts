import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type Body = { system?: string; prompt?: string };

export const Route = createFileRoute("/api/ai-reading")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { system, prompt } = ((await request.json()) as Body) ?? {};
        if (!system || !prompt) {
          return new Response("system and prompt required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3.1-flash-lite"),
          system: system.slice(0, 2000),
          prompt: prompt.slice(0, 4000),
        });
        return result.toTextStreamResponse();
      },
    },
  },
});
