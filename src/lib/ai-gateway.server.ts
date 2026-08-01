import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { aiModel, aiSource } from "./ai-provider.server";

/**
 * Text/chat provider for the whole app.
 *
 * The name is historic: this now points at whatever provider is active. When the
 * app owner has set their own AI_API_KEY secret, calls go there and no Lovable
 * credits are used at all. Otherwise it falls back to the Lovable AI Gateway.
 *
 * Call sites keep passing gateway style model ids such as
 * "google/gemini-3.1-flash-lite"; those ids are translated for the owner's own
 * provider automatically, so nothing else has to change.
 */
export function createLovableAiGatewayProvider(apiKey: string) {
  const source =
    aiSource() ??
    ({ baseURL: "https://ai.gateway.lovable.dev/v1", headers: { "Lovable-API-Key": apiKey }, own: false } as const);

  const provider = createOpenAICompatible({
    name: "lovable",
    baseURL: source.baseURL,
    headers: source.headers,
    includeUsage: true,
  });

  // Chat and vision both run on the text model, so one mapping covers everything.
  return (requestedModelId: string) => provider(aiModel("text", requestedModelId));
}

/** True when AI runs on the app owner's own key (zero Lovable credits). */
export { usingOwnAi } from "./ai-provider.server";
