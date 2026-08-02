// Western natal data tables: precise planetary rows, house cusps, declinations,
// minor bodies/points, chart balance, and narrative reports.
//
// Every number here is computed from astronomy-engine (no lookup tables, no
// random values). Angles are tropical (ecliptic of date) unless noted.

import * as A from "astronomy-engine";
import type { PlanetName } from "./vedic";
import {
  SIGN_NAMES, SIGN_GLYPHS, ELEMENTS, MODES,
  houseOfLongitude, arabicLots, type WesternChart,
} from "./western";

const norm360 = (x: number) => ((x % 360) + 360) % 360;
const d2r = (d: number) => (d * Math.PI) / 180;
const r2d = (r: number) => (r * 180) / Math.PI;

const ELEMENT_OF_SIGN = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3];
const MODE_OF_SIGN = [0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2];

/** Degrees → sign-relative degrees, minutes, seconds. */
export function dms(deg: number): { d: number; m: number; s: number; text: string } {
  const abs = Math.abs(deg);
  let d = Math.floor(abs);
  let m = Math.floor((abs - d) * 60);
  let s = Math.round((((abs - d) * 60) - m) * 60);
  if (s === 60) { s = 0; m += 1; }
  if (m === 60) { m = 0; d += 1; }
  const sign = deg < 0 ? "-" : "";
  return { d, m, s, text: `${sign}${d}° ${String(m).padStart(2, "0")}' ${String(s).padStart(2, "0")}"` };
}

/** "14° 27' 09\" Taurus" style label for an absolute zodiac longitude. */
export function signDms(lon: number): string {
  const L = norm360(lon);
  const s = Math.floor(L / 30);
  return `${dms(L - s * 30).text} ${SIGN_NAMES[s]}`;
}

export const AE_BODY: Partial<Record<PlanetName | "Uranus" | "Neptune" | "Pluto", A.Body>> = {
  Sun: A.Body.Sun, Moon: A.Body.Moon, Mercury: A.Body.Mercury, Venus: A.Body.Venus,
  Mars: A.Body.Mars, Jupiter: A.Body.Jupiter, Saturn: A.Body.Saturn,
  Uranus: A.Body.Uranus, Neptune: A.Body.Neptune, Pluto: A.Body.Pluto,
};

/** Tropical (ecliptic-of-date) longitude of a body. */
export function tropicalLongitude(body: A.Body, date: Date): number {
  const g = A.GeoVector(body, date, true);
  const e = A.RotateVector(A.Rotation_EQJ_ECT(date), g);
  return norm360(r2d(Math.atan2(e.y, e.x)));
}

/** Geocentric ecliptic latitude (degrees, ecliptic of date). */
export function eclipticLatitude(body: A.Body, date: Date): number {
  const g = A.GeoVector(body, date, true);
  const e = A.RotateVector(A.Rotation_EQJ_ECT(date), g);
  const r = Math.hypot(e.x, e.y, e.z);
  return r2d(Math.asin(e.z / r));
}

/** Apparent declination (degrees, equator of date). */
export function declination(body: A.Body, date: Date): number {
  const g = A.GeoVector(body, date, true);
  const q = A.RotateVector(A.Rotation_EQJ_EQD(date), g);
  const r = Math.hypot(q.x, q.y, q.z);
  return r2d(Math.asin(q.z / r));
}

/** Apparent daily motion in ecliptic longitude (deg/day), central difference. */
export function dailySpeed(body: A.Body, date: Date): number {
  const h = 0.25; // days
  const before = tropicalLongitude(body, new Date(date.getTime() - h * 86400000));
  const after = tropicalLongitude(body, new Date(date.getTime() + h * 86400000));
  let diff = after - before;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  return diff / (2 * h);
}

// ── Planetary positions table ────────────────────────────────────────────────
export type PlanetRow = {
  name: string;
  glyphKey: PlanetName | null;
  signNo: number;           // 1-12
  sign: string;
  signGlyph: string;
  longitudeDms: string;     // within-sign DMS
  fullDegree: number;       // 0-360
  house: number;            // 1-12
  speed: number;            // deg/day (negative = retrograde)
  retrograde: boolean;
  stationary: boolean;
  element: string;
  modality: string;
  latitude: number;
  declination: number;
};

const OUTER: ("Uranus" | "Neptune" | "Pluto")[] = ["Uranus", "Neptune", "Pluto"];

