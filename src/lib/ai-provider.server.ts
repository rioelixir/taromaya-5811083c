/**
 * Where the app's AI comes from.
 *
 * Two ways to run:
 *
 *  1. OWN KEY (zero Lovable credits). Set the secret AI_API_KEY. Every reading,
 *     chat, translation, voice and transcription then goes straight to that
 *     provider on the app owner's own account, so nothing is billed to Lovable
 *     credits. Optional secrets: AI_BASE_URL (default OpenAI), AI_TEXT_MODEL,
 *     AI_VISION_MODEL, AI_TTS_MODEL, AI_STT_MODEL.
 *
 *  2. NO KEY. Everything still works, but the calls go through the Lovable AI
 *     Gateway, which does spend Lovable credits.
 *
 * Server only. Never import this from browser code.
 */

export type AiSource = {
  /** Base URL of an OpenAI-compatible API, no trailing slash. */
  baseURL: string;
  /** Auth headers for that API. */
  headers: Record<string, string>;
  /** True when the app owner's own key is paying, so Lovable credits stay at zero. */
  own: boolean;
};

/** Model kinds the app asks for. */
export type AiKind = "text" | "vision" | "tts" | "stt";

const DEFAULT_OWN_MODELS: Record<AiKind, string> = {
  text: "gpt-4o-mini",
  vision: "gpt-4o-mini",
  tts: "gpt-4o-mini-tts",
  stt: "whisper-1",
};

const OWN_MODEL_SECRET: Record<AiKind, string> = {
  text: "AI_TEXT_MODEL",
  vision: "AI_VISION_MODEL",
  tts: "AI_TTS_MODEL",
  stt: "AI_STT_MODEL",
};

function ownKey(): string | undefined {
  const key = process.env["AI_API_KEY"]?.trim();
  return key ? key : undefined;
}

/** True when AI runs on the owner's own key, so no Lovable credits are used. */
export function usingOwnAi(): boolean {
  return Boolean(ownKey());
}

/**
 * Picks the provider for this call. Returns null only when there is no way to
 * reach any model at all, so callers can degrade instead of throwing.
 */
export function aiSource(): AiSource | null {
  const own = ownKey();
  if (own) {
    const base = (process.env["AI_BASE_URL"]?.trim() || "https://api.openai.com/v1").replace(/\/+$/, "");
    return {
      baseURL: base,
      headers: { Authorization: `Bearer ${own}` },
      own: true,
    };
  }

  const lovable = process.env["LOVABLE_API_KEY"]?.trim();
  if (!lovable) return null;
  return {
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": lovable },
    own: false,
  };
}

/**
 * Turns a gateway style model id such as "google/gemini-3.1-flash-lite" into an
 * id the chosen provider understands.
 *
 * On the owner's own key we ignore the requested id completely and use the one
 * configured for that kind of job, because a gateway id means nothing there.
 */
export function aiModel(kind: AiKind, requested?: string): string {
  if (usingOwnAi()) {
    return process.env[OWN_MODEL_SECRET[kind]]?.trim() || DEFAULT_OWN_MODELS[kind];
  }
  if (requested) return requested;
  // Gateway defaults, kept cheap.
  if (kind === "tts") return "openai/gpt-4o-mini-tts";
  if (kind === "stt") return "openai/whisper-1";
  return "google/gemini-3.1-flash-lite";
}

/**
 * One plain HTTP call to whichever provider is active. Used for the endpoints
 * that are not text generation: speech and transcription.
 */
export async function aiFetch(
  path: string,
  init: { body: BodyInit; headers?: Record<string, string> },
): Promise<Response> {
  const source = aiSource();
  if (!source) return new Response("AI is not set up", { status: 500 });
  return fetch(`${source.baseURL}/${path.replace(/^\/+/, "")}`, {
    method: "POST",
    headers: { ...source.headers, ...(init.headers ?? {}) },
    body: init.body,
  });
}
