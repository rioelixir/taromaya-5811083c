/**
 * Offline readings switch.
 *
 * The app writes every reading itself, from its own astrology, numerology and
 * tarot engines. No outside AI model is called anywhere, so no AI credits are
 * ever spent. Flip this to false only if paid AI models are wanted again.
 */
export const AI_OFFLINE = true;

/** Friendly note shown when something used to need an outside AI model. */
export const OFFLINE_NOTE =
  "This reading was written by Taromaya from your own chart and numbers.";
