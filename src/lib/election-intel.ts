// Planetary Election Intelligence — live astronomy + Western electional rules.
//
// Every number here comes from live computed positions (astronomy-engine),
// never from stored or guessed tables.

import { AE_BODY, dailySpeed, tropicalLongitude } from "./western-tables";
import { SIGN_NAMES } from "./western";

const norm360 = (x: number) => ((x % 360) + 360) % 360;

export const ELECTION_BODIES = [
  "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
] as const;
export type Body = (typeof ELECTION_BODIES)[number];

export type LivePosition = {
  name: Body;
  longitude: number;      // 0..360 tropical
  sign: string;
  signNo: number;         // 1..12
  degreeInSign: number;
  speed: number;          // deg/day
  retrograde: boolean;
  stationary: boolean;
};

export function livePositions(date: Date): LivePosition[] {
  return ELECTION_BODIES.map((name) => {
    const body = AE_BODY[name]!;
    const lon = norm360(tropicalLongitude(body, date));
    const speed = dailySpeed(body, date);
    const signNo = Math.floor(lon / 30);
    return {
      name,
      longitude: lon,
      sign: SIGN_NAMES[signNo],
      signNo: signNo + 1,
      degreeInSign: lon - signNo * 30,
      speed,
      retrograde: speed < 0,
      stationary: Math.abs(speed) < 0.015 && name !== "Sun" && name !== "Moon",
    };
  });
}

// ── Aspects between live bodies ────────────────────────────────────────────
export type LiveAspect = {
  a: Body; b: Body;
  type: "conjunction" | "opposition" | "trine" | "square" | "sextile";
  orb: number;
  harmony: "harmonious" | "tense" | "neutral";
  applying: boolean;
};

const ASPECT_DEFS: { type: LiveAspect["type"]; angle: number; orb: number; harmony: LiveAspect["harmony"] }[] = [
  { type: "conjunction", angle: 0, orb: 7, harmony: "neutral" },
  { type: "sextile", angle: 60, orb: 4, harmony: "harmonious" },
  { type: "square", angle: 90, orb: 6, harmony: "tense" },
  { type: "trine", angle: 120, orb: 6, harmony: "harmonious" },
  { type: "opposition", angle: 180, orb: 7, harmony: "tense" },
];

