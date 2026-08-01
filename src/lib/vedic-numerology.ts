// Vedic (Indian) numerology engine + advanced Lo Shu grid layer.
//
// One documented school is used throughout so results never contradict
// each other between screens:
//   • Mulank  (driver / radical)  = birth day reduced to 1..9
//   • Bhagyank(conductor / destiny) = whole date of birth reduced to 1..9
//   • Namank  (name number)       = Chaldean letter values reduced to 1..9
//   • Kua/planet rulers are the classic Sun..Mars set (1..9).
//   • Number friendship is derived from planetary friendship and is
//     symmetric: if 6 is an enemy of 1, then 1 is an enemy of 6.

import { reduce, reducedName } from "@/lib/numerology";
import { loShuGrid, type LoShuGrid, type LoShuLineKey } from "@/lib/numerology-deep";

export type VedicNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export const VEDIC_PLANETS: Record<number, string> = {
  1: "Sun (Surya)",
  2: "Moon (Chandra)",
  3: "Jupiter (Guru)",
  4: "Rahu",
  5: "Mercury (Budh)",
  6: "Venus (Shukra)",
  7: "Ketu",
  8: "Saturn (Shani)",
  9: "Mars (Mangal)",
};

type Profile = {
  planet: string;
  nature: string;
  days: string[];
  colors: string[];
  gem: string;
  direction: string;
  mantra: string;
  career: string;
  caution: string;
};

const PROFILE: Record<number, Profile> = {
  1: {
    planet: VEDIC_PLANETS[1], nature: "Leader. Wants to be first, hates being told what to do.",
    days: ["Sunday", "Monday"], colors: ["Golden", "Orange", "Yellow"], gem: "Ruby",
    direction: "East", mantra: "Om Suryaya Namah",
    career: "Founder, boss, government work, anything where you sign the final page.",
    caution: "Pride and stubbornness. Ask for help before things break.",
  },
  2: {
    planet: VEDIC_PLANETS[2], nature: "Soft heart. Feels everything, works best beside someone.",
    days: ["Monday", "Friday"], colors: ["White", "Cream", "Light green"], gem: "Pearl",
    direction: "North-west", mantra: "Om Chandraya Namah",
    career: "Care work, teaching, hotels, water, art, partnerships.",
    caution: "Mood swings and overthinking. Sleep and routine fix most of it.",
  },
  3: {
    planet: VEDIC_PLANETS[3], nature: "Teacher and talker. Cheerful, learns fast, loves meaning.",
    days: ["Thursday", "Tuesday"], colors: ["Yellow", "Saffron", "Gold"], gem: "Yellow sapphire",
    direction: "North-east", mantra: "Om Gurave Namah",
    career: "Teaching, law, writing, advising, publishing, priesthood.",
    caution: "Talking more than doing. Finish one thing before starting three.",
  },
  4: {
    planet: VEDIC_PLANETS[4], nature: "Different thinker. Sees what others miss, dislikes rules.",
    days: ["Sunday", "Saturday"], colors: ["Grey", "Electric blue", "Khaki"], gem: "Gomed (hessonite)",
    direction: "South-west", mantra: "Om Rahave Namah",
    career: "Technology, research, machines, foreign work, unusual trades.",
    caution: "Sudden decisions and secrecy. Say plans out loud to someone you trust.",
  },
  5: {
    planet: VEDIC_PLANETS[5], nature: "Quick mind, quick tongue. Needs freedom and movement.",
    days: ["Wednesday", "Friday"], colors: ["Green", "Turquoise"], gem: "Emerald",
    direction: "North", mantra: "Om Budhaya Namah",
    career: "Business, trading, media, travel, coding, anything with talking.",
    caution: "Too many things at once. Pick two, drop the rest.",
  },
  6: {
    planet: VEDIC_PLANETS[6], nature: "Loves beauty, comfort and people. Warm and magnetic.",
    days: ["Friday", "Wednesday"], colors: ["White", "Pink", "Pastel blue"], gem: "Diamond or white sapphire",
    direction: "South-east", mantra: "Om Shukraya Namah",
    career: "Design, fashion, music, food, hospitality, luxury, beauty.",
    caution: "Spending and pleasing everyone. Keep a budget and a boundary.",
  },
  7: {
    planet: VEDIC_PLANETS[7], nature: "Quiet searcher. Feels unseen things, needs alone time.",
    days: ["Monday", "Sunday"], colors: ["Smoky grey", "Sea green", "White"], gem: "Cat's eye",
    direction: "South", mantra: "Om Ketave Namah",
    career: "Healing, spirituality, research, psychology, imagery, water work.",
    caution: "Drifting and doubting. A daily routine keeps your gifts usable.",
  },
  8: {
    planet: VEDIC_PLANETS[8], nature: "Slow, strong builder. Rewards arrive late but stay.",
    days: ["Saturday", "Friday"], colors: ["Dark blue", "Black", "Deep purple"], gem: "Blue sapphire",
    direction: "West", mantra: "Om Shanicharaya Namah",
    career: "Land, mining, law, iron, logistics, long-term business, service to workers.",
    caution: "Delay and heaviness. Honesty and patience remove most of the weight.",
  },
  9: {
    planet: VEDIC_PLANETS[9], nature: "Fighter with a good heart. Full of energy, hates injustice.",
    days: ["Tuesday", "Sunday"], colors: ["Red", "Coral", "Maroon"], gem: "Red coral",
    direction: "South", mantra: "Om Mangalaya Namah",
    career: "Sport, army, police, surgery, engineering, land, rescue work.",
    caution: "Anger and haste. Move your body daily so the heat has an exit.",
  },
};

