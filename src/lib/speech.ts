/**
 * Voice input helpers — plain, simple and shared by every microphone in the app.
 * No technical jargon reaches the user: everything here just cleans up
 * spoken words into text that looks the way a person would type it.
 */

export type VoiceLang = {
  code: string; // BCP-47 code handed to the speech engine
  label: string; // what the user sees
};

/** Languages offered in the microphone menu. Add more by appending here. */
export const VOICE_LANGUAGES: VoiceLang[] = [
  { code: "auto", label: "Detect automatically" },
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "Hindi" },
  { code: "en-IN|hi", label: "Hinglish" },
  { code: "mr-IN", label: "Marathi" },
  { code: "gu-IN", label: "Gujarati" },
  { code: "pa-IN", label: "Punjabi" },
  { code: "bn-IN", label: "Bengali" },
  { code: "ta-IN", label: "Tamil" },
  { code: "te-IN", label: "Telugu" },
  { code: "kn-IN", label: "Kannada" },
  { code: "ml-IN", label: "Malayalam" },
  { code: "or-IN", label: "Odia" },
  { code: "as-IN", label: "Assamese" },
  { code: "ur-PK", label: "Urdu" },
  { code: "ne-NP", label: "Nepali" },
  { code: "si-LK", label: "Sinhala" },
  { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" },
  { code: "es-ES", label: "Spanish" },
  { code: "it-IT", label: "Italian" },
  { code: "pt-BR", label: "Portuguese" },
  { code: "nl-NL", label: "Dutch" },
  { code: "ru-RU", label: "Russian" },
  { code: "pl-PL", label: "Polish" },
  { code: "uk-UA", label: "Ukrainian" },
  { code: "ar-SA", label: "Arabic" },
  { code: "fa-IR", label: "Persian" },
  { code: "he-IL", label: "Hebrew" },
  { code: "tr-TR", label: "Turkish" },
  { code: "zh-CN", label: "Chinese" },
  { code: "ja-JP", label: "Japanese" },
  { code: "ko-KR", label: "Korean" },
  { code: "th-TH", label: "Thai" },
  { code: "id-ID", label: "Indonesian" },
  { code: "ms-MY", label: "Malay" },
  { code: "vi-VN", label: "Vietnamese" },
  { code: "sw-KE", label: "Swahili" },
];


const VOICE_LANG_KEY = "taromaya:voice-lang";

export function getVoiceLang(): string {
  if (typeof window === "undefined") return "auto";
  return window.localStorage.getItem(VOICE_LANG_KEY) || "auto";
}

export function setVoiceLang(code: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(VOICE_LANG_KEY, code);
  window.dispatchEvent(new CustomEvent("taromaya:voice-lang", { detail: code }));
}

/** The code the browser engine understands (Hinglish/auto fall back to English-India). */
export function engineLang(code: string): string {
  if (!code || code === "auto") return "en-IN";
  return code.split("|")[0];
}

/** Two-letter hint for the server transcriber, or undefined to auto-detect. */
export function serverLangHint(code: string): string | undefined {
  if (!code || code === "auto" || code.includes("|")) return undefined;
  return code.slice(0, 2);
}

/* ------------------------------------------------------------------ */
/* Cleaning spoken words into typed-looking text                       */
/* ------------------------------------------------------------------ */

const SMALL_NUMBERS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90,
};

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

const PROPER_WORDS = [
  "delhi", "new delhi", "mumbai", "bengaluru", "bangalore", "chennai", "kolkata",
  "hyderabad", "pune", "jaipur", "lucknow", "ahmedabad", "surat", "indore",
  "nagpur", "kochi", "goa", "chandigarh", "amritsar", "varanasi", "patna",
  "bhopal", "new york", "london", "sydney", "tokyo", "dubai", "singapore",
  "paris", "berlin", "toronto", "chicago", "los angeles", "san francisco",
  "ashwini", "bharani", "krittika", "rohini", "mrigashira", "ardra", "punarvasu",
  "pushya", "ashlesha", "magha", "purva phalguni", "uttara phalguni", "hasta",
  "chitra", "swati", "vishakha", "anuradha", "jyeshtha", "mula", "purva ashadha",
  "uttara ashadha", "shravana", "dhanishta", "shatabhisha", "purva bhadrapada",
  "uttara bhadrapada", "revati",
  "aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio",
  "sagittarius", "capricorn", "aquarius", "pisces",
  "mesha", "vrishabha", "mithuna", "karka", "simha", "kanya", "tula", "vrishchika",
  "dhanu", "makara", "kumbha", "meena",
  "sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu",
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
  ...MONTHS,
];

