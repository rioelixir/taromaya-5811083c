// Five tarot decks the user can pull from on the canvas.
// Rider-Waite reuses the classic 78-card set from tarot-deck.ts.
// The four themed decks are generated with meaningful, human names + keywords.

import { TAROT_DECK, type TarotCard } from "./tarot-deck";

export type DeckKey = "rider-waite" | "nakshatra" | "health" | "lost-found" | "soulmates";

export type DeckMeta = {
  key: DeckKey;
  name: string;
  shortName: string;
  tagline: string;
  count: number;
  accent: string; // hex
  glyph: string;
};

// ------------ Nakshatra deck (27) ------------
const NAKSHATRAS: { name: string; deity: string; theme: string; shadow: string }[] = [
  { name: "Ashwini",       deity: "Ashwini Kumaras", theme: "fresh start, healing, speed",       shadow: "impatience, rushing in" },
  { name: "Bharani",       deity: "Yama",            theme: "carrying weight, discipline, rebirth", shadow: "burnout, holding on too long" },
  { name: "Krittika",      deity: "Agni",            theme: "cutting through, honest fire",       shadow: "harsh words, cruelty" },
  { name: "Rohini",        deity: "Brahma",          theme: "beauty, growth, sweetness",          shadow: "possessiveness, indulgence" },
  { name: "Mrigashira",    deity: "Soma",            theme: "searching, curiosity, gentleness",   shadow: "restlessness, never landing" },
  { name: "Ardra",         deity: "Rudra",           theme: "storm, breakthrough, tears",         shadow: "destructive moods" },
  { name: "Punarvasu",     deity: "Aditi",           theme: "return home, second chances",        shadow: "clinging to the past" },
  { name: "Pushya",        deity: "Brihaspati",      theme: "nourishment, care, wise counsel",    shadow: "smothering, over-serving" },
  { name: "Ashlesha",      deity: "Nagas",           theme: "intuition, subtle knowing",          shadow: "manipulation, coiled anger" },
  { name: "Magha",         deity: "Pitris",          theme: "ancestral strength, lineage pride",  shadow: "ego, entitlement" },
  { name: "Purva Phalguni",deity: "Bhaga",           theme: "pleasure, romance, play",            shadow: "laziness, drama" },
  { name: "Uttara Phalguni",deity:"Aryaman",         theme: "loyal partnership, contracts kept",  shadow: "rigidity, coldness" },
  { name: "Hasta",         deity: "Savitr",          theme: "skilled hands, craft, ease",         shadow: "trickery, over-cleverness" },
  { name: "Chitra",        deity: "Vishwakarma",     theme: "beauty, design, bright presence",    shadow: "vanity, illusion" },
  { name: "Swati",         deity: "Vayu",            theme: "independence, wind of change",       shadow: "scattered, blown around" },
  { name: "Vishakha",      deity: "Indra & Agni",    theme: "focused effort, reaching a goal",    shadow: "obsession, jealousy" },
  { name: "Anuradha",      deity: "Mitra",           theme: "friendship, quiet devotion",         shadow: "loneliness, hidden hurt" },
  { name: "Jyeshtha",      deity: "Indra",           theme: "elder wisdom, protective power",     shadow: "pride, isolation" },
  { name: "Mula",          deity: "Nirriti",         theme: "root work, digging to the truth",    shadow: "uprooting, chaos" },
  { name: "Purva Ashadha", deity: "Apas",            theme: "invincibility, spirited rise",       shadow: "over-confidence" },
  { name: "Uttara Ashadha",deity: "Vishvedevas",     theme: "final victory, steady climb",        shadow: "cold ambition" },
  { name: "Shravana",      deity: "Vishnu",          theme: "listening, learning, connection",    shadow: "gossip, distraction" },
  { name: "Dhanishta",     deity: "Vasus",           theme: "music, rhythm, abundance",           shadow: "harshness, drum-beating" },
  { name: "Shatabhisha",   deity: "Varuna",          theme: "healing mysteries, quiet magic",     shadow: "secrecy, isolation" },
  { name: "Purva Bhadrapada",deity:"Aja Ekapada",    theme: "sacred fire, spiritual intensity",   shadow: "fear, extremes" },
  { name: "Uttara Bhadrapada",deity:"Ahir Budhnya",  theme: "deep calm, kundalini wisdom",        shadow: "withdrawal, delay" },
  { name: "Revati",        deity: "Pushan",          theme: "safe passage, kindness, endings",    shadow: "getting lost, sorrow" },
];