// Symmetric friendship map (unordered pairs).
const FRIEND_GROUPS: number[][] = [[1, 2, 3, 9], [4, 5, 6, 8], [2, 7]];
const ENEMY_PAIRS: Array<[number, number]> = [
  [1, 6], [1, 8], [2, 4], [2, 8], [3, 5], [3, 6], [9, 4], [9, 5],
];

const key = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;
const FRIENDS = new Set<string>();
for (const g of FRIEND_GROUPS) {
  for (const a of g) for (const b of g) FRIENDS.add(key(a, b));
}
for (let n = 1; n <= 9; n++) FRIENDS.add(key(n, n));
const ENEMIES = new Set<string>(ENEMY_PAIRS.map(([a, b]) => key(a, b)));

export type Relation = "friend" | "neutral" | "enemy";

/** How two numbers 1..9 get along. Always symmetric. */
export function numberRelation(a: number, b: number): Relation {
  const k = key(a, b);
  if (ENEMIES.has(k)) return "enemy";
  if (FRIENDS.has(k)) return "friend";
  return "neutral";
}

export function relationSets(n: number): { friends: number[]; neutral: number[]; enemies: number[] } {
  const friends: number[] = [];
  const neutral: number[] = [];
  const enemies: number[] = [];
  for (let i = 1; i <= 9; i++) {
    const r = numberRelation(n, i);
    (r === "friend" ? friends : r === "enemy" ? enemies : neutral).push(i);
  }
  return { friends, neutral, enemies };
}

export type VedicNumerology = {
  mulank: number;          // driver — birth day
  bhagyank: number;        // conductor — whole date
  namank: number | null;   // name number (Chaldean), null when no name given
  kua: number;             // Lo Shu personal number (year based)
  mulankProfile: Profile;
  bhagyankProfile: Profile;
  namankProfile: Profile | null;
  harmony: {
    mulankBhagyank: Relation;
    mulankNamank: Relation | null;
    bhagyankNamank: Relation | null;
    score: number;         // 0..100, plain-language friendliness of the set
    note: string;
  };
  luckyDays: string[];
  luckyColors: string[];
  luckyNumbers: number[];
  avoidNumbers: number[];
  gems: string[];
  mantras: string[];
  personalYear: number;
  yearNote: string;
};

