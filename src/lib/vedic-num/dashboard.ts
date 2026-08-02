/**
 * Everything the Vedic Numerology home dashboard shows: lucky factors, the
 * universal numbers of the day, the active Mahadasha ladder and the daily
 * guidance line. All values come from the audited engines — nothing random.
 */
import { reduce } from "@/lib/numerology";
import { vedicNumerology, VEDIC_PLANETS } from "@/lib/vedic-numerology";
import { dashaAt, personalCycles, type Period } from "@/lib/numerology-dasha";

export const LUCKY_DIRECTION: Record<number, string> = {
  1: "East", 2: "North West", 3: "North East", 4: "South West", 5: "North",
  6: "South East", 7: "West", 8: "South", 9: "South (upper)",
};
export const LUCKY_TIME: Record<number, string> = {
  1: "Sunrise to 9 am", 2: "8 pm to 10 pm", 3: "10 am to noon", 4: "Dusk, 6 pm to 8 pm",
  5: "Late morning, 10 am to 1 pm", 6: "Evening, 5 pm to 7 pm", 7: "Pre dawn, 4 am to 6 am",
  8: "Late afternoon, 3 pm to 5 pm", 9: "Midday, noon to 2 pm",
};
export const LUCKY_METAL: Record<number, string> = {
  1: "Copper", 2: "Silver", 3: "Gold", 4: "Steel", 5: "Brass",
  6: "Silver", 7: "White metal", 8: "Iron", 9: "Copper",
};

const DAILY_ADVICE: Record<number, string> = {
  1: "Start the one task you have been postponing. Today rewards initiative more than consultation.",
  2: "Move through people. A short honest conversation settles more today than any amount of effort alone.",
  3: "Speak, write or present. Visibility works in your favour, so put your thinking where it can be seen.",
  4: "Do the unglamorous work: paperwork, checks, backups. What you tidy today prevents a loss later.",
  5: "Stay flexible. Plans will shift and the change is usually an upgrade if you do not fight it.",
  6: "Attend to home and health. One act of care for family carries further than a work win today.",
  7: "Work quietly and alone for a stretch. Depth, review and study suit the day better than meetings.",
  8: "Handle money, authority and commitments squarely. Keep every record clean and claim what is owed.",
  9: "Finish and release. Close a pending matter rather than opening a new one.",
};
const DAILY_MOTIVATION: Record<number, string> = {
  1: "You do not need permission to begin.",
  2: "Patience is a strategy, not a delay.",
  3: "Your voice is the shortest route to your opportunity.",
  4: "Steady hands build what luck cannot.",
  5: "Change is only chaos until you use it.",
  6: "Care given at home returns as strength outside it.",
  7: "Silence is where clarity is manufactured.",
  8: "Responsibility is the price of real power.",
  9: "Completion clears the ground for what is next.",
};

const digits = (n: number) => String(Math.abs(Math.trunc(n))).split("").reduce((s, c) => s + Number(c), 0);

export type Snapshot = {
  ok: boolean;
  driver: number;
  conductor: number;
  nameNumber: number | null;
  personalYear: number;
  personalMonth: number;
  personalDay: number;
  universalYear: number;
  universalMonth: number;
  universalDay: number;
  luckyNumber: number;
  luckyNumbers: number[];
  luckyColour: string;
  luckyColours: string[];
  luckyDirection: string;
  luckyTime: string;
  luckyDay: string;
  luckyMetal: string;
  luckyPlanet: string;
  gems: string[];
  mantras: string[];
  maha: Period | null;
  antar: Period | null;
  pratyantar: Period | null;
  advice: string;
  motivation: string;
  summary: string;
  yearTheme: string;
};

const EMPTY: Snapshot = {
  ok: false, driver: 0, conductor: 0, nameNumber: null,
  personalYear: 0, personalMonth: 0, personalDay: 0,
  universalYear: 0, universalMonth: 0, universalDay: 0,
  luckyNumber: 0, luckyNumbers: [], luckyColour: "—", luckyColours: [],
  luckyDirection: "—", luckyTime: "—", luckyDay: "—", luckyMetal: "—", luckyPlanet: "—",
  gems: [], mantras: [], maha: null, antar: null, pratyantar: null,
  advice: "Add a birth date to begin.", motivation: "", summary: "", yearTheme: "",
};

export function dashboardSnapshot(birthDate: string, fullName = "", when: Date = new Date()): Snapshot {
  let vedic: ReturnType<typeof vedicNumerology>;
  try {
    vedic = vedicNumerology(birthDate, fullName);
  } catch {
    return EMPTY;
  }
  const cycles = personalCycles(birthDate, when);
  const ladder = dashaAt(birthDate, when);
  const uy = reduce(digits(when.getFullYear()), false);
  const um = reduce(uy + (when.getMonth() + 1), false);
  const ud = reduce(um + when.getDate(), false);
  const driver = vedic.mulank;

  return {
    ok: true,
    driver,
    conductor: vedic.bhagyank,
    nameNumber: vedic.namank,
    personalYear: cycles.personalYear,
    personalMonth: cycles.personalMonth,
    personalDay: cycles.personalDay,
    universalYear: uy,
    universalMonth: um,
    universalDay: ud,
    luckyNumber: vedic.luckyNumbers[0] ?? driver,
    luckyNumbers: vedic.luckyNumbers,
    luckyColour: vedic.luckyColors[0] ?? "—",
    luckyColours: vedic.luckyColors,
    luckyDirection: LUCKY_DIRECTION[driver] ?? "—",
    luckyTime: LUCKY_TIME[driver] ?? "—",
    luckyDay: vedic.luckyDays[0] ?? "—",
    luckyMetal: LUCKY_METAL[driver] ?? "—",
    luckyPlanet: VEDIC_PLANETS[driver] ?? "—",
    gems: vedic.gems,
    mantras: vedic.mantras,
    maha: ladder?.maha ?? null,
    antar: ladder?.antar ?? null,
    pratyantar: ladder?.pratyantar ?? null,
    advice: DAILY_ADVICE[cycles.personalDay] ?? "",
    motivation: DAILY_MOTIVATION[cycles.personalDay] ?? "",
    yearTheme: cycles.theme,
    summary: [
      `Driver ${vedic.mulank} with conductor ${vedic.bhagyank}${vedic.namank ? ` and name number ${vedic.namank}` : ""}.`,
      `You are in a personal year ${cycles.personalYear}, personal month ${cycles.personalMonth} and personal day ${cycles.personalDay}.`,
      ladder ? `The ruling period is ${ladder.maha.planet} Mahadasha with ${ladder.antar.planet} Antardasha.` : "",
    ].filter(Boolean).join(" "),
  };
}

export function greeting(when: Date = new Date()): string {
  const h = when.getHours();
  if (h < 5) return "Still awake";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}
