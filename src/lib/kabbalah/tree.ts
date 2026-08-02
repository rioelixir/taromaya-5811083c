/**
 * The Tree of Life: the ten Sephirot, their positions on the diagram, and the
 * Soul / Personality / Mission gematria calculations with the working shown
 * step by step so nothing is a black box.
 */
import { HEBREW_LETTERS, kabbalahReading, type HebrewLetter } from "@/lib/kabbalah-tarot";

export type Sephirah = {
  order: number;      // 1..10
  name: string;
  hebrew: string;
  title: string;      // English title
  pillar: "mercy" | "severity" | "balance";
  planet: string;
  virtue: string;
  vice: string;
  body: string;
  meaning: string;
  practice: string;
  x: number;          // diagram position, 0..100
  y: number;          // diagram position, 0..100
};

export const SEPHIROT: Sephirah[] = [
  { order: 1, name: "Kether", hebrew: "כתר", title: "Crown", pillar: "balance", planet: "First Swirlings", virtue: "Completion of the Great Work", vice: "None attributed", body: "Above the head", meaning: "Pure undivided will, before any form exists.", practice: "Sit for two minutes with no aim at all. Notice that you still exist without a goal.", x: 50, y: 4 },
  { order: 2, name: "Chokmah", hebrew: "חכמה", title: "Wisdom", pillar: "mercy", planet: "Zodiac", virtue: "Devotion", vice: "None attributed", body: "Right temple", meaning: "The first outward flash of force; insight before analysis.", practice: "Write the first answer that arrives before you begin reasoning.", x: 78, y: 18 },
  { order: 3, name: "Binah", hebrew: "בינה", title: "Understanding", pillar: "severity", planet: "Saturn", virtue: "Silence", vice: "Avarice", body: "Left temple", meaning: "Force given shape, limit and structure.", practice: "Turn one loose intention into a dated written plan.", x: 22, y: 18 },
  { order: 4, name: "Chesed", hebrew: "חסד", title: "Mercy", pillar: "mercy", planet: "Jupiter", virtue: "Obedience", vice: "Tyranny, hypocrisy", body: "Right arm", meaning: "Expansion, generosity and lawful authority.", practice: "Give something away that you would rather keep.", x: 78, y: 38 },
  { order: 5, name: "Geburah", hebrew: "גבורה", title: "Severity", pillar: "severity", planet: "Mars", virtue: "Courage, energy", vice: "Cruelty, destruction", body: "Left arm", meaning: "Correction, discipline and the removal of excess.", practice: "End one commitment that has quietly become a drain.", x: 22, y: 38 },
  { order: 6, name: "Tiphareth", hebrew: "תפארת", title: "Beauty", pillar: "balance", planet: "Sun", virtue: "Devotion to the Great Work", vice: "Pride", body: "Heart", meaning: "The balancing centre where all pairs are reconciled.", practice: "Name the one thing you would still do if nobody watched.", x: 50, y: 50 },
  { order: 7, name: "Netzach", hebrew: "נצח", title: "Victory", pillar: "mercy", planet: "Venus", virtue: "Unselfishness", vice: "Lust, restlessness", body: "Right hip", meaning: "Endurance, desire and the long patient push.", practice: "Repeat one small useful act daily for seven days.", x: 78, y: 66 },
  { order: 8, name: "Hod", hebrew: "הוד", title: "Splendour", pillar: "severity", planet: "Mercury", virtue: "Truthfulness", vice: "Dishonesty", body: "Left hip", meaning: "Intellect, speech, method and record keeping.", practice: "Write down what happened before you interpret what it meant.", x: 22, y: 66 },
  { order: 9, name: "Yesod", hebrew: "יסוד", title: "Foundation", pillar: "balance", planet: "Moon", virtue: "Independence", vice: "Idleness", body: "Reproductive centre", meaning: "The store of images, habits and dreams that shapes daily life.", practice: "Change one habit of input: what you read, watch or scroll first.", x: 50, y: 80 },
  { order: 10, name: "Malkuth", hebrew: "מלכות", title: "Kingdom", pillar: "balance", planet: "Earth", virtue: "Discrimination", vice: "Avarice, inertia", body: "Feet", meaning: "The finished world, where every idea is finally tested.", practice: "Complete one physical, visible task today.", x: 50, y: 95 },
];

/** The classical 22 paths as pairs of Sephirot, in path order 11..32. */
export const PATH_LINKS: { path: number; from: number; to: number }[] = [
  { path: 11, from: 1, to: 2 }, { path: 12, from: 1, to: 3 }, { path: 13, from: 1, to: 6 },
  { path: 14, from: 2, to: 3 }, { path: 15, from: 2, to: 6 }, { path: 16, from: 2, to: 4 },
  { path: 17, from: 3, to: 6 }, { path: 18, from: 3, to: 5 }, { path: 19, from: 4, to: 5 },
  { path: 20, from: 4, to: 6 }, { path: 21, from: 4, to: 7 }, { path: 22, from: 5, to: 6 },
  { path: 23, from: 5, to: 8 }, { path: 24, from: 6, to: 7 }, { path: 25, from: 6, to: 9 },
  { path: 26, from: 6, to: 8 }, { path: 27, from: 7, to: 8 }, { path: 28, from: 7, to: 9 },
  { path: 29, from: 7, to: 10 }, { path: 30, from: 8, to: 9 }, { path: 31, from: 8, to: 10 },
  { path: 32, from: 9, to: 10 },
];

