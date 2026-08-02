// Transit-driven horoscope engine.
// Computes real planetary positions across a period window and derives
// per-domain scores plus professional narrative that names the actual
// placement, the reason, the method and the timing.

import * as A from "astronomy-engine";
import { lahiriAyanamsa } from "./vedic";
import { SIGN_NAMES } from "./western";
import { RASHIS } from "./vedic";

export type Period = "Daily" | "Weekly" | "Monthly" | "Yearly";
export type DomainKey = "Personal" | "Health" | "Profession" | "Emotions" | "Travel" | "Luck";
export const DOMAINS: DomainKey[] = ["Personal", "Health", "Profession", "Emotions", "Travel", "Luck"];

const norm360 = (x: number) => ((x % 360) + 360) % 360;

function tropicalLon(body: A.Body, date: Date): number {
  const g = A.GeoVector(body, date, true);
  const e = A.RotateVector(A.Rotation_EQJ_ECT(date), g);
  return norm360((Math.atan2(e.y, e.x) * 180) / Math.PI);
}

/** Mean lunar north node (Rahu) longitude, tropical. */
function rahuLon(date: Date): number {
  const jd = (date.getTime() / 86400000) + 2440587.5;
  const T = (jd - 2451545.0) / 36525;
  return norm360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T);
}

export type MovingBody =
  | "Sun" | "Moon" | "Mercury" | "Venus" | "Mars" | "Jupiter" | "Saturn" | "Rahu" | "Ketu";

const BODIES: { name: MovingBody; body?: A.Body }[] = [
  { name: "Sun", body: A.Body.Sun },
  { name: "Moon", body: A.Body.Moon },
  { name: "Mercury", body: A.Body.Mercury },
  { name: "Venus", body: A.Body.Venus },
  { name: "Mars", body: A.Body.Mars },
  { name: "Jupiter", body: A.Body.Jupiter },
  { name: "Saturn", body: A.Body.Saturn },
  { name: "Rahu" },
  { name: "Ketu" },
];

export function bodyLongitude(name: MovingBody, date: Date, sidereal: boolean): number {
  let lon: number;
  if (name === "Rahu") lon = rahuLon(date);
  else if (name === "Ketu") lon = norm360(rahuLon(date) + 180);
  else lon = tropicalLon(BODIES.find((b) => b.name === name)!.body!, date);
  return sidereal ? norm360(lon - lahiriAyanamsa(date)) : lon;
}

function isRetrograde(name: MovingBody, date: Date): boolean {
  if (name === "Sun" || name === "Moon") return false;
  if (name === "Rahu" || name === "Ketu") return true;
  const before = bodyLongitude(name, new Date(date.getTime() - 43200000), false);
  const after = bodyLongitude(name, new Date(date.getTime() + 43200000), false);
  const d = ((after - before + 540) % 360) - 180;
  return d < 0;
}

// ---------- period windows ----------
export function periodWindow(period: Period, now: Date): { start: Date; end: Date; label: string } {
  const d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  if (period === "Daily") {
    const end = new Date(d0.getTime() + 86399000);
    return { start: d0, end, label: fmt(d0) };
  }
  if (period === "Weekly") {
    const start = new Date(d0.getTime() - ((d0.getDay() + 6) % 7) * 86400000);
    const end = new Date(start.getTime() + 7 * 86400000 - 1000);
    return { start, end, label: `${fmt(start)} to ${fmt(end)}` };
  }
  if (period === "Monthly") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { start, end, label: start.toLocaleDateString(undefined, { month: "long", year: "numeric" }) };
  }
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  return { start, end, label: String(now.getFullYear()) };
}

function samples(start: Date, end: Date, count: number): Date[] {
  const out: Date[] = [];
  const step = (end.getTime() - start.getTime()) / Math.max(1, count - 1);
  for (let i = 0; i < count; i++) out.push(new Date(start.getTime() + step * i));
  return out;
}

