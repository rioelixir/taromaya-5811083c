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
async function gtx(lang: string, text: string): Promise<string | null> {
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=" +
    encodeURIComponent(GOOGLE_CODE[lang] ?? lang) +
    "&dt=t&q=" +
    encodeURIComponent(text);

  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return null;
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null;
    const out = (data[0] as unknown[])
      .map((seg) => (Array.isArray(seg) && typeof seg[0] === "string" ? seg[0] : ""))
      .join("");
    return out.trim() ? out : null;
  } catch {
    return null;
  }
}

/**
 * Hinglish (Hindi words in Latin letters) is produced by translating to Hindi
 * and then transliterating the Devanagari back into Latin letters.
 */
const DEVA_MAP: Array<[RegExp, string]> = [
  [/क्ष/g, "ksh"], [/ज्ञ/g, "gy"], [/श्र/g, "shr"],
  [/ा/g, "a"], [/ि/g, "i"], [/ी/g, "ee"], [/ु/g, "u"], [/ू/g, "oo"],
  [/े/g, "e"], [/ै/g, "ai"], [/ो/g, "o"], [/ौ/g, "au"], [/ृ/g, "ri"],
  [/ं/g, "n"], [/ँ/g, "n"], [/ः/g, "h"], [/्/g, ""],
  [/अ/g, "a"], [/आ/g, "aa"], [/इ/g, "i"], [/ई/g, "ee"], [/उ/g, "u"], [/ऊ/g, "oo"],
  [/ए/g, "e"], [/ऐ/g, "ai"], [/ओ/g, "o"], [/औ/g, "au"], [/ऋ/g, "ri"],
  [/क/g, "ka"], [/ख/g, "kha"], [/ग/g, "ga"], [/घ/g, "gha"], [/ङ/g, "na"],
  [/च/g, "cha"], [/छ/g, "chha"], [/ज/g, "ja"], [/झ/g, "jha"], [/ञ/g, "na"],
  [/ट/g, "ta"], [/ठ/g, "tha"], [/ड/g, "da"], [/ढ/g, "dha"], [/ण/g, "na"],
  [/त/g, "ta"], [/थ/g, "tha"], [/द/g, "da"], [/ध/g, "dha"], [/न/g, "na"],
  [/प/g, "pa"], [/फ/g, "pha"], [/ब/g, "ba"], [/भ/g, "bha"], [/म/g, "ma"],
  [/य/g, "ya"], [/र/g, "ra"], [/ल/g, "la"], [/व/g, "va"],
  [/श/g, "sha"], [/ष/g, "sha"], [/स/g, "sa"], [/ह/g, "ha"],
  [/ळ/g, "la"], [/ऱ/g, "ra"], [/़/g, ""], [/।/g, "."],
];

function toLatin(hindi: string): string {
  let s = hindi;
  for (const [re, rep] of DEVA_MAP) s = s.replace(re, rep);
  // "kaa" style clean-up so words read naturally
  s = s.replace(/aa+/g, "aa").replace(/a([aeiou])/g, "$1");
  return s.replace(/\s+/g, " ").trim();
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
        const target = lang === "hr" ? "hi" : lang;

        const results = await Promise.all(
          strings.map(async (s) => {
            const hit = await gtx(target, s);
            if (!hit) return s;
            return lang === "hr" ? toLatin(hit) : hit;
          }),
        );

        return new Response(JSON.stringify({ translations: results }), { headers: json() });
      },
    },
  },
});