export function planetRows(chart: WesternChart, includeOuter = true): PlanetRow[] {
  const date = new Date(chart.epochUtc);
  const rows: PlanetRow[] = chart.tropicalPlanets.map((p) => {
    const L = norm360(p.tropicalLongitude);
    const s = Math.floor(L / 30);
    const body = AE_BODY[p.name];
    const speed = body ? dailySpeed(body, date) : p.name === "Rahu" || p.name === "Ketu" ? -0.0529 : 0;
    return {
      name: p.name,
      glyphKey: p.name,
      signNo: s + 1,
      sign: SIGN_NAMES[s],
      signGlyph: SIGN_GLYPHS[s],
      longitudeDms: dms(L - s * 30).text,
      fullDegree: L,
      house: houseOfLongitude(L, chart.cusps) + 1,
      speed,
      retrograde: speed < 0,
      stationary: Math.abs(speed) < 0.02 && p.name !== "Rahu" && p.name !== "Ketu",
      element: ELEMENTS[ELEMENT_OF_SIGN[s]],
      modality: MODES[MODE_OF_SIGN[s]],
      latitude: body ? eclipticLatitude(body, date) : 0,
      declination: body ? declination(body, date) : 0,
    };
  });
  if (!includeOuter) return rows;
  for (const name of OUTER) {
    const body = AE_BODY[name]!;
    const L = tropicalLongitude(body, date);
    const s = Math.floor(L / 30);
    const speed = dailySpeed(body, date);
    rows.push({
      name, glyphKey: null,
      signNo: s + 1, sign: SIGN_NAMES[s], signGlyph: SIGN_GLYPHS[s],
      longitudeDms: dms(L - s * 30).text, fullDegree: L,
      house: houseOfLongitude(L, chart.cusps) + 1,
      speed, retrograde: speed < 0, stationary: Math.abs(speed) < 0.005,
      element: ELEMENTS[ELEMENT_OF_SIGN[s]], modality: MODES[MODE_OF_SIGN[s]],
      latitude: eclipticLatitude(body, date), declination: declination(body, date),
    });
  }
  return rows;
}

// ── House cusps table ───────────────────────────────────────────────────────
export type CuspRow = {
  house: number; signNo: number; sign: string; signGlyph: string;
  longitudeDms: string; fullDegree: number; size: number;
};

export function cuspRows(chart: WesternChart): CuspRow[] {
  return chart.cusps.map((c, i) => {
    const L = norm360(c);
    const s = Math.floor(L / 30);
    const next = norm360(chart.cusps[(i + 1) % 12]);
    return {
      house: i + 1, signNo: s + 1, sign: SIGN_NAMES[s], signGlyph: SIGN_GLYPHS[s],
      longitudeDms: dms(L - s * 30).text, fullDegree: L,
      size: norm360(next - L),
    };
  });
}

// ── Declinations, parallels and contra-parallels ─────────────────────────────
export type Parallel = { a: string; b: string; kind: "parallel" | "contra-parallel"; orb: number };

export function parallels(rows: PlanetRow[], orb = 1): Parallel[] {
  const out: Parallel[] = [];
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const da = rows[i].declination, db = rows[j].declination;
      const same = Math.abs(da - db);
      const opp = Math.abs(da + db);
      if (same <= orb) out.push({ a: rows[i].name, b: rows[j].name, kind: "parallel", orb: same });
      else if (opp <= orb) out.push({ a: rows[i].name, b: rows[j].name, kind: "contra-parallel", orb: opp });
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}

// ── Minor bodies and calculated points ──────────────────────────────────────
export type MinorPoint = { name: string; longitude: number; house: number; note: string };

/** Moon's mean apogee (Black Moon Lilith) and mean perigee (Priapus). */
export function meanLilith(date: Date): number {
  const jd = 2440587.5 + date.getTime() / 86400000;
  const T = (jd - 2451545.0) / 36525;
  // Mean longitude of lunar perigee (Meeus, Ch. 47 mean elements).
  const perigee = norm360(83.3532465 + 4069.0137287 * T - 0.0103200 * T * T);
  return norm360(perigee + 180);
}

/** Vertex: the Descendant computed for the co-latitude (classical definition). */
function vertex(date: Date, lat: number, lonEast: number): number {
  const gast = A.SiderealTime(date);
  const lst = norm360(gast * 15 + lonEast);
  const eps = d2r(A.e_tilt(A.MakeTime(date)).tobl);
  const coLat = d2r((lat >= 0 ? 90 - lat : -90 - lat));
  const ramc = d2r(lst);
  const y = Math.cos(ramc);
  const x = -(Math.sin(eps) * Math.tan(coLat) + Math.cos(eps) * Math.sin(ramc));
  return norm360(r2d(Math.atan2(y, x)) + 180);
}

