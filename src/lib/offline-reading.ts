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
import {
  composeReading,
  section,
  LIFE_AREAS,
  areaById,
  type LifeArea,
  type LifeAreaId,
} from "./reading-frame";

/**
 * Writes a full reading from facts the app already calculated, with no AI model.
 *
 * The call sites send the same two things an AI would have received: a short
 * "who you are" note and a prompt full of computed facts. Those facts are read,
 * grouped, and told back in the app's single reading shape:
 * facts, meaning, real life, why, timing, next steps.
 */

export type ReadingRequest = {
  system?: string;
  prompt: string;
  /** Life areas the reader asked to hear about. Empty means "whatever fits". */
  areas?: LifeAreaId[] | null;
};

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
    .replace(/^[-*•✓✗\s]+/, "")
    .replace(/[*_#`]+/g, "")
    .replace(/\s+/g, " ")
    .replace(/[.:;,]+$/, "")
    .trim();
}

/**
 * Turn one data line into something a reader can understand: no coordinates,
 * no degrees, no short codes, no engine words. Returns "" when nothing is left
 * worth saying.
 */
function humanise(line: string): string {
  let s = line
    .replace(/\(-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\)/g, "") // coordinates
    .replace(/\bayanamsa[^·\n]*/gi, "")
    .replace(/\bhouses?:\s*[a-z-]+/gi, "")
    .replace(/\bsidereal\b/gi, "")
    .replace(/\bstrong AV\b/gi, "strong")
    .replace(/\bp(\d)\b/g, "part $1")
    .replace(/\(R\)/g, "moving backwards")
    .replace(/\b(\d{1,2})\s+\d{1,2}(\s+\d{1,2})?\b(?=\s*(·|$))/g, "") // bare degree numbers
    // a lone degree number right after a sign name, e.g. "Aquarius 10"
    .replace(
      /\b(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)\s+\d{1,2}\b/gi,
      "$1",
    )

    .replace(/\s*·\s*/g, " · ")
    .replace(/\(\s*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*·\s*$/g, "")
    .trim();
  s = clean(s);
  if (/^(planets|gochara|next \d+ days|dasha-lord transits)\b/i.test(s)) return "";
  if (!/[a-z]{4}/i.test(s)) return "";
  return s;
}

/** Facts worth repeating back, cleaned of symbols and inner workings. */
function factsFrom(prompt: string, limit = 7): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of prompt.split(/\n|;/)) {
    const first = clean(raw);
    if (!first || first.length < 6) continue;
    if (/^(question|write|reply|return|keep it|do not|never|use only|shape of|rules?)\b/i.test(first)) continue;
    if (/^(module|user intent|selected life areas|output|context)\b/i.test(first)) continue;

    if (/json|markdown|word[s]? ?limit|under \d+ words|===/i.test(first)) continue;
    const line = humanise(first);
    if (!line || line.length < 6 || line.length > 150) continue;
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
    if (out.length >= limit) break;
  }

  return out;
}

/** The reader's own details, pulled out of the supplied data — never invented. */
type Person = {
  name?: string;
  bornDate?: string;
  bornTime?: string;
  place?: string;
  lagna?: string;
  moonSign?: string;
  starName?: string;
  starPada?: string;
  maha?: string;
  antar?: string;
  sadeSati?: boolean;
  todayStar?: string;
  todayTithi?: string;
  helpful: Array<{ planet: string; area: string }>;
  testing: Array<{ planet: string; area: string }>;
};