function titleCase(s: string) {
  return s.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

/** Turn spoken number words into digits ("twenty three" -> "23"). */
function digitsFromWords(text: string): string {
  const hundreds = text
    .replace(/\btwo thousand and (\w+)\b/gi, (_m, r) => `2000 ${r}`)
    .replace(/\btwo thousand\b/gi, "2000")
    .replace(/\bnineteen (\w+) (\w+)\b/gi, (m, a: string, b: string) => {
      const t = SMALL_NUMBERS[a.toLowerCase()];
      const o = SMALL_NUMBERS[b.toLowerCase()];
      if (t !== undefined && t >= 20 && t % 10 === 0 && o !== undefined && o < 10) {
        return String(1900 + t + o);
      }
      return m;
    });

  return hundreds.replace(
    /\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:[ -](one|two|three|four|five|six|seven|eight|nine))?\b|\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)\b/gi,
    (match) => {
      const parts = match.toLowerCase().split(/[ -]/);
      let total = 0;
      for (const p of parts) {
        const v = SMALL_NUMBERS[p];
        if (v === undefined) return match;
        total += v;
      }
      return String(total);
    },
  );
}

/** "5 30 pm" / "five thirty pm" -> "5:30 PM" */
function tidyTimes(text: string): string {
  return text
    .replace(/\b(\d{1,2})[ :](\d{2})\s*(a\.?m\.?|p\.?m\.?)\b/gi,
      (_m, h, min, ap: string) => `${Number(h)}:${min} ${ap.replace(/\./g, "").toUpperCase()}`)
    .replace(/\b(\d{1,2})\s*o'?\s?clock\b/gi, (_m, h) => `${Number(h)}:00`)
    .replace(/\b(\d{1,2})\s*(a\.?m\.?|p\.?m\.?)\b/gi,
      (_m, h, ap: string) => `${Number(h)}:00 ${ap.replace(/\./g, "").toUpperCase()}`);
}

/** Capitalise cities, stars, signs, planets, weekdays and months. */
function tidyProperNames(text: string): string {
  let out = text;
  for (const w of PROPER_WORDS) {
    const re = new RegExp(`\\b${w.replace(/ /g, "\\s+")}\\b`, "gi");
    out = out.replace(re, () => titleCase(w));
  }
  return out;
}

/** Spoken punctuation words plus a friendly guess at the ending mark. */
function tidyPunctuation(text: string): string {
  let out = text
    .replace(/\s*\b(full stop|period)\b\s*/gi, ". ")
    .replace(/\s*\bcomma\b\s*/gi, ", ")
    .replace(/\s*\bquestion mark\b\s*/gi, "? ")
    .replace(/\s*\bexclamation (mark|point)\b\s*/gi, "! ")
    .replace(/\s*\bnew line\b\s*/gi, "\n")
    .replace(/\s+([,.?!])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  if (!out) return out;
  if (!/[.?!]$/.test(out)) {
    const asks = /^(what|why|when|where|who|which|how|should|can|could|will|would|is|are|am|do|does|did|may|shall)\b/i.test(out);
    out += asks ? "?" : ".";
  }
  return out.charAt(0).toUpperCase() + out.slice(1);
}

/**
 * Listeners often hear the same words twice or thrice in a row
 * ("Delhi Delhi Delhi", "my name is my name is Ria"). Keep only the first one.
 */
export function dedupeRepeats(text: string): string {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const key = (w: string) => w.toLowerCase().replace(/[.,!?;:]+$/, "");
  for (let size = 4; size >= 1; size--) {
    let i = 0;
    while (i + size * 2 <= words.length) {
      const same = () => {
        for (let k = 0; k < size; k++) {
          if (key(words[i + k]) !== key(words[i + size + k])) return false;
        }
        return true;
      };
      if (same()) words.splice(i + size, size);
      else i++;
    }
  }
  return words.join(" ");
}


/** Full clean-up used for finished speech. */
export function cleanSpeech(raw: string, opts: { punctuate?: boolean } = {}): string {
  if (!raw) return "";
  let out = raw.replace(/\s+/g, " ").trim();
  out = dedupeRepeats(out);
  out = digitsFromWords(out);
  out = tidyTimes(out);
  out = tidyProperNames(out);
  out = opts.punctuate === false ? out.trim() : tidyPunctuation(out);
  return out;
}

/** "14 February 2000" / "february 14 2000" -> "2000-02-14" for date fields. */
export function parseSpokenDate(text: string): string | null {
  const t = cleanSpeech(text, { punctuate: false }).toLowerCase().replace(/[,.]/g, "");
  const monthIdx = MONTHS.findIndex((m) => t.includes(m));
  const nums = t.match(/\d{1,4}/g)?.map(Number) ?? [];
  if (monthIdx >= 0) {
    const day = nums.find((n) => n >= 1 && n <= 31);
    const year = nums.find((n) => n >= 1000);
    if (day && year) {
      return `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }
  const iso = t.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const dmy = t.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  return null;
}

/** "five thirty pm" -> "17:30" for time fields. */
export function parseSpokenTime(text: string): string | null {
  const t = tidyTimes(digitsFromWords(text.toLowerCase()));
  const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const ap = m[3]?.toUpperCase();
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}
