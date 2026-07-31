// Plain-speech commands so the whole app can be used by voice.
// Everything here is simple word matching — no AI needed, works offline.

export type VoiceCommand =
  | { kind: "navigate"; to: string; label: string }
  | { kind: "back" }
  | { kind: "scroll"; dir: "up" | "down" | "top" | "bottom" }
  | { kind: "click"; label: string }
  | { kind: "menu" }
  | { kind: "search"; text: string }
  | { kind: "help" };

/** Every page a person can ask for, with the words they might say. */
export const VOICE_PAGES: { to: string; label: string; words: string[] }[] = [
  { to: "/", label: "Home", words: ["home", "start", "main page", "front page"] },
  { to: "/tarot", label: "Tarot board", words: ["tarot", "tarot board", "cards", "card board"] },
  { to: "/kundli", label: "Kundli", words: ["kundli", "kundali", "birth chart", "janam kundli", "horoscope chart"] },
  { to: "/ai", label: "AI Guide", words: ["ai", "ai guide", "ask ai", "assistant", "guide"] },
  { to: "/history", label: "History", words: ["history", "past readings"] },
  { to: "/profile", label: "Profile", words: ["profile", "my profile", "account"] },
  { to: "/birth-details", label: "Birth details", words: ["birth details", "my birth details"] },
  { to: "/astrology", label: "Astrology", words: ["astrology", "western astrology"] },
  { to: "/avakhada", label: "Avakhada", words: ["avakhada", "avkahada"] },
  { to: "/strength", label: "Strength", words: ["strength", "shadbala", "ashtakavarga"] },
  { to: "/panchang", label: "Panchang", words: ["panchang", "panchanga", "today's panchang"] },
  { to: "/muhurat", label: "Muhurat", words: ["muhurat", "muhurta", "good time"] },
  { to: "/varshphal", label: "Varshphal", words: ["varshphal", "yearly chart", "annual chart"] },
  { to: "/prashna", label: "Prashna", words: ["prashna", "question chart", "horary"] },
  { to: "/deep-jyotish", label: "Deep Jyotish", words: ["deep jyotish", "jyotish"] },
  { to: "/nakshatra", label: "Nakshatra", words: ["nakshatra", "star", "birth star"] },
  { to: "/nakshatra-location", label: "Nakshatra for location", words: ["nakshatra for location", "place nakshatra", "place star"] },
  { to: "/remedies", label: "Remedies", words: ["remedies", "remedy", "upay"] },
  { to: "/sadesati", label: "Sade Sati", words: ["sade sati", "sadesati", "saturn period"] },
  { to: "/kaalsarp", label: "Kaal Sarp", words: ["kaal sarp", "kalsarp", "kaalsarp"] },
  { to: "/mangal-dosha", label: "Mangal Dosha", words: ["mangal dosha", "manglik", "mangal"] },
  { to: "/yantra", label: "Yantra", words: ["yantra"] },
  { to: "/dharma", label: "Dharma", words: ["dharma", "life purpose"] },
  { to: "/horoscope", label: "Horoscope", words: ["horoscope", "daily horoscope", "rashifal"] },
  { to: "/compatibility", label: "Match Making", words: ["match making", "matchmaking", "compatibility", "kundli matching", "marriage match"] },
  { to: "/numerology", label: "Numerology", words: ["numerology", "numbers", "number reading"] },
  { to: "/baby-names", label: "Baby Names", words: ["baby names", "baby name"] },
  { to: "/festivals", label: "Festivals", words: ["festivals", "festival", "tyohar"] },
  { to: "/career", label: "Career", words: ["career", "job", "work"] },
  { to: "/finance", label: "Finance", words: ["finance", "money", "wealth"] },
  { to: "/health", label: "Health", words: ["health"] },
  { to: "/ayurveda", label: "Ayurveda", words: ["ayurveda", "dosha type"] },
  { to: "/chakra", label: "Chakra", words: ["chakra", "chakras"] },
  { to: "/karma", label: "Karma", words: ["karma", "past life"] },
  { to: "/vastu", label: "Vastu", words: ["vastu", "house direction"] },
  { to: "/life-dashboard", label: "Life Dashboard", words: ["life dashboard", "dashboard"] },
  { to: "/transits", label: "Transits", words: ["transits", "transit"] },
  { to: "/vedic-transits", label: "Vedic Transits", words: ["vedic transits", "gochar"] },
  { to: "/progressions", label: "Progressions", words: ["progressions", "progressed chart"] },
  { to: "/synastry", label: "Synastry", words: ["synastry"] },
  { to: "/timeline", label: "Timeline", words: ["timeline"] },
  { to: "/rectification", label: "Rectification", words: ["rectification", "correct my birth time"] },
  { to: "/astrocartography", label: "Astrocartography", words: ["astrocartography", "world map", "lucky places"] },
  { to: "/observatory", label: "Observatory", words: ["observatory", "sky map"] },
  { to: "/weather", label: "Cosmic Weather", words: ["cosmic weather", "weather"] },
  { to: "/dreams", label: "Dream Oracle", words: ["dreams", "dream", "dream oracle"] },
  { to: "/moon-calendar", label: "Moon Calendar", words: ["moon calendar", "moon phases"] },
  { to: "/reports", label: "Reports", words: ["reports", "report", "pdf"] },
  { to: "/saved", label: "Saved charts", words: ["saved charts", "saved"] },
  { to: "/bookmarks", label: "Bookmarks", words: ["bookmarks"] },
  { to: "/blog", label: "Blog", words: ["blog", "articles"] },
  { to: "/faq", label: "FAQ", words: ["faq", "questions", "help page"] },
  { to: "/journal", label: "Journal", words: ["journal", "diary"] },
  { to: "/meditation", label: "Meditation", words: ["meditation", "meditate"] },
  { to: "/settings", label: "Settings", words: ["settings", "options", "preferences"] },
  { to: "/sky", label: "Sky", words: ["sky", "live sky"] },
  { to: "/auth", label: "Sign in", words: ["sign in", "log in", "login", "sign up", "create account"] },
  { to: "/terms", label: "Terms", words: ["terms", "terms and conditions", "privacy"] },
];

