/**
 * One reading shape for the whole app.
 *
 * Every reading — tarot, kundli, transits, numerology, dreams, the AI Guide —
 * is told in the same four steps, in the same order, with a blank line between
 * each part so it is easy on the eye:
 *
 *   1. Facts    what the app actually calculated (so the reader can check it)
 *   2. Meaning  what those facts mean for this person, with the reason said out loud
 *   3. Timing   how long it lasts and when to act
 *   4. Steps    small things to do next
 *
 * Both paths use this file: the app's own writer (no AI credits) builds the
 * sections here, and when a paid model is switched on it is handed the same
 * shape as instructions, so the reader always gets the same experience.
 */

export type ReadingSection = {
  /** One meaningful picture-emoji. */
  emoji: string;
  /** Short plain title. */
  title: string;
  /** Lines under the title. Lines starting with • are read as list items. */
  lines: string[];
};

/** The fixed order of a Taromaya reading. */
export const READING_FRAME = [
  { key: "answer", emoji: "⭐", title: "Summary" },
  { key: "facts", emoji: "🔍", title: "What your details show" },
  { key: "meaning", emoji: "🧩", title: "Detailed analysis" },
  { key: "areas", emoji: "🏡", title: "Areas of life" },
  { key: "why", emoji: "💬", title: "Why this applies to you" },
  { key: "opportunities", emoji: "🍀", title: "Opportunities" },
  { key: "challenges", emoji: "⚠️", title: "Challenges to manage" },
  { key: "timing", emoji: "🕰️", title: "Timing" },
  { key: "practices", emoji: "🪔", title: "Supportive practices" },
  { key: "steps", emoji: "✅", title: "Recommended next steps" },
  { key: "remember", emoji: "💡", title: "Important note" },
] as const;


export type FrameKey = (typeof READING_FRAME)[number]["key"];

/** Build one section by frame key, or nothing when there is no content. */
export function section(key: FrameKey, lines: Array<string | false | null | undefined>): ReadingSection | null {
  const clean = lines.filter((l): l is string => typeof l === "string" && l.trim().length > 0).map((l) => l.trim());
  if (!clean.length) return null;
  const spec = READING_FRAME.find((s) => s.key === key)!;
  return { emoji: spec.emoji, title: spec.title, lines: clean };
}

/**
 * Join sections into finished text: heading line, its lines, then a blank line
 * before the next heading. Plain text only, never markdown.
 */
export function composeReading(sections: Array<ReadingSection | null | undefined>): string {
  return sections
    .filter((s): s is ReadingSection => !!s && s.lines.length > 0)
    .map((s) => [`${s.emoji} ${s.title}`, ...s.lines].join("\n"))
    .join("\n\n");
}

/** Areas of life a reading can speak to. Readers pick the ones they care about. */
export type LifeAreaId = "mood" | "work" | "money" | "love" | "health" | "purpose";

export type LifeArea = {
  id: LifeAreaId;
  label: string;
  emoji: string;
  /** Words in the data that make this area worth talking about. */
  test: RegExp;
  /** Plain, safe advice for this area when nothing more specific applies. */
  base: string;
};

export const LIFE_AREAS: LifeArea[] = [
  {
    id: "mood",
    label: "Emotional wellbeing",
    emoji: "🌙",
    test: /moon|mercury|nakshatra|tithi|phase|mind|mood|sleep/i,
    base: "Emotional pacing matters more than output in this period; protected rest and a consistent sleep window will noticeably steady your judgement.",
  },
  {
    id: "work",
    label: "Career and study",
    emoji: "💼",
    test: /saturn|sun|mars|mercury|area 10|house 10|career|job|work|study|exam|business/i,
    base: "Sustained, methodical effort is rewarded here, while abrupt moves are not; consolidate one commitment fully before opening the next.",
  },
  {
    id: "money",
    label: "Finances",
    emoji: "💰",
    test: /venus|jupiter|area 2|area 11|house 2|house 11|money|finance|income|salary/i,
    base: "Favour clarity over expansion: review recurring outflows, keep a reserve intact, and defer any single large commitment until the current phase settles.",
  },
  {
    id: "love",
    label: "Relationships and family",
    emoji: "❤️",
    test: /venus|moon|area 7|area 4|house 7|house 4|love|partner|marriage|family|match/i,
    base: "Direct, considerate communication resolves far more here than strategy does; state expectations plainly rather than testing them.",
  },
  {
    id: "health",
    label: "Health and vitality",
    emoji: "🌿",
    test: /mars|saturn|area 6|house 6|health|body|ayurved|dosha|energy/i,
    base: "Foundations first: hydration, sleep and daily movement address most of what this period raises. Seek qualified medical advice for anything persistent.",
  },
  {
    id: "purpose",
    label: "Purpose and growth",
    emoji: "🧭",
    test: /jupiter|ketu|rahu|area 9|area 12|house 9|house 12|dharma|karma|purpose|spiritual|dasha/i,
    base: "Long-term development responds to regular practice rather than intensity; commit a fixed weekly slot to the pursuit that matters most.",
  },
];


