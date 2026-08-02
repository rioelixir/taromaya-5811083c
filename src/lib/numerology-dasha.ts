// Vedic numerology period engine: Mahadasha, Antardasha, Pratyantar Dasha,
// personal year/month/day, date-wise prediction, multi-year forecast, and the
// "current" Lo Shu grid.
//
// Methodology (deterministic, documented):
//   * Number periods run in the natural order 1..9, starting from the Mulank
//     (birth-day number) at the moment of birth. Each number rules a period of
//     as many years as the number itself, so one full round is
//     1+2+...+9 = 45 years and the sequence then repeats.
//   * Antardasha divides a Mahadasha into nine sub-periods in the same 1..9
//     order starting from the Mahadasha lord, each sized in proportion
//     (sub/45) of the parent period. Pratyantar repeats the rule one level
//     deeper. This mirrors the proportional logic of Vimshottari Dasha.
//   * A tropical year is taken as 365.2425 days so long spans stay accurate.
//   * Personal Year = reduce(birth month) + reduce(birth day) + reduce(year),
//     reduced to 1..9. Personal Month adds the calendar month; Personal Day
//     adds the calendar day. Master numbers are not preserved in this Vedic
//     layer, matching classroom practice.

const YEAR_DAYS = 365.2425;
const DAY_MS = 86400000;

const digitSum = (n: number) => String(Math.abs(Math.trunc(n))).split("").reduce((s, c) => s + Number(c), 0);
function root9(n: number): number {
  let x = Math.abs(Math.trunc(n));
  while (x > 9) x = digitSum(x);
  return x;
}

export const NUMBER_PLANET: Record<number, string> = {
  1: "Sun", 2: "Moon", 3: "Jupiter", 4: "Rahu", 5: "Mercury",
  6: "Venus", 7: "Ketu", 8: "Saturn", 9: "Mars",
};

export const PERIOD_THEME: Record<number, { focus: string; opportunities: string[]; challenges: string[] }> = {
  1: {
    focus: "Independence, identity and starting things in your own name.",
    opportunities: ["Launching your own work or brand", "Promotion into a visible role", "Recovery of self-respect after a passive phase"],
    challenges: ["Ego clashes with seniors or elders", "Impatience with slow partners", "Blood pressure, eyes and heat in the body"],
  },
  2: {
    focus: "Partnership, emotion, home and the reading of moods.",
    opportunities: ["Marriage, alliances and mediation", "Work involving the public, water, liquids or care", "Support from the mother or from women in authority"],
    challenges: ["Over-thinking and mood swings", "Dependence on one person's approval", "Sleep, digestion and anxiety"],
  },
  3: {
    focus: "Learning, teaching, expansion and reputation.",
    opportunities: ["Study, certification, publishing and speaking", "Guidance from a teacher or mentor", "Children, ceremonies and religious work"],
    challenges: ["Over-promising and scattering energy", "Weight, liver and sugar", "Spending on show rather than substance"],
  },
  4: {
    focus: "Unconventional routes, systems, technology and foreign links.",
    opportunities: ["Technical skill, research, data and machines", "Foreign travel, visas and outside contracts", "Rebuilding something that was broken"],
    challenges: ["Paperwork errors and hidden clauses", "Sudden reversals and rumours", "Nervous system, skin and irregular sleep"],
  },
  5: {
    focus: "Trade, speech, movement and quick intelligence.",
    opportunities: ["Sales, brokerage, writing and negotiation", "Short courses and skill switching", "Multiple income lines"],
    challenges: ["Too many options, no completion", "Loose speech that costs trust", "Nerves, skin and overuse of the phone"],
  },
  6: {
    focus: "Home, comfort, beauty, vehicles and relationships.",
    opportunities: ["Marriage, property, vehicles and interiors", "Creative, fashion, food and hospitality work", "Reconciliation inside the family"],
    challenges: ["Indulgence and over-spending on comfort", "Triangles and unclear commitments", "Kidneys, sugar and reproductive health"],
  },
  7: {
    focus: "Research, faith, detachment and quiet correction.",
    opportunities: ["Deep specialisation, audit, medicine and spiritual practice", "Closing an old chapter cleanly", "Working alone with high quality"],
    challenges: ["Isolation mistaken for peace", "Delays that test faith", "Digestion, immunity and low energy"],
  },
  8: {
    focus: "Structure, discipline, karma and delayed but solid reward.",
    opportunities: ["Land, mining, law, insurance, heavy industry and long service", "Cleaning up finances and debts", "Authority that lasts"],
    challenges: ["Slow results and cold treatment from others", "Legal and tax scrutiny", "Bones, teeth, joints and chronic fatigue"],
  },
  9: {
    focus: "Drive, courage, competition and completion.",
    opportunities: ["Leadership under pressure, sports, defence, surgery and engineering", "Winning a contest that mattered", "Finishing what has dragged on"],
    challenges: ["Anger, accidents and burns", "Conflict with siblings or rivals", "Wounds, inflammation and blood"],
  },
};