const nakshatra: TarotCard[] = NAKSHATRAS.map((n, i) => ({
  id: `nak-${i + 1}`,
  name: n.name,
  arcana: "major",
  number: i + 1,
  keywords: [n.theme, `deity: ${n.deity}`],
  keywordsReversed: [n.shadow, "unbalanced energy"],
}));

// ------------ Themed deck generator (78 or 90 cards) ------------
// Builds evocative, human-readable card names by combining a symbol
// (like "The Doorway" or "Two of Rivers") with a theme-specific keyword set.

type Theme = {
  key: string;
  suits: string[]; // 6 short suit words
  suitKeyword: Record<string, [string, string]>; // upright, reversed
  majors: { name: string; up: string; rev: string }[]; // 22 or more
  extras?: { name: string; up: string; rev: string }[]; // for 90-card decks
};

const healthTheme: Theme = {
  key: "health",
  suits: ["Breath", "Bone", "Blood", "Roots"],
  suitKeyword: {
    Breath: ["calm, clarity, air",       "anxiety, hurry, held breath"],
    Bone:   ["structure, strength, rest", "stiffness, injury, overuse"],
    Blood:  ["vitality, warmth, feeling", "burnout, inflammation, worry"],
    Roots:  ["nourishment, ground, food", "depletion, poor sleep, drift"],
  },
  majors: [
    { name: "The Body",         up: "listen to your body",         rev: "ignoring signals" },
    { name: "The Healer",       up: "help is nearby",              rev: "self-blame" },
    { name: "The Sleep",        up: "deep rest, repair",           rev: "insomnia, tired mind" },
    { name: "The Meal",         up: "simple nourishment",          rev: "poor eating, skipping meals" },
    { name: "The Walk",         up: "gentle movement helps",       rev: "sitting too much" },
    { name: "The Sun",          up: "vitamin sun, warmth",         rev: "low light, low mood" },
    { name: "The Water",        up: "hydrate, flow",               rev: "dryness, headaches" },
    { name: "The Green",        up: "nature heals",                rev: "cut off from outside" },
    { name: "The Doctor",       up: "trust the check-up",          rev: "avoiding the visit" },
    { name: "The Recovery",     up: "you are mending",             rev: "pushing too soon" },
    { name: "The Balance",      up: "steady middle path",          rev: "swinging extremes" },
    { name: "The Immunity",     up: "quiet defense holds",         rev: "run down, catching things" },
    { name: "The Mind",         up: "clear thinking, calm nerves", rev: "overthinking, spirals" },
    { name: "The Heart",        up: "kind self-talk",              rev: "hard on yourself" },
    { name: "The Breath",       up: "one slow breath resets",      rev: "shallow breathing" },
    { name: "The Detox",        up: "gentle release, cleaner life",rev: "too aggressive a cleanse" },
    { name: "The Habit",        up: "small daily act, big change", rev: "chain broken, restart" },
    { name: "The Injury",       up: "listen, adjust, heal",        rev: "re-injury from denial" },
    { name: "The Second Wind",  up: "energy returns",              rev: "false lift, crash coming" },
    { name: "The Longevity",    up: "playing the long game",       rev: "fast fixes fail" },
    { name: "The Community",    up: "healing with others",         rev: "isolating in pain" },
    { name: "The Whole Self",   up: "body, mind and heart aligned",rev: "one part out of sync" },
  ],
};