function ymd(birthDate: string): { y: number; m: number; d: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate.trim());
  if (!m) throw new Error("Vedic numerology: date must be YYYY-MM-DD");
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const probe = new Date(Date.UTC(y, mo - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) {
    throw new Error("Vedic numerology: invalid calendar date");
  }
  return { y, m: mo, d };
}

const digitSum = (n: number) => String(n).split("").reduce((s, c) => s + Number(c), 0);

/** Kua (personal Lo Shu number) — reduced birth year, 5 kept as 5. */
function kuaNumber(year: number): number {
  return reduce(digitSum(year), false);
}

export function vedicNumerology(birthDate: string, fullName = ""): VedicNumerology {
  const { y, m, d } = ymd(birthDate);
  const mulank = reduce(d, false);
  const bhagyank = reduce(digitSum(y) + digitSum(m) + digitSum(d), false);
  const trimmed = fullName.trim();
  const namank = trimmed ? reduce(reducedName(trimmed, "Chaldean"), false) : null;

  const mulankBhagyank = numberRelation(mulank, bhagyank);
  const mulankNamank = namank ? numberRelation(mulank, namank) : null;
  const bhagyankNamank = namank ? numberRelation(bhagyank, namank) : null;

  const points = (r: Relation | null) => (r === "friend" ? 100 : r === "neutral" ? 60 : 25);
  const parts = [mulankBhagyank, mulankNamank, bhagyankNamank].filter(
    (r): r is Relation => r !== null,
  );
  const score = Math.round(parts.reduce((s, r) => s + points(r), 0) / parts.length);
  const note =
    score >= 85
      ? "Your numbers pull in the same direction — plans usually move without a fight."
      : score >= 60
        ? "Your numbers mostly agree. A little planning smooths the rough days."
        : "Your numbers pull in different directions. Small daily habits matter more for you than big jumps.";

  const p1 = PROFILE[mulank];
  const p2 = PROFILE[bhagyank];
  const p3 = namank ? PROFILE[namank] : null;

  const setOf = (...arrays: string[][]) => Array.from(new Set(arrays.flat()));
  const friendsOfBoth = relationSets(mulank).friends.filter(
    (n) => numberRelation(bhagyank, n) !== "enemy",
  );
  const avoid = Array.from(
    new Set([...relationSets(mulank).enemies, ...relationSets(bhagyank).enemies]),
  ).sort((a, b) => a - b);

  const nowYear = new Date().getFullYear();
  const personalYear = reduce(digitSum(nowYear) + digitSum(m) + digitSum(d), false);

  return {
    mulank,
    bhagyank,
    namank,
    kua: kuaNumber(y),
    mulankProfile: p1,
    bhagyankProfile: p2,
    namankProfile: p3,
    harmony: { mulankBhagyank, mulankNamank, bhagyankNamank, score, note },
    luckyDays: setOf(p1.days, p2.days),
    luckyColors: setOf(p1.colors, p2.colors),
    luckyNumbers: friendsOfBoth,
    avoidNumbers: avoid,
    gems: setOf([p1.gem], [p2.gem]),
    mantras: setOf([p1.mantra], [p2.mantra]),
    personalYear,
    yearNote: YEAR_NOTES[personalYear],
  };
}

const YEAR_NOTES: Record<number, string> = {
  1: "A starting year. Begin the thing you keep postponing.",
  2: "A pairing year. Partners, patience and listening help most.",
  3: "A growing year. Learning, teaching and speaking up pay off.",
  4: "A building year. Boring, steady work now saves you later.",
  5: "A moving year. Travel, change and new offers arrive — pick carefully.",
  6: "A home year. Family, love and comfort take the front seat.",
  7: "A quiet year. Rest, study and inner work matter more than noise.",
  8: "A results year. Money and responsibility both grow. Stay honest.",
  9: "A closing year. Let go of what is finished so next year can start clean.",
};

// ─────────────────────────────────────────────────────────────
// ADVANCED LO SHU LAYER
// ─────────────────────────────────────────────────────────────