/** Equatorial Ascendant (East Point): Ascendant taken at zero geographic latitude. */
function eastPoint(date: Date, lonEast: number): number {
  const gast = A.SiderealTime(date);
  const lst = norm360(gast * 15 + lonEast);
  const eps = d2r(A.e_tilt(A.MakeTime(date)).tobl);
  const ramc = d2r(lst);
  return norm360(r2d(Math.atan2(Math.cos(ramc), -Math.cos(eps) * Math.sin(ramc))));
}

/** Prenatal syzygy: the last New or Full Moon before birth. */
export function prenatalSyzygy(date: Date): { date: Date; kind: "New Moon" | "Full Moon"; longitude: number } {
  let best: { date: Date; kind: "New Moon" | "Full Moon" } | null = null;
  for (const [target, kind] of [[0, "New Moon"], [180, "Full Moon"]] as const) {
    let t = A.SearchMoonPhase(target, new Date(date.getTime() - 40 * 86400000), 45);
    let last: A.AstroTime | null = null;
    while (t && t.date.getTime() <= date.getTime()) {
      last = t;
      t = A.SearchMoonPhase(target, new Date(t.date.getTime() + 86400000), 45);
    }
    if (last && (!best || last.date.getTime() > best.date.getTime())) best = { date: last.date, kind };
  }
  const when = best?.date ?? date;
  return { date: when, kind: best?.kind ?? "New Moon", longitude: tropicalLongitude(A.Body.Sun, when) };
}

export function minorPoints(chart: WesternChart, lat: number, lonEast: number): MinorPoint[] {
  const date = new Date(chart.epochUtc);
  const lots = arabicLots(chart);
  const lil = meanLilith(date);
  const vx = vertex(date, lat, lonEast);
  const ep = eastPoint(date, lonEast);
  const sun = chart.tropicalPlanets.find((p) => p.name === "Sun")!.tropicalLongitude;
  const node = chart.tropicalPlanets.find((p) => p.name === "Rahu")?.tropicalLongitude ?? 0;
  const syz = prenatalSyzygy(date);
  const list: [string, number, string][] = [
    ["Uranus", tropicalLongitude(A.Body.Uranus, date), "Sudden change, invention, freedom."],
    ["Neptune", tropicalLongitude(A.Body.Neptune, date), "Imagination, devotion, dissolving of boundaries."],
    ["Pluto", tropicalLongitude(A.Body.Pluto, date), "Power, depth, irreversible transformation."],
    ["North Node", node, "The direction of growth and unfamiliar experience."],
    ["South Node", norm360(node + 180), "Inherited comfort and habits to release."],
    ["Black Moon Lilith", lil, "Where instinct refuses to be tamed."],
    ["Priapus", norm360(lil + 180), "Compulsive attachment; the shadow of Lilith."],
    ["Ascendant", chart.tropicalAscendant, "Visible personality and physical approach."],
    ["Descendant", norm360(chart.tropicalAscendant + 180), "What is sought in partnership."],
    ["Midheaven", chart.midheaven, "Public direction, vocation, reputation."],
    ["Imum Coeli", norm360(chart.midheaven + 180), "Roots, home, private foundation."],
    ["Vertex", vx, "Fated meetings and turning-point encounters."],
    ["Anti-Vertex", norm360(vx + 180), "Self-initiated action opposite the Vertex."],
    ["East Point", ep, "Identity as expressed through the equator; a secondary Ascendant."],
    ["West Point", norm360(ep + 180), "Reflected identity through others."],
    ["Part of Fortune", lots[0].longitude, lots[0].meaning],
    ["Part of Spirit", lots[1].longitude, lots[1].meaning],
    ["Prenatal Syzygy", syz.longitude, `Last ${syz.kind} before birth — the lunation the life is built on.`],
    ["Earth", norm360(sun + 180), "The heliocentric position of the Earth; embodiment point."],
  ];
  return list.map(([name, longitude, note]) => ({
    name, longitude: norm360(longitude),
    house: houseOfLongitude(norm360(longitude), chart.cusps) + 1, note,
  }));
}