export type BirthNumbers = { mulank: number; bhagyank: number; y: number; m: number; d: number };

export function birthNumbers(birthDate: string): BirthNumbers {
  const mt = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate.trim());
  if (!mt) throw new Error("Numerology periods: date must be YYYY-MM-DD");
  const y = Number(mt[1]), m = Number(mt[2]), d = Number(mt[3]);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) {
    throw new Error("Numerology periods: invalid calendar date");
  }
  return { mulank: root9(d), bhagyank: root9(digitSum(y) + digitSum(m) + digitSum(d)), y, m, d };
}

const nextNumber = (n: number) => (n === 9 ? 1 : n + 1);
/** Nine numbers in natural order starting from `start`. */
export function orderFrom(start: number): number[] {
  const out: number[] = [];
  let n = start;
  for (let i = 0; i < 9; i++) { out.push(n); n = nextNumber(n); }
  return out;
}

export type Period = {
  level: "maha" | "antar" | "pratyantar";
  lord: number;
  planet: string;
  start: Date;
  end: Date;
  years: number;
  focus: string;
  opportunities: string[];
  challenges: string[];
};

function mk(level: Period["level"], lord: number, start: Date, days: number): Period {
  const t = PERIOD_THEME[lord]!;
  return {
    level, lord, planet: NUMBER_PLANET[lord]!,
    start, end: new Date(start.getTime() + days * DAY_MS),
    years: days / YEAR_DAYS,
    focus: t.focus, opportunities: t.opportunities, challenges: t.challenges,
  };
}

/** Full Mahadasha ladder from birth for `spanYears` years. */
export function mahadashaTimeline(birthDate: string, spanYears = 100): Period[] {
  const { mulank } = birthNumbers(birthDate);
  const start = new Date(`${birthDate}T00:00:00Z`);
  const out: Period[] = [];
  let cursor = start;
  let lord = mulank;
  while ((cursor.getTime() - start.getTime()) / DAY_MS < spanYears * YEAR_DAYS) {
    const p = mk("maha", lord, cursor, lord * YEAR_DAYS);
    out.push(p);
    cursor = p.end;
    lord = nextNumber(lord);
  }
  return out;
}

/** Nine sub-periods of a parent period, proportional to lord size over 45. */
export function subPeriods(parent: Period, level: Period["level"]): Period[] {
  const totalDays = (parent.end.getTime() - parent.start.getTime()) / DAY_MS;
  const out: Period[] = [];
  let cursor = parent.start;
  for (const lord of orderFrom(parent.lord)) {
    const days = (totalDays * lord) / 45;
    const p = mk(level, lord, cursor, days);
    out.push(p);
    cursor = p.end;
  }
  return out;
}

export type DashaAt = {
  maha: Period;
  antar: Period;
  pratyantar: Period;
  mahaList: Period[];
  antarList: Period[];
  pratyantarList: Period[];
};

/** Maha, Antar and Pratyantar active on a given date. */
export function dashaAt(birthDate: string, when: Date): DashaAt | null {
  const t = when.getTime();
  const mahaList = mahadashaTimeline(birthDate, 120);
  const maha = mahaList.find((p) => t >= p.start.getTime() && t < p.end.getTime());
  if (!maha) return null;
  const antarList = subPeriods(maha, "antar");
  const antar = antarList.find((p) => t >= p.start.getTime() && t < p.end.getTime()) ?? antarList[0]!;
  const pratyantarList = subPeriods(antar, "pratyantar");
  const pratyantar = pratyantarList.find((p) => t >= p.start.getTime() && t < p.end.getTime()) ?? pratyantarList[0]!;
  return { maha, antar, pratyantar, mahaList, antarList, pratyantarList };
}

// ── Personal year, month, day ───────────────────────────────────────────────

