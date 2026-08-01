/**
 * One place that decides which AI model each part of the app uses.
 *
 * Every call the app makes to Lovable AI costs workspace credits, so the app
 * deliberately uses the cheapest model that still gives a good answer, and only
 * steps up for the few places where deep reasoning really shows.
 */

/** Everyday readings, summaries, translations. Cheapest good model. */
export const MODEL_EVERYDAY = "google/gemini-3.1-flash-lite";

/** Longer, more layered readings (tarot spreads, full reports). */
export const MODEL_DEEP = "google/gemini-3.5-flash";

/** Models an admin may pick in the prompt library. Nothing else is allowed. */
export const ALLOWED_CHAT_MODELS = [
  MODEL_EVERYDAY,
  MODEL_DEEP,
  "google/gemini-3.6-flash",
] as const;

/**
 * Hard caps so one long page of context can never turn into an expensive call.
 * Characters, not tokens — deliberately conservative and easy to reason about.
 */
export const MAX_SYSTEM_CHARS = 4000;
export const MAX_PROMPT_CHARS = 3000;
export const MAX_OUTPUT_TOKENS = 900;

/** Trim any text down to a hard character budget without cutting mid-word. */
export function budget(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("\n"));
  return (lastStop > max * 0.6 ? cut.slice(0, lastStop + 1) : cut).trim();
}
