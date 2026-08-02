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

/** Server-side memo so repeat strings never hit the network twice. */
const memo = new Map<string, string>();
const MEMO_MAX = 5000;
function memoGet(key: string) {
  return memo.get(key);
}
function memoSet(key: string, value: string) {
  if (memo.size > MEMO_MAX) memo.clear();
  memo.set(key, value);
}

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

/** Split a long paragraph on sentence boundaries so no request is too long. */
function chunkText(text: string, max = 600): string[] {
  if (text.length <= max) return [text];
  const parts: string[] = [];
  let cur = "";
  for (const piece of text.split(/(?<=[.!?।;])\s+/)) {
    if ((cur + " " + piece).trim().length > max && cur) {
      parts.push(cur.trim());
      cur = piece;
    } else {
      cur = cur ? `${cur} ${piece}` : piece;
    }
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

/** Translate any length of text, retrying once before giving up. */
async function translate(
  lang: string,
  text: string,
  wantRoman = false,
): Promise<{ text: string; roman: string | null } | null> {
  const chunks = chunkText(text);
  const outs = await Promise.all(
    chunks.map(async (c) => (await gtx(lang, c, wantRoman)) ?? (await gtx(lang, c, wantRoman))),
  );
  if (outs.some((o) => o == null)) return null;
  const joined = outs.map((o) => o!.text.trim()).join(" ");
  const roman = outs.every((o) => o!.roman) ? outs.map((o) => o!.roman!.trim()).join(" ") : null;
  return { text: joined, roman };
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
          ? body.strings.filter((s) => typeof s === "string" && s.length <= 2000).slice(0, 60)
          : [];


        const known = LANGUAGE_LIST.some((l) => l.code === lang);
        if (!lang || !known || lang === "en" || strings.length === 0) {
          return new Response(JSON.stringify({ translations: strings }), { headers: json() });
        }

        // Hinglish goes through Hindi, everything else translates directly.
        const hinglish = lang === "hr";
        const target = hinglish ? "hi" : lang;

        // Translate each distinct string once, even if it repeats in the batch.
        const unique = Array.from(new Set(strings));
        const resolved = new Map<string, string>();
        await Promise.all(
          unique.map(async (s) => {
            const key = `${lang}\u0000${s}`;
            const cached = memoGet(key);
            if (cached != null) {
              resolved.set(s, cached);
              return;
            }
            const hit = await translate(target, s, hinglish);
            if (!hit) {
              resolved.set(s, s);
              return;
            }
            // Prefer Google's own romanization; fall back to transliteration.
            const out = hinglish ? (hit.roman ?? toLatin(hit.text)) : hit.text;
            memoSet(key, out);
            resolved.set(s, out);

          }),
        );
        const results = strings.map((s) => resolved.get(s) ?? s);



        return new Response(JSON.stringify({ translations: results }), { headers: json() });
      },
    },
  },
});
