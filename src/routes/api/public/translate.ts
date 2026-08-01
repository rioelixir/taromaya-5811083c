import { createFileRoute } from "@tanstack/react-router";
import { LANGUAGE_LIST } from "@/lib/i18n";

type Body = { lang?: string; strings?: string[] };

/** App language code -> the code Google's translate endpoint expects. */
const GOOGLE_CODE: Record<string, string> = {
  zh: "zh-CN",
  he: "iw",
  mni: "mni-Mtei",
  kok: "gom",
  pa: "pa",
  sa: "sa",
};

/** Google's free (key-less) translate endpoint. No AI credits are used. */
async function gtx(lang: string, text: string, wantRoman = false): Promise<{ text: string; roman: string | null } | null> {
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=" +
    encodeURIComponent(GOOGLE_CODE[lang] ?? lang) +
    "&dt=t" +
    (wantRoman ? "&dt=rm" : "") +
    "&q=" +
    encodeURIComponent(text);

  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return null;
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null;
    let out = "";
    let roman = "";
    for (const seg of data[0] as unknown[]) {
      if (!Array.isArray(seg)) continue;
      if (typeof seg[0] === "string") out += seg[0];
      // With dt=rm Google adds segments carrying the romanization of the
      // translated text at index 2 (source romanization sits at index 3).
      else if (typeof seg[2] === "string") roman += seg[2];
    }
    if (!out.trim()) return null;
    return { text: out, roman: roman.trim() ? roman.trim() : null };
  } catch {
    return null;
  }
}

/**
 * Fallback Devanagari -> Latin transliteration (used only when Google does not
 * return its own romanization). Handles the inherent "a", matras and virama
 * properly instead of blindly replacing letters.
 */
const CONS: Record<string, string> = {
  "क":"k","ख":"kh","ग":"g","घ":"gh","ङ":"n",
  "च":"ch","छ":"chh","ज":"j","झ":"jh","ञ":"n",
  "ट":"t","ठ":"th","ड":"d","ढ":"dh","ण":"n",
  "त":"t","थ":"th","द":"d","ध":"dh","न":"n",
  "प":"p","फ":"ph","ब":"b","भ":"bh","म":"m",
  "य":"y","र":"r","ल":"l","व":"v","ळ":"l","ऱ":"r",
  "श":"sh","ष":"sh","स":"s","ह":"h",
  "क़":"q","ख़":"kh","ग़":"g","ज़":"z","ड़":"r","ढ़":"rh","फ़":"f",
};
const MATRA: Record<string, string> = {
  "ा":"a","ि":"i","ी":"ee","ु":"u","ू":"oo","े":"e","ै":"ai","ो":"o","ौ":"au","ृ":"ri",
};
const VOWEL: Record<string, string> = {
  "अ":"a","आ":"aa","इ":"i","ई":"ee","उ":"u","ऊ":"oo","ए":"e","ऐ":"ai","ओ":"o","औ":"au","ऋ":"ri",
};

function toLatin(src: string): string {
  const s = src.replace(/[़]/g, "");
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (CONS[ch]) {
      out += CONS[ch];
      const next = s[i + 1] ?? "";
      if (next === "्") {
        i++; // no inherent vowel
      } else if (MATRA[next]) {
        out += MATRA[next];
        i++;
      } else if (next === "ं" || next === "ँ" || next === "ः") {
        // inherent a then nasal, handled next loop
        out += "a";
      } else {
        // Drop the inherent "a" at the end of a word for natural Hinglish.
        const isWordEnd = next === "" || /[\s.,!?;:।'"()\-]/.test(next);
        out += isWordEnd ? "" : "a";
      }
      continue;
    }
    if (VOWEL[ch]) { out += VOWEL[ch]; continue; }
    if (MATRA[ch]) { out += MATRA[ch]; continue; }
    if (ch === "ं" || ch === "ँ") { out += "n"; continue; }
    if (ch === "ः") { out += "h"; continue; }
    if (ch === "्") continue;
    if (ch === "।") { out += "."; continue; }
    out += ch;
  }
  return out.replace(/\s+/g, " ").trim();
}


export const Route = createFileRoute("/api/public/translate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const json = (headers: Record<string, string> = {}) => ({
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=86400",
          ...headers,
        });
        let body: Body = {};
        try {
          body = ((await request.json()) as Body) ?? {};
        } catch {
          /* empty body */
        }
        const lang = typeof body.lang === "string" ? body.lang : "";
        const strings = Array.isArray(body.strings)
          ? body.strings.filter((s) => typeof s === "string" && s.length <= 900).slice(0, 60)
          : [];

        const known = LANGUAGE_LIST.some((l) => l.code === lang);
        if (!lang || !known || lang === "en" || strings.length === 0) {
          return new Response(JSON.stringify({ translations: strings }), { headers: json() });
        }

        // Hinglish goes through Hindi, everything else translates directly.
        const hinglish = lang === "hr";
        const target = hinglish ? "hi" : lang;

        const results = await Promise.all(
          strings.map(async (s) => {
            const hit = await gtx(target, s, hinglish);
            if (!hit) return s;
            if (!hinglish) return hit.text;
            // Prefer Google's own romanization; fall back to transliteration.
            return hit.roman ?? toLatin(hit.text);
          }),
        );


        return new Response(JSON.stringify({ translations: results }), { headers: json() });
      },
    },
  },
});
