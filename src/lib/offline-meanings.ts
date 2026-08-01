/**
 * Plain-English meanings used to write readings without any AI model.
 *
 * Everything here is written for a 10 year old: short words, no jargon, no
 * symbols. Each entry has what the thing IS, how it FEELS, and one simple
 * thing to DO about it.
 */

export type Meaning = {
  /** What it is, in one very short line. */
  is: string;
  /** How it usually feels day to day. */
  feels: string;
  /** One small, doable action. */
  does: string;
};

/** The sky's ten main players. */
export const PLANET_MEANINGS: Record<string, Meaning> = {
  Sun: { is: "the Sun is who you really are inside", feels: "you want to be seen and to matter", does: "do one thing today that is truly yours, not someone else's idea" },
  Moon: { is: "the Moon is your feelings and your comfort", feels: "moods come and go like weather", does: "rest, eat well, and talk to someone kind" },
  Mercury: { is: "Mercury is talking, thinking and messages", feels: "your mind runs fast and words matter", does: "write your thought down before you say it" },
  Venus: { is: "Venus is love, beauty and money you enjoy", feels: "you want sweetness and peace", does: "say a kind thing to someone you like" },
  Mars: { is: "Mars is energy, courage and doing", feels: "you feel pushy or fired up", does: "put that heat into exercise or a job you keep avoiding" },
  Jupiter: { is: "Jupiter is growth, luck and learning", feels: "doors feel a little wider", does: "ask for the thing you thought was too big to ask" },
  Saturn: { is: "Saturn is time, rules and hard work that pays", feels: "slow, heavy, but it makes you strong", does: "keep one small promise to yourself every day this week" },
  Uranus: { is: "Uranus is surprises and new ideas", feels: "restless, like you want to change something", does: "change one small habit instead of your whole life" },
  Neptune: { is: "Neptune is dreams, art and faith", feels: "soft and a bit foggy", does: "check facts twice before you decide" },
  Pluto: { is: "Pluto is deep change and letting go", feels: "intense, like something old is ending", does: "let go of one thing that is already over" },
  Rahu: { is: "Rahu is hunger for something new", feels: "you want more, fast", does: "pick one goal and drop the rest for now" },
  Ketu: { is: "Ketu is letting go and looking inward", feels: "you care less about things you used to chase", does: "spend ten quiet minutes alone" },
};

/** How two planets talk to each other. */
export const ASPECT_MEANINGS: Record<string, Meaning> = {
  conjunction: { is: "they sit together and act as one", feels: "strong and hard to ignore", does: "use it on purpose instead of letting it use you" },
  opposition: { is: "they pull from opposite sides", feels: "like a tug of war", does: "give both sides a turn instead of choosing one" },
  trine: { is: "they help each other easily", feels: "smooth and lucky", does: "start the good thing now, while it is easy" },
  square: { is: "they push against each other", feels: "tense, like a knot", does: "take the harder, honest step and the knot loosens" },
  sextile: { is: "they offer a small friendly chance", feels: "a light nudge forward", does: "say yes to the small offer that shows up" },
  quincunx: { is: "they do not quite understand each other", feels: "a bit awkward", does: "adjust slowly, do not force it" },
  "semi-sextile": { is: "a tiny helpful link", feels: "a quiet hint", does: "notice what keeps repeating" },
  "semi-square": { is: "a small irritation", feels: "like a stone in your shoe", does: "fix the little thing before it grows" },
  sesquiquadrate: { is: "a stretched, stubborn tension", feels: "you feel pulled thin", does: "do less today, not more" },
  quintile: { is: "a creative spark", feels: "playful and clever", does: "make something, even something small" },
};

/** The twelve signs, named by number the way the app shows them. */
export const SIGN_MEANINGS: Record<number, Meaning> = {
  1: { is: "sign 1 starts things", feels: "bold and quick", does: "begin, then look" },
  2: { is: "sign 2 builds and keeps", feels: "steady and calm", does: "go slow and finish" },
  3: { is: "sign 3 talks and learns", feels: "curious and chatty", does: "ask the question" },
  4: { is: "sign 4 cares and protects", feels: "soft and homey", does: "look after your people" },
  5: { is: "sign 5 shines", feels: "warm and proud", does: "share your gift out loud" },
  6: { is: "sign 6 fixes details", feels: "careful and helpful", does: "clean up one messy thing" },
  7: { is: "sign 7 balances", feels: "fair and friendly", does: "make peace, not a winner" },
  8: { is: "sign 8 goes deep", feels: "private and powerful", does: "tell one true feeling" },
  9: { is: "sign 9 explores", feels: "hopeful and free", does: "learn something new" },
  10: { is: "sign 10 climbs", feels: "serious and strong", does: "take the responsible step" },
  11: { is: "sign 11 dreams for everyone", feels: "different and kind", does: "join a group that shares your idea" },
  12: { is: "sign 12 feels everything", feels: "dreamy and tender", does: "rest and trust your gut" },
};