const MISSING_REMEDY: Record<number, string> = {
  1: "Face the rising sun for a few minutes each morning and make one decision a day entirely on your own.",
  2: "Keep a small water bowl or silver item at home, and speak to your mother or an elder woman often.",
  3: "Read something wise for ten minutes daily and wear yellow on Thursdays.",
  4: "Write your plans on paper instead of keeping them in your head; keep your desk tidy.",
  5: "Talk to one new person a week and walk daily — movement wakes this number up.",
  6: "Bring flowers or music into the house on Fridays and do one kind thing for someone you love.",
  7: "Sit quietly for five minutes a day with your eyes closed, no phone.",
  8: "Serve someone who has less than you on Saturdays and pay your bills on time.",
  9: "Exercise or play a sport regularly and speak up once when something feels unfair.",
};

const ARROW_MEANING: Record<LoShuLineKey, { strength: string; weakness: string }> = {
  thought: {
    strength: "A strong planning mind — you think a problem through before touching it.",
    weakness: "Ideas slip away. Write everything down the moment you think it.",
  },
  emotion: {
    strength: "A balanced heart — you feel deeply but stay standing.",
    weakness: "Feelings get bottled up. Say them out loud to one safe person.",
  },
  action: {
    strength: "You finish what you start. Plans turn into real things.",
    weakness: "Starting is hard. Do the smallest first step today, not the big one.",
  },
  intellect: {
    strength: "Sharp reasoning — good with detail, logic and study.",
    weakness: "Doubt slows learning. Learn one small thing every day.",
  },
  will: {
    strength: "Strong determination — hard to knock you off your path.",
    weakness: "You give up early. Choose one goal and keep a daily tick-mark.",
  },
  feelings: {
    strength: "Very sensitive to people; you read a room instantly.",
    weakness: "You may look cold when you are only quiet. Show small warmth on purpose.",
  },
  prosperity: {
    strength: "Money follows your work — a rare and lucky line.",
    weakness: "Money comes and goes. Save a fixed small amount before spending.",
  },
  spirituality: {
    strength: "Natural faith and inner guidance — trust the quiet voice.",
    weakness: "Life can feel meaningless at times. A simple daily prayer or gratitude note helps.",
  },
};

export type LoShuAdvanced = LoShuGrid & {
  /** Plain-language remedy for every missing number. */
  remedies: { number: number; planet: string; remedy: string }[];
  /** Arrow-by-arrow meaning, only for lines that are fully present or fully missing. */
  arrowNotes: { key: LoShuLineKey; kind: "strength" | "weakness"; note: string }[];
  /** Repeated numbers and what the excess does. */
  excess: { number: number; count: number; note: string }[];
  summary: string;
};

export function loShuAdvanced(birthDate: string): LoShuAdvanced {
  const grid = loShuGrid(birthDate);

  const remedies = grid.missing.map((n) => ({
    number: n,
    planet: VEDIC_PLANETS[n],
    remedy: MISSING_REMEDY[n],
  }));

  const arrowNotes: LoShuAdvanced["arrowNotes"] = [];
  for (const k of grid.arrows.strengths) {
    arrowNotes.push({ key: k, kind: "strength", note: ARROW_MEANING[k].strength });
  }
  for (const k of grid.arrows.weaknesses) {
    arrowNotes.push({ key: k, kind: "weakness", note: ARROW_MEANING[k].weakness });
  }

  const excess = Object.entries(grid.counts)
    .filter(([, c]) => c >= 3)
    .map(([n, c]) => ({
      number: Number(n),
      count: c,
      note: `${VEDIC_PLANETS[Number(n)]} is very loud in your chart. Its good side is easy for you; its rough side shows up when you are tired.`,
    }));

  const summary =
    `Your driver number is ${grid.driver} and your destiny number is ${grid.conductor}. ` +
    (grid.missing.length === 0
      ? "Every number is present — a full grid, which is rare."
      : `Missing numbers: ${grid.missing.join(", ")}. These are the habits life keeps asking you to build.`) +
    (arrowNotes.length ? ` You have ${grid.arrows.strengths.length} strong line(s) and ${grid.arrows.weaknesses.length} weak line(s).` : "");

  return { ...grid, remedies, arrowNotes, excess, summary };
}
