/**
 * Turn one spoken sentence into the fields a form needs.
 * Everything here is plain word-matching so it works instantly and offline.
 *
 * "My name is Ria, born 18 August 1995 at 4:35 in the evening in Delhi"
 *   -> { name: "Ria", date: "1995-08-18", time: "16:35", place: "Delhi" }
 */

import { cleanSpeech, parseSpokenTime } from "@/lib/speech";

export type SpokenDetails = {
  name?: string;
  date?: string; // yyyy-mm-dd
  time?: string; // HH:mm
  place?: string;
  gender?: "male" | "female";
};

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];
const MONTH_SHORT = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

const WORD_NUM: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  thirty: 30, forty: 40, fifty: 50,
};

function numsToDigits(s: string): string {
  let out = s;
  // "twenty one" style
  out = out.replace(
    /\b(twenty|thirty|forty|fifty)[\s-](one|two|three|four|five|six|seven|eight|nine)\b/g,
    (_m, a: string, b: string) => String(WORD_NUM[a] + WORD_NUM[b]),
  );
  out = out.replace(/\bnineteen (\d{2})\b/g, (_m, r) => String(1900 + Number(r)));
  out = out.replace(/\btwo thousand and (\d{1,2})\b/g, (_m, r) => String(2000 + Number(r)));
  out = out.replace(/\btwo thousand\b/g, "2000");
  out = out.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty)\b/g,
    (m) => String(WORD_NUM[m]));
  return out;
}

/* ------------------------------ date ------------------------------ */