/** The twelve life areas, by number. */
export const HOUSE_MEANINGS: Record<number, Meaning> = {
  1: { is: "area 1 is you, your body and your start", feels: "personal", does: "take care of yourself first" },
  2: { is: "area 2 is money and what you own", feels: "practical", does: "check your spending" },
  3: { is: "area 3 is talking, siblings and short trips", feels: "busy", does: "send the message" },
  4: { is: "area 4 is home and family", feels: "cosy or heavy", does: "tidy or heal one home thing" },
  5: { is: "area 5 is fun, love and children", feels: "playful", does: "do something creative" },
  6: { is: "area 6 is work, health and habits", feels: "daily and steady", does: "fix one habit" },
  7: { is: "area 7 is partners and close deals", feels: "shared", does: "have the honest talk" },
  8: { is: "area 8 is secrets, change and shared money", feels: "deep", does: "face the thing you avoid" },
  9: { is: "area 9 is study, travel and belief", feels: "wide open", does: "learn or plan a trip" },
  10: { is: "area 10 is career and name", feels: "public", does: "show your work to someone who matters" },
  11: { is: "area 11 is friends, hopes and gains", feels: "social", does: "ask a friend for help" },
  12: { is: "area 12 is rest, dreams and letting go", feels: "quiet", does: "sleep more and let go" },
};

/** Numerology numbers, including the master numbers. */
export const NUMBER_MEANINGS: Record<number, Meaning> = {
  1: { is: "1 is the leader", feels: "you want to do it your way", does: "start it yourself" },
  2: { is: "2 is the peacemaker", feels: "you feel others quickly", does: "work with someone, not alone" },
  3: { is: "3 is the storyteller", feels: "happy and creative", does: "share your idea" },
  4: { is: "4 is the builder", feels: "solid and careful", does: "make a simple plan and follow it" },
  5: { is: "5 is the free bird", feels: "restless and fun", does: "give yourself one healthy change" },
  6: { is: "6 is the carer", feels: "loving and responsible", does: "help at home, but keep some care for you" },
  7: { is: "7 is the thinker", feels: "quiet and deep", does: "read, study, sit alone a while" },
  8: { is: "8 is the manager", feels: "strong about money and power", does: "handle one money job today" },
  9: { is: "9 is the big heart", feels: "kind to everyone", does: "give something away" },
  11: { is: "11 is the bright light, a master number", feels: "sensitive and inspired", does: "trust the feeling, then check it" },
  22: { is: "22 is the master builder", feels: "big dreams that can be real", does: "break the dream into small steps" },
  33: { is: "33 is the master teacher", feels: "you want to lift others", does: "teach one person one thing" },
};

/** Moon phases, in kid words. */
export const PHASE_MEANINGS: Record<string, Meaning> = {
  new: { is: "a new Moon is a fresh start", feels: "quiet and open", does: "plant one small wish" },
  waxing: { is: "a growing Moon builds up", feels: "energy rising", does: "keep going, add a little each day" },
  full: { is: "a full Moon shows everything", feels: "bright and emotional", does: "finish, celebrate, then rest" },
  waning: { is: "a shrinking Moon clears out", feels: "tired but lighter", does: "let go, clean, say no" },
};

const PLANET_KEYS = Object.keys(PLANET_MEANINGS);
const ASPECT_KEYS = Object.keys(ASPECT_MEANINGS);

/** Every meaning the given text mentions, in the order it appears. */
export function meaningsIn(text: string, limit = 6): Meaning[] {
  const found: Meaning[] = [];
  const seen = new Set<string>();
  const add = (key: string, m?: Meaning) => {
    if (!m || seen.has(key) || found.length >= limit) return;
    seen.add(key);
    found.push(m);
  };

  for (const p of PLANET_KEYS) {
    if (new RegExp(`\\b${p}\\b`).test(text)) add(`p:${p}`, PLANET_MEANINGS[p]);
  }
  const lower = text.toLowerCase();
  for (const a of ASPECT_KEYS) {
    if (lower.includes(a)) add(`a:${a}`, ASPECT_MEANINGS[a]);
  }
  for (const m of text.matchAll(/\bH(\d{1,2})\b|\bhouse\s*(\d{1,2})\b/gi)) {
    const n = Number(m[1] ?? m[2]);
    if (n >= 1 && n <= 12) add(`h:${n}`, HOUSE_MEANINGS[n]);
  }
  for (const m of lower.matchAll(/\bsign\s*(\d{1,2})\b/g)) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 12) add(`s:${n}`, SIGN_MEANINGS[n]);
  }
  for (const m of lower.matchAll(/\b(life path|destiny|soul urge|personality|mulank|bhagyank|namank)\D{0,12}(\d{1,2})\b/g)) {
    const n = Number(m[2]);
    if (NUMBER_MEANINGS[n]) add(`n:${n}`, NUMBER_MEANINGS[n]);
  }
  for (const key of Object.keys(PHASE_MEANINGS)) {
    if (lower.includes(`${key} moon`)) add(`ph:${key}`, PHASE_MEANINGS[key]);
  }
  return found;
}