const lostFoundTheme: Theme = {
  key: "lost-found",
  suits: ["Keys", "Maps", "Trails", "Signs"],
  suitKeyword: {
    Keys:   ["access, unlocking, memory return", "wrong door, forgetting again"],
    Maps:   ["direction, planning, overview",    "confusion, wrong route"],
    Trails: ["following clues, patience",        "false trail, going in circles"],
    Signs:  ["omens, small hints noticed",       "missed signals, denial"],
  },
  majors: [
    { name: "The Missing Thing",   up: "the object is closer than you think", rev: "still hidden, wait" },
    { name: "The Turned Corner",   up: "look where you already looked",       rev: "stop retracing, try new" },
    { name: "The Kind Stranger",   up: "help arrives, ask people",            rev: "no one saw anything" },
    { name: "The Backtrack",       up: "return to the last known place",      rev: "the trail is cold" },
    { name: "The Pocket",          up: "check what you're wearing",           rev: "you already searched here" },
    { name: "The Shelf",           up: "high up or behind other things",      rev: "not where you thought" },
    { name: "The Drawer",          up: "look in the obvious place again",     rev: "moved by someone else" },
    { name: "The Coat",            up: "clothing you haven't worn in a while",rev: "washed away, gone" },
    { name: "The Bag",             up: "inside a bag you use daily",          rev: "left in a different bag" },
    { name: "The Car",             up: "check the vehicle you last used",     rev: "not the car, elsewhere" },
    { name: "The Friend's House",  up: "left at a place you visited",         rev: "no one has seen it" },
    { name: "The Return Home",     up: "it will come back to you",            rev: "you must let it go" },
    { name: "The Old Photo",       up: "memory returns, story clarified",     rev: "misremembering" },
    { name: "The Lost Person",     up: "you'll reconnect, reach out first",   rev: "they aren't ready yet" },
    { name: "The Lost Way",        up: "pause, breathe, orient",              rev: "keep wandering" },
    { name: "The Lost Voice",      up: "your words come back",                rev: "silence for now" },
    { name: "The Found Answer",    up: "clarity arrives simply",              rev: "the question was wrong" },
    { name: "The Found Coin",      up: "small luck, a nudge from life",       rev: "just noise, not a sign" },
    { name: "The Found Note",      up: "a message meant for you",             rev: "misread the meaning" },
    { name: "The Found Path",      up: "your route is clear now",             rev: "detour needed" },
    { name: "The Found Peace",     up: "closure, quiet inside",               rev: "not yet, be gentle" },
    { name: "The Search Ends",     up: "you can stop looking",                rev: "one more place to check" },
  ],
};

const soulmatesTheme: Theme = {
  key: "soulmates",
  suits: ["Hearts", "Vows", "Threads", "Sparks"],
  suitKeyword: {
    Hearts:  ["feelings, softness, care",     "hurt, closed heart, cold"],
    Vows:    ["commitment, promise, trust",   "broken word, unclear terms"],
    Threads: ["fate, timing, karmic pull",    "tangled ties, wrong time"],
    Sparks:  ["chemistry, passion, magnetism","fizzle, mixed signals"],
  },
  majors: [
    { name: "The First Meeting",   up: "meaningful encounter ahead",       rev: "already met, didn't notice" },
    { name: "The Recognition",     up: "the deep 'I know you' moment",     rev: "familiar but unsafe" },
    { name: "The Timing",          up: "right person, right window",       rev: "right person, wrong time" },
    { name: "The Distance",        up: "space that makes you both grow",   rev: "distance that quietly ends it" },
    { name: "The Confession",      up: "speak the true feeling",           rev: "the truth stays unsaid" },
    { name: "The First Kiss",      up: "tender beginning",                 rev: "regret, not ready" },
    { name: "The Long Talk",       up: "hours pass like minutes",          rev: "surface chatter, no depth" },
    { name: "The Shared Silence",  up: "peaceful togetherness",            rev: "cold silence, avoidance" },
    { name: "The Mirror Lover",    up: "they show you yourself",           rev: "you avoid the mirror" },
    { name: "The Karmic Lover",    up: "old lesson, honest ending",        rev: "repeating the loop" },
    { name: "The Twin Flame",      up: "intense, transformative bond",     rev: "too hot to hold" },
    { name: "The Slow Burn",       up: "love that grows quietly",          rev: "you missed the ember" },
    { name: "The Second Chance",   up: "reunion possible",                 rev: "keep the past in the past" },
    { name: "The Chosen Family",   up: "love with your people",            rev: "old wounds resurface" },
    { name: "The Wedding",         up: "sacred union, promise made",       rev: "cold feet, delay" },
    { name: "The Home",            up: "building a shared life",           rev: "not on the same page" },
    { name: "The Child",           up: "creating something together",      rev: "different visions" },
    { name: "The Farewell",        up: "kind release, love remembered",    rev: "clinging, prolonged pain" },
    { name: "The Reunion",         up: "coming back together",             rev: "the door has closed" },
    { name: "The Alone Time",      up: "loving yourself first",            rev: "loneliness, waiting" },
    { name: "The Self-Love",       up: "you are already whole",            rev: "seeking through another" },
    { name: "The Guide",           up: "someone loves you into growth",    rev: "you're teaching, not receiving" },
  ],
  extras: [
    { name: "The Message",       up: "a message arrives soon",             rev: "no reply, let it be" },
    { name: "The Old Flame",     up: "old love resurfaces",                rev: "leave the past sleeping" },
    { name: "The New Face",      up: "someone new is coming",              rev: "not who you expected" },
    { name: "The Green Flag",    up: "safe, warm, kind partner",           rev: "too good, verify slowly" },
    { name: "The Red Flag",      up: "trust the warning",                  rev: "not what it seems" },
    { name: "The Chemistry",     up: "electric attraction",                rev: "chemistry, no compatibility" },
    { name: "The Compatibility", up: "values line up",                     rev: "fun, but not aligned" },
    { name: "The Family Blessing",up:"loved ones approve",                 rev: "outside voices interfere" },
    { name: "The Long Wait",     up: "patience is protecting you",         rev: "you've waited long enough" },
    { name: "The Yes",           up: "clear yes from the universe",        rev: "answer is not now" },
  ],
};

