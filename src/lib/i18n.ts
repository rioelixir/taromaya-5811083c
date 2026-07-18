// Client-side i18n. English + Hindi (Devanagari) + Roman Hindi (Hinglish).
import { useSyncExternalStore } from "react";

export const LANGUAGES = ["en", "hi", "hr"] as const;
export type Lang = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Lang, string> = {
  en: "English",
  hi: "हिंदी",
  hr: "Hinglish",
};

const STORAGE_KEY = "taromaya.lang";

function readLang(): Lang {
  if (typeof window === "undefined") return "en";
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === "hi" || v === "hr" || v === "en") return v;
  return "en";
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

type Entry = { en: string; hi: string; hr: string };

/** Dictionary keyed by the English string itself for painless in-place use. */
const DICT: Record<string, Entry> = {
  // Nav groups
  "Home":            { en: "Home",            hi: "मुख्य",         hr: "Home" },
  "Horoscopes":      { en: "Horoscopes",      hi: "राशिफल",       hr: "Rashifal" },
  "Vedic":           { en: "Vedic",           hi: "वैदिक",         hr: "Vedic" },
  "Divination":      { en: "Divination",      hi: "दिव्य ज्ञान",    hr: "Divya Gyaan" },
  "Advanced":        { en: "Advanced",        hi: "उन्नत",         hr: "Advanced" },
  "Library":         { en: "Library",         hi: "पुस्तकालय",     hr: "Library" },
  "Account":         { en: "Account",         hi: "खाता",          hr: "Account" },
  "Admin":           { en: "Admin",           hi: "एडमिन",         hr: "Admin" },

  // Nav items
  "Dashboard":       { en: "Dashboard",       hi: "डैशबोर्ड",       hr: "Dashboard" },
  "AI Guide":        { en: "AI Guide",        hi: "एआई मार्गदर्शक", hr: "AI Guide" },
  "Horoscope":       { en: "Horoscope",       hi: "राशिफल",       hr: "Rashifal" },
  "Kundli":          { en: "Kundli",          hi: "कुंडली",        hr: "Kundli" },
  "Astrology":       { en: "Astrology",       hi: "ज्योतिष",       hr: "Jyotish" },
  "Panchang":        { en: "Panchang",        hi: "पंचांग",        hr: "Panchang" },
  "Muhurat":         { en: "Muhurat",         hi: "मुहूर्त",        hr: "Muhurat" },
  "Remedies":        { en: "Remedies",        hi: "उपाय",          hr: "Upay" },
  "Matching":        { en: "Matching",        hi: "गुण मिलान",     hr: "Guna Milan" },
  "Varshphal":       { en: "Varshphal",       hi: "वर्षफल",        hr: "Varshphal" },
  "Prashna":         { en: "Prashna",         hi: "प्रश्न",         hr: "Prashna" },
  "Ayurveda":        { en: "Ayurveda",        hi: "आयुर्वेद",       hr: "Ayurveda" },
  "Chakra":          { en: "Chakra",          hi: "चक्र",           hr: "Chakra" },
  "Tarot":           { en: "Tarot",           hi: "टैरो",          hr: "Tarot" },
  "Numerology":      { en: "Numerology",      hi: "अंक ज्योतिष",    hr: "Ank Jyotish" },
  "Baby Names":      { en: "Baby Names",      hi: "शिशु नाम",      hr: "Shishu Naam" },
  "Festivals":       { en: "Festivals",       hi: "त्यौहार",        hr: "Tyohaar" },
  "Transits":        { en: "Transits",        hi: "गोचर",          hr: "Gochar" },
  "Vedic Transits":  { en: "Vedic Transits",  hi: "वैदिक गोचर",     hr: "Vedic Gochar" },
  "Progressions":    { en: "Progressions",    hi: "प्रगति",         hr: "Progressions" },
  "Synastry":        { en: "Synastry",        hi: "सिनास्ट्री",     hr: "Synastry" },
  "Natal Chart":     { en: "Natal Chart",     hi: "जन्म कुंडली",    hr: "Natal Chart" },
  "Timeline":        { en: "Timeline",        hi: "समय रेखा",      hr: "Timeline" },
  "Rectification":   { en: "Rectification",   hi: "समय सुधार",     hr: "Rectification" },
  "Astrocartography":{ en: "Astrocartography",hi: "ज्योतिष मानचित्र",hr: "Astrocartography" },
  "Observatory":     { en: "Observatory",     hi: "वेधशाला",       hr: "Observatory" },
  "Cosmic Weather":  { en: "Cosmic Weather",  hi: "ब्रह्मांडीय मौसम",hr: "Cosmic Weather" },
  "Dream Oracle":    { en: "Dream Oracle",    hi: "स्वप्न ओरेकल",   hr: "Sapna Oracle" },
  "Moon Calendar":   { en: "Moon Calendar",   hi: "चंद्र कैलेंडर",   hr: "Chandra Calendar" },
  "Nakshatra":       { en: "Nakshatra",       hi: "नक्षत्र",        hr: "Nakshatra" },
  "Reports":         { en: "Reports",         hi: "रिपोर्ट",        hr: "Reports" },
  "Saved Charts":    { en: "Saved Charts",    hi: "सहेजी कुंडलियाँ", hr: "Saved Charts" },
  "History":         { en: "History",         hi: "इतिहास",        hr: "History" },
  "Bookmarks":       { en: "Bookmarks",       hi: "बुकमार्क",       hr: "Bookmarks" },
  "Journal":         { en: "Journal",         hi: "डायरी",         hr: "Journal" },
  "Learn":           { en: "Learn",           hi: "सीखें",          hr: "Learn" },
  "Premium":         { en: "Premium",         hi: "प्रीमियम",       hr: "Premium" },
  "Profile":         { en: "Profile",         hi: "प्रोफ़ाइल",       hr: "Profile" },
  "Settings":        { en: "Settings",        hi: "सेटिंग्स",       hr: "Settings" },
  "Control Room":    { en: "Control Room",    hi: "नियंत्रण कक्ष",   hr: "Control Room" },
  "Sign in":         { en: "Sign in",         hi: "लॉगिन",         hr: "Sign in" },
  "Sign out":        { en: "Sign out",        hi: "लॉगआउट",        hr: "Sign out" },
  "Language":        { en: "Language",        hi: "भाषा",          hr: "Bhasha" },

  // Legacy form keys retained
  "kundli.title":            { en: "Kundli",                   hi: "कुंडली",              hr: "Kundli" },
  "kundli.subtitle":         { en: "Vedic birth chart",        hi: "जन्म कुंडली",         hr: "Janam Kundli" },
  "form.name":               { en: "Name",                     hi: "नाम",                hr: "Naam" },
  "form.date":               { en: "Birth date",               hi: "जन्म तिथि",          hr: "Janam Tithi" },
  "form.time":               { en: "Birth time",               hi: "जन्म समय",          hr: "Janam Samay" },
  "form.seconds":            { en: "Seconds",                  hi: "सेकंड",              hr: "Seconds" },
  "form.unknown_time":       { en: "Time unknown (uses solar/noon chart)", hi: "समय ज्ञात नहीं (सूर्य/दोपहर कुंडली)", hr: "Samay pata nahi (Surya/Dopahar chart)" },
  "form.place":              { en: "Birthplace",               hi: "जन्म स्थान",         hr: "Janam Sthan" },
  "form.lat":                { en: "Latitude",                 hi: "अक्षांश",            hr: "Latitude" },
  "form.lon":                { en: "Longitude",                hi: "देशांतर",             hr: "Longitude" },
  "form.tz":                 { en: "Time zone (hrs from UTC)", hi: "समय क्षेत्र (UTC से घंटे)", hr: "Time zone (UTC se ghante)" },
  "form.elevation":          { en: "Elevation (m)",            hi: "ऊँचाई (मी)",         hr: "Elevation (m)" },
  "form.ayanamsa":           { en: "Ayanamsa",                 hi: "अयनांश",             hr: "Ayanamsa" },
  "form.house_system":       { en: "House system",             hi: "भाव पद्धति",         hr: "Bhav Paddhati" },
  "form.node_type":          { en: "Rahu/Ketu node",           hi: "राहु/केतु",          hr: "Rahu/Ketu" },
  "form.calculate":          { en: "Calculate chart",          hi: "कुंडली बनाएँ",       hr: "Kundli banao" },
  "form.save":               { en: "Save chart",               hi: "कुंडली सहेजें",       hr: "Kundli save karo" },
  "form.calculating":        { en: "Calculating…",             hi: "गणना हो रही है…",    hr: "Calculate ho raha hai…" },
  "form.geocode_confirm":    { en: "Confirm location",         hi: "स्थान की पुष्टि करें", hr: "Location confirm karo" },
  "chart.ascendant":         { en: "Ascendant (Lagna)",        hi: "लग्न",               hr: "Lagna" },
  "chart.moon_sign":         { en: "Moon sign (Rashi)",        hi: "चंद्र राशि",          hr: "Chandra Rashi" },
  "chart.nakshatra":         { en: "Nakshatra",                hi: "नक्षत्र",            hr: "Nakshatra" },
  "common.saved":            { en: "Saved",                    hi: "सहेज लिया गया",      hr: "Save ho gaya" },
  "common.error":            { en: "Something went wrong",     hi: "कुछ गलत हो गया",     hr: "Kuch galat ho gaya" },
  "common.sign_in_required": { en: "Sign in to save",          hi: "सहेजने के लिए लॉगिन करें", hr: "Save karne ke liye sign in karo" },
};

/** Translate a key (or English string). Falls back to the key itself. */
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