export function extractDate(raw: string): string | undefined {
  const t = numsToDigits(
    raw.toLowerCase().replace(/(\d)(st|nd|rd|th)\b/g, "$1").replace(/[,]/g, " "),
  );

  // 18 august 1995 / august 18 1995 / 18 aug 95
  const monthPos = (() => {
    for (let i = 0; i < 12; i++) {
      const re = new RegExp(`\\b(${MONTHS[i]}|${MONTH_SHORT[i]})\\b`);
      const m = re.exec(t);
      if (m) return { idx: i, at: m.index, len: m[0].length };
    }
    return null;
  })();

  if (monthPos) {
    const before = t.slice(Math.max(0, monthPos.at - 14), monthPos.at);
    const after = t.slice(monthPos.at + monthPos.len, monthPos.at + monthPos.len + 20);
    const dayFrom = (s: string) => s.match(/\b([12][0-9]|3[01]|0?[1-9])\b/)?.[1];
    const day = Number(dayFrom(before) ?? dayFrom(after) ?? 0);
    const year = Number(
      (before + " " + after).match(/\b(1[89]\d{2}|20\d{2})\b/)?.[1] ??
        (before + " " + after).match(/\b(\d{2})\b(?!\s*:)/g)?.slice(-1)[0] ??
        0,
    );
    if (day) {
      const y = year >= 1000 ? year : year ? (year > 30 ? 1900 + year : 2000 + year) : 0;
      if (y) return iso(y, monthPos.idx + 1, day);
    }
  }

  const ymd = t.match(/\b(1[89]\d{2}|20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (ymd) return iso(Number(ymd[1]), Number(ymd[2]), Number(ymd[3]));

  const dmy = t.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
  if (dmy) {
    let y = Number(dmy[3]);
    if (y < 100) y = y > 30 ? 1900 + y : 2000 + y;
    return iso(y, Number(dmy[2]), Number(dmy[1]));
  }
  return undefined;
}

function iso(y: number, m: number, d: number): string | undefined {
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) return undefined;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/* ------------------------------ time ------------------------------ */

export function extractTime(raw: string): string | undefined {
  let t = numsToDigits(raw.toLowerCase());
  t = t
    .replace(/\bhalf past (\d{1,2})\b/g, (_m, h) => `${h}:30`)
    .replace(/\bquarter past (\d{1,2})\b/g, (_m, h) => `${h}:15`)
    .replace(/\bquarter to (\d{1,2})\b/g, (_m, h) => `${Number(h) - 1 || 12}:45`)
    .replace(/\b(\d{1,2}) thirty\b/g, "$1:30")
    .replace(/\b(\d{1,2}) fifteen\b/g, "$1:15")
    .replace(/\bnoon|midday\b/g, "12:00 pm")
    .replace(/\bmidnight\b/g, "12:00 am")
    .replace(/\b(\d{1,2})\s*o'?\s?clock\b/g, "$1:00");

  const part = /\b(morning|forenoon)\b/.test(t)
    ? "am"
    : /\b(evening|night|afternoon)\b/.test(t)
      ? "pm"
      : undefined;

  const m =
    t.match(/\b(\d{1,2})[:.](\d{2})\s*(a\.?m\.?|p\.?m\.?)?/) ??
    t.match(/\b(\d{1,2})()\s*(a\.?m\.?|p\.?m\.?)/);
  if (!m) return undefined;

  let h = Number(m[1]);
  const min = Number(m[2] || 0);
  const ap = (m[3] || part || "").replace(/\./g, "").toLowerCase();
  if (ap.startsWith("p") && h < 12) h += 12;
  if (ap.startsWith("a") && h === 12) h = 0;
  if (h > 23 || min > 59) return undefined;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/* ------------------------------ place ------------------------------ */

const PLACE_CUES =
  /(?:born (?:in|at)|birth\s*place(?:\s*is)?|place of birth(?:\s*is)?|place(?:\s*is)?|city(?:\s*is)?|in the city of|from)\s+([a-z\u0900-\u097F][a-z\u0900-\u097F .'-]{1,40})/i;

/** Words that are never a place, so "in the evening" is not read as a city. */
const NOT_A_PLACE = new Set([
  ...MONTHS, ...MONTH_SHORT,
  "the", "morning", "forenoon", "afternoon", "evening", "night", "midnight", "noon", "midday",
  "am", "pm", "day", "days", "month", "months", "year", "years", "week", "weeks",
  "hour", "hours", "minute", "minutes", "oclock", "o'clock", "time", "date", "future",
  "love", "work", "money", "health", "life", "hospital", "home", "house", "india",
]);

const STOP_AFTER =
  /\b(and|my|time|date|born|at|on|is|was|hai|ka|ke|ko|please|thanks|thank)\b/i;

function tidyPlace(chunk: string): string | undefined {
  const words = chunk.trim().split(/\s+/);
  const kept: string[] = [];
  for (const w of words) {
    if (STOP_AFTER.test(w) && kept.length) break;
    if (/\d/.test(w)) break;
    const clean = w.replace(/[.,]$/, "");
    if (!kept.length && NOT_A_PLACE.has(clean.toLowerCase())) continue;
    if (kept.length && NOT_A_PLACE.has(clean.toLowerCase())) break;
    kept.push(clean);
    if (kept.length === 3) break;
  }
  const place = kept.join(" ").trim();
  if (place.length < 2) return undefined;
  return place.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

export function extractPlace(raw: string): string | undefined {
  const m = PLACE_CUES.exec(raw);
  const cued = m ? tidyPlace(m[1]) : undefined;
  if (cued) return cued;

  // Plain speech like "at 4:35 in the evening in Mumbai" — take the last
  // "in / at <somewhere>" that is not a time or a date word.
  const re = /\b(?:in|at|near)\s+([a-z\u0900-\u097F][a-z\u0900-\u097F .'-]{1,40})/gi;
  let best: string | undefined;
  for (let hit = re.exec(raw); hit; hit = re.exec(raw)) {
    const cand = tidyPlace(hit[1]);
    if (cand) best = cand;
  }
  return best;
}


/* ------------------------------ name ------------------------------ */

const NAME_CUES = /(?:my name is|name is|i am|i'm|this is|call me|myself)\s+([a-z\u0900-\u097F][a-z\u0900-\u097F' -]{1,30})/i;

export function extractName(raw: string): string | undefined {
  const m = NAME_CUES.exec(raw);
  if (!m) return undefined;
  const words = m[1].trim().split(/\s+/).slice(0, 3);
  const kept: string[] = [];
  for (const w of words) {
    if (STOP_AFTER.test(w) || /\d/.test(w)) break;
    kept.push(w.replace(/[.,]$/, ""));
  }
  const name = kept.join(" ").trim();
  if (name.length < 2) return undefined;
  return name.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

/* ------------------------------ gender ------------------------------ */

export function extractGender(raw: string): "male" | "female" | undefined {
  if (/\b(female|woman|girl|lady|ladki|mahila)\b/i.test(raw)) return "female";
  if (/\b(male|man|boy|gent|ladka|purush)\b/i.test(raw)) return "male";
  return undefined;
}

/** Everything at once. */
export function parseSpokenDetails(raw: string): SpokenDetails {
  const text = cleanSpeech(raw, { punctuate: false });
  const out: SpokenDetails = {};
  const date = extractDate(text);
  const time = extractTime(text) ?? parseSpokenTime(text) ?? undefined;
  const place = extractPlace(text);
  const name = extractName(text);
  const gender = extractGender(text);
  if (date) out.date = date;
  if (time) out.time = time;
  if (place) out.place = place;
  if (name) out.name = name;
  if (gender) out.gender = gender;
  return out;
}

export function hasDetails(d: SpokenDetails): boolean {
  return !!(d.date || d.time || d.place || d.name || d.gender);
}

/* ------------------------------ shared events ------------------------------ */

export const VOICE_FILL_EVENT = "taromaya:voice-fill";

export function announceDetails(details: SpokenDetails) {
  window.dispatchEvent(new CustomEvent<SpokenDetails>(VOICE_FILL_EVENT, { detail: details }));
}

/** True when this element is the first of its kind on the page (so we fill one form only). */
export function isFirstOfKind(el: Element | null, selector: string): boolean {
  if (!el) return false;
  return document.querySelector(selector) === el;
}