export const PERSONAL_YEAR_THEME: Record<number, { theme: string; career: string; money: string; health: string; relationship: string }> = {
  1: { theme: "A beginning year. What you start now sets the tone for nine years.", career: "Take the lead role or start the venture you keep postponing.", money: "Income restarts from a new source; invest in your own skill first.", health: "Head, eyes and blood pressure. Early mornings suit you.", relationship: "You set the terms. Say what you want plainly." },
  2: { theme: "A pairing year. Progress comes through people, not force.", career: "Support roles, negotiation and quiet groundwork pay off.", money: "Joint funds and small steady gains rather than a jump.", health: "Sleep, digestion and anxiety need routine.", relationship: "Best year for marriage talks and repairs. Listen twice." },
  3: { theme: "A growing year. Learning, visibility and expression rise.", career: "Study, present, publish, teach or interview.", money: "Money flows in and out quickly; budget the show expenses.", health: "Liver, weight and sugar. Keep food simple.", relationship: "Social life widens; keep one promise at a time." },
  4: { theme: "A building year. Boring work now prevents later loss.", career: "Systems, documentation, technical depth and clean processes.", money: "Save and formalise. Avoid speculative shortcuts.", health: "Nerves and irregular sleep. Fix the schedule.", relationship: "Practical support matters more than romance." },
  5: { theme: "A moving year. Change, travel and offers arrive.", career: "Switching, selling, negotiating and short courses.", money: "Several small streams; guard against impulse spending.", health: "Skin, nerves and screen fatigue.", relationship: "Freedom is the theme. Do not confuse novelty with love." },
  6: { theme: "A home year. Family, comfort and responsibility come first.", career: "Client-facing, creative, food, beauty and property work.", money: "Spending on home and vehicles; keep one reserve untouched.", health: "Kidneys, sugar and reproductive health.", relationship: "Marriage, children and reconciliation are favoured." },
  7: { theme: "A quiet year. Depth beats speed.", career: "Research, audit, specialisation and skill polishing.", money: "Slow inflow; reduce fixed costs instead of chasing more.", health: "Immunity and digestion. Rest is treatment, not laziness.", relationship: "Space is needed. Explain the silence so it is not read as distance." },
  8: { theme: "A results year. Authority and accountability both grow.", career: "Ownership, legal structure, land, finance and long service.", money: "Largest gains of the cycle, with scrutiny attached. Stay clean.", health: "Bones, joints, teeth and fatigue.", relationship: "Duty-heavy. Protect time for the people at home." },
  9: { theme: "A closing year. Release what is finished before the next cycle.", career: "Complete, hand over and exit gracefully.", money: "Clear debts; avoid starting a long new commitment.", health: "Inflammation, wounds and old complaints resurfacing.", relationship: "Forgive or formally end. Do not begin something you cannot finish." },
};

export type PersonalCycles = {
  personalYear: number;
  personalMonth: number;
  personalDay: number;
  universalYear: number;
  universalDay: number;
  theme: string;
  career: string;
  money: string;
  health: string;
  relationship: string;
  yearWindow: { from: string; to: string };
};

export function personalCycles(birthDate: string, when: Date = new Date()): PersonalCycles {
  const { m, d } = birthNumbers(birthDate);
  const y = when.getUTCFullYear();
  const mo = when.getUTCMonth() + 1;
  const day = when.getUTCDate();
  const personalYear = root9(root9(m) + root9(d) + root9(y));
  const personalMonth = root9(personalYear + root9(mo));
  const personalDay = root9(personalMonth + root9(day));
  const t = PERSONAL_YEAR_THEME[personalYear]!;
  return {
    personalYear, personalMonth, personalDay,
    universalYear: root9(y),
    universalDay: root9(root9(y) + root9(mo) + root9(day)),
    theme: t.theme, career: t.career, money: t.money, health: t.health, relationship: t.relationship,
    yearWindow: { from: `${y}-01-01`, to: `${y}-12-31` },
  };
}

// ── Date-wise prediction and multi-year forecast ────────────────────────────

export type DatePrediction = {
  date: string;
  maha: Period | null;
  antar: Period | null;
  pratyantar: Period | null;
  cycles: PersonalCycles;
  summary: string;
};

