// Client-side i18n. English base + AI-powered translation for every language.
import { useEffect, useState, useSyncExternalStore } from "react";

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
export const RTL_LANGS: readonly Lang[] = ["ar", "ur", "fa", "he", "sd"];

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
  if (prev === next) return;
  window.localStorage.setItem(STORAGE_KEY, next);
  listeners.forEach((l) => l());
  // No reload: the translator restores English text and re-translates in place.
  window.dispatchEvent(new CustomEvent("taromaya:lang", { detail: next }));
}


export function useLang(): Lang {
  const stored = useSyncExternalStore(subscribe, readLang, (): Lang => "en");
  // Render English on the very first paint so the server and browser agree,
  // then switch to the chosen language.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated ? stored : "en";
}


type Entry = { en: string } & Partial<Record<Lang, string>>;

/**
 * Reviewed translations for the app's core professional terminology.
 * Keys are the English string itself. Languages without a reviewed entry fall
 * back to English here and are translated live by the AI translator.
 */
const CORE_TERMS: Record<string, Entry> = {
  "Overview":              { en: "Overview", hi: "अवलोकन", hr: "Overview", bn: "সংক্ষিপ্ত বিবরণ", mr: "आढावा", gu: "ઝલક", ta: "மேலோட்டம்", te: "సమగ్ర వివరణ" },
  "Vedic astrology":       { en: "Vedic astrology", hi: "वैदिक ज्योतिष", hr: "Vedic Jyotish", bn: "বৈদিক জ্যোতিষ", mr: "वैदिक ज्योतिष", gu: "વૈદિક જ્યોતિષ", ta: "வேத ஜோதிடம்", te: "వైదిక జ్యోతిష్యం" },
  "Doshas and remedies":   { en: "Doshas and remedies", hi: "दोष और उपाय", hr: "Dosh aur upay", bn: "দোষ ও প্রতিকার", mr: "दोष आणि उपाय", gu: "દોષ અને ઉપાય", ta: "தோஷங்கள் மற்றும் பரிகாரங்கள்", te: "దోషాలు మరియు పరిహారాలు" },
  "Life and relationships":{ en: "Life and relationships", hi: "जीवन और संबंध", hr: "Jeevan aur rishte", bn: "জীবন ও সম্পর্ক", mr: "जीवन आणि नातेसंबंध", gu: "જીવન અને સંબંધો", ta: "வாழ்க்கை மற்றும் உறவுகள்", te: "జీవితం మరియు సంబంధాలు" },
  "Transits and forecasts":{ en: "Transits and forecasts", hi: "गोचर और भविष्यवाणी", hr: "Gochar aur forecast", bn: "গোচর ও পূর্বাভাস", mr: "गोचर आणि अंदाज", gu: "ગોચર અને આગાહી", ta: "கோச்சாரம் மற்றும் முன்னறிவிப்பு", te: "గోచారం మరియు అంచనాలు" },
  "Janma Kundli":          { en: "Janma Kundli", hi: "जन्म कुंडली", hr: "Janma Kundli", bn: "জন্ম কুণ্ডলী", mr: "जन्म कुंडली", gu: "જન્મ કુંડળી", ta: "ஜாதகம்", te: "జన్మ కుండలి" },
  "Tarot consultation":    { en: "Tarot consultation", hi: "टैरो परामर्श", hr: "Tarot consultation", bn: "টैরো পরামর্শ", mr: "टॅरो सल्ला", gu: "ટેરો પરામર્શ", ta: "டாரோ ஆலோசனை", te: "టారో సలహా" },
  "Chart analysis":        { en: "Chart analysis", hi: "कुंडली विश्लेषण", hr: "Kundli analysis", bn: "কুণ্ডলী বিশ্লেষণ", mr: "कुंडली विश्लेषण", gu: "કુંડળી વિશ્લેષણ", ta: "ஜாதக பரிசீலனை", te: "కుండలి విశ్లేషణ" },
  "Planetary strength":    { en: "Planetary strength", hi: "ग्रह बल", hr: "Grah bal", bn: "গ্রহবল", mr: "ग्रहबल", gu: "ગ્રહબળ", ta: "கிரக பலம்", te: "గ్రహ బలం" },
  "Annual forecast":       { en: "Annual forecast", hi: "वर्षफल", hr: "Varshphal", bn: "বর্ষফল", mr: "वर्षफल", gu: "વર્ષફળ", ta: "வருட பலன்", te: "వర్షఫలం" },
  "Advanced Jyotish":      { en: "Advanced Jyotish", hi: "उन्नत ज्योतिष", hr: "Advanced Jyotish", bn: "উচ্চতর জ্যোতিষ", mr: "प्रगत ज्योतिष", gu: "પ્રગત જ્યોતિષ", ta: "மேம்பட்ட ஜோதிடம்", te: "అధునాతన జ్యోతిష్యం" },
  "Birth nakshatra":       { en: "Birth nakshatra", hi: "जन्म नक्षत्र", hr: "Janma Nakshatra", bn: "জন্ম নক্ষত্র", mr: "जन्म नक्षत्र", gu: "જન્મ નક્ષત્ર", ta: "பிறப்பு நட்சத்திரம்", te: "జన్మ నక్షత్రం" },
  "Remedies":              { en: "Remedies", hi: "उपाय", hr: "Upay", bn: "প্রতিকার", mr: "उपाय", gu: "ઉપાય", ta: "பரிகாரம்", te: "పరిహారాలు" },
  "Numerology":            { en: "Numerology", hi: "अंक ज्योतिष", hr: "Ank Jyotish", bn: "সংখ্যাতত্ত্ব", mr: "अंकशास्त्र", gu: "અંકશાસ્ત્ર", ta: "எண் கணிதம்", te: "సంఖ్యా శాస్త్రం" },
  "Kundli matching":       { en: "Kundli matching", hi: "कुंडली मिलान", hr: "Kundli milan", bn: "কুণ্ডলী মিলন", mr: "कुंडली जुळणी", gu: "કુંડળી મેળાપ", ta: "ஜாதகப் பொருத்தம்", te: "కుండలి మ్యాచింగ్" },
  "Career and education":  { en: "Career and education", hi: "करियर और शिक्षा", hr: "Career aur shiksha", bn: "কর্মজীবন ও শিক্ষা", mr: "करिअर आणि शिक्षण", gu: "કારકિર્દી અને શિક્ષણ", ta: "பணி மற்றும் கல்வி", te: "వృత్తి మరియు విద్య" },
  "Finances":              { en: "Finances", hi: "वित्त", hr: "Paisa aur finance", bn: "আর্থিক বিষয়", mr: "आर्थिक बाबी", gu: "નાણાકીય બાબતો", ta: "நிதி", te: "ఆర్థిక విషయాలు" },
  "Health":                { en: "Health", hi: "स्वास्थ्य", hr: "Swasthya", bn: "স্বাস্থ্য", mr: "आरोग्य", gu: "આરોગ્ય", ta: "உடல்நலம்", te: "ఆరోగ్యం" },
  "Current transits":      { en: "Current transits", hi: "वर्तमान गोचर", hr: "Current gochar", bn: "বর্তমান গোচর", mr: "चालू गोचर", gu: "ચાલુ ગોચર", ta: "தற்போதைய கோச்சாரம்", te: "ప్రస్తుత గోచారం" },
  "Forecast timeline":     { en: "Forecast timeline", hi: "भविष्य समय-रेखा", hr: "Forecast timeline", bn: "পূর্বাভাস সময়রেখা", mr: "अंदाज कालरेषा", gu: "આગાહી સમયરેખા", ta: "முன்னறிவிப்பு காலவரிசை", te: "అంచనా కాలరేఖ" },
  "Reading history":       { en: "Reading history", hi: "पिछले पाठ", hr: "Purani readings", bn: "পূর্বের পাঠ", mr: "मागील वाचने", gu: "અગાઉના પાઠ", ta: "முந்தைய வாசிப்புகள்", te: "గత రీడింగ్‌లు" },
  "Saved charts":          { en: "Saved charts", hi: "सहेजी कुंडलियाँ", hr: "Saved kundlis", bn: "সংরক্ষিত কুণ্ডলী", mr: "जतन केलेल्या कुंडल्या", gu: "સાચવેલી કુંડળીઓ", ta: "சேமித்த ஜாதகங்கள்", te: "సేవ్ చేసిన కుండలిలు" },
  "Profile":               { en: "Profile", hi: "प्रोफ़ाइल", hr: "Profile", bn: "প্রোফাইল", mr: "प्रोफाइल", gu: "પ્રોફાઇલ", ta: "சுயவிவரம்", te: "ప్రొఫైల్" },
  "Birth details":         { en: "Birth details", hi: "जन्म विवरण", hr: "Janm details", bn: "জন্ম বিবরণ", mr: "जन्म तपशील", gu: "જન્મ વિગતો", ta: "பிறப்பு விவரங்கள்", te: "జన్మ వివరాలు" },
  "Generate":              { en: "Generate", hi: "तैयार करें", hr: "Generate karo", bn: "তৈরি করুন", mr: "तयार करा", gu: "તૈયાર કરો", ta: "உருவாக்கு", te: "సృష్టించు" },
  "Summary":               { en: "Summary", hi: "सारांश", hr: "Summary", bn: "সারসংক্ষেপ", mr: "सारांश", gu: "સારાંશ", ta: "சுருக்கம்", te: "సారాంశం" },
  "Detailed analysis":     { en: "Detailed analysis", hi: "विस्तृत विश्लेषण", hr: "Detailed analysis", bn: "বিস্তারিত বিশ্লেষণ", mr: "सविस्तर विश्लेषण", gu: "વિગતવાર વિશ્લેષણ", ta: "விரிவான பரிசீலனை", te: "వివరణాత్మక విశ్లేషణ" },
  "Opportunities":         { en: "Opportunities", hi: "अवसर", hr: "Mauke", bn: "সুযোগ", mr: "संधी", gu: "તકો", ta: "வாய்ப்புகள்", te: "అవకాశాలు" },
  "Challenges to manage":  { en: "Challenges to manage", hi: "संभालने योग्य चुनौतियाँ", hr: "Challenges", bn: "সামলানোর চ্যালেঞ্জ", mr: "हाताळायच्या अडचणी", gu: "સંભાળવાના પડકારો", ta: "கவனிக்க வேண்டிய சவால்கள்", te: "నిర్వహించాల్సిన సవాళ్లు" },
  "Timing":                { en: "Timing", hi: "समय", hr: "Timing", bn: "সময়", mr: "वेळ", gu: "સમય", ta: "நேரம்", te: "సమయం" },
  "Recommended next steps":{ en: "Recommended next steps", hi: "अगले सुझाए कदम", hr: "Agle steps", bn: "পরবর্তী প্রস্তাবিত পদক্ষেপ", mr: "पुढील शिफारस केलेली पावले", gu: "આગળના સૂચિત પગલાં", ta: "அடுத்த பரிந்துரைகள்", te: "తదుపరి సూచించిన చర్యలు" },
};

/** Dictionary keyed by the English string itself for painless in-place use. */
const DICT: Record<string, Entry> = {
  ...CORE_TERMS,

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
  "Natal Chart":     { en: "Natal Chart",     hi: "जन्म कुंडली",    hr: "Natal Chart" },
  "Timeline":        { en: "Timeline",        hi: "समय रेखा",      hr: "Timeline" },
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

/**
 * Reviewed English -> target-language strings, used to seed the live
 * translator so hand-checked wording always wins over machine output.
 */
export function reviewedTerms(lang: Lang): Record<string, string> {
  const out: Record<string, string> = {};
  if (lang === "en") return out;
  for (const entry of Object.values(DICT)) {
    const value = (entry as Record<string, string | undefined>)[lang];
    if (entry.en && value && value !== entry.en) out[entry.en] = value;
  }
  return out;
}



/** React hook returning a bound translator. */
export function useT() {
  const lang = useLang();
  return { lang, t: (k: string) => t(k, lang) };
}