// ── Natal insights: balance, hemispheres, quadrants ─────────────────────────
export type NatalInsights = {
  elements: { name: string; count: number; pct: number }[];
  modes: { name: string; count: number; pct: number }[];
  polarity: { positive: number; negative: number };
  hemispheres: { north: number; south: number; east: number; west: number; note: string };
  quadrants: { name: string; count: number; theme: string }[];
  balance: string;
  lacking: string[];
};

const QUADRANTS = [
  { name: "First (houses 1-3)", theme: "Self-formation: identity, resources, immediate learning." },
  { name: "Second (houses 4-6)", theme: "Foundation: home, creativity, daily craft." },
  { name: "Third (houses 7-9)", theme: "Relationship: partnership, depth, expansion." },
  { name: "Fourth (houses 10-12)", theme: "Contribution: vocation, community, release." },
];

export function natalInsights(rows: PlanetRow[]): NatalInsights {
  const core = rows.filter((r) => !["Rahu", "Ketu"].includes(r.name));
  const el = [0, 0, 0, 0], md = [0, 0, 0], quad = [0, 0, 0, 0];
  let pos = 0, neg = 0, north = 0, south = 0, east = 0, west = 0;
  for (const r of core) {
    el[ELEMENTS.indexOf(r.element as typeof ELEMENTS[number])]++;
    md[MODES.indexOf(r.modality as typeof MODES[number])]++;
    if (r.signNo % 2 === 1) pos++; else neg++;
    if (r.house >= 7) north++; else south++;
    if (r.house >= 4 && r.house <= 9) west++; else east++;
    quad[Math.floor((r.house - 1) / 3)]++;
  }
  const total = core.length || 1;
  const elements = ELEMENTS.map((name, i) => ({ name, count: el[i], pct: Math.round((el[i] / total) * 100) }));
  const modes = MODES.map((name, i) => ({ name, count: md[i], pct: Math.round((md[i] / total) * 100) }));
  const lacking = [
    ...elements.filter((e) => e.count === 0).map((e) => `${e.name} element`),
    ...modes.filter((m) => m.count === 0).map((m) => `${m.name} mode`),
  ];
  const hemNote = north > south
    ? "Weight above the horizon: the life is worked out in public, visible arenas."
    : "Weight below the horizon: the life is built inwardly first, then shown.";
  const spread = Math.max(...el) - Math.min(...el);
  const balance = spread <= 1
    ? "Evenly distributed — adaptable, with no single temperament dominating."
    : spread <= 3
      ? "Moderately weighted — a clear leaning that still leaves room for flexibility."
      : "Strongly weighted — one temperament governs, and the missing element must be learned deliberately.";
  return {
    elements, modes,
    polarity: { positive: pos, negative: neg },
    hemispheres: {
      north, south, east, west,
      note: `${hemNote} ${east >= west ? "Eastern emphasis: self-directed initiative." : "Western emphasis: outcomes arrive through other people."}`,
    },
    quadrants: QUADRANTS.map((q, i) => ({ name: q.name, count: quad[i], theme: q.theme })),
    balance, lacking,
  };
}

// ── Ascendant report ────────────────────────────────────────────────────────
export type AscendantReport = {
  sign: string; degree: string; ruler: string;
  personality: string; career: string; health: string; finance: string; relationships: string;
};

const ASC_RULER = ["Mars","Venus","Mercury","Moon","Sun","Mercury","Venus","Mars and Pluto","Jupiter","Saturn","Saturn and Uranus","Jupiter and Neptune"];