function readPerson(all: string): Person {
  const p: Person = { helpful: [], testing: [] };
  const one = (re: RegExp): string | undefined => {
    const m = re.exec(all);
    return m?.[1]?.trim() || undefined;
  };

  p.name = one(/\bName:\s*([^·\n]+)/);
  const born = /\bBorn\s+(\d{4}-\d{2}-\d{2})\s+([0-9:]{4,8})/.exec(all);
  if (born) {
    p.bornDate = born[1];
    p.bornTime = born[2].slice(0, 5);
  }
  p.place = one(/\bBorn[^\n·]*·\s*([^(\n·]+)/);
  p.lagna = one(/\bLagna:\s*([A-Za-z]+)/);
  p.moonSign = one(/\bMoon:\s*([A-Za-z]+)/);
  const star = /\bNakshatra\s+([A-Za-z ]+?)\s*p(\d)/.exec(all);
  if (star) {
    p.starName = star[1].trim();
    p.starPada = star[2];
  }
  p.maha = one(/\bMahadasha:\s*([A-Za-z]+)/);
  p.antar = one(/\bAntardasha:\s*([A-Za-z]+)/);
  p.sadeSati = /Sade Sati:\s*ACTIVE/i.test(all);
  p.todayStar = one(/\bNakshatra:\s*([A-Za-z ]+?)\s*pada/);
  p.todayTithi = one(/\bTithi:\s*([A-Za-z ]+?)\s*\(/);

  for (const m of all.matchAll(/✓\s*([A-Za-z]+)[^\n]*?house\s*(\d{1,2})/g)) {
    p.helpful.push({ planet: m[1], area: m[2] });
  }
  for (const m of all.matchAll(/✗\s*([A-Za-z]+)[^\n]*?house\s*(\d{1,2})/g)) {
    p.testing.push({ planet: m[1], area: m[2] });
  }
  return p;
}

/** What the data is about, so the reading opens in the right place. */
type Topic = "birth" | "transit" | "numbers" | "match" | "horoscope" | "timing" | "period" | "star" | "general";

function topicOf(all: string): Topic {
  const t = all.toLowerCase();
  // The module the reading was asked for wins over stray words in the data.
  const asked = /\bmodule:\s*([a-z \-]+)/.exec(t)?.[1] ?? "";
  const both = `${asked} ${t}`;
  if (/kundli match|compat|synastry|guna|ashtakoot|match making/.test(both)) return "match";
  if (/numerolog|life path|destiny|soul urge|mulank|bhagyank|loshu|lo shu/.test(both)) return "numbers";
  if (/muhurat|choghadiya|hora|good time|panchang/.test(asked || "no")) return "timing";
  if (/horoscope|day ahead|week ahead|month ahead/.test(both)) return "horoscope";
  if (/lagna|ascendant|birth chart|kundli|natal/.test(both)) return "birth";
  if (/muhurat|choghadiya|good time/.test(t)) return "timing";
  if (/dasha|antardasha|varsh/.test(t)) return "period";
  if (/transit|current sky|gochara/.test(t)) return "transit";
  if (/nakshatra|birth star|pada/.test(t)) return "star";
  return "general";
}


const TOPIC_OPENERS: Record<Topic, string[]> = {
  birth: [
    "This is a reading of the chart you were born with. It describes your natural temperament and the conditions you tend to work with, rather than a fixed outcome.",
    "This reading works from your own birth chart. It sets out your underlying disposition and the areas of life it most often shapes.",
  ],
  transit: [
    "This reading covers current planetary movement across your birth chart. Transits describe passing conditions, so their influence is time-bound.",
    "This is an assessment of today's planetary positions in relation to your chart. Treat it as prevailing conditions rather than fate.",
  ],
  numbers: [
    "This is a numerological profile drawn from your birth date and name. It describes decision-making style, natural strengths and recurring patterns.",
    "This reading interprets your core numbers and what they indicate about how you think, choose and work.",
  ],
  match: [
    "This is a comparative reading of two charts. Every pairing carries areas of natural ease and areas that require deliberate effort; both are informative.",
    "This assessment sets out where the two charts support each other and where friction is likely, with practical guidance for each.",
  ],
  horoscope: [
    "This is a short-range forecast of prevailing conditions, intended to help you plan the days ahead.",
    "This reading describes the tone of the coming days and how best to work with it.",
  ],
  timing: [
    "This is a timing assessment: the more supportive and less supportive windows for what you are planning.",
    "This reading identifies when conditions favour action and when it is better to wait.",
  ],
  period: [
    "This reading covers the planetary period you are currently in. A period behaves like a long season, with its own demands and its own openings.",
    "This is an assessment of your current life period and what it is asking of you.",
  ],
  star: [
    "This reading interprets your birth nakshatra, which colours the rest of the chart.",
    "This is an assessment of your birth star and what it contributes to the wider picture.",
  ],
  general: [
    "This is a structured reading of the details supplied, set out clearly and in order.",
    "Here is a considered interpretation of the information provided.",
  ],
};

const CLOSERS = [
  "Astrological and symbolic readings describe tendencies and likely conditions, not certainties; your own decisions remain the deciding factor.",
  "Take what is useful and set aside what does not apply. This reading is guidance, not instruction.",
  "Consistent, incremental action produces better results here than a single decisive move.",
  "Revisit this reading after a week and note what has actually shifted; that record is the most reliable guide you have.",
];

/** Favourable conditions drawn from what the data supports. */
const OPPORTUNITY_LINES = [
  "Conditions favour consolidation: existing work, relationships and commitments respond better than new ventures started from scratch.",
  "Communication and negotiation are supported here, so conversations you have been postponing are worth scheduling.",
  "This is a productive period for learning and preparation, which pays off once conditions shift.",
  "Support is available from people who already know your work; asking directly is likely to be met well.",
];

/** Honest difficulties, framed as manageable. */
const CHALLENGE_LINES = [
  "Impatience is the main risk in this period. Deadlines set too tightly are the most likely source of avoidable error.",
  "Expect some delay in matters that depend on other people; build slack into your plans rather than pressing harder.",
  "Energy is uneven here, so guard against overcommitting on a good day and paying for it across the following week.",
  "Written details, paperwork and agreements deserve a second review before you commit to them.",
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

/** Areas to speak to: the reader's picks first, otherwise whatever the data supports. */
function chooseAreas(all: string, wanted?: LifeAreaId[] | null): LifeArea[] {
  const picked = (wanted ?? []).map((id) => areaById(id)).filter((a): a is LifeArea => !!a);
  if (picked.length) return picked.slice(0, 6);
  return LIFE_AREAS.filter((a) => a.test.test(all)).slice(0, 4);
}

export function offlineReading(input: ReadingRequest): string {
  const prompt = input.prompt ?? "";
  const all = `${input.system ?? ""}\n${prompt}`;
  const n = seed(all);
  const facts = factsFrom(prompt);
  const found = scan(all);
  const person = readPerson(all);
  const topic = topicOf(all);
  const meanings: Meaning[] = meaningsIn(all, 8);
  const areas = chooseAreas(all, input.areas);

  // 1. Straight answer, in the right voice for what was asked.
  const answer = [
    pick(TOPIC_OPENERS[topic], n),
    person.name ? `This one is written for ${person.name}, from their own details.` : "",
  ];

  // 2. The facts, repeated back so the reader can check them.
  const factLines = facts.map((f) => `• ${f}`);

  // 3. One joined story instead of a list of pieces.
  const story: string[] = [];
  const lead = found.planets[0];
  const sign = found.signs[0];
  const house = found.houses[0];
  if (lead) story.push(`${cap(lead.m.is)}, and ${lead.m.feels}.`);
  if (sign) story.push(`Because ${sign.m.is}, that side of you is ${sign.m.feels}.`);
  if (house) story.push(`It lands in ${house.m.is}, so this shows up as something ${house.m.feels}.`);
  if (found.aspects[0]) story.push(`Two forces meet here: ${found.aspects[0].m.is}, which ${found.aspects[0].m.feels}.`);
  if (found.numbers[0]) story.push(`Your number side says ${found.numbers[0].m.is}, so ${found.numbers[0].m.feels}.`);
  if (found.phases[0]) story.push(`${cap(found.phases[0].m.is)}, and ${found.phases[0].m.feels}.`);
  if (found.retro.length) {
    story.push(
      `${found.retro.join(" and ")} ${found.retro.length > 1 ? "are" : "is"} moving backwards for now, so check plans, papers and messages twice instead of rushing them.`,
    );
  }

  // 4. Real life, area by area, tuned to what the reader asked to hear about.
  const usedAdvice = new Set<string>();
  const areaLines = areas.map((a, i) => {
    const extra = meanings[i % Math.max(meanings.length, 1)];
    const helpful = person.helpful.length ? person.helpful[i % person.helpful.length] : null;
    // Only mention the helpful planet once, on the first area, so it reads naturally.
    const lift =
      i === 0 && helpful ? ` Right now ${helpful.planet} is helping this part of your life, so use it.` : "";

    let tail = "";
    if (extra && !usedAdvice.has(extra.does)) {
      usedAdvice.add(extra.does);
      tail = ` ${cap(extra.does)}.`;
    }
    return `${a.emoji} ${a.label}: ${a.base}${lift}${tail}`;
  });


  // 5. The reasoning, said out loud, from the reader's own details.
  const why: string[] = [];
  if (person.bornDate) {
    why.push(
      `You were born on ${person.bornDate}${person.bornTime ? ` at ${person.bornTime}` : ""}${
        person.place ? ` in ${person.place}` : ""
      }, so this reading uses your own birth moment, not a general sun sign.`,
    );
  }
  if (person.starName) {
    why.push(
      `Your birth star is ${person.starName}${person.starPada ? `, part ${person.starPada}` : ""}, which is why the mood advice above is shaped the way it is.`,
    );
  }
  if (person.maha) {
    why.push(
      `You are in a ${person.maha} life season${person.antar ? `, with a ${person.antar} chapter inside it` : ""}, so the same day can feel different for you than for someone else.`,
    );
  }
  if (person.testing.length) {
    why.push(
      `${person.testing.map((t) => t.planet).join(" and ")} ${person.testing.length > 1 ? "are" : "is"} passing through a tender part of your chart at the moment, which is why patience is asked for and not more effort.`,
    );
  }
  if (person.sadeSati) {
    why.push("A long Saturn stretch is running for you, so slow, honest progress counts far more than speed.");
  }
  if (person.todayStar || person.todayTithi) {
    why.push(
      `Today's sky adds ${[person.todayStar, person.todayTithi].filter(Boolean).join(" and ")}, which is the flavour of the next day or two only.`,
    );
  }

  // 6. Timing, without promising dates.
  const timing =
    topic === "timing"
      ? "Use the calm windows listed above for anything that matters, and keep the noisy windows for ordinary jobs."
      : topic === "period"
        ? "This season moves slowly. Judge it by the month, not by one hard day."
        : topic === "transit"
          ? "This mood is short. Give it a few days before you decide anything big."
          : person.maha
            ? "The big pattern is a slow season, and today's sky is only a passing mood on top of it."
            : "For picking a good day or hour, use the Muhurat section rather than guessing.";

  // 7. Small, clear actions.
  const actions = meanings
    .map((m) => m.does)
    .filter((d) => !usedAdvice.has(d))
    .slice(0, 3)
    .map((d) => cap(d))
    .concat(
      areas[0] ? `Give ${areas[0].label.toLowerCase()} ten honest minutes today` : "",
      "Pick the one line above that feels most true and act on it today",
      "Write down how it goes, so you can spot the pattern later",
    );


  return composeReading([
    section("answer", answer),
    section("facts", factLines),
    section("meaning", story.length ? story : meanings.map((m) => `• ${cap(m.is)}, so ${m.feels}.`)),
    section("areas", areaLines),
    section("why", why),
    section("timing", [timing]),
    section(
      "steps",
      actions
        .filter(Boolean)
        .slice(0, 5)
        .map((a) => `• ${a}.`),
    ),
    section("remember", [pick(CLOSERS, n >> 3)]),
  ]);
}
