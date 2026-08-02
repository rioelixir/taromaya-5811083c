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

/** Hosts that serve the same key-less translate payload. Some block edge servers. */
const GTX_HOSTS = [
  "https://translate.googleapis.com/translate_a/single",
  "https://clients5.google.com/translate_a/single",
  "https://translate.google.com/translate_a/single",
];

/** Google's free (key-less) translate endpoint. No AI credits are used. */
async function gtx(lang: string, text: string, wantRoman = false): Promise<{ text: string; roman: string | null } | null> {
  const query =
    "?client=gtx&sl=en&tl=" +
    encodeURIComponent(GOOGLE_CODE[lang] ?? lang) +
    "&dt=t" +
    (wantRoman ? "&dt=rm" : "") +
    "&q=" +
    encodeURIComponent(text);

  for (const host of GTX_HOSTS) {
    try {
      const res = await fetch(host + query, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          Accept: "*/*",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
      if (!res.ok) continue;
      const data = (await res.json()) as unknown;
      if (!Array.isArray(data) || !Array.isArray(data[0])) continue;
      let out = "";
      let roman = "";
      for (const seg of data[0] as unknown[]) {
        if (!Array.isArray(seg)) continue;
        if (typeof seg[0] === "string") out += seg[0];
        // With dt=rm Google adds segments carrying the romanization of the
        // translated text at index 2 (source romanization sits at index 3).
        else if (typeof seg[2] === "string") roman += seg[2];
      }
      if (!out.trim()) continue;
      return { text: out, roman: roman.trim() ? roman.trim() : null };
    } catch {
      /* try the next host */
    }
  }
  return null;
}

/**
 * Last-resort translator used when every key-less endpoint is unreachable
 * (published edge servers are sometimes blocked). Keeps the app fully
 * translated instead of silently falling back to English.
 */
async function aiTranslate(lang: string, texts: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const key = process.env["LOVABLE_API_KEY"]?.trim();
  if (!key || texts.length === 0) return out;
  const target = LANGUAGE_LIST.find((l) => l.code === lang)?.ai ?? lang;

  const batches: string[][] = [];
  for (let i = 0; i < texts.length; i += 20) batches.push(texts.slice(i, i + 20));

  await Promise.all(
    batches.map(async (batch) => {
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content:
                  `Translate each item of the JSON array from English into ${target}. ` +
                  "Reply with ONLY a JSON array of the same length, same order, translations as plain strings. " +
                  "Keep numbers, names and formatting. No commentary.",
              },
              { role: "user", content: JSON.stringify(batch) },
            ],
          }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const raw = data.choices?.[0]?.message?.content ?? "";
        const match = raw.match(/\[[\s\S]*\]/);
        if (!match) return;
        const arr = JSON.parse(match[0]) as unknown;
        if (!Array.isArray(arr)) return;
        arr.forEach((t, i) => {
          const src = batch[i];
          if (src && typeof t === "string" && t.trim()) out.set(src, t.trim());
        });
      } catch {
        /* leave these strings in English */
      }
    }),
  );
  return out;
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
        const missed: string[] = [];
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
              missed.push(s);
              return;
            }
            // Prefer Google's own romanization; fall back to transliteration.
            const out = hinglish ? (hit.roman ?? toLatin(hit.text)) : hit.text;
            memoSet(key, out);
            resolved.set(s, out);

          }),
        );

        // Anything the key-less endpoints could not reach goes through the AI fallback.
        if (missed.length > 0) {
          const ai = await aiTranslate(lang, missed);
          missed.forEach((s) => {
            const out = ai.get(s);
            if (out) {
              memoSet(`${lang}\u0000${s}`, out);
              resolved.set(s, out);
            } else {
              resolved.set(s, s);
            }
          });
        }
        const results = strings.map((s) => resolved.get(s) ?? s);




        return new Response(JSON.stringify({ translations: results }), { headers: json() });
      },
    },
  },
});