export function predictForDate(birthDate: string, dateISO: string): DatePrediction {
  const when = new Date(`${dateISO}T12:00:00Z`);
  const dash = dashaAt(birthDate, when);
  const cycles = personalCycles(birthDate, when);
  const summary = dash
    ? `On ${dateISO} the major period belongs to ${dash.maha.lord} (${dash.maha.planet}), the sub-period to ${dash.antar.lord} (${dash.antar.planet}) and the fine period to ${dash.pratyantar.lord} (${dash.pratyantar.planet}), inside personal year ${cycles.personalYear}. ${dash.antar.focus} ${cycles.theme}`
    : `On ${dateISO} the date falls outside the calculated period ladder. Personal year ${cycles.personalYear}. ${cycles.theme}`;
  return { date: dateISO, maha: dash?.maha ?? null, antar: dash?.antar ?? null, pratyantar: dash?.pratyantar ?? null, cycles, summary };
}

export type ForecastRow = {
  year: number;
  personalYear: number;
  mahaLord: number;
  antarLord: number;
  pratyantarLord: number;
  headline: string;
};

export function multiYearForecast(birthDate: string, fromYear: number, count = 10): ForecastRow[] {
  const rows: ForecastRow[] = [];
  for (let i = 0; i < count; i++) {
    const year = fromYear + i;
    const when = new Date(Date.UTC(year, 6, 1));
    const dash = dashaAt(birthDate, when);
    const cycles = personalCycles(birthDate, when);
    rows.push({
      year,
      personalYear: cycles.personalYear,
      mahaLord: dash?.maha.lord ?? 0,
      antarLord: dash?.antar.lord ?? 0,
      pratyantarLord: dash?.pratyantar.lord ?? 0,
      headline: `${PERSONAL_YEAR_THEME[cycles.personalYear]!.theme}${dash ? ` Major period ${dash.maha.lord} with sub-period ${dash.antar.lord}.` : ""}`,
    });
  }
  return rows;
}

// ── Current (dynamic) Lo Shu grid ───────────────────────────────────────────

export type CurrentGrid = {
  cells: Record<number, number[]>;   // 1..9 → digits contributed
  counts: Record<number, number>;
  activeNumbers: number[];
  missingNumbers: number[];
  strongNumbers: number[];
  strengths: string[];
  weaknesses: string[];
  note: string;
};

const GRID_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6];

/**
 * The current grid adds today's date digits, the personal year and the running
 * dasha lords on top of the birth digits, so it shows which numbers are live
 * right now rather than at birth.
 */
export function currentGrid(birthDate: string, when: Date = new Date()): CurrentGrid {
  const { y, m, d, mulank, bhagyank } = birthNumbers(birthDate);
  const natal = `${y}${String(m).padStart(2, "0")}${String(d).padStart(2, "0")}`.split("").map(Number).filter((n) => n > 0);
  const today = `${when.getUTCFullYear()}${String(when.getUTCMonth() + 1).padStart(2, "0")}${String(when.getUTCDate()).padStart(2, "0")}`
    .split("").map(Number).filter((n) => n > 0);
  const cycles = personalCycles(birthDate, when);
  const dash = dashaAt(birthDate, when);
  const extra = [mulank, bhagyank, cycles.personalYear, cycles.personalMonth]
    .concat(dash ? [dash.maha.lord, dash.antar.lord] : []);

  const cells: Record<number, number[]> = {};
  const counts: Record<number, number> = {};
  for (const n of GRID_ORDER) { cells[n] = []; counts[n] = 0; }
  for (const digit of [...natal, ...today, ...extra]) {
    if (digit >= 1 && digit <= 9) { cells[digit]!.push(digit); counts[digit] = (counts[digit] ?? 0) + 1; }
  }
  const activeNumbers = GRID_ORDER.filter((n) => counts[n]! > 0).sort((a, b) => a - b);
  const missingNumbers = GRID_ORDER.filter((n) => counts[n] === 0).sort((a, b) => a - b);
  const strongNumbers = GRID_ORDER.filter((n) => counts[n]! >= 3).sort((a, b) => a - b);

  const STRONG: Record<number, string> = {
    1: "Leadership and visibility are strong right now.",
    2: "Emotional reading of people and partnership matters are strong.",
    3: "Learning, teaching and expression are strong.",
    4: "Technical and unconventional problem-solving is strong.",
    5: "Communication, trade and travel are strong.",
    6: "Home, comfort and creative work are strong.",
    7: "Research and inner work are strong.",
    8: "Discipline, structure and money handling are strong.",
    9: "Energy, courage and completion are strong.",
  };
  const WEAK: Record<number, string> = {
    1: "Self-assertion is thin; ask directly instead of hinting.",
    2: "Emotional patience is thin; do not decide on a low mood.",
    3: "Expression is thin; write things down before meetings.",
    4: "Order is thin; recheck documents and deadlines.",
    5: "Communication is thin; confirm messages twice.",
    6: "Home attention is thin; give family scheduled time.",
    7: "Reflection is thin; keep a short daily quiet slot.",
    8: "Financial discipline is thin; track spending weekly.",
    9: "Stamina is thin; protect sleep and avoid confrontation.",
  };
  return {
    cells, counts, activeNumbers, missingNumbers, strongNumbers,
    strengths: strongNumbers.map((n) => STRONG[n]!),
    weaknesses: missingNumbers.map((n) => WEAK[n]!),
    note: `Live numbers combine your birth digits with today's date, personal year ${cycles.personalYear}${dash ? ` and the running periods ${dash.maha.lord} and ${dash.antar.lord}` : ""}.`,
  };
}

