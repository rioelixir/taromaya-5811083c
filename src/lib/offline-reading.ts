import {
  meaningsIn,
  PLANET_MEANINGS,
  SIGN_MEANINGS,
  HOUSE_MEANINGS,
  NUMBER_MEANINGS,
  PHASE_MEANINGS,
  ASPECT_MEANINGS,
  type Meaning,
} from "./offline-meanings";

/**
 * Writes a full reading from facts the app already calculated, with no AI model.
 *
 * The call sites all send the same two things an AI would have received: a
 * short "who you are" note and a prompt full of computed facts. Here those
 * facts are read, grouped, and turned into a proper joined-up reading in simple
 * English with no symbols: what is happening, what it means for each part of
 * life, timing, and one thing that helps.
 */

/** Stable number from a string, so the same reading reads the same way twice. */
function seed(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = ((h ^ text.charCodeAt(i)) * 16777619) >>> 0;
  return h;
}

function pick<T>(list: T[], n: number): T {
  return list[n % list.length];
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function clean(line: string): string {
  return line
    .replace(/^[-*•\s]+/, "")
    .replace(/[*_#`]+/g, "")
    .replace(/\s+/g, " ")
    .replace(/[.:;,]+$/, "")
    .trim();
}

/** Facts worth repeating back, cleaned of symbols and labels. */
function factsFrom(prompt: string, limit = 10): string[] {
  const out: string[] = [];
  for (const raw of prompt.split(/\n|;/)) {
    const line = clean(raw);
    if (!line || line.length < 6 || line.length > 160) continue;
    if (/^(question|write|reply|return|keep it|do not|never|use only|shape of|rules?)\b/i.test(line)) continue;
    if (/json|markdown|word[s]? ?limit|under \d+ words/i.test(line)) continue;
    out.push(line);
    if (out.length >= limit) break;
  }
  return out;
}

/** What the data is about, so the reading opens in the right place. */
type Topic =
  | "birth"
  | "transit"
  | "numbers"
  | "match"
  | "horoscope"
  | "timing"
  | "period"
  | "star"
  | "general";

function topicOf(all: string): Topic {
  const t = all.toLowerCase();
  if (/kundli match|compat|synastry|guna|ashtakoot|match making/.test(t)) return "match";
  if (/numerolog|life path|destiny|soul urge|mulank|bhagyank|loshu|lo shu/.test(t)) return "numbers";
  if (/panchang|muhurat|tithi|good time|choghadiya|hora/.test(t)) return "timing";
  if (/dasha|antardasha|period|varsh/.test(t)) return "period";
  if (/transit|current sky|today|right now/.test(t)) return "transit";
  if (/horoscope|day ahead|week ahead|month ahead/.test(t)) return "horoscope";
  if (/nakshatra|birth star|pada/.test(t)) return "star";
  if (/lagna|ascendant|birth chart|kundli|natal/.test(t)) return "birth";
  return "general";
}

const TOPIC_OPENERS: Record<Topic, string[]> = {
  birth: [
    "This is the map you were born with. It shows the shape of your nature, not a fixed future.",
    "Here is your birth map in plain words. Think of it as your starting kit, not your ending.",
  ],
  transit: [
    "This is the sky today, moving over your birth map. It is weather, so it passes.",
    "Here is what today's sky is doing to your chart. Weather, not fate.",
  ],
  numbers: [
    "These are your birth numbers. They show your habits and your natural style.",
    "Here is what your numbers say about how you think, choose and act.",
  ],
  match: [
    "Two charts always have easy parts and hard parts. Both are normal, and both are useful.",
    "Here is how these two charts fit together, the smooth bits and the bumpy bits.",
  ],
  horoscope: [
    "Think of this as the weather for your mood, so you can dress for it.",
    "Here is the mood of the days ahead and how to work with it.",
  ],
  timing: [
    "This is about the calm times and the noisy times of the day for what you plan.",
    "Here is when the day helps you and when it asks you to wait.",
  ],
  period: [
    "A life period is like a season. It has its own jobs and its own gifts.",
    "Here is the season you are walking through and what it is asking of you.",
  ],
  star: [
    "Your birth star adds flavour to everything else in your chart.",
    "Here is what your star is adding to the whole picture.",
  ],
  general: [
    "Here is the simple version, in plain words.",
    "Let us keep this easy to follow.",
  ],
};

const CLOSERS = [
  "Nothing here is fixed. Your choices still steer the ship.",
  "Take what helps and leave the rest. You know your life best.",
  "Small steady steps work better than one big jump.",
  "Come back to this in a week and see what has changed.",
];

/** Everything the data mentions, kept in named groups so the story joins up. */
type Found = {
  planets: Array<{ name: string; m: Meaning }>;
  signs: Array<{ n: number; m: Meaning }>;
  houses: Array<{ n: number; m: Meaning }>;
  numbers: Array<{ n: number; m: Meaning }>;
  aspects: Array<{ name: string; m: Meaning }>;
  phases: Array<{ name: string; m: Meaning }>;
  retro: string[];
};

function scan(text: string): Found {
  const lower = text.toLowerCase();
  const found: Found = { planets: [], signs: [], houses: [], numbers: [], aspects: [], phases: [], retro: [] };
  const once = new Set<string>();
  const add = (bucket: keyof Found, key: string, value: unknown) => {
    if (once.has(key)) return;
    once.add(key);
    (found[bucket] as unknown[]).push(value);
  };

  for (const name of Object.keys(PLANET_MEANINGS)) {
    if (new RegExp(`\\b${name}\\b`).test(text)) add("planets", `p${name}`, { name, m: PLANET_MEANINGS[name] });
    if (new RegExp(`\\b${name}\\b[^\\n]{0,40}(retro|\\(r\\)|moving backwards)`, "i").test(text)) {
      if (!found.retro.includes(name)) found.retro.push(name);
    }
  }
  for (const m of lower.matchAll(/\bsign\s*(\d{1,2})\b/g)) {
    const n = Number(m[1]);
    if (SIGN_MEANINGS[n]) add("signs", `s${n}`, { n, m: SIGN_MEANINGS[n] });
  }
  for (const m of text.matchAll(/\bH(\d{1,2})\b|\bhouse\s*(\d{1,2})\b|\barea\s*(\d{1,2})\b/gi)) {
    const n = Number(m[1] ?? m[2] ?? m[3]);
    if (HOUSE_MEANINGS[n]) add("houses", `h${n}`, { n, m: HOUSE_MEANINGS[n] });
  }
  for (const m of lower.matchAll(
    /\b(life path|destiny|soul urge|personality|mulank|bhagyank|namank|birth number)\D{0,12}(\d{1,2})\b/g,
  )) {
    const n = Number(m[2]);
    if (NUMBER_MEANINGS[n]) add("numbers", `n${n}`, { n, m: NUMBER_MEANINGS[n] });
  }
  for (const name of Object.keys(ASPECT_MEANINGS)) {
    if (lower.includes(name)) add("aspects", `a${name}`, { name, m: ASPECT_MEANINGS[name] });
  }
  for (const name of Object.keys(PHASE_MEANINGS)) {
    if (lower.includes(`${name} moon`)) add("phases", `ph${name}`, { name, m: PHASE_MEANINGS[name] });
  }
  return found;
}

/** Which life areas the data actually supports, so nothing is invented. */
const AREA_RULES: Array<{ label: string; icon: string; test: RegExp; base: string }> = [
  {
    label: "Mood and mind",
    icon: "🌙",
    test: /moon|mercury|nakshatra|tithi|phase|mind/i,
    base: "Your feelings lead the way right now, so treat rest and quiet as real work.",
  },
  {
    label: "Work and study",
    icon: "💼",
    test: /saturn|sun|mars|mercury|house 10|area 10|career|job|work|10th/i,
    base: "Steady effort counts more than speed. Finish one thing fully before starting the next.",
  },
  {
    label: "Money",
    icon: "💰",
    test: /venus|jupiter|house 2|house 11|area 2|area 11|money|finance|8/i,
    base: "Keep money simple: know what comes in, know what goes out, and delay one big spend.",
  },
  {
    label: "Love and family",
    icon: "❤️",
    test: /venus|moon|house 7|house 4|area 7|area 4|love|partner|marriage|family/i,
    base: "Say the plain, kind thing instead of the clever thing. It saves a week of guessing.",
  },
  {
    label: "Body and energy",
    icon: "🌿",
    test: /mars|saturn|house 6|area 6|health|body|ayurved|dosha/i,
    base: "Sleep, water and a short walk fix more than you expect. Start there before anything bigger.",
  },
];

export function offlineReading(input: { system?: string; prompt: string }): string {
  const prompt = input.prompt ?? "";
  const all = `${input.system ?? ""}\n${prompt}`;
  const n = seed(all);
  const facts = factsFrom(prompt);
  const found = scan(all);
  const topic = topicOf(all);
  const meanings: Meaning[] = meaningsIn(all, 8);

  const parts: string[] = [];

  // 1. The short answer, in the right voice for the topic.
  parts.push(`🌟 The short answer\n${pick(TOPIC_OPENERS[topic], n)}`);

  // 2. What the data actually says, repeated back so the reader can check it.
  if (facts.length) {
    parts.push(`🔍 What your chart shows\n${facts.map((f) => `• ${f}`).join("\n")}`);
  }

  // 3. One joined story instead of a list of pieces.
  const story: string[] = [];
  const lead = found.planets[0];
  const sign = found.signs[0];
  const house = found.houses[0];
  if (lead) story.push(`${cap(lead.m.is)}, and ${lead.m.feels}.`);
  if (sign) story.push(`Because ${sign.m.is}, that side of you is ${sign.m.feels}.`);
  if (house) story.push(`It lands in ${house.m.is}, so this shows up as something ${house.m.feels}.`);
  if (found.aspects[0]) story.push(`Two forces here meet: ${found.aspects[0].m.is}, which ${found.aspects[0].m.feels}.`);
  if (found.numbers[0]) story.push(`Your number side says ${found.numbers[0].m.is}, so ${found.numbers[0].m.feels}.`);
  if (found.phases[0]) story.push(`${cap(found.phases[0].m.is)}, and ${found.phases[0].m.feels}.`);
  if (found.retro.length) {
    story.push(
      `${found.retro.join(" and ")} ${found.retro.length > 1 ? "are" : "is"} moving backwards for now, so double check plans, papers and messages instead of rushing them.`,
    );
  }
  if (story.length) parts.push(`🧩 How it all fits together\n${story.join(" ")}`);

  // 4. Real life, area by area, but only areas the data supports.
  const areas = AREA_RULES.filter((a) => a.test.test(all)).slice(0, 5);
  if (areas.length) {
    parts.push(
      `🏡 What it means in real life\n${areas
        .map((a, i) => {
          const extra = meanings[i % Math.max(meanings.length, 1)];
          const tail = extra ? ` ${cap(extra.does)}.` : "";
          return `${a.icon} ${a.label}: ${a.base}${tail}`;
        })
        .join("\n")}`,
    );
  } else if (meanings.length) {
    parts.push(`🙂 What that means for you\n${meanings.map((m) => `• ${cap(m.is)}, so ${m.feels}.`).join("\n")}`);
  }

  // 5. Timing, without promising dates.
  const timing =
    topic === "timing"
      ? "Use the calm windows listed above for anything that matters, and keep the noisy windows for ordinary jobs."
      : topic === "period"
        ? "This season moves slowly. Judge it by the month, not by one bad day."
        : topic === "transit"
          ? "This mood is short. Give it a few days before you decide anything big."
          : "For picking a good day or hour, use the Muhurat section rather than guessing.";
  parts.push(`⏳ Timing\n${timing}`);

  // 6. Clear, small actions.
  const actions = (meanings.length ? meanings.slice(0, 4).map((m) => cap(m.does)) : []).concat([
    "Pick the one line above that feels most true and act on it today",
    "Write down how it goes, so you can spot the pattern later",
  ]);
  parts.push(`✅ What to do\n${actions.slice(0, 5).map((a) => `• ${a}.`).join("\n")}`);

  parts.push(`💡 Remember\n${pick(CLOSERS, n >> 3)}`);

  return parts.join("\n\n");
}