const ASC_TEXT: { personality: string; career: string; health: string; finance: string; relationships: string }[] = [
  { personality: "Direct, quick to act, visibly restless until a challenge appears.", career: "Suits roles with a clear target and short feedback loops: founding, sales, emergency work, competitive fields.", health: "Head, eyes and adrenal load; heat and inflammation rise under stress. Regular hard exercise settles the system.", finance: "Earnings come in bursts tied to initiative. Guard against impulsive commitments made in the first minute of enthusiasm.", relationships: "Attracts through vitality. Needs a partner who holds ground calmly rather than competing." },
  { personality: "Steady, sensory, unhurried; presence rather than performance.", career: "Suits value-building work: finance, land, food, design, anything where quality compounds slowly.", health: "Throat, neck and thyroid; metabolic slowdown from comfort eating. Consistent movement matters more than intensity.", finance: "Strong instinct for accumulation and pricing. Risk is over-attachment to holdings past their usefulness.", relationships: "Loyal and physically affectionate. Needs reliability; withdraws from volatility rather than arguing." },
  { personality: "Curious, verbal, mentally quick, visibly animated in conversation.", career: "Suits communication-led work: writing, teaching, media, brokerage, technology, translation.", health: "Nervous system, lungs and hands; overstimulation shows as insomnia. Breathwork and screen limits help.", finance: "Multiple income streams outperform a single salary. Track the small leaks rather than chasing the big win.", relationships: "Bonds through talk and shared novelty. Needs mental company, not only emotional company." },
  { personality: "Protective, sensitive to atmosphere, reads a room before speaking.", career: "Suits caretaking and custodial work: hospitality, property, healthcare, family enterprise, heritage roles.", health: "Stomach, breast and fluid balance; emotion is digested physically. Regular meals and sleep rhythm stabilise mood.", finance: "Saves instinctively for security. Property and long holdings suit better than speculation.", relationships: "Offers deep care and expects loyalty. Needs reassurance stated out loud, not assumed." },
  { personality: "Warm, dignified, naturally the centre of attention even when quiet.", career: "Suits visible leadership and performance: management, stage, teaching, design, entrepreneurship, brand-facing work.", health: "Heart, spine and posture; pride delays rest. Cardiovascular work and genuine recreation are protective.", finance: "Earns well and spends generously on quality and appearance. Budget for the generosity rather than regretting it.", relationships: "Devoted when appreciated. Needs recognition; interprets indifference as rejection." },
  { personality: "Precise, observant, quietly improving whatever is in reach.", career: "Suits analysis and craft: health sciences, editing, systems, auditing, research, skilled service.", health: "Digestion and intestinal balance; anxiety somatises. Simple food, routine and diagnostics work well.", finance: "Careful and detail-accurate; the risk is under-charging for real expertise.", relationships: "Shows love through usefulness. Needs to be told that being helpful is not the price of being loved." },
  { personality: "Poised, socially fluent, weighs both sides before committing.", career: "Suits mediation and aesthetics: law, diplomacy, design, HR, partnership-based business, the arts.", health: "Kidneys, lower back and blood sugar; imbalance follows prolonged conflict avoidance. Hydration and paired activity help.", finance: "Spends on beauty and shared experience. Joint finances need explicit agreements to stay fair.", relationships: "Relationship is the main arena of growth. Needs a partner who names problems early so harmony is real." },
  { personality: "Reserved, penetrating, gives access to depth only after testing trust.", career: "Suits investigative and high-stakes work: research, surgery, psychology, forensics, crisis management, finance.", health: "Reproductive and eliminative systems; suppressed feeling becomes chronic tension. Deep rest and honest release matter.", finance: "Strong instinct for other people's money and hidden value. Avoid secrecy in shared accounts.", relationships: "Bonds absolutely or not at all. Needs a partner who can hold intensity without flinching or retaliating." },
  { personality: "Optimistic, wide-ranging, visibly restless when confined.", career: "Suits expansion work: teaching, publishing, travel, law, international trade, coaching.", health: "Liver, hips and thighs; excess follows enthusiasm. Long walks and moderation restore balance.", finance: "Income grows with reach and reputation. Over-commitment, not scarcity, is the usual risk.", relationships: "Needs freedom and shared philosophy. Bonds through adventure and honest debate." },
  { personality: "Composed, self-disciplined, older in bearing than in years.", career: "Suits structural authority: administration, engineering, government, long-cycle building, institutional leadership.", health: "Bones, knees, teeth and skin; chronic strain from over-responsibility. Warmth, stretching and delegated load help.", finance: "Excellent long-horizon planning; wealth arrives late and stays. Watch austerity becoming self-denial.", relationships: "Commits seriously and slowly. Needs a partner who values reliability over display." },
  { personality: "Independent, observant, socially engaged yet privately detached.", career: "Suits innovation and collective work: technology, science, reform, networks, community organisations.", health: "Circulation, ankles and nervous rhythm; irregular hours take a toll. Grounding routine offsets mental overdrive.", finance: "Unconventional earning patterns. Diversify, and treat cash reserves as freedom rather than restriction.", relationships: "Values friendship inside love and needs space granted freely rather than fought for." },
  { personality: "Receptive, imaginative, absorbs the mood of the environment.", career: "Suits imaginative and caring work: healing, music, film, spiritual practice, charity, anaesthetics of any kind used consciously.", health: "Feet, lymph and immune sensitivity; escapism weakens vitality. Water, rest and firm boundaries restore it.", finance: "Money flows in and out easily. Automated saving beats willpower.", relationships: "Merges quickly and deeply. Needs a partner who keeps the edges clear so compassion does not become loss of self." },
];