// ── Practical recommendations ───────────────────────────────────────────────

export type Guidance = { area: string; advice: string }[];

const FRIENDLY: Record<number, number[]> = {
  1: [1, 2, 3, 5, 9], 2: [1, 2, 3, 5, 7], 3: [1, 2, 3, 5, 6, 7, 9],
  4: [1, 5, 6, 7, 8], 5: [1, 2, 3, 5, 6, 9], 6: [3, 4, 5, 6, 8, 9],
  7: [2, 3, 4, 6, 7], 8: [4, 5, 6, 8], 9: [1, 3, 5, 6, 9],
};

export function practicalGuidance(birthDate: string, when: Date = new Date()): Guidance {
  const { mulank, bhagyank } = birthNumbers(birthDate);
  const cycles = personalCycles(birthDate, when);
  const good = FRIENDLY[mulank]!.filter((n) => FRIENDLY[bhagyank]!.includes(n));
  const dates = good.flatMap((n) => [n, n + 9, n + 18, n + 27].filter((x) => x <= 31)).sort((a, b) => a - b);
  const CAREERS: Record<number, string> = {
    1: "administration, government, own brand, energy and leadership roles",
    2: "care, hospitality, water and dairy, counselling, human resources",
    3: "teaching, law, finance advisory, publishing, religious and cultural work",
    4: "technology, research, aviation, logistics, foreign trade",
    5: "sales, media, writing, brokerage, travel and communication",
    6: "design, fashion, food, beauty, property, entertainment",
    7: "medicine, audit, analytics, spirituality, chemicals and research",
    8: "law, land, mining, insurance, heavy industry, long-term service",
    9: "defence, sports, surgery, engineering, sports medicine and machinery",
  };
  return [
    { area: "Career and profession", advice: `Your best fit is ${CAREERS[bhagyank]}, entered through the style of number ${mulank}. In personal year ${cycles.personalYear}: ${cycles.career}` },
    { area: "Marriage and partner choice", advice: `Partners whose day number is ${good.join(", ")} suit you best. Avoid deciding during a number ${mulank === 8 ? 8 : 4} phase without paperwork clarity. ${cycles.relationship}` },
    { area: "Investment", advice: `Commit larger sums on dates ${dates.slice(0, 8).join(", ")} of a month. ${cycles.money}` },
    { area: "Business registration", advice: `Register so that the total of the registration date reduces to ${good[0] ?? mulank}, and keep the business name total friendly to ${bhagyank}.` },
    { area: "Meetings and contracts", advice: `Hold decisive meetings on dates reducing to ${good.slice(0, 3).join(" or ")}. Read clauses twice during a number 4 or 8 sub-period.` },
    { area: "Travel", advice: `Travel started on dates reducing to ${good.includes(5) ? 5 : (good[0] ?? mulank)} runs smoothly. Keep buffers during number 4 periods.` },
    { area: "Health", advice: cycles.health },
    { area: "Child naming", advice: `Choose a name whose Chaldean total reduces to ${good.join(", ")} against the child's own birth numbers, never against the parent's numbers.` },
    { area: "Projects", advice: `Begin on a personal day of ${good.slice(0, 2).join(" or ")}; review on a personal day of 7; close and hand over on a personal day of 9.` },
  ];
}

export { root9, GRID_ORDER };
