import { aiReading as aiReadingServer } from "./ai-reading.functions";
import { offlineReading } from "./offline-reading";
import { AI_OFFLINE } from "./offline-mode";

/**
 * Cached front door for AI readings.
 *
 * Every AI call costs credits, so the exact same question is never paid for
 * twice: the answer is remembered in the browser for a day. Re-opening a page,
 * switching tabs and coming back, or tapping a section twice all reuse the
 * stored answer instead of asking the model again.
 */

const STORE_PREFIX = "taromaya.ai.v1:";
const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 60;

type Entry = { text: string; at: number };

/** Small, fast, stable string key. Not security — just a cache bucket. */
function hash(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = (h1 ^ c) * 16777619 >>> 0;
    h2 = (h2 + c * (i + 1)) >>> 0;
  }
  return `${h1.toString(36)}${h2.toString(36)}`;
}

function store(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function read(key: string): string | null {
  const s = store();
  if (!s) return null;
  try {
    const raw = s.getItem(STORE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Entry;
    if (!entry?.text || Date.now() - entry.at > TTL_MS) {
      s.removeItem(STORE_PREFIX + key);
      return null;
    }
    return entry.text;
  } catch {
    return null;
  }
}

function write(key: string, text: string) {
  const s = store();
  if (!s) return;
  try {
    // Keep the cache small: drop the oldest entries when it grows too big.
    const keys = Object.keys(s).filter((k) => k.startsWith(STORE_PREFIX));
    if (keys.length >= MAX_ENTRIES) {
      keys
        .map((k) => {
          let at = 0;
          try { at = (JSON.parse(s.getItem(k) ?? "{}") as Entry).at ?? 0; } catch { at = 0; }
          return { k, at };
        })
        .sort((a, b) => a.at - b.at)
        .slice(0, Math.ceil(MAX_ENTRIES / 3))
        .forEach(({ k }) => s.removeItem(k));
    }
    s.setItem(STORE_PREFIX + key, JSON.stringify({ text, at: Date.now() } satisfies Entry));
  } catch {
    // A full or blocked storage must never break a reading.
  }
}

/**
 * Ask for a reading, reusing an identical earlier answer when there is one.
 * Same signature as the underlying server function, so call sites don't change.
 */
export async function aiReading(args: { data: { system: string; prompt: string } }) {
  // Offline mode: Taromaya writes the reading itself from the numbers it just
  // calculated, so nothing is sent to a paid AI model.
  if (AI_OFFLINE) return { text: offlineReading(args.data), cached: false as const };

  const key = hash(`${args.data.system}\u0000${args.data.prompt}`);
  const hit = read(key);
  if (hit) return { text: hit, cached: true as const };

  const out = await aiReadingServer(args);
  if (out?.text) write(key, out.text);
  return { ...out, cached: false as const };
}

/** Forget every stored answer (used when a person signs out). */
export function clearAiCache() {
  const s = store();
  if (!s) return;
  try {
    Object.keys(s)
      .filter((k) => k.startsWith(STORE_PREFIX))
      .forEach((k) => s.removeItem(k));
  } catch {
    // ignore
  }
}