const OPEN_WORDS = [
  "open", "go to", "goto", "go", "show me", "show", "take me to", "take me",
  "start", "launch", "visit", "switch to", "switch", "move to", "jump to",
  "bring up", "let me see", "i want", "i want to see", "give me", "page",
];

function tidy(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[.,!?;:"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const FILLER = /\b(the|a|an|my|please|now|module|page|section|screen|tab|of|for|to)\b/g;

function core(s: string): string {
  return tidy(s).replace(FILLER, " ").replace(/\s+/g, " ").trim();
}

function stripOpener(s: string): { rest: string; asked: boolean } {
  let cur = s;
  let asked = false;
  // Peel off any number of polite openers: "please go to open kundli page".
  for (let i = 0; i < 3; i++) {
    let hit = false;
    for (const w of OPEN_WORDS) {
      if (cur === w) return { rest: "", asked: true };
      if (cur.startsWith(w + " ")) {
        cur = cur.slice(w.length + 1).trim();
        asked = true;
        hit = true;
        break;
      }
    }
    if (!hit) break;
  }
  return { rest: cur, asked };
}

/**
 * Turn spoken words into one clear action.
 * Returns null when the words are not a command (so they can be typed instead).
 */
export function matchVoiceCommand(raw: string): VoiceCommand | null {
  const s = tidy(raw);
  if (!s) return null;

  if (/^(go )?back$/.test(s) || s === "previous page" || s === "last page") return { kind: "back" };
  if (/^(what can i say|help me|voice help|commands)$/.test(s)) return { kind: "help" };
  if (/^(open )?(the )?menu$/.test(s) || s === "show menu" || s === "close menu") return { kind: "menu" };

  if (/^scroll (down|next)$/.test(s) || s === "next" || s === "down") return { kind: "scroll", dir: "down" };
  if (/^scroll up$/.test(s) || s === "up") return { kind: "scroll", dir: "up" };
  if (/^(scroll to )?(the )?top$/.test(s) || s === "go up") return { kind: "scroll", dir: "top" };
  if (/^(scroll to )?(the )?(bottom|end)$/.test(s)) return { kind: "scroll", dir: "bottom" };

  const search = s.match(/^(?:search|find|look for) (.+)$/);
  if (search) {
    const page = findPage(search[1]);
    if (page) return { kind: "navigate", to: page.to, label: page.label };
    return { kind: "search", text: search[1] };
  }

  const press = s.match(/^(?:press|tap|click|hit|choose|select) (?:the )?(.+?)(?: button)?$/);
  if (press) {
    // "click kundli" should still open the page when nothing on screen matches.
    const el = findClickable(press[1]);
    if (el) return { kind: "click", label: press[1] };
    const page = findPage(press[1]);
    if (page) return { kind: "navigate", to: page.to, label: page.label };
    return { kind: "click", label: press[1] };
  }

  const { rest, asked } = stripOpener(s);
  const page = findPage(rest || s);
  // Any recognised page name opens it — with or without an opener word.
  if (page) return { kind: "navigate", to: page.to, label: page.label };

  const target = core(rest);
  if (asked && target) return { kind: "click", label: target };
  if (/^(calculate|compute|save|submit|next step|continue|reset|clear|read it|ask ai|sign out|log out)$/.test(s)) {
    return { kind: "click", label: s };
  }
  return null;
}

/** Match spoken words to a page, forgiving extra words, plurals and small slips. */
function findPage(text: string): { to: string; label: string; exact: boolean } | null {
  const t = core(text);
  if (!t) return null;
  const said = t.split(" ").filter(Boolean);

  let best: { to: string; label: string; exact: boolean; score: number } | null = null;

  for (const p of VOICE_PAGES) {
    const names = [...p.words, p.label].map(core).filter(Boolean);
    for (const name of names) {
      let score = 0;
      let exact = false;
      if (name === t) {
        score = 100;
        exact = true;
      } else if (t.includes(name) || name.includes(t)) {
        score = 80 - Math.abs(name.length - t.length);
      } else {
        const words = name.split(" ");
        const hits = words.filter((w) => said.some((sw) => near(sw, w))).length;
        if (hits === 0) continue;
        score = 40 + (hits / words.length) * 30 - Math.abs(words.length - said.length);
      }
      if (!best || score > best.score) best = { to: p.to, label: p.label, exact, score };
    }
  }
  return best && best.score >= 40 ? { to: best.to, label: best.label, exact: best.exact } : null;
}

/** Two words are "near" if one contains the other or they differ by one slip. */
function near(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4 && (a.startsWith(b.slice(0, 4)) || b.startsWith(a.slice(0, 4)))) return true;
  if (a.length < 3 || b.length < 3) return false;
  if (a.includes(b) || b.includes(a)) return true;
  return editDistance(a, b) <= 1;
}

function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 1) return 2;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}


/** Find a clickable thing on the page whose words match what was said. */
export function findClickable(label: string): HTMLElement | null {
  const want = tidy(label);
  if (!want) return null;
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>(
      'button, a[href], [role="button"], [role="tab"], summary, input[type="submit"], input[type="checkbox"], input[type="radio"]',
    ),
  ).filter((el) => el.offsetParent !== null || el.getClientRects().length > 0);

  const text = (el: HTMLElement) =>
    tidy(`${el.textContent ?? ""} ${el.getAttribute("aria-label") ?? ""} ${el.getAttribute("title") ?? ""}`);

  return (
    nodes.find((el) => text(el) === want) ??
    nodes.find((el) => text(el).startsWith(want)) ??
    nodes.find((el) => text(el).includes(want)) ??
    null
  );
}
