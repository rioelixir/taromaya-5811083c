// Client-side i18n. English base + AI-powered translation for every language.
import { useSyncExternalStore } from "react";

/** Every language the app can be read in. `en` is the base language. */
export const LANGUAGE_LIST = [
  { code: "en", label: "English", ai: "English" },
  { code: "hi", label: "हिंदी", ai: "Hindi in Devanagari script" },
  { code: "hr", label: "Hinglish", ai: "Roman Hinglish (Hindi words written in Latin script, natural and conversational)" },
  { code: "bn", label: "বাংলা", ai: "Bengali" },
  { code: "mr", label: "मराठी", ai: "Marathi" },
  { code: "te", label: "తెలుగు", ai: "Telugu" },
  { code: "ta", label: "தமிழ்", ai: "Tamil" },
  { code: "gu", label: "ગુજરાતી", ai: "Gujarati" },
  { code: "kn", label: "ಕನ್ನಡ", ai: "Kannada" },
  { code: "ml", label: "മലയാളം", ai: "Malayalam" },
  { code: "pa", label: "ਪੰਜਾਬੀ", ai: "Punjabi in Gurmukhi script" },
  { code: "or", label: "ଓଡ଼ିଆ", ai: "Odia" },
  { code: "as", label: "অসমীয়া", ai: "Assamese" },
  { code: "ur", label: "اردو", ai: "Urdu" },
  { code: "ne", label: "नेपाली", ai: "Nepali" },
  { code: "si", label: "සිංහල", ai: "Sinhala" },
  { code: "sa", label: "संस्कृतम्", ai: "Sanskrit" },
  { code: "kok", label: "कोंकणी", ai: "Konkani" },
  { code: "mai", label: "मैथिली", ai: "Maithili" },
  { code: "sd", label: "سنڌي", ai: "Sindhi" },
  { code: "ks", label: "کٲشُر", ai: "Kashmiri" },
  { code: "mni", label: "ꯃꯤꯇꯩꯂꯣꯟ", ai: "Manipuri (Meitei)" },
  { code: "es", label: "Español", ai: "Spanish" },
  { code: "fr", label: "Français", ai: "French" },
  { code: "de", label: "Deutsch", ai: "German" },
  { code: "pt", label: "Português", ai: "Portuguese" },
  { code: "it", label: "Italiano", ai: "Italian" },
  { code: "ru", label: "Русский", ai: "Russian" },
  { code: "ar", label: "العربية", ai: "Arabic" },
  { code: "tr", label: "Türkçe", ai: "Turkish" },
  { code: "fa", label: "فارسی", ai: "Persian (Farsi)" },
  { code: "zh", label: "中文", ai: "Simplified Chinese" },
  { code: "ja", label: "日本語", ai: "Japanese" },
  { code: "ko", label: "한국어", ai: "Korean" },
  { code: "id", label: "Bahasa Indonesia", ai: "Indonesian" },
  { code: "ms", label: "Bahasa Melayu", ai: "Malay" },
  { code: "th", label: "ไทย", ai: "Thai" },
  { code: "vi", label: "Tiếng Việt", ai: "Vietnamese" },
  { code: "nl", label: "Nederlands", ai: "Dutch" },
  { code: "pl", label: "Polski", ai: "Polish" },
  { code: "sw", label: "Kiswahili", ai: "Swahili" },
  { code: "he", label: "עברית", ai: "Hebrew" },
] as const;

export const LANGUAGES = LANGUAGE_LIST.map((l) => l.code) as unknown as readonly Lang[];
export type Lang = (typeof LANGUAGE_LIST)[number]["code"];

export const LANGUAGE_LABELS = Object.fromEntries(
  LANGUAGE_LIST.map((l) => [l.code, l.label]),
) as Record<Lang, string>;

/** Right-to-left languages, used to flip page direction. */
export const RTL_LANGS: readonly Lang[] = ["ar", "ur", "fa", "he", "sd", "ks"];

const STORAGE_KEY = "taromaya.lang";

function readLang(): Lang {
  if (typeof window === "undefined") return "en";
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v && LANGUAGE_LIST.some((l) => l.code === v)) return v as Lang;
  return "en";
}


const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function setLang(next: Lang) {
  if (typeof window === "undefined") return;
  const prev = readLang();
  window.localStorage.setItem(STORAGE_KEY, next);
  listeners.forEach((l) => l());
  // Full reload guarantees clean base text before re-translating.
  if (prev !== next) window.location.reload();
}

export function useLang(): Lang {
  const stored = useSyncExternalStore(subscribe, readLang, () => "en");
  // Render English on the very first paint so the server and browser agree,
  // then switch to the chosen language.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated ? stored : "en";
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
  "Life Dashboard":  { en: "Life Dashboard",  hi: "जीवन डैशबोर्ड",  hr: "Life Dashboard" },
  "AI Guide":        { en: "AI Guide",        hi: "एआई मार्गदर्शक", hr: "AI Guide" },
  "Career":          { en: "Career",          hi: "करियर",         hr: "Career" },
  "Finance":         { en: "Finance",         hi: "धन",            hr: "Dhan" },
  "Health":          { en: "Health",          hi: "स्वास्थ्य",      hr: "Swasthya" },
  "Mangal Dosha":    { en: "Mangal Dosha",    hi: "मंगल दोष",      hr: "Mangal Dosha" },
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
  "Karma":           { en: "Karma",           hi: "कर्म",           hr: "Karma" },
  "Vastu":           { en: "Vastu",           hi: "वास्तु",         hr: "Vastu" },
  "Sade Sati":       { en: "Sade Sati",       hi: "साढ़ेसाती",       hr: "Sade Sati" },
  "Kaal Sarp":       { en: "Kaal Sarp",       hi: "काल सर्प",       hr: "Kaal Sarp" },
  "Dharma":          { en: "Dharma",          hi: "धर्म",           hr: "Dharma" },
  "Yantra":          { en: "Yantra",          hi: "यंत्र",          hr: "Yantra" },
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

/**
 * Translate a key (or English string). Languages without a hand-written entry
 * fall back to English here and are translated live by the AI translator.
 */
export function t(key: string, lang: Lang): string {
  const entry = DICT[key];
  if (!entry) return key;
  return (entry as Record<string, string | undefined>)[lang] ?? entry.en;
}


/** React hook returning a bound translator. */
export function useT() {
  const lang = useLang();
  return { lang, t: (k: string) => t(k, lang) };
}