// ---------- domain model ----------
const DOMAIN_HOUSES: Record<DomainKey, number[]> = {
  Personal: [1, 5, 7],
  Health: [1, 6, 8],
  Profession: [2, 6, 10, 11],
  Emotions: [4, 8, 12],
  Travel: [3, 9, 12],
  Luck: [2, 5, 9, 11],
};

const DOMAIN_SIGNIFICATORS: Record<DomainKey, MovingBody[]> = {
  Personal: ["Venus", "Moon", "Sun", "Jupiter"],
  Health: ["Sun", "Mars", "Moon", "Saturn"],
  Profession: ["Sun", "Saturn", "Mars", "Mercury"],
  Emotions: ["Moon", "Venus", "Jupiter", "Ketu"],
  Travel: ["Mercury", "Moon", "Jupiter", "Rahu"],
  Luck: ["Jupiter", "Sun", "Mercury", "Venus"],
};

const BENEFIC: MovingBody[] = ["Jupiter", "Venus", "Moon", "Mercury"];
const MALEFIC: MovingBody[] = ["Saturn", "Mars", "Rahu", "Ketu", "Sun"];

// Classical upachaya / trine / kendra treatment measured from the sign.
const STRONG_HOUSES = new Set([1, 3, 5, 6, 7, 9, 10, 11]);
const DIFFICULT_HOUSES = new Set([4, 8, 12]);

const BODY_WEIGHT: Record<MovingBody, number> = {
  Sun: 8, Moon: 6, Mercury: 6, Venus: 7, Mars: 8,
  Jupiter: 12, Saturn: 12, Rahu: 8, Ketu: 7,
};

export type Placement = {
  planet: MovingBody;
  sign: string;
  signIndex: number;
  house: number;
  retrograde: boolean;
  degreeInSign: number;
};

export type DomainReading = {
  domain: DomainKey;
  score: number;                 // 0-100
  trend: "Rising" | "Steady" | "Testing";
  headline: string;
  what: string;                  // what is happening
  why: string;                   // which placements cause it
  how: string;                   // how to work with it
  when: string;                  // timing inside the window
  watch: string;                 // honest challenge
  drivers: Placement[];
};

export type SignReading = {
  sign: string;
  signIndex: number;
  system: "western" | "vedic";
  period: Period;
  windowLabel: string;
  overall: number;
  placements: Placement[];
  domains: DomainReading[];
  summary: string;
  lucky: { number: number; colour: string; direction: string; day: string; gemstone: string };
};

const COLOURS = ["Deep red","Pearl white","Coral","Emerald green","Golden yellow","Sky blue","Rose","Indigo","Saffron","Charcoal blue","Turquoise","Ivory"];
const DIRECTIONS = ["East","South-East","South","South-West","West","North-West","North","North-East"];
const GEMS = ["Ruby","Pearl","Red coral","Emerald","Yellow sapphire","Diamond","Blue sapphire","Hessonite","Cat's eye"];
const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function placementsFor(signIndex: number, date: Date, sidereal: boolean): Placement[] {
  const names = sidereal ? RASHIS : SIGN_NAMES;
  return BODIES.map(({ name }) => {
    const lon = bodyLongitude(name, date, sidereal);
    const si = Math.floor(lon / 30);
    return {
      planet: name,
      sign: names[si],
      signIndex: si,
      house: ((si - signIndex + 12) % 12) + 1,
      retrograde: isRetrograde(name, date),
      degreeInSign: lon - si * 30,
    };
  });
}