export function liveAspects(pos: LivePosition[]): LiveAspect[] {
  const out: LiveAspect[] = [];
  for (let i = 0; i < pos.length; i++) {
    for (let j = i + 1; j < pos.length; j++) {
      let diff = Math.abs(pos[i].longitude - pos[j].longitude);
      if (diff > 180) diff = 360 - diff;
      for (const def of ASPECT_DEFS) {
        const orb = Math.abs(diff - def.angle);
        if (orb > def.orb) continue;
        // Applying when the faster body is still closing the gap.
        const rel = pos[i].speed - pos[j].speed;
        const applying = diff > def.angle ? rel < 0 : rel > 0;
        out.push({ a: pos[i].name, b: pos[j].name, type: def.type, orb, harmony: def.harmony, applying });
      }
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}

// ── Dignity ───────────────────────────────────────────────────────────────
const RULER: Record<number, Body[]> = {
  1: ["Mars"], 2: ["Venus"], 3: ["Mercury"], 4: ["Moon"], 5: ["Sun"], 6: ["Mercury"],
  7: ["Venus"], 8: ["Pluto", "Mars"], 9: ["Jupiter"], 10: ["Saturn"], 11: ["Uranus", "Saturn"], 12: ["Neptune", "Jupiter"],
};
const EXALT: Partial<Record<Body, number>> = {
  Sun: 5, Moon: 2, Mercury: 6, Venus: 12, Mars: 10, Jupiter: 4, Saturn: 7,
};
const FALL: Partial<Record<Body, number>> = {
  Sun: 11, Moon: 8, Mercury: 12, Venus: 6, Mars: 4, Jupiter: 10, Saturn: 1,
};

export type Dignity = "rulership" | "exaltation" | "detriment" | "fall" | "neutral";

export function dignityOf(p: LivePosition): Dignity {
  if ((RULER[p.signNo] ?? []).includes(p.name)) return "rulership";
  if (EXALT[p.name] === p.signNo) return "exaltation";
  if (FALL[p.name] === p.signNo) return "fall";
  const opposite = ((p.signNo + 5) % 12) + 1;
  if ((RULER[opposite] ?? []).includes(p.name)) return "detriment";
  return "neutral";
}

// ── Moon phase and void of course ─────────────────────────────────────────
export type MoonState = {
  phaseAngle: number;
  illumination: number;
  phase: string;
  waxing: boolean;
  sign: string;
  degreeInSign: number;
  voidOfCourse: boolean;
};

export function moonState(pos: LivePosition[]): MoonState {
  const sun = pos.find((p) => p.name === "Sun")!;
  const moon = pos.find((p) => p.name === "Moon")!;
  const angle = norm360(moon.longitude - sun.longitude);
  const illumination = (1 - Math.cos((angle * Math.PI) / 180)) / 2;
  const names = [
    "New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous",
    "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent",
  ];
  const phase = names[Math.floor((norm360(angle + 22.5) / 45)) % 8];
  // Void of course: no further major aspect from the Moon before it leaves the sign.
  const degreesLeft = 30 - moon.degreeInSign;
  let willAspect = false;
  for (const p of pos) {
    if (p.name === "Moon") continue;
    for (const def of ASPECT_DEFS) {
      for (const target of [def.angle, -def.angle]) {
        const wanted = norm360(p.longitude + target);
        const ahead = norm360(wanted - moon.longitude);
        if (ahead <= degreesLeft) willAspect = true;
      }
    }
  }
  return {
    phaseAngle: angle,
    illumination,
    phase,
    waxing: angle < 180,
    sign: moon.sign,
    degreeInSign: moon.degreeInSign,
    voidOfCourse: !willAspect,
  };
}

// ── Event database ────────────────────────────────────────────────────────
export type EventDef = {
  slug: string;
  label: string;
  group: string;
  primary: Body[];
  secondary: Body[];
  avoid: string[];
  wants: string[];
  waxingPreferred: boolean;
  mercuryRetroBlocks: boolean;
  venusRetroBlocks: boolean;
};

const e = (
  slug: string, label: string, group: string,
  primary: Body[], secondary: Body[],
  opts: Partial<Pick<EventDef, "avoid" | "wants" | "waxingPreferred" | "mercuryRetroBlocks" | "venusRetroBlocks">> = {},
): EventDef => ({
  slug, label, group, primary, secondary,
  avoid: opts.avoid ?? [],
  wants: opts.wants ?? [],
  waxingPreferred: opts.waxingPreferred ?? true,
  mercuryRetroBlocks: opts.mercuryRetroBlocks ?? false,
  venusRetroBlocks: opts.venusRetroBlocks ?? false,
});

export const EVENTS: EventDef[] = [
  e("house-purchase", "Buy a house", "Property", ["Jupiter", "Moon", "Venus"], ["Saturn"], {
    mercuryRetroBlocks: true,
    avoid: ["Moon square Saturn", "Mars afflicting the Moon", "Mercury retrograde while signing"],
    wants: ["Jupiter trine Moon", "Venus trine Jupiter", "Waxing Moon in Taurus, Cancer or Pisces"],
  }),
  e("land-purchase", "Buy land", "Property", ["Saturn", "Jupiter", "Moon"], ["Venus"], {
    mercuryRetroBlocks: true, avoid: ["Mars afflictions", "Mercury retrograde"],
  }),
  e("home-shifting", "Shift home", "Property", ["Moon", "Jupiter", "Venus"], ["Mercury"], {}),
  e("home-renovation", "Home renovation", "Property", ["Mars", "Saturn"], ["Venus"], {}),
  e("interior-design", "Interior design", "Property", ["Venus", "Moon"], ["Mercury"], { venusRetroBlocks: true }),
  e("real-estate-business", "Real estate business", "Property", ["Saturn", "Jupiter"], ["Mercury"], {}),

  e("car-purchase", "Buy a car", "Vehicles", ["Venus", "Mercury", "Moon"], ["Jupiter"], {
    mercuryRetroBlocks: true, avoid: ["Mercury retrograde", "Mars square Uranus"],
  }),
  e("luxury-vehicle", "Buy a luxury vehicle", "Vehicles", ["Venus", "Jupiter", "Moon"], ["Mercury"], { mercuryRetroBlocks: true }),
  e("electric-vehicle", "Buy an electric vehicle", "Vehicles", ["Uranus", "Mercury", "Venus"], ["Moon"], {
    mercuryRetroBlocks: true, avoid: ["Uranus in hard aspect with Mars"],
  }),

  e("electronics", "Buy electronics", "Technology", ["Mercury", "Uranus", "Moon"], [], {
    mercuryRetroBlocks: true, avoid: ["Mercury retrograde", "Void of course Moon"],
  }),
  e("mobile-phone", "Buy a mobile phone", "Technology", ["Mercury", "Uranus", "Venus"], [], { mercuryRetroBlocks: true }),
  e("computer", "Buy a computer", "Technology", ["Mercury", "Uranus", "Saturn"], [], { mercuryRetroBlocks: true }),
  e("software-launch", "Launch software", "Technology", ["Mercury", "Jupiter", "Uranus"], ["Sun"], { mercuryRetroBlocks: true }),
  e("ai-product", "Launch an AI product", "Technology", ["Mercury", "Uranus", "Pluto"], ["Jupiter"], { mercuryRetroBlocks: true }),
  e("website-launch", "Launch a website", "Technology", ["Mercury", "Uranus"], ["Venus"], { mercuryRetroBlocks: true }),

  e("startup", "Start a company", "Business", ["Sun", "Jupiter", "Mercury"], ["Saturn"], { mercuryRetroBlocks: true }),
  e("business-registration", "Register a business", "Business", ["Sun", "Mercury", "Jupiter"], ["Saturn"], { mercuryRetroBlocks: true }),
  e("open-shop", "Open a shop", "Business", ["Mercury", "Venus", "Jupiter"], ["Moon"], {}),
  e("agreement", "Sign an agreement", "Business", ["Mercury", "Jupiter"], ["Saturn", "Sun"], { mercuryRetroBlocks: true }),
  e("social-media", "Start social media", "Business", ["Mercury", "Venus", "Moon"], [], {}),
  e("youtube", "Start a YouTube channel", "Business", ["Mercury", "Moon", "Jupiter"], ["Venus"], {}),
  e("book-writing", "Begin writing a book", "Business", ["Mercury", "Jupiter"], ["Neptune"], {}),

  e("job-interview", "Attend a job interview", "Career", ["Mercury", "Sun", "Jupiter"], [], { mercuryRetroBlocks: true }),
  e("job-joining", "Join a new job", "Career", ["Sun", "Jupiter", "Saturn"], ["Mercury"], {}),
  e("job-resignation", "Resign from a job", "Career", ["Saturn", "Pluto"], ["Sun"], { waxingPreferred: false }),
  e("promotion", "Ask for a promotion", "Career", ["Sun", "Jupiter"], ["Mercury"], {}),
  e("change-job", "Change job", "Career", ["Sun", "Saturn", "Jupiter"], ["Mercury"], {}),

  e("bank-account", "Open a bank account", "Money", ["Mercury", "Jupiter", "Venus"], [], { mercuryRetroBlocks: true }),
  e("loan", "Apply for a loan", "Money", ["Jupiter", "Mercury", "Saturn"], [], { mercuryRetroBlocks: true }),
  e("investment", "Make an investment", "Money", ["Jupiter", "Mercury", "Moon"], ["Saturn"], { mercuryRetroBlocks: true }),
  e("share-market", "Buy shares", "Money", ["Mercury", "Jupiter", "Uranus"], ["Moon"], { mercuryRetroBlocks: true }),
  e("crypto", "Buy cryptocurrency", "Money", ["Uranus", "Mercury", "Pluto"], ["Jupiter"], { mercuryRetroBlocks: true }),
  e("buy-gold", "Buy gold", "Money", ["Venus", "Sun", "Jupiter"], ["Moon"], { venusRetroBlocks: true }),
  e("donation", "Make a donation", "Money", ["Jupiter", "Venus", "Moon"], [], {}),

  e("marriage", "Marriage or registration", "Relationships", ["Venus", "Moon", "Jupiter"], ["Sun"], {
    venusRetroBlocks: true, avoid: ["Venus retrograde", "Moon in fall", "Mars square Venus"],
    wants: ["Waxing Moon", "Venus in rulership or exaltation", "Jupiter supporting the Moon"],
  }),
  e("proposal", "Propose to someone", "Relationships", ["Venus", "Moon"], ["Jupiter"], { venusRetroBlocks: true }),
  e("engagement", "Engagement", "Relationships", ["Venus", "Jupiter", "Moon"], [], { venusRetroBlocks: true }),
  e("pregnancy-planning", "Plan a pregnancy", "Relationships", ["Moon", "Venus", "Jupiter"], [], {}),
  e("ivf", "Begin IVF treatment", "Relationships", ["Moon", "Venus", "Jupiter"], ["Saturn"], {}),

  e("surgery", "General surgery", "Health", ["Mars", "Sun", "Saturn"], ["Moon"], {
    waxingPreferred: false,
    avoid: ["Mars afflicted by Uranus", "Moon in the sign ruling the treated organ", "Weak or void of course Moon"],
  }),
  e("heart-surgery", "Heart surgery", "Health", ["Sun", "Mars", "Saturn"], ["Moon"], { waxingPreferred: false }),
  e("brain-surgery", "Brain surgery", "Health", ["Mercury", "Mars", "Saturn"], ["Moon"], { waxingPreferred: false }),
  e("cosmetic-surgery", "Cosmetic surgery", "Health", ["Venus", "Moon", "Jupiter"], [], {
    venusRetroBlocks: true, avoid: ["Venus retrograde", "Mars square Venus"],
  }),
  e("plastic-surgery", "Plastic surgery", "Health", ["Venus", "Pluto", "Moon"], [], { venusRetroBlocks: true }),
  e("hair-transplant", "Hair transplant", "Health", ["Venus", "Sun", "Moon"], [], { venusRetroBlocks: true }),
  e("dental", "Dental treatment", "Health", ["Saturn", "Venus"], ["Mars"], {}),
  e("lasik", "Lasik or eye surgery", "Health", ["Sun", "Mercury"], ["Mars"], {}),
  e("skin-treatment", "Skin treatment", "Health", ["Venus", "Moon"], [], { venusRetroBlocks: true }),
  e("beauty-parlour", "Beauty treatment", "Health", ["Venus", "Moon"], [], { venusRetroBlocks: true }),
  e("hair-cut", "Hair cut", "Health", ["Moon", "Venus"], [], {}),
  e("tattoo", "Get a tattoo", "Health", ["Mars", "Pluto"], ["Venus"], {}),
  e("gym-start", "Start the gym", "Health", ["Mars", "Sun"], ["Saturn"], {}),
  e("weight-loss", "Start weight loss", "Health", ["Mars", "Saturn"], ["Sun"], { waxingPreferred: false }),
  e("yoga", "Start yoga", "Health", ["Sun", "Moon"], ["Jupiter"], {}),

  e("legal-case", "Start legal action", "Legal and travel", ["Saturn", "Jupiter", "Mars"], ["Sun"], { mercuryRetroBlocks: true }),
  e("court-appearance", "Court appearance", "Legal and travel", ["Jupiter", "Saturn", "Sun"], ["Mercury"], {}),
  e("passport", "Apply for a passport", "Legal and travel", ["Mercury", "Jupiter"], ["Sun"], { mercuryRetroBlocks: true }),
  e("visa", "Apply for a visa", "Legal and travel", ["Jupiter", "Mercury", "Moon"], [], { mercuryRetroBlocks: true }),
  e("foreign-travel", "Travel abroad", "Legal and travel", ["Jupiter", "Moon", "Mercury"], ["Venus"], { mercuryRetroBlocks: true }),

  e("meditation", "Begin meditation practice", "Spiritual", ["Neptune", "Moon", "Jupiter"], [], {}),
  e("spiritual-initiation", "Spiritual initiation", "Spiritual", ["Neptune", "Jupiter", "Moon"], ["Sun"], {}),
  e("temple-visit", "Temple visit", "Spiritual", ["Jupiter", "Moon", "Sun"], [], {}),
];

export const EVENT_GROUPS = Array.from(new Set(EVENTS.map((x) => x.group)));

export function findEvent(slug: string): EventDef {
  return EVENTS.find((x) => x.slug === slug) ?? EVENTS[0];
}

// ── Planetary strength ────────────────────────────────────────────────────
export type StrengthGrade = "Excellent" | "Good" | "Average" | "Weak" | "Very Weak";

export type PlanetStrength = {
  name: Body;
  sign: string;
  degreeInSign: number;
  retrograde: boolean;
  stationary: boolean;
  dignity: Dignity;
  score: number;          // 0..100
  grade: StrengthGrade;
  notes: string[];
};

const BENEFICS: Body[] = ["Venus", "Jupiter"];
const MALEFICS: Body[] = ["Mars", "Saturn", "Pluto"];

function gradeOf(score: number): StrengthGrade {
  if (score >= 78) return "Excellent";
  if (score >= 62) return "Good";
  if (score >= 46) return "Average";
  if (score >= 30) return "Weak";
  return "Very Weak";
}

export function planetStrengths(pos: LivePosition[], aspects: LiveAspect[]): PlanetStrength[] {
  return pos.map((p) => {
    const notes: string[] = [];
    let score = 55;
    const dignity = dignityOf(p);
    if (dignity === "rulership") { score += 18; notes.push(`in its own sign ${p.sign}`); }
    else if (dignity === "exaltation") { score += 22; notes.push(`exalted in ${p.sign}`); }
    else if (dignity === "detriment") { score -= 15; notes.push(`in detriment in ${p.sign}`); }
    else if (dignity === "fall") { score -= 20; notes.push(`in fall in ${p.sign}`); }

    if (p.retrograde && p.name !== "Uranus" && p.name !== "Neptune" && p.name !== "Pluto") {
      score -= 16; notes.push("retrograde, so its results come slowly and need review");
    }
    if (p.stationary) { score -= 6; notes.push("almost stationary, energy is held still"); }
    if (p.degreeInSign < 1 || p.degreeInSign > 29) { score -= 5; notes.push("at the very edge of a sign"); }

    for (const a of aspects) {
      if (a.a !== p.name && a.b !== p.name) continue;
      const other = a.a === p.name ? a.b : a.a;
      const weight = Math.max(0.35, 1 - a.orb / 8);
      if (a.harmony === "harmonious") {
        const gain = (BENEFICS.includes(other) ? 9 : 5) * weight;
        score += gain;
        if (a.orb < 3) notes.push(`${a.type} with ${other}`);
      } else if (a.harmony === "tense") {
        const loss = (MALEFICS.includes(other) ? 11 : 6) * weight;
        score -= loss;
        if (a.orb < 3) notes.push(`${a.type} with ${other}`);
      } else {
        if (BENEFICS.includes(other)) score += 6 * weight;
        if (MALEFICS.includes(other)) score -= 7 * weight;
        if (a.orb < 3) notes.push(`conjunct ${other}`);
      }
    }
    score = Math.max(4, Math.min(97, Math.round(score)));
    return {
      name: p.name, sign: p.sign, degreeInSign: p.degreeInSign,
      retrograde: p.retrograde, stationary: p.stationary,
      dignity, score, grade: gradeOf(score), notes,
    };
  });
}

// ── Snapshot ──────────────────────────────────────────────────────────────
export type Snapshot = {
  at: Date;
  positions: LivePosition[];
  aspects: LiveAspect[];
  strengths: PlanetStrength[];
  moon: MoonState;
  retrogrades: Body[];
};

export function snapshotAt(date: Date): Snapshot {
  const positions = livePositions(date);
  const aspects = liveAspects(positions);
  return {
    at: date,
    positions,
    aspects,
    strengths: planetStrengths(positions, aspects),
    moon: moonState(positions),
    retrogrades: positions.filter((p) => p.retrograde).map((p) => p.name),
  };
}

// ── Event scoring for one moment ──────────────────────────────────────────
export type MomentVerdict = {
  at: Date;
  score: number;                 // 0..100
  risk: "Excellent" | "Good" | "Average" | "Poor";
  positives: string[];
  negatives: string[];
  supporting: Body[];
  opposing: Body[];
  blocked: string[];
};

const MOON_SIGN_FRIENDS: Record<string, string[]> = {
  Property: ["Taurus", "Cancer", "Pisces", "Virgo"],
  Vehicles: ["Taurus", "Libra", "Gemini", "Sagittarius"],
  Technology: ["Gemini", "Virgo", "Aquarius"],
  Business: ["Leo", "Virgo", "Sagittarius", "Capricorn"],
  Career: ["Leo", "Capricorn", "Sagittarius"],
  Money: ["Taurus", "Cancer", "Sagittarius", "Capricorn"],
  Relationships: ["Taurus", "Cancer", "Libra", "Pisces"],
  Health: ["Aries", "Scorpio", "Capricorn", "Virgo"],
  "Legal and travel": ["Sagittarius", "Libra", "Aquarius"],
  Spiritual: ["Pisces", "Cancer", "Sagittarius"],
};

export function evaluateMoment(def: EventDef, snap: Snapshot): MomentVerdict {
  const positives: string[] = [];
  const negatives: string[] = [];
  const blocked: string[] = [];
  const supporting: Body[] = [];
  const opposing: Body[] = [];

  const byName = new Map(snap.strengths.map((s) => [s.name, s]));
  let weighted = 0;
  let weightTotal = 0;

  const consider = (list: Body[], weight: number) => {
    for (const name of list) {
      const s = byName.get(name);
      if (!s) continue;
      weighted += s.score * weight;
      weightTotal += weight;
      if (s.score >= 62) {
        supporting.push(name);
        positives.push(`${name} is ${s.grade.toLowerCase()} in ${s.sign}${s.notes[0] ? ` (${s.notes[0]})` : ""}.`);
      } else if (s.score < 46) {
        opposing.push(name);
        negatives.push(`${name} is ${s.grade.toLowerCase()} in ${s.sign}${s.notes[0] ? ` (${s.notes[0]})` : ""}.`);
      }
    }
  };
  consider(def.primary, 3);
  consider(def.secondary, 1.5);

  // Whole-sky background: benefics and malefics always matter.
  const benefic = (byName.get("Jupiter")!.score + byName.get("Venus")!.score) / 2;
  const malefic = (byName.get("Mars")!.score + byName.get("Saturn")!.score) / 2;
  weighted += benefic * 1; weightTotal += 1;

  let score = weightTotal > 0 ? weighted / weightTotal : 50;

  // Moon condition matters for every election.
  const moon = snap.moon;
  if (def.waxingPreferred) {
    if (moon.waxing) { score += 4; positives.push(`The Moon is waxing (${moon.phase}, ${Math.round(moon.illumination * 100)} percent lit), which supports beginnings.`); }
    else { score -= 4; negatives.push(`The Moon is waning (${moon.phase}), better for closing than for starting.`); }
  } else {
    if (!moon.waxing) { score += 4; positives.push(`The Moon is waning (${moon.phase}), which suits reduction, removal and release.`); }
    else { score -= 3; negatives.push(`The Moon is waxing (${moon.phase}), which adds swelling and retention.`); }
  }
  if (moon.voidOfCourse) { score -= 9; negatives.push("The Moon is void of course, so actions started now tend to lead nowhere."); }
  const friendly = MOON_SIGN_FRIENDS[def.group] ?? [];
  if (friendly.includes(moon.sign)) { score += 5; positives.push(`Moon in ${moon.sign} is a friendly sign for this kind of decision.`); }

  // Hard blocks from the event rules.
  const mercury = snap.positions.find((p) => p.name === "Mercury")!;
  const venus = snap.positions.find((p) => p.name === "Venus")!;
  if (def.mercuryRetroBlocks && mercury.retrograde) {
    score -= 16; blocked.push("Mercury is retrograde, so paperwork, prices and technical details get revised later.");
  }
  if (def.venusRetroBlocks && venus.retrograde) {
    score -= 20; blocked.push("Venus is retrograde, which is the classic warning against commitments of love, beauty and value.");
  }
  const moonSaturn = snap.aspects.find((a) => a.type === "square" && [a.a, a.b].includes("Moon") && [a.a, a.b].includes("Saturn"));
  if (moonSaturn) { score -= 8; negatives.push("Moon square Saturn tightens the mood and delays outcomes."); }
  const marsMoon = snap.aspects.find((a) => (a.harmony === "tense") && [a.a, a.b].includes("Moon") && [a.a, a.b].includes("Mars"));
  if (marsMoon) { score -= 6; negatives.push("Mars in hard aspect to the Moon raises haste and friction."); }
  if (malefic > 75 && benefic < 55) { score -= 5; negatives.push("Mars and Saturn are currently louder than Jupiter and Venus."); }

  const best = snap.aspects.filter((a) => a.harmony === "harmonious" && a.orb < 3.5)
    .slice(0, 3)
    .map((a) => `${a.a} ${a.type} ${a.b} (orb ${a.orb.toFixed(1)} degrees)`);
  for (const b of best) positives.push(b);

  score = Math.max(3, Math.min(97, Math.round(score)));
  const risk: MomentVerdict["risk"] =
    score >= 76 ? "Excellent" : score >= 62 ? "Good" : score >= 48 ? "Average" : "Poor";

  return {
    at: snap.at, score, risk,
    positives: Array.from(new Set(positives)).slice(0, 7),
    negatives: Array.from(new Set(negatives)).slice(0, 7),
    supporting: Array.from(new Set(supporting)),
    opposing: Array.from(new Set(opposing)),
    blocked,
  };
}

// ── Forward search for the best window ────────────────────────────────────
export type Window = {
  start: Date;
  end: Date;
  score: number;
  risk: MomentVerdict["risk"];
  moonSign: string;
  moonPhase: string;
  headline: string;
};

export type ElectionReport = {
  question: string;
  event: EventDef;
  now: Snapshot;
  today: MomentVerdict;
  windows: Window[];
  bestWindow: Window | null;
  confidence: number;
  verdict: "Go ahead today" | "Acceptable today with care" | "Better to wait";
  recommendation: string;
  precautions: string[];
};

const HOURS = 3;

export function electionReport(eventSlug: string, opts?: { now?: Date; days?: number }): ElectionReport {
  const def = findEvent(eventSlug);
  const now = opts?.now ?? new Date();
  const days = opts?.days ?? 21;
  const snapNow = snapshotAt(now);
  const today = evaluateMoment(def, snapNow);

  // Sample the sky ahead and keep the strong stretches.
  const samples: MomentVerdict[] = [];
  const steps = Math.floor((days * 24) / HOURS);
  for (let i = 0; i <= steps; i++) {
    const t = new Date(now.getTime() + i * HOURS * 3600000);
    const hour = t.getHours();
    if (hour < 6 || hour > 21) continue;              // keep humane hours
    samples.push(evaluateMoment(def, snapshotAt(t)));
  }

  const windows: Window[] = [];
  let run: MomentVerdict[] = [];
  const flush = () => {
    if (run.length === 0) return;
    const score = Math.round(run.reduce((s, r) => s + r.score, 0) / run.length);
    const first = run[0];
    const last = run[run.length - 1];
    const snap = snapshotAt(first.at);
    windows.push({
      start: first.at,
      end: new Date(last.at.getTime() + HOURS * 3600000),
      score,
      risk: score >= 76 ? "Excellent" : score >= 62 ? "Good" : "Average",
      moonSign: snap.moon.sign,
      moonPhase: snap.moon.phase,
      headline: first.positives[0] ?? `Moon in ${snap.moon.sign}`,
    });
    run = [];
  };
  const threshold = Math.max(58, today.score + 3);
  for (const s of samples) {
    if (s.score >= threshold) run.push(s);
    else flush();
  }
  flush();
  windows.sort((a, b) => b.score - a.score);
  const top = windows.slice(0, 5);
  const bestWindow = top[0] ?? null;

  const strongCount = def.primary.filter((n) => (snapNow.strengths.find((s) => s.name === n)?.score ?? 0) >= 62).length;
  const confidence = Math.max(35, Math.min(96, Math.round(
    50 + strongCount * 9 + (today.blocked.length === 0 ? 10 : -12) + (today.score - 55) * 0.35,
  )));

  const verdict: ElectionReport["verdict"] =
    today.blocked.length === 0 && today.score >= 72 ? "Go ahead today"
    : today.blocked.length === 0 && today.score >= 58 ? "Acceptable today with care"
    : "Better to wait";

  const recommendation = verdict === "Go ahead today"
    ? `The live sky supports ${def.label.toLowerCase()} today. ${def.primary.join(", ")} are the planets carrying this decision and they are currently in usable condition, with the Moon in ${snapNow.moon.sign}.`
    : verdict === "Acceptable today with care"
    ? `Today is workable but not ideal for ${def.label.toLowerCase()}. You can proceed if the timing is fixed, ideally inside the recommended window, and follow the precautions below.`
    : `The current planetary conditions do not support ${def.label.toLowerCase()}. Rather than forcing it, wait for the recommended window when the planets that rule this matter are stronger.`;

  const precautions = [
    ...today.blocked,
    ...today.negatives.slice(0, 3),
    ...def.avoid.map((x) => `Classical caution for this matter: avoid ${x.toLowerCase()}.`),
  ];

  return {
    question: `Is this a good time to ${def.label.toLowerCase()}?`,
    event: def,
    now: snapNow,
    today,
    windows: top,
    bestWindow,
    confidence,
    verdict,
    recommendation,
    precautions: Array.from(new Set(precautions)).slice(0, 8),
  };
}
