// Minimal client-side i18n. Phase 1 scaffold — English + Simple Hindi.
// Extend the dictionaries as more strings need translating.

import { useSyncExternalStore } from "react";

export const LANGUAGES = ["en", "hi"] as const;
export type Lang = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Lang, string> = {
  en: "English",
  hi: "हिंदी",
};

const STORAGE_KEY = "taromaya.lang";

function readLang(): Lang {
  if (typeof window === "undefined") return "en";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "hi" ? "hi" : "en";
}

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function setLang(next: Lang) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, next);
  listeners.forEach((l) => l());
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, readLang, () => "en");
}

/** Dictionary keys, English fallback, Hindi (Devanagari) target. */
const DICT: Record<string, { en: string; hi: string }> = {
  "kundli.title":            { en: "Kundli",                   hi: "कुंडली" },
  "kundli.subtitle":         { en: "Vedic birth chart",        hi: "जन्म कुंडली" },
  "form.name":               { en: "Name",                     hi: "नाम" },
  "form.date":               { en: "Birth date",               hi: "जन्म तिथि" },
  "form.time":               { en: "Birth time",               hi: "जन्म समय" },
  "form.seconds":            { en: "Seconds",                  hi: "सेकंड" },
  "form.unknown_time":       { en: "Time unknown (uses solar/noon chart)", hi: "समय ज्ञात नहीं (सूर्य/दोपहर कुंडली)" },
  "form.place":              { en: "Birthplace",               hi: "जन्म स्थान" },
  "form.lat":                { en: "Latitude",                 hi: "अक्षांश" },
  "form.lon":                { en: "Longitude",                hi: "देशांतर" },
  "form.tz":                 { en: "Time zone (hrs from UTC)", hi: "समय क्षेत्र (UTC से घंटे)" },
  "form.elevation":          { en: "Elevation (m)",            hi: "ऊँचाई (मी)" },
  "form.ayanamsa":           { en: "Ayanamsa",                 hi: "अयनांश" },
  "form.house_system":       { en: "House system",             hi: "भाव पद्धति" },
  "form.node_type":          { en: "Rahu/Ketu node",           hi: "राहु/केतु" },
  "form.calculate":          { en: "Calculate chart",          hi: "कुंडली बनाएँ" },
  "form.save":               { en: "Save chart",               hi: "कुंडली सहेजें" },
  "form.calculating":        { en: "Calculating…",             hi: "गणना हो रही है…" },
  "form.geocode_confirm":    { en: "Confirm location",         hi: "स्थान की पुष्टि करें" },
  "chart.ascendant":         { en: "Ascendant (Lagna)",        hi: "लग्न" },
  "chart.moon_sign":         { en: "Moon sign (Rashi)",        hi: "चंद्र राशि" },
  "chart.nakshatra":         { en: "Nakshatra",                hi: "नक्षत्र" },
  "common.saved":            { en: "Saved",                    hi: "सहेज लिया गया" },
  "common.error":            { en: "Something went wrong",     hi: "कुछ गलत हो गया" },
  "common.sign_in_required": { en: "Sign in to save",          hi: "सहेजने के लिए लॉगिन करें" },
};

/** Translate a key. Falls back to English. */
export function t(key: string, lang: Lang): string {
  const entry = DICT[key];
  if (!entry) return key;
  return entry[lang] ?? entry.en;
}

/** React hook returning a bound translator. */
export function useT() {
  const lang = useLang();
  return { lang, t: (k: string) => t(k, lang) };
}