const suitRanks = [
  { n: 1,  name: "Ace"  },
  { n: 2,  name: "Two"  },
  { n: 3,  name: "Three"},
  { n: 4,  name: "Four" },
  { n: 5,  name: "Five" },
  { n: 6,  name: "Six"  },
  { n: 7,  name: "Seven"},
  { n: 8,  name: "Eight"},
  { n: 9,  name: "Nine" },
  { n: 10, name: "Ten"  },
  { n: 11, name: "Page" },
  { n: 12, name: "Knight"},
  { n: 13, name: "Queen"},
  { n: 14, name: "King" },
];

function buildThemedDeck(theme: Theme): TarotCard[] {
  const majors: TarotCard[] = theme.majors.map((m, i) => ({
    id: `${theme.key}-m-${i}`,
    name: m.name,
    arcana: "major",
    number: i,
    keywords: [m.up],
    keywordsReversed: [m.rev],
  }));
  const minors: TarotCard[] = theme.suits.flatMap((suit) =>
    suitRanks.map<TarotCard>((r) => ({
      id: `${theme.key}-${suit}-${r.n}`,
      name: `${r.name} of ${suit}`,
      arcana: "minor",
      number: r.n,
      keywords: [theme.suitKeyword[suit][0], `${r.name.toLowerCase()} energy`],
      keywordsReversed: [theme.suitKeyword[suit][1], `blocked ${r.name.toLowerCase()}`],
    })),
  );
  const extras: TarotCard[] = (theme.extras ?? []).map((m, i) => ({
    id: `${theme.key}-x-${i}`,
    name: m.name,
    arcana: "major",
    number: 100 + i,
    keywords: [m.up],
    keywordsReversed: [m.rev],
  }));
  return [...majors, ...minors, ...extras];
}

const health = buildThemedDeck(healthTheme);       // 22 + 56 = 78
const lostFound = buildThemedDeck(lostFoundTheme); // 22 + 56 = 78
const soulmates = buildThemedDeck(soulmatesTheme); // 22 + 56 + 10 = 88 -> need 90

// Top up soulmates to 90.
if (soulmates.length < 90) {
  const filler = [
    { name: "The Whisper",    up: "quiet inner yes", rev: "quiet inner no" },
    { name: "The Full Circle",up: "the story completes", rev: "one more chapter left" },
  ];
  filler.slice(0, 90 - soulmates.length).forEach((m, i) => {
    soulmates.push({
      id: `soulmates-x2-${i}`,
      name: m.name,
      arcana: "major",
      number: 200 + i,
      keywords: [m.up],
      keywordsReversed: [m.rev],
    });
  });
}

// ------------ Registry ------------
export const DECKS: Record<DeckKey, TarotCard[]> = {
  "rider-waite": TAROT_DECK,
  "nakshatra":   nakshatra,
  "health":      health,
  "lost-found":  lostFound,
  "soulmates":   soulmates,
};

export const DECK_LIST: DeckMeta[] = [
  { key: "rider-waite", name: "Rider–Waite",   shortName: "Rider–Waite", tagline: "the classic 78-card deck",   count: DECKS["rider-waite"].length, accent: "#F5C56B", glyph: "✦" },
  { key: "nakshatra",   name: "Nakshatra",     shortName: "Nakshatra",   tagline: "27 Vedic star energies",     count: DECKS["nakshatra"].length,   accent: "#C0C7FF", glyph: "☾" },
  { key: "health",      name: "Health",        shortName: "Health",      tagline: "78 cards for body & mind",   count: DECKS["health"].length,      accent: "#7FE6C4", glyph: "❋" },
  { key: "lost-found",  name: "Lost & Found",  shortName: "Lost & Found",tagline: "78 cards to find your way",  count: DECKS["lost-found"].length,  accent: "#E58CB4", glyph: "✧" },
  { key: "soulmates",   name: "Soulmates",     shortName: "Soulmates",   tagline: "90 cards on love & bonds",   count: DECKS["soulmates"].length,   accent: "#B79BFF", glyph: "♡" },
];