export function areaById(id: string): LifeArea | undefined {
  return LIFE_AREAS.find((a) => a.id === id);
}

/**
 * Supportive, non-superstitious practices per life area. Deliberately practical:
 * habit, attention and record-keeping rather than promises.
 */
export const AREA_PRACTICES: Record<LifeAreaId, string[]> = {
  mood: [
    "Keep the same sleep and wake window for the next two weeks; steadiness of routine is what settles the mind here",
    "Spend ten quiet minutes at the same hour daily — breathing, prayer or simple stillness, whichever you already trust",
  ],
  work: [
    "Write the week's three real priorities on paper each Monday and refuse a fourth",
    "Close one pending commitment fully before accepting the next; unfinished work is the main drag in this phase",
  ],
  money: [
    "List every recurring outflow once this month and cancel what you no longer use",
    "Hold a fixed reserve untouched, and put any large decision through a seven-day waiting rule",
  ],
  love: [
    "State one expectation plainly this week instead of hinting at it",
    "Protect a regular, undistracted hour with the person who matters most",
  ],
  health: [
    "Anchor the basics first: water, sleep and twenty minutes of movement daily",
    "Note anything persistent in writing and take it to a qualified doctor rather than to a reading",
  ],
  purpose: [
    "Reserve one fixed weekly slot for the pursuit that matters most and treat it as an appointment",
    "Read or learn in small regular portions rather than in occasional long bursts",
  ],
};

/** Two supportive practices for the areas this reading speaks to. */
export function practicesFor(areas: Array<{ id: LifeAreaId }>, offset = 0): string[] {
  const out: string[] = [];
  areas.forEach((a, i) => {
    const list = AREA_PRACTICES[a.id];
    if (!list) return;
    const line = list[(offset + i) % list.length];
    if (line && !out.includes(line)) out.push(line);
  });
  if (!out.length) out.push(...AREA_PRACTICES.mood);
  return out.slice(0, 3);
}

/**
 * The same framework written as instructions, for when a paid AI model is on.
 * Kept short on purpose: it is sent with every call.
 */
export const READING_FRAMEWORK_RULES = [
  "READING SHAPE (follow exactly, same shape every time):",
  "Use these picture-emoji section titles, each on its own line, in this order. Leave one completely blank line between sections. Skip a section only when the supplied data cannot support it.",
  ...READING_FRAME.map((s) => `${s.emoji} ${s.title}`),
  "Summary: 2 to 3 sentences that answer the question directly and name the single dominant signature in the data.",
  "What your details show: 2 to 4 bullet lines restating the calculated facts you were given, in professional but readable language.",
  "Detailed analysis: 3 to 5 sentences joining those facts into one coherent interpretation. Say why each factor leads to the conclusion and how it is likely to show up in the client's daily life.",
  "Areas of life: one line per relevant area, each starting with the matching emoji and the area name, with a specific observation rather than generic advice.",
  "Why this applies to you: 2 to 3 sentences linking the client's own birth data and the current sky to the reading, without exposing chart arithmetic.",
  "Opportunities: 2 to 3 bullet lines naming favourable conditions and how to use them.",
  "Challenges to manage: 2 to 3 bullet lines naming honest difficulties and how to reduce their impact. Never alarmist.",
  "Timing: 2 to 3 sentences on how long the condition lasts, when within it the effect strengthens or eases, and which part of it is the better window to act in. Never invent exact dates.",
  "Supportive practices: 2 to 3 bullet lines of steady, practical practices — routine, attention, record-keeping, study or quiet time. No purchases, no fear-based remedies, no guarantees.",
  "Recommended next steps: 3 to 4 bullet lines, each a concrete, practical action.",
  "Important note: one closing line, including a brief honest statement of certainty where the reading is symbolic.",
].join("\n");