function scoreDomain(domain: DomainKey, placements: Placement[]): { score: number; drivers: Placement[] } {
  const houses = DOMAIN_HOUSES[domain];
  const sig = DOMAIN_SIGNIFICATORS[domain];
  let s = 55;
  const drivers: Placement[] = [];
  for (const p of placements) {
    const relevant = houses.includes(p.house) || sig.includes(p.planet);
    if (!relevant) continue;
    const w = BODY_WEIGHT[p.planet] / 12;
    let delta = 0;
    if (houses.includes(p.house)) {
      if (BENEFIC.includes(p.planet)) delta += STRONG_HOUSES.has(p.house) ? 9 : 4;
      else delta += STRONG_HOUSES.has(p.house) ? 4 : -9;
      if (DIFFICULT_HOUSES.has(p.house) && MALEFIC.includes(p.planet)) delta -= 4;
    }
    if (sig.includes(p.planet)) {
      delta += STRONG_HOUSES.has(p.house) ? 5 : -5;
    }
    if (p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu") delta -= 3;
    delta *= w;
    if (Math.abs(delta) >= 3) drivers.push(p);
    s += delta;
  }
  return {
    score: Math.max(18, Math.min(97, Math.round(s))),
    drivers: drivers.sort((a, b) => BODY_WEIGHT[b.planet] - BODY_WEIGHT[a.planet]).slice(0, 4),
  };
}

const HOUSE_MEANING: Record<number, string> = {
  1: "your own body, presence and first impressions",
  2: "earnings, savings, family resources and speech",
  3: "courage, short journeys, siblings and daily communication",
  4: "home, inner peace, property and the mother",
  5: "romance, children, creativity and study",
  6: "work routine, service, competition, debt and illness",
  7: "partnership, marriage and public agreements",
  8: "shared money, sudden change, research and endings",
  9: "fortune, long travel, teachers, faith and higher learning",
  10: "career standing, authority and public reputation",
  11: "gains, networks, elder circles and fulfilled wishes",
  12: "expenses, foreign matters, rest, retreat and sleep",
};

const PLANET_ROLE: Record<MovingBody, string> = {
  Sun: "authority, vitality and recognition",
  Moon: "mood, comfort and receptivity",
  Mercury: "thinking, paperwork, trade and travel logistics",
  Venus: "affection, comfort, beauty and negotiation",
  Mars: "drive, competition, machinery and physical energy",
  Jupiter: "expansion, guidance, funding and protection",
  Saturn: "structure, delay, discipline and long-term proof",
  Rahu: "ambition, unusual openings and restlessness",
  Ketu: "detachment, insight and quiet withdrawal",
};

const DOMAIN_FOCUS: Record<DomainKey, string> = {
  Personal: "your identity, close bonds and one-to-one relationships",
  Health: "vitality, sleep, digestion and physical resilience",
  Profession: "work output, standing, income and professional decisions",
  Emotions: "inner state, security and emotional processing",
  Travel: "movement, commuting, relocation and long journeys",
  Luck: "support, timing, opportunity and returns on effort",
};

function trendOf(score: number): DomainReading["trend"] {
  return score >= 68 ? "Rising" : score >= 48 ? "Steady" : "Testing";
}

function timingText(period: Period, window: { start: Date; end: Date }, moonPlacements: Placement[][], dates: Date[], domain: DomainKey): string {
  // Find the sample date whose placement set scores highest for this domain.
  let best = 0, bestI = 0, worst = 999, worstI = 0;
  moonPlacements.forEach((pl, i) => {
    const s = scoreDomain(domain, pl).score;
    if (s > best) { best = s; bestI = i; }
    if (s < worst) { worst = s; worstI = i; }
  });
  const fmt = (d: Date) =>
    period === "Daily"
      ? d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  if (period === "Daily") {
    return `The most supportive stretch falls around ${fmt(dates[bestI])}, and the flattest window is near ${fmt(dates[worstI])}. Place decisions in the first window and routine work in the second.`;
  }
  return `Within ${window.start.toLocaleDateString(undefined, { day: "numeric", month: "short" })} to ${window.end.toLocaleDateString(undefined, { day: "numeric", month: "short" })}, the strongest phase for ${domain.toLowerCase()} runs near ${fmt(dates[bestI])}, while ${fmt(dates[worstI])} asks for patience rather than initiative.`;
}

function joinNames(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function domainNarrative(
  domain: DomainKey,
  score: number,
  drivers: Placement[],
  placements: Placement[],
  period: Period,
  window: { start: Date; end: Date },
  series: Placement[][],
  dates: Date[],
): DomainReading {
  const trend = trendOf(score);
  const support = drivers.filter((d) => BENEFIC.includes(d.planet) && STRONG_HOUSES.has(d.house));
  const friction = drivers.filter((d) => MALEFIC.includes(d.planet) || DIFFICULT_HOUSES.has(d.house));
  const retro = placements.filter((p) => p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu");

  const why = drivers.length
    ? `${joinNames(drivers.map((d) => `${d.planet}${d.retrograde && d.planet !== "Rahu" && d.planet !== "Ketu" ? " retrograde" : ""} in ${d.sign}, house ${d.house} from your sign`))}. House ${drivers[0].house} governs ${HOUSE_MEANING[drivers[0].house]}, and ${drivers[0].planet} carries ${PLANET_ROLE[drivers[0].planet]}, so that combination sets the tone for ${DOMAIN_FOCUS[domain]}.`
    : `No fast-moving body is currently loading the houses that rule ${DOMAIN_FOCUS[domain]}, so this area stays close to its baseline.`;

  const what =
    trend === "Rising"
      ? `${domain} runs above your usual level this ${period.toLowerCase()} period. Effort placed here converts faster than normal because the supporting houses are occupied by cooperative planets.`
      : trend === "Steady"
      ? `${domain} sits in a workable middle band. Nothing forces change, so results follow the quality of your own routine rather than outside momentum.`
      : `${domain} is under review. The chart is not blocking you, it is testing method, timing and stamina before it releases results.`;

  const how =
    trend === "Rising"
      ? `Use the window deliberately: open the conversation, send the proposal, book the appointment, or make the commitment while ${support[0]?.planet ?? "the benefic transit"} still supports house ${support[0]?.house ?? drivers[0]?.house ?? 1}. Momentum here rewards speed with preparation.`
      : trend === "Steady"
      ? `Work the fundamentals. Fix one process, close one pending item and protect your schedule. Steady periods reward consolidation far more than fresh expansion.`
      : `Reduce scope and raise quality. Re-read documents, confirm details in writing, keep one buffer day around commitments and avoid arguing from a tired state.`;

  const when = timingText(period, window, series, dates, domain);

  const watch = friction.length
    ? `Be honest about the pressure point: ${joinNames(friction.map((f) => `${f.planet} in house ${f.house}`))} can bring ${friction[0].planet === "Saturn" ? "delay and extra proof of work" : friction[0].planet === "Mars" ? "haste, heat and avoidable conflict" : friction[0].planet === "Rahu" ? "over-reach and distraction" : friction[0].planet === "Ketu" ? "loss of interest at the wrong moment" : "unclear expectations"} in ${DOMAIN_FOCUS[domain]}.${retro.length ? ` ${joinNames(retro.map((r) => r.planet))} retrograde also asks you to revise before you launch.` : ""}`
    : `The main risk is complacency. A favourable window closes quietly if you postpone the practical step.${retro.length ? ` ${joinNames(retro.map((r) => r.planet))} retrograde still asks for a second reading of anything you sign.` : ""}`;

  const headline =
    trend === "Rising"
      ? `Open window for ${DOMAIN_FOCUS[domain].split(",")[0]}`
      : trend === "Steady"
      ? `Hold the line and consolidate`
      : `Slow, careful and well documented`;

  return { domain, score, trend, headline, what, why, how, when, watch, drivers };
}

export function buildSignReading(
  signIndex: number,
  system: "western" | "vedic",
  period: Period,
  now: Date,
): SignReading {
  const sidereal = system === "vedic";
  const win = periodWindow(period, now);
  const sampleCount = period === "Daily" ? 6 : period === "Weekly" ? 7 : period === "Monthly" ? 10 : 12;
  const dates = samples(win.start, win.end, sampleCount);
  const series = dates.map((d) => placementsFor(signIndex, d, sidereal));
  const mid = series[Math.floor(series.length / 2)];

  const domains = DOMAINS.map((d) => {
    const { score, drivers } = scoreDomain(d, mid);
    // Average across the window so longer periods reflect movement, not one instant.
    const avg = Math.round(series.reduce((a, pl) => a + scoreDomain(d, pl).score, 0) / series.length);
    const blended = Math.round(score * 0.4 + avg * 0.6);
    return domainNarrative(d, blended, drivers, mid, period, win, series, dates);
  });

  const overall = Math.round(domains.reduce((a, d) => a + d.score, 0) / domains.length);
  const names = sidereal ? RASHIS : SIGN_NAMES;
  const jup = mid.find((p) => p.planet === "Jupiter")!;
  const sat = mid.find((p) => p.planet === "Saturn")!;
  const sun = mid.find((p) => p.planet === "Sun")!;
  const moon = mid.find((p) => p.planet === "Moon")!;

  const summary = `For ${names[signIndex]} across ${win.label}, Jupiter sits in house ${jup.house} from your sign and Saturn in house ${sat.house}, which frames the ${period.toLowerCase()} period as ${overall >= 68 ? "expansive but accountable" : overall >= 48 ? "workmanlike and gradual" : "corrective and preparatory"}. The Sun moves through house ${sun.house}, placing attention on ${HOUSE_MEANING[sun.house]}, while the Moon starts the period in house ${moon.house}, colouring mood through ${HOUSE_MEANING[moon.house]}. Read the sections below in order: each one names the placement responsible, the practical effect, the correct response and the timing inside this window.`;

  const seed = signIndex * 97 + period.length * 31 + now.getFullYear() + (period === "Daily" ? now.getMonth() * 40 + now.getDate() : period === "Monthly" ? now.getMonth() : 0);
  return {
    sign: names[signIndex],
    signIndex,
    system,
    period,
    windowLabel: win.label,
    overall,
    placements: mid,
    domains,
    summary,
    lucky: {
      number: ((seed * 7) % 9) + 1,
      colour: COLOURS[(signIndex + seed) % COLOURS.length],
      direction: DIRECTIONS[(signIndex + Math.floor(seed / 3)) % 8],
      day: WEEKDAYS[(signIndex * 2 + seed) % 7],
      gemstone: GEMS[signIndex % GEMS.length],
    },
  };
}

// ---------- Chinese domains ----------
export type ChineseDomainKey = "Growth" | "Health" | "Wealth" | "Career" | "Love" | "Family" | "Fortune";
export const CHINESE_DOMAINS: ChineseDomainKey[] = ["Growth", "Health", "Wealth", "Career", "Love", "Family", "Fortune"];

const ELEMENT_CYCLE = ["Wood", "Fire", "Earth", "Metal", "Water"] as const;
type Elem = typeof ELEMENT_CYCLE[number];
const generates: Record<Elem, Elem> = { Wood: "Fire", Fire: "Earth", Earth: "Metal", Metal: "Water", Water: "Wood" };
const controls: Record<Elem, Elem> = { Wood: "Earth", Earth: "Water", Water: "Fire", Fire: "Metal", Metal: "Wood" };

export type ChineseDomainReading = {
  domain: ChineseDomainKey;
  score: number;
  what: string;
  why: string;
  how: string;
  when: string;
};

export function chineseDomainReadings(
  personAnimal: string,
  personElement: string,
  yearAnimal: string,
  yearElement: string,
  relation: "harmony" | "clash" | "self" | "neutral",
  year: number,
): ChineseDomainReading[] {
  const pe = personElement as Elem;
  const ye = yearElement as Elem;
  const elementLink =
    generates[ye] === pe ? "supportive" :
    generates[pe] === ye ? "draining" :
    controls[ye] === pe ? "restrictive" :
    controls[pe] === ye ? "assertive" : "neutral";

  const base =
    (relation === "harmony" ? 78 : relation === "clash" ? 46 : relation === "self" ? 58 : 65) +
    (elementLink === "supportive" ? 8 : elementLink === "restrictive" ? -8 : elementLink === "draining" ? -4 : elementLink === "assertive" ? 3 : 0);

  const quarters = ["February to April", "May to July", "August to October", "November to January"];
  const tilt: Record<ChineseDomainKey, number> = {
    Growth: 4, Health: relation === "self" ? -6 : 0, Wealth: elementLink === "supportive" ? 6 : -2,
    Career: relation === "clash" ? -6 : 4, Love: relation === "harmony" ? 7 : -3,
    Family: relation === "clash" ? -5 : 2, Fortune: elementLink === "restrictive" ? -7 : 3,
  };

  const why: Record<ChineseDomainKey, string> = {
    Growth: `${personElement} ${personAnimal} meets the ${yearElement} ${yearAnimal} year. In the five element cycle this contact is ${elementLink}, which sets the ceiling on how fast you can expand in ${year}.`,
    Health: `${relation === "self" ? "This is your Ben Ming Nian, the year of your own animal, which classically lowers physical reserves." : `The ${yearAnimal} branch sits in a ${relation} relationship with ${personAnimal}, so stamina follows your routine rather than luck.`}`,
    Wealth: `The year element ${yearElement} is ${elementLink} to your ${personElement} nature, which is the classical marker for how easily resources accumulate versus leak.`,
    Career: `Branch relationship ${personAnimal} to ${yearAnimal} is ${relation}. That decides whether promotion comes through alliance or through proving yourself again.`,
    Love: `${relation === "harmony" ? "The year animal is one of your San He allies, which softens negotiation and favours commitment." : relation === "clash" ? "The year animal opposes yours across the branch circle, so relationships need explicit agreements rather than assumption." : "A neutral branch year keeps relationships stable and undramatic."}`,
    Family: `Household matters follow the same ${relation} branch contact, expressed through the home rather than the workplace.`,
    Fortune: `Overall fortune blends the ${relation} branch contact with the ${elementLink} element contact between ${personElement} and ${yearElement}.`,
  };

  const how: Record<ChineseDomainKey, string> = {
    Growth: "Choose one direction and deepen it. Broad experimentation costs more than it returns this year.",
    Health: relation === "self" ? "Keep sleep, meals and medical checks regular, and wear red as the traditional remedy for the self year." : "Protect sleep and keep one recovery day each week.",
    Wealth: elementLink === "supportive" ? "Move surplus into productive assets early in the year while support lasts." : "Hold reserves, clear debt first and avoid guaranteeing another person's obligation.",
    Career: relation === "clash" ? "Document work, confirm scope in writing and avoid open confrontation with authority." : "Ask directly for the responsibility you want, then deliver visibly.",
    Love: relation === "harmony" ? "Formalise what is already working. This is a favourable year for engagement, marriage or shared commitments." : "Slow the pace, speak plainly and settle finances jointly before making promises.",
    Family: "Give elders time and attention, and settle old household disputes early rather than late in the year.",
    Fortune: "Act in the supportive quarters, consolidate in the rest, and keep a small cash buffer through the clash months.",
  };

  return CHINESE_DOMAINS.map((d, i) => {
    const score = Math.max(20, Math.min(96, base + tilt[d] + ((personAnimal.length * (i + 3) + year) % 7) - 3));
    return {
      domain: d,
      score,
      what: score >= 70
        ? `${d} is one of the stronger areas of ${year} for the ${personElement} ${personAnimal}.`
        : score >= 50
        ? `${d} is steady in ${year}. Progress comes from consistency, not from a single opening.`
        : `${d} needs management in ${year}. Treat it as maintenance rather than expansion.`,
      why: why[d],
      how: how[d],
      when: `Strongest phase: ${quarters[(i + (relation === "clash" ? 2 : 0)) % 4]}. Take the most care during ${quarters[(i + 2) % 4]}.`,
    };
  });
}

// ---------- Numeroscope ----------
export type NumeroDay = {
  personalYear: number;
  personalMonth: number;
  personalDay: number;
  universalDay: number;
  ruler: string;
  theme: string;
  what: string;
  how: string;
  avoid: string;
  luckyNumbers: number[];
  luckyColour: string;
};

const NUM_RULER: Record<number, string> = {
  1: "Sun", 2: "Moon", 3: "Jupiter", 4: "Rahu", 5: "Mercury",
  6: "Venus", 7: "Ketu", 8: "Saturn", 9: "Mars",
};
const NUM_THEME: Record<number, string> = {
  1: "Initiative and independent decisions",
  2: "Cooperation, listening and quiet diplomacy",
  3: "Communication, learning and visible expression",
  4: "Structure, documentation and unglamorous groundwork",
  5: "Movement, negotiation, travel and change",
  6: "Responsibility, home, care and aesthetics",
  7: "Analysis, research, solitude and review",
  8: "Authority, money, contracts and long-term results",
  9: "Completion, release and service to others",
};
const NUM_DO: Record<number, string> = {
  1: "Start the item you have been postponing and make the first decision yourself.",
  2: "Handle the sensitive conversation today. Partnerships respond better than solo pushes.",
  3: "Present, publish, teach or pitch. Words carry further than usual.",
  4: "Fix systems, file paperwork and finish the maintenance backlog.",
  5: "Travel, negotiate and follow up leads. Keep your schedule flexible.",
  6: "Attend to home, family and health commitments, and settle a domestic expense.",
  7: "Study, audit and review before acting. Depth beats speed today.",
  8: "Handle money, legal documents and senior discussions with full preparation.",
  9: "Close old matters, forgive a pending issue and clear what no longer serves you.",
};
const NUM_AVOID: Record<number, string> = {
  1: "Avoid taking orders passively or diluting your position by seeking too many opinions.",
  2: "Avoid confrontation and over-sensitivity to tone.",
  3: "Avoid scattering energy across too many conversations.",
  4: "Avoid impulsive spending and shortcuts in procedure.",
  5: "Avoid signing anything you have not read twice.",
  6: "Avoid over-committing to other people's obligations.",
  7: "Avoid crowded, noisy commitments and forced socialising.",
  8: "Avoid arguing with authority and avoid informal money arrangements.",
  9: "Avoid starting a brand new venture today.",
};
const NUM_COLOUR: Record<number, string> = {
  1: "Golden orange", 2: "Pearl white", 3: "Yellow", 4: "Grey blue", 5: "Green",
  6: "Rose white", 7: "Smoke grey", 8: "Deep blue", 9: "Red",
};

const reduceNum = (n: number): number => {
  while (n > 9) n = String(n).split("").reduce((a, c) => a + Number(c), 0);
  return n || 9;
};

export function numeroscopeDay(birthDate: string, date: Date): NumeroDay | null {
  const m = birthDate.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const bMonth = Number(m[2]), bDay = Number(m[3]);
  const personalYear = reduceNum(reduceNum(bDay) + reduceNum(bMonth) + reduceNum(date.getFullYear()));
  const personalMonth = reduceNum(personalYear + (date.getMonth() + 1));
  const personalDay = reduceNum(personalMonth + date.getDate());
  const universalDay = reduceNum(date.getFullYear() + date.getMonth() + 1 + date.getDate());
  return {
    personalYear, personalMonth, personalDay, universalDay,
    ruler: NUM_RULER[personalDay],
    theme: NUM_THEME[personalDay],
    what: `Your personal day number is ${personalDay}, ruled by ${NUM_RULER[personalDay]}, inside personal month ${personalMonth} and personal year ${personalYear}. The universal day is ${universalDay}, so the wider mood ${universalDay === personalDay ? "matches your own cycle, which amplifies the day" : "runs on a different note, so pace yourself against your own number rather than the room"}.`,
    how: NUM_DO[personalDay],
    avoid: NUM_AVOID[personalDay],
    luckyNumbers: [personalDay, reduceNum(personalDay + personalMonth), reduceNum(personalYear + date.getDate())],
    luckyColour: NUM_COLOUR[personalDay],
  };
}