export function sephirahFor(n: number): Sephirah {
  const idx = ((Math.abs(Math.trunc(n)) - 1) % 10 + 10) % 10;
  return SEPHIROT[idx]!;
}

export function letterFor(path: number): HebrewLetter | null {
  return HEBREW_LETTERS.find((l) => l.path === path) ?? null;
}

const VOWELS = new Set("AEIOU");
const clean = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z ]/g, " ");

export type Step = { label: string; detail: string };

export type KabNumber = {
  key: "soul" | "personality" | "mission";
  label: string;
  total: number;
  reduced: number;
  sephirah: Sephirah;
  letter: HebrewLetter | null;
  card: string | null;
  steps: Step[];
  reading: string;
};

function gematriaOf(text: string) {
  const r = kabbalahReading(text);
  return { total: r.total, cells: r.cells };
}

function reduce9(n: number): number {
  let x = Math.abs(Math.trunc(n));
  while (x > 9) x = String(x).split("").reduce((s, c) => s + Number(c), 0);
  return x;
}

const SOUL_READING: Record<number, string> = {
  1: "Your inner life is driven by the wish to originate. You are quietly restless until something is yours.",
  2: "Inwardly you need harmony and a witness. You feel most yourself when someone understands you accurately.",
  3: "Your soul asks to be expressed. Unspoken thought becomes heaviness for you faster than for most people.",
  4: "You want a safe ordered world. Security is not fear for you, it is the ground you build on.",
  5: "Your soul needs room. Any arrangement that cannot change will eventually be broken by you.",
  6: "You are moved by care and beauty. Being needed by the right people is your deepest satisfaction.",
  7: "Your soul seeks the truth behind appearances. Shallow company tires you more than hard work does.",
  8: "You want mastery and material proof. Achievement is how you measure your inner worth, so choose the measure carefully.",
  9: "Your soul is drawn to service and to endings. You feel complete when something is healed or finished.",
};
const PERSONALITY_READING: Record<number, string> = {
  1: "Others read you as direct and self-assured, sometimes before you feel it yourself.",
  2: "You come across as approachable and diplomatic; people bring you their problems.",
  3: "You appear lively, articulate and socially confident.",
  4: "You seem dependable and methodical; people trust you with details.",
  5: "You appear adaptable and quick, occasionally hard to pin down.",
  6: "You are seen as warm and responsible, the one who holds a group together.",
  7: "You seem reserved and observant; people assume depth before you speak.",
  8: "You project competence and authority; people expect you to decide.",
  9: "You appear generous and principled, with a certain distance.",
};
const MISSION_READING: Record<number, string> = {
  1: "Your work in this life is to lead something into existence that did not exist before.",
  2: "Your work is to join people, ideas or traditions that would not otherwise meet.",
  3: "Your work is to teach, express and make difficult things intelligible.",
  4: "Your work is to build a durable structure others can rely on after you.",
  5: "Your work is to move knowledge, goods or people across boundaries.",
  6: "Your work is to care, restore and make places worth returning to.",
  7: "Your work is to investigate and preserve what most people overlook.",
  8: "Your work is to hold responsibility at scale and use resources justly.",
  9: "Your work is to serve broadly and to bring cycles to a clean end.",
};

/** Soul, Personality and Mission numbers with the full working shown. */
export function kabNumbers(fullName: string): KabNumber[] {
  const letters = clean(fullName);
  const vowels = [...letters].filter((c) => VOWELS.has(c) || c === " ").join("");
  const consonants = [...letters].filter((c) => c === " " || (c >= "A" && c <= "Z" && !VOWELS.has(c))).join("");

  const build = (
    key: KabNumber["key"],
    label: string,
    source: string,
    sourceNote: string,
    reading: Record<number, string>,
  ): KabNumber => {
    const { total, cells } = gematriaOf(source);
    const reduced = reduce9(total);
    const pathIndex = total === 0 ? 1 : ((total - 1) % 22) + 1;
    const letter = HEBREW_LETTERS[pathIndex - 1] ?? null;
    return {
      key,
      label,
      total,
      reduced,
      sephirah: sephirahFor(reduced),
      letter,
      card: letter?.card ?? null,
      steps: [
        { label: "Step one", detail: sourceNote },
        {
          label: "Step two",
          detail: cells.length
            ? `Each letter becomes its Hebrew equivalent: ${cells.map((c) => `${c.source} to ${c.letter.name} ${c.letter.value}`).join(", ")}.`
            : "No usable letters were found in this name.",
        },
        { label: "Step three", detail: `The values are added: ${cells.map((c) => c.letter.value).join(" plus ") || "0"} equals ${total}.` },
        { label: "Step four", detail: `${total} reduces to ${reduced}, which is the Sephirah ${sephirahFor(reduced).name}, ${sephirahFor(reduced).title}.` },
        { label: "Step five", detail: letter ? `${total} also falls on path ${letter.path}, the letter ${letter.name} (${letter.hebrew}), carrying the card ${letter.card}.` : "No path could be assigned." },
      ],
      reading: reading[reduced] ?? "",
    };
  };

  return [
    build("soul", "Soul number", vowels, "Only the vowels of the name are used, because the vowels carry the inner voice.", SOUL_READING),
    build("personality", "Personality number", consonants, "Only the consonants are used, because they form the outer shape others meet first.", PERSONALITY_READING),
    build("mission", "Mission number", letters, "The complete name is used, because the whole name states the life task.", MISSION_READING),
  ];
}
