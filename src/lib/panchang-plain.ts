// Plain-English helpers for the Panchang, Muhurat, Festival and Moon
// Calendar pages — turns the technical Vedic terms into one-line
// beginner-friendly sentences, without changing any of the underlying math.

import type { Panchang } from "./panchang";
import { classifyPanchaka, bhadraInfo, tithiQuality, yogaQuality } from "./panchang-deep";
import { WEEKDAY } from "./panchang";

// One-line plain meaning for the day's tithi (Moon day).
export function tithiPlain(p: Panchang): string {
  const tq = tithiQuality(p.tithi.number);
  return `${p.tithi.name} is day ${p.tithi.number} of the Moon's 30-day cycle — ${tq.note.toLowerCase()}`;
}

// One-line plain meaning for the day's nakshatra (Moon's star sign for the day).
export function nakshatraPlain(p: Panchang): string {
  return `The Moon is passing through ${p.nakshatra.name} today, its ruling force is ${p.nakshatra.lord} — this colours the day's mood.`;
}

// One-line plain meaning for the day's yoga (Sun + Moon combined angle).
export function yogaPlain(p: Panchang): string {
  const yq = yogaQuality(p.yoga.name);
  return yq.auspicious
    ? `${p.yoga.name} yoga is a calm, favourable combination — good for everyday plans.`
    : `${p.yoga.name} yoga is a tense combination — better to be careful with big decisions.`;
}

// One-line plain meaning for the day's karana (half of a tithi).
export function karanaPlain(p: Panchang): string {
  const bh = bhadraInfo(p.karana.name);
  return bh.active
    ? `${p.karana.name} karana is running — this is the Bhadra window, best to postpone weddings or big launches.`
    : `${p.karana.name} karana is running — nothing special to avoid because of it.`;
}

// One-line plain meaning for the weekday and its ruling planet.
const WEEKDAY_LORD_PLAIN: Record<string, string> = {
  Sunday: "the Sun — energy, authority, health",
  Monday: "the Moon — feelings, home, comfort",
  Tuesday: "Mars — action, courage, conflict",
  Wednesday: "Mercury — talk, trade, learning",
  Thursday: "Jupiter — wisdom, money, growth",
  Friday: "Venus — love, beauty, relationships",
  Saturday: "Saturn — discipline, patience, hard work",
};
export function weekdayPlain(p: Panchang): string {
  return `${p.weekday} is ruled by ${WEEKDAY_LORD_PLAIN[p.weekday] ?? p.weekday}.`;
}

export type DayVerdict = {
  label: "Excellent" | "Good" | "Fair" | "Take care";
  summary: string;
};

// A single plain-English headline for "what kind of day is this", built from
// the same classical factors used elsewhere on the page (tithi quality, yoga
// quality, Panchaka and Bhadra), so it always agrees with the detail below it.
export function dayVerdict(p: Panchang): DayVerdict {
  const weekdayNum = WEEKDAY.indexOf(p.weekday);
  const tq = tithiQuality(p.tithi.number);
  const yq = yogaQuality(p.yoga.name);
  const panchaka = classifyPanchaka(p.nakshatra.name, weekdayNum);
  const bhadra = bhadraInfo(p.karana.name);

  let score = 0;
  if (tq.auspicious) score += 1; else score -= 1;
  if (yq.auspicious) score += 1; else score -= 1;
  if (panchaka.active && panchaka.type) score -= 1;
  if (bhadra.active) score -= 1;

  const goodNote = p.abhijitMuhurat
    ? " There's a reliably good window around midday (Abhijit Muhurat)."
    : "";
  const cautionParts: string[] = [];
  if (panchaka.active && panchaka.type) cautionParts.push(`${panchaka.type} Panchaka`);
  if (bhadra.active) cautionParts.push("Bhadra");
  const cautionNote = cautionParts.length
    ? ` Watch out for ${cautionParts.join(" and ")} — and avoid Rahu Kaal for anything new.`
    : " Just avoid Rahu Kaal for anything new.";

  if (score >= 2) return { label: "Excellent", summary: `Today is a strong, favourable day overall.${goodNote}` };
  if (score === 1) return { label: "Good", summary: `Today is a generally good day.${goodNote}` };
  if (score === 0) return { label: "Fair", summary: `Today is an average, mixed day — nothing special either way.${cautionNote}` };
  return { label: "Take care", summary: `Today has some tricky energy — better for routine tasks than big new starts.${cautionNote}` };
}