export function ascendantReport(chart: WesternChart): AscendantReport {
  const L = norm360(chart.tropicalAscendant);
  const s = Math.floor(L / 30);
  const t = ASC_TEXT[s];
  return {
    sign: SIGN_NAMES[s], degree: dms(L - s * 30).text, ruler: ASC_RULER[s],
    ...t,
  };
}

// ── General sign and house reports ──────────────────────────────────────────
const PLANET_FUNCTION: Record<string, string> = {
  Sun: "core identity and the will to be seen",
  Moon: "emotional need and instinctive response",
  Mercury: "thinking, speech and exchange",
  Venus: "attraction, value and pleasure",
  Mars: "drive, assertion and physical courage",
  Jupiter: "expansion, belief and opportunity",
  Saturn: "structure, limit and long-term mastery",
  Rahu: "hunger for unfamiliar experience",
  Ketu: "detachment from what is already mastered",
  Uranus: "the urge to break pattern",
  Neptune: "longing, imagination and devotion",
  Pluto: "power, exposure and rebuilding",
};

const SIGN_STYLE = [
  "with immediacy and initiative", "with patience and material realism",
  "through language, variety and quick association", "through feeling, memory and protection",
  "with confidence, warmth and visibility", "with precision, discernment and usefulness",
  "through balance, negotiation and aesthetics", "with intensity, secrecy and depth",
  "through breadth, principle and adventure", "with discipline, patience and hierarchy",
  "through originality, systems and detachment", "through empathy, imagination and surrender",
];

const HOUSE_FIELD = [
  "self-presentation and physical vitality", "money, possessions and self-worth",
  "communication, siblings and immediate environment", "home, family and the private base",
  "creativity, romance and children", "work, health routines and service",
  "partnership, contracts and open dealings", "shared resources, intimacy and transformation",
  "philosophy, travel, higher study and belief", "career, standing and public duty",
  "community, allies and long-range hopes", "solitude, endings, healing and the unseen",
];

export type SignReportRow = { planet: string; sign: string; text: string };
export type HouseReportRow = { planet: string; house: number; text: string };

export function planetInSignReport(rows: PlanetRow[]): SignReportRow[] {
  return rows.map((r) => ({
    planet: r.name, sign: r.sign,
    text: `${r.name} in ${r.sign} expresses ${PLANET_FUNCTION[r.name] ?? "its function"} ${SIGN_STYLE[r.signNo - 1]}. ` +
      `Because ${r.sign} is ${r.modality} ${r.element}, this function ${r.modality === "Cardinal" ? "starts things" : r.modality === "Fixed" ? "sustains and consolidates" : "adapts and redirects"} ` +
      `and is coloured by ${r.element.toLowerCase()} temperament. ` +
      `${r.retrograde ? "Retrograde motion turns this function inward first; results arrive after private revision." : "Direct motion lets this function operate outwardly without long delay."}`,
  }));
}

export function planetInHouseReport(rows: PlanetRow[]): HouseReportRow[] {
  return rows.map((r) => ({
    planet: r.name, house: r.house,
    text: `${r.name} in house ${r.house} places ${PLANET_FUNCTION[r.name] ?? "its function"} in the field of ${HOUSE_FIELD[r.house - 1]}. ` +
      `Expect this area to be where ${r.name === "Saturn" ? "effort, delay and eventual authority" : r.name === "Jupiter" ? "growth and opportunity" : r.name === "Mars" ? "conflict and initiative" : "attention and development"} repeatedly concentrate. ` +
      `The sign on it, ${r.sign}, sets the method: ${SIGN_STYLE[r.signNo - 1]}.`,
  }));
}

// ── Chart-wide midpoints ────────────────────────────────────────────────────
export type MidpointRow = { a: string; b: string; longitude: number; sign: string; dmsText: string };

export function midpointTable(rows: PlanetRow[]): MidpointRow[] {
  const out: MidpointRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i].fullDegree, b = rows[j].fullDegree;
      let m = norm360((a + b) / 2);
      if (Math.abs(a - b) > 180) m = norm360(m + 180);
      const s = Math.floor(m / 30);
      out.push({ a: rows[i].name, b: rows[j].name, longitude: m, sign: SIGN_NAMES[s], dmsText: dms(m - s * 30).text });
    }
  }
  return out;
}
