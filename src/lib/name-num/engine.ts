// Name numerology analysis engine.
//
// Deterministic. Everything below is derived from the letter chart in
// name-numerology-pro.ts (Chaldean or Pythagorean), the compound total and the
// reduced root. No randomness, so the same name always produces the same
// report.

import {
  nameChart,
  spellingOptions,
  type NameChart,
  type NameSystem,
  type SpellingOption,
} from "@/lib/name-numerology-pro";

export type Planet =
  | "Sun" | "Moon" | "Jupiter" | "Rahu" | "Mercury"
  | "Venus" | "Ketu" | "Saturn" | "Mars";

export const PLANET_OF: Record<number, Planet> = {
  1: "Sun", 2: "Moon", 3: "Jupiter", 4: "Rahu", 5: "Mercury",
  6: "Venus", 7: "Ketu", 8: "Saturn", 9: "Mars",
};

/** Short energy word used beside each letter. */
export const ENERGY_OF: Record<number, string> = {
  1: "Authority",
  2: "Sensitivity",
  3: "Expansion",
  4: "Disruption",
  5: "Quickness",
  6: "Comfort",
  7: "Detachment",
  8: "Discipline",
  9: "Drive",
};

export type PlanetProfile = {
  planet: Planet;
  number: number;
  nature: string;
  strengths: string[];
  weaknesses: string[];
  leadership: string;
  communication: string;
  money: string;
  relationships: string;
  career: string;
  learning: string;
  colours: string[];
  weekdays: string[];
  direction: string;
  gemstone: string;
  metal: string;
  luckyNumbers: number[];
  friendlyNumbers: number[];
  supportiveNumbers: number[];
  dates: number[];
};

const PROFILES: Record<number, Omit<PlanetProfile, "planet" | "number">> = {
  1: {
    nature: "Self-directed, decisive and visible. You prefer to own the outcome rather than share the steering wheel.",
    strengths: ["Clear decisions", "Original ideas", "Natural front-of-room presence", "Does not need approval to start"],
    weaknesses: ["Impatience with slow people", "Takes criticism personally", "Delegates late", "Ego shows under pressure"],
    leadership: "Directive. You set the target first and explain later, which works best with a small skilled team.",
    communication: "Short, declarative sentences. People remember what you said, so soften the delivery in sensitive rooms.",
    money: "Earns through ownership and position rather than salary steps. Income rises when you hold equity or a title.",
    relationships: "Loyal and protective, but you need to be respected before you can be close.",
    career: "Founder, department head, brand owner, government or administrative posts, anything with your name on the door.",
    learning: "Learns fastest by doing the thing badly once, then correcting it. Long theory courses bore you.",
    colours: ["Golden yellow", "Deep orange", "Copper"],
    weekdays: ["Sunday", "Monday"],
    direction: "East",
    gemstone: "Ruby",
    metal: "Gold or copper",
    luckyNumbers: [1, 4],
    friendlyNumbers: [2, 3, 9],
    supportiveNumbers: [5],
    dates: [1, 10, 19, 28],
  },
  2: {
    nature: "Receptive, diplomatic and observant. You read the mood of a room before you speak in it.",
    strengths: ["Reads people accurately", "Patient negotiation", "Loyal partnerships", "Creates calm around conflict"],
    weaknesses: ["Delays hard decisions", "Absorbs other people's stress", "Over-explains", "Mood swings with company"],
    leadership: "Consensus based. You lead by making everyone feel heard, which is slow but very hard to break.",
    communication: "Gentle and indirect. State the ask plainly at the end so it is not lost in the politeness.",
    money: "Income arrives through partnerships, collaborations and repeat clients rather than aggressive selling.",
    relationships: "Deeply attached and nurturing. You need reassurance more than gifts.",
    career: "Counselling, HR, design partnership, hospitality, diplomacy, healthcare, anything relational.",
    learning: "Learns by discussion and imitation. A mentor doubles your speed.",
    colours: ["Pearl white", "Soft cream", "Sea green"],
    weekdays: ["Monday", "Friday"],
    direction: "North-west",
    gemstone: "Natural pearl",
    metal: "Silver",
    luckyNumbers: [2, 7],
    friendlyNumbers: [1, 3, 5],
    supportiveNumbers: [6],
    dates: [2, 11, 20, 29],
  },
  3: {
    nature: "Expansive, teaching-minded and optimistic. You grow by explaining what you know to other people.",
    strengths: ["Persuasive speech", "Wide network", "Sees the principle behind a case", "Genuine generosity"],
    weaknesses: ["Overcommits", "Advises before listening", "Spends on appearances", "Loses interest after the idea stage"],
    leadership: "Mentoring. You raise people rather than manage tasks, so give the execution to a detail person.",
    communication: "Fluent and warm. Your risk is talking past the decision, not failing to make the point.",
    money: "Money follows knowledge and reputation. Teaching, advisory and content income compound over years.",
    relationships: "Affectionate and social. You need a partner who enjoys your public life, not one who competes with it.",
    career: "Teaching, law, advisory, publishing, finance, medicine, religion, training.",
    learning: "Structured and fast. You enjoy syllabus, certification and formal study.",
    colours: ["Yellow", "Saffron", "Turmeric gold"],
    weekdays: ["Thursday", "Tuesday"],
    direction: "North-east",
    gemstone: "Yellow sapphire",
    metal: "Gold",
    luckyNumbers: [3, 9],
    friendlyNumbers: [1, 2, 5, 6],
    supportiveNumbers: [7],
    dates: [3, 12, 21, 30],
  },
  4: {
    nature: "Unconventional, systems-minded and quietly rebellious. You see the flaw in the accepted method.",
    strengths: ["Original problem solving", "Comfort with technology", "Works well in chaos", "Unimpressed by hierarchy"],
    weaknesses: ["Restlessness", "Sudden reversals", "Distrusts authority even when it helps", "Irregular routine"],
    leadership: "Reformer. You are best brought in to fix a broken unit, less suited to steady caretaking.",
    communication: "Blunt and unusual. People either find you refreshing or difficult; there is rarely a middle view.",
    money: "Income is uneven and often from non-traditional sources. Keep a twelve-month reserve.",
    relationships: "Independent, needs space. Honesty matters to you far more than ceremony.",
    career: "Technology, research, aviation, media, crypto and data, import-export, reform work.",
    learning: "Self-taught. You skip the manual and reverse engineer the result.",
    colours: ["Grey", "Electric blue", "Smoke"],
    weekdays: ["Saturday", "Sunday"],
    direction: "South-west",
    gemstone: "Hessonite",
    metal: "Mixed alloy or steel",
    luckyNumbers: [4, 8],
    friendlyNumbers: [1, 5, 6],
    supportiveNumbers: [7],
    dates: [4, 13, 22, 31],
  },
  5: {
    nature: "Quick, adaptable and commercially alert. You process information faster than you process feelings.",
    strengths: ["Fast learning", "Excellent negotiation", "Adapts to any market", "Writes and speaks clearly"],
    weaknesses: ["Starts more than it finishes", "Nervous energy", "Bores easily", "Overthinks small risks"],
    leadership: "Agile. You are strongest coordinating many moving parts, weakest doing one thing for years.",
    communication: "Your primary strength. Sharp, funny and quick to find the useful phrase.",
    money: "Trading, commissions, consulting and short cycles suit you. Long lock-ins frustrate you.",
    relationships: "Friendly and light. You need mental company more than emotional intensity.",
    career: "Sales, marketing, consulting, writing, trading, software, travel, media.",
    learning: "Absorbs quickly from short formats. Depth requires deliberate repetition.",
    colours: ["Emerald green", "Light grey", "Mint"],
    weekdays: ["Wednesday", "Friday"],
    direction: "North",
    gemstone: "Emerald",
    metal: "Bronze",
    luckyNumbers: [5, 6],
    friendlyNumbers: [1, 2, 3, 9],
    supportiveNumbers: [4],
    dates: [5, 14, 23],
  },
  6: {
    nature: "Aesthetic, responsible and comfort-seeking. You build a beautiful, stable environment and then protect it.",
    strengths: ["Design sense", "Reliability with family and team", "Attracts support easily", "Creates loyalty"],
    weaknesses: ["Avoids confrontation", "Over-indulges", "Takes on other people's duties", "Perfectionism about appearance"],
    leadership: "Caretaking. People stay under you for years because you look after them.",
    communication: "Warm, tactful and persuasive. You win agreement rather than argument.",
    money: "Steady earning with strong taste. Luxury spending is your main leak; automate savings.",
    relationships: "Marriage and family are central. You give a great deal and expect acknowledgement.",
    career: "Design, fashion, hospitality, real estate, beauty, entertainment, wellness, luxury retail.",
    learning: "Visual and practical. You learn well from beautiful, well-made material.",
    colours: ["White", "Pastel pink", "Ivory"],
    weekdays: ["Friday", "Wednesday"],
    direction: "South-east",
    gemstone: "Diamond or white sapphire",
    metal: "Silver or platinum",
    luckyNumbers: [6, 5],
    friendlyNumbers: [3, 4, 8, 9],
    supportiveNumbers: [2],
    dates: [6, 15, 24],
  },
  7: {
    nature: "Analytical, private and research-driven. You need to understand a thing before you can commit to it.",
    strengths: ["Deep concentration", "Sees through pretence", "Independent judgement", "Comfortable alone"],
    weaknesses: ["Withdraws under stress", "Late to ask for help", "Cynical phases", "Delays practical decisions"],
    leadership: "Expert authority. People follow your judgement, not your instructions.",
    communication: "Precise and sparing. Say the supportive part out loud; you tend to assume it is obvious.",
    money: "Income from specialisation. You are not a natural seller, so price the expertise, not the hours.",
    relationships: "Selective and deep. A few real bonds matter more than a wide circle.",
    career: "Research, analytics, medicine, law, spirituality, audit, forensics, writing, philosophy.",
    learning: "Intense self-study. You prefer primary sources to summaries.",
    colours: ["Sea green", "Grey", "Smoky violet"],
    weekdays: ["Monday", "Sunday"],
    direction: "South",
    gemstone: "Cat's eye",
    metal: "Silver",
    luckyNumbers: [7, 2],
    friendlyNumbers: [3, 4, 6],
    supportiveNumbers: [1],
    dates: [7, 16, 25],
  },
  8: {
    nature: "Structural, patient and results-focused. You accept delay if the outcome is permanent.",
    strengths: ["Long-term planning", "Handles pressure", "Financial discipline", "Builds institutions"],
    weaknesses: ["Slow starts", "Emotionally reserved", "Carries burdens silently", "Rigid when challenged"],
    leadership: "Administrative. You are excellent with scale, process and accountability.",
    communication: "Formal and measured. Warmth has to be added deliberately.",
    money: "Wealth builds late and lasts. Property, systems and compounding suit you; speculation does not.",
    relationships: "Committed and dutiful. You show love through provision more than words.",
    career: "Finance, law, mining, construction, government, logistics, large-scale operations, insurance.",
    learning: "Slow, thorough and permanent. What you learn, you keep.",
    colours: ["Deep blue", "Black", "Charcoal"],
    weekdays: ["Saturday", "Friday"],
    direction: "West",
    gemstone: "Blue sapphire (test first)",
    metal: "Iron or steel",
    luckyNumbers: [8, 4],
    friendlyNumbers: [5, 6],
    supportiveNumbers: [3],
    dates: [8, 17, 26],
  },
  9: {
    nature: "Energetic, courageous and cause-driven. You need something worth fighting for.",
    strengths: ["Physical and mental stamina", "Acts under pressure", "Protective of the weaker side", "Finishes what threatens to fail"],
    weaknesses: ["Temper", "Impulsive commitments", "Burnout", "Argues when tired"],
    leadership: "Frontline. You lead the difficult phase rather than the maintenance phase.",
    communication: "Direct and forceful. Pause before replying when the topic is personal.",
    money: "Earned through effort and risk. Property and technical skill hold value better than trading for you.",
    relationships: "Passionate and protective. Learn to name the feeling before the frustration arrives.",
    career: "Defence, surgery, engineering, sport, real estate, manufacturing, emergency services, entrepreneurship.",
    learning: "Practical drills and repetition. You learn by training, not by reading.",
    colours: ["Red", "Coral", "Rust"],
    weekdays: ["Tuesday", "Sunday"],
    direction: "South",
    gemstone: "Red coral",
    metal: "Copper",
    luckyNumbers: [9, 1],
    friendlyNumbers: [3, 5, 6],
    supportiveNumbers: [2],
    dates: [9, 18, 27],
  },
};

export function planetProfile(root: number): PlanetProfile {
  const n = root >= 1 && root <= 9 ? root : 1;
  return { planet: PLANET_OF[n]!, number: n, ...PROFILES[n]! };
}

// ── Scoring ─────────────────────────────────────────────────────────────────

/** Balanced compounds from classical practice, used only for the rating. */
const STRONG_COMPOUNDS = new Set([10, 15, 19, 21, 23, 24, 27, 32, 37, 41, 45, 46, 50]);
const HARSH_COMPOUNDS = new Set([13, 16, 18, 26, 29, 31, 35, 38, 43, 44, 47, 48, 51]);

function clamp(n: number) {
  return Math.max(4, Math.min(99, Math.round(n)));
}

export type StrengthKey =
  | "Confidence" | "Leadership" | "Communication" | "Creativity" | "Discipline"
  | "Finance" | "Relationships" | "Career" | "Spirituality" | "Luck";

const STRENGTH_WEIGHTS: Record<StrengthKey, Record<number, number>> = {
  Confidence:     { 1: 92, 2: 58, 3: 80, 4: 66, 5: 74, 6: 70, 7: 60, 8: 78, 9: 88 },
  Leadership:     { 1: 95, 2: 55, 3: 78, 4: 64, 5: 70, 6: 68, 7: 58, 8: 86, 9: 84 },
  Communication:  { 1: 74, 2: 76, 3: 90, 4: 68, 5: 95, 6: 82, 7: 60, 8: 62, 9: 70 },
  Creativity:     { 1: 76, 2: 72, 3: 84, 4: 88, 5: 86, 6: 92, 7: 78, 8: 58, 9: 72 },
  Discipline:     { 1: 74, 2: 62, 3: 70, 4: 54, 5: 58, 6: 66, 7: 80, 8: 95, 9: 76 },
  Finance:        { 1: 78, 2: 64, 3: 82, 4: 60, 5: 84, 6: 86, 7: 62, 8: 92, 9: 70 },
  Relationships:  { 1: 66, 2: 92, 3: 82, 4: 58, 5: 74, 6: 94, 7: 60, 8: 64, 9: 68 },
  Career:         { 1: 88, 2: 68, 3: 84, 4: 70, 5: 82, 6: 78, 7: 74, 8: 90, 9: 80 },
  Spirituality:   { 1: 64, 2: 78, 3: 82, 4: 74, 5: 58, 6: 70, 7: 96, 8: 68, 9: 72 },
  Luck:           { 1: 80, 2: 66, 3: 86, 4: 54, 5: 78, 6: 88, 7: 60, 8: 62, 9: 74 },
};

export const STRENGTH_KEYS = Object.keys(STRENGTH_WEIGHTS) as StrengthKey[];

export type CareerScore = {
  field: string;
  score: number;
  reason: string;
  strength: string;
  challenge: string;
};

const CAREERS: { field: string; base: Record<number, number>; reason: string; strength: string; challenge: string }[] = [
  { field: "Business", base: { 1: 92, 2: 62, 3: 80, 4: 72, 5: 88, 6: 82, 7: 58, 8: 90, 9: 84 },
    reason: "Ownership rewards decision speed and risk tolerance, which this vibration carries.",
    strength: "You can hold responsibility without external supervision.",
    challenge: "Cash-flow discipline needs a second person or a fixed system." },
  { field: "Management", base: { 1: 90, 2: 74, 3: 78, 4: 66, 5: 76, 6: 80, 7: 62, 8: 94, 9: 82 },
    reason: "Process, accountability and people handling sit close to this number's natural habit.",
    strength: "Structure and follow-through come easily to you.",
    challenge: "Softening the delivery so the team does not read pressure as displeasure." },
  { field: "Teaching", base: { 1: 70, 2: 82, 3: 95, 4: 62, 5: 80, 6: 84, 7: 86, 8: 66, 9: 68 },
    reason: "Explaining is how this vibration converts knowledge into standing.",
    strength: "You simplify complex material without losing accuracy.",
    challenge: "Institutional pay ceilings; add advisory or content work." },
  { field: "Technology", base: { 1: 76, 2: 62, 3: 70, 4: 94, 5: 88, 6: 66, 7: 90, 8: 74, 9: 72 },
    reason: "Abstract systems and independent problem solving suit this energy.",
    strength: "You can stay with an unsolved problem longer than most.",
    challenge: "Visibility. Technical results need translation for decision makers." },
  { field: "Creative arts", base: { 1: 72, 2: 78, 3: 86, 4: 84, 5: 82, 6: 95, 7: 76, 8: 54, 9: 70 },
    reason: "Taste and originality are strong markers of this number.",
    strength: "Distinct personal style that clients recognise.",
    challenge: "Pricing and consistency of output rather than talent." },
  { field: "Medical and healthcare", base: { 1: 74, 2: 84, 3: 82, 4: 66, 5: 70, 6: 80, 7: 92, 8: 72, 9: 90 },
    reason: "Sustained attention plus service orientation define this field's fit.",
    strength: "Calm judgement when others are anxious.",
    challenge: "Long training period and emotional load; protect rest." },
  { field: "Government and public service", base: { 1: 88, 2: 70, 3: 78, 4: 60, 5: 64, 6: 72, 7: 74, 8: 92, 9: 82 },
    reason: "Hierarchy, tenure and formal authority match this vibration.",
    strength: "You work well inside rules and long timelines.",
    challenge: "Slow recognition; plan advancement over years, not months." },
  { field: "Law", base: { 1: 80, 2: 68, 3: 92, 4: 66, 5: 78, 6: 70, 7: 88, 8: 86, 9: 76 },
    reason: "Argument built on precedent rewards structured, principled thinking.",
    strength: "You hold a position under pressure and cite the reason for it.",
    challenge: "Early years are low-paid and adversarial; endurance decides it." },
  { field: "Finance and banking", base: { 1: 78, 2: 70, 3: 84, 4: 62, 5: 86, 6: 80, 7: 74, 8: 96, 9: 66 },
    reason: "Numbers, risk and long compounding cycles fit this number's temperament.",
    strength: "Comfort with detail and delayed reward.",
    challenge: "Avoid speculation in a weak phase; keep to systems." },
  { field: "Sales", base: { 1: 84, 2: 72, 3: 82, 4: 64, 5: 96, 6: 78, 7: 52, 8: 68, 9: 80 },
    reason: "Persuasion and quick reading of the other side are core to this vibration.",
    strength: "You convert conversations into agreements.",
    challenge: "Income variability; build a recurring base." },
  { field: "Consulting", base: { 1: 84, 2: 74, 3: 90, 4: 76, 5: 90, 6: 74, 7: 88, 8: 80, 9: 70 },
    reason: "Advice sold as expertise suits an analytical, articulate signature.",
    strength: "You diagnose faster than you are expected to.",
    challenge: "Positioning. Narrow the niche before widening the fee." },
  { field: "Entrepreneurship", base: { 1: 94, 2: 58, 3: 78, 4: 86, 5: 90, 6: 76, 7: 62, 8: 84, 9: 88 },
    reason: "Independent starts and tolerance for uncertainty are marked here.",
    strength: "You begin without waiting for permission.",
    challenge: "Operating discipline after the launch phase." },
  { field: "Research", base: { 1: 66, 2: 74, 3: 80, 4: 88, 5: 70, 6: 64, 7: 96, 8: 78, 9: 62 },
    reason: "Depth over breadth, which is exactly this number's preference.",
    strength: "Patience with unresolved questions.",
    challenge: "Funding cycles and slow public recognition." },
  { field: "Writing", base: { 1: 70, 2: 80, 3: 88, 4: 78, 5: 92, 6: 82, 7: 90, 8: 60, 9: 66 },
    reason: "Language is a direct outlet for this vibration's mental speed.",
    strength: "Clarity of phrasing and a recognisable voice.",
    challenge: "Monetisation; pair writing with teaching or consulting." },
  { field: "Media and communication", base: { 1: 82, 2: 74, 3: 84, 4: 90, 5: 94, 6: 84, 7: 62, 8: 64, 9: 76 },
    reason: "Public reach and fast cycles suit an outward, adaptable signature.",
    strength: "You understand audience attention instinctively.",
    challenge: "Burnout from constant output; build a content system." },
  { field: "Hospitality", base: { 1: 70, 2: 86, 3: 80, 4: 62, 5: 82, 6: 94, 7: 56, 8: 72, 9: 74 },
    reason: "Comfort, aesthetics and service response are strong here.",
    strength: "Guests remember how you made the experience feel.",
    challenge: "Thin margins and long hours; systemise early." },
  { field: "Spiritual professions", base: { 1: 66, 2: 80, 3: 90, 4: 72, 5: 60, 6: 76, 7: 96, 8: 70, 9: 74 },
    reason: "Inward orientation and teaching ability combine in this vibration.",
    strength: "People trust your detachment from their outcome.",
    challenge: "Sustainable income; keep a separate professional base." },
];

export type Chip = { label: string; value: string };

export type Timeline = { phase: string; window: string; body: string }[];

export type Section = { title: string; body: string };

export type NameAnalysis = {
  input: string;
  system: NameSystem;
  chart: NameChart;
  compound: number;
  root: number;
  compoundMeaning: string;
  planet: PlanetProfile;
  rating: number;
  luckLevel: string;
  harmony: number;
  steps: { label: string; value: string; note: string }[];
  letters: { letter: string; value: number; planet: Planet; energy: string; isVowel: boolean }[];
  personality: Section[];
  careers: CareerScore[];
  relationships: { area: string; score: number; note: string }[];
  finance: { area: string; score: number; note: string }[];
  lucky: Chip[];
  correction: {
    balanced: boolean;
    weakAreas: string[];
    additions: string[];
    removals: string[];
    alternatives: SpellingOption[];
    expected: string[];
    confidence: number;
  };
  timeline: Timeline;
  strengths: { key: StrengthKey; value: number }[];
  summary: {
    rating: number;
    planet: Planet;
    bestStrength: string;
    mainChallenge: string;
    career: string;
    relationship: string;
    finance: string;
    advice: string;
    affirmation: string;
  };
};

const AFFIRMATIONS: Record<number, string> = {
  1: "I decide clearly, and I carry what I decide.",
  2: "I stay steady with people, and steadiness returns to me.",
  3: "What I understand, I share, and sharing widens my work.",
  4: "I trust my own method, and I finish what I redesign.",
  5: "I move quickly, and I complete before I move again.",
  6: "I build beauty that is also useful, and it holds.",
  7: "I go deep before I go wide, and depth pays me.",
  8: "I build slowly and it stays built.",
  9: "I use my energy for something worth protecting.",
};

const ADVICE: Record<number, string> = {
  1: "Keep the final decision, but give away the middle steps. Your growth is limited by how much you personally carry.",
  2: "Say the ask out loud. Your reading of people is excellent, but you under-request what you are owed.",
  3: "Choose two subjects and go deep. Your reputation grows with specialisation, not with range.",
  4: "Stabilise the base before the next reinvention. A twelve-month reserve turns your unpredictability into freedom.",
  5: "Finish one thing fully every quarter. Your speed is an asset only when something is completed with it.",
  6: "Separate generosity from obligation. Comfort spending, not income, is your real constraint.",
  7: "Sell the expertise, not the hours. Ask for help earlier than feels natural.",
  8: "Keep going through the slow middle. Your results are usually two years behind your effort, and then they last.",
  9: "Convert reaction into training. Physical routine keeps your temper and your income both stable.",
};

const P_TITLES = [
  "Core personality", "Public image", "Inner nature", "Thinking pattern",
  "Decision making", "Communication style", "Creativity", "Discipline",
  "Leadership", "Emotional nature", "Money mindset", "Relationships",
  "Marriage tendencies", "Business potential", "Career potential",
  "Health tendencies", "Spiritual nature", "Life mission",
];

function personalitySections(p: PlanetProfile, chart: NameChart, rating: number): Section[] {
  const n = p.number;
  const vowelLed = chart.vowelTotal > chart.consonantTotal;
  const long = chart.cells.length >= 12;
  const rep = chart.repeatedValues[0];
  const missing = chart.missingValues;

  const bodies: Record<string, string> = {
    "Core personality": `${p.nature} The signature reduces to ${n}, ruled by ${p.planet}, so the first thing people register about you is ${
      n === 1 ? "authority" : n === 2 ? "approachability" : n === 3 ? "knowledge" : n === 4 ? "difference" : n === 5 ? "speed" : n === 6 ? "taste" : n === 7 ? "reserve" : n === 8 ? "seriousness" : "energy"
    }. That impression forms in under a minute and shapes what people offer you.`,
    "Public image": `Your name total ${chart.compound} carries a public reading of its own. ${chart.compoundMeaning} In practical terms, your reputation moves ${
      rating >= 75 ? "in your favour without much management" : rating >= 55 ? "correctly once people work with you, though the first impression undersells you" : "slower than your ability, so evidence and testimonials matter more for you than for others"
    }.`,
    "Inner nature": `${vowelLed
      ? "The vowels outweigh the consonants in your name, so the inner life is louder than the outward one. You feel decisions before you can justify them, and you need private time to convert feeling into a reason."
      : "The consonants outweigh the vowels, so the outward, functional self is stronger than the inner commentary. You act first and process afterwards, usually while doing something else."} `
      + `${p.weaknesses[0]} is the pattern that shows when you are tired.`,
    "Thinking pattern": `${p.learning} Under time pressure you fall back on ${
      n === 5 || n === 3 ? "verbal reasoning: you think by explaining." : n === 7 || n === 4 ? "analysis: you withdraw and model the problem." : n === 8 || n === 1 ? "structure: you break the task into ordered steps." : "relational reasoning: you ask who is affected before you ask what is optimal."
    }`,
    "Decision making": `${p.leadership} You decide ${
      [1, 5, 9].includes(n) ? "fast, and the risk is acting on incomplete information" : [2, 6].includes(n) ? "slowly, and the risk is that the opportunity closes while you consult" : "deliberately, and the risk is over-analysis"
    }. A useful rule for you: ${
      [1, 5, 9].includes(n) ? "sleep on anything above one month of income." : [2, 6].includes(n) ? "set a decision deadline in writing before you start consulting." : "write the three facts that would change your mind, then check only those."
    }`,
    "Communication style": p.communication + (long ? " Your name is long, which gives a formal, complete impression in writing; keep the spoken version shorter." : " Your name is short, which reads as direct and confident; add warmth in writing."),
    "Creativity": `Creative output for a ${n} vibration comes from ${
      [3, 6, 5].includes(n) ? "abundance: you generate quickly and edit later." : [4, 7].includes(n) ? "constraint: you produce your best work with a hard limit and a real problem." : "purpose: you create when the output serves something concrete."
    } ${rep ? `The value ${rep.value} repeats ${rep.count} times in your name, which intensifies that theme and can make your style recognisable to the point of repetition.` : "No value dominates the spelling, so your style stays flexible across formats."}`,
    "Discipline": `${p.strengths.includes("Financial discipline") ? "Discipline is native to this number." : "Discipline is learned rather than native for this number."} The reliable method for you is ${
      [8, 4].includes(n) ? "a fixed schedule you do not renegotiate daily." : [5, 3].includes(n) ? "short sprints with a visible finish line." : "an accountability partner who sees the weekly output."
    }`,
    "Leadership": `${p.leadership} You are strongest leading ${
      n === 9 || n === 4 ? "a turnaround or crisis phase" : n === 8 || n === 1 ? "a scaling or institution-building phase" : n === 6 || n === 2 ? "a team that needs retention and morale" : "a knowledge team that needs direction more than supervision"
    }.`,
    "Emotional nature": `${p.relationships} When hurt you ${
      [1, 8, 9].includes(n) ? "become brisk and busy rather than open." : [2, 6].includes(n) ? "go quiet and wait to be asked." : [7, 4].includes(n) ? "withdraw entirely and analyse." : "talk around the subject before reaching it."
    } Naming the feeling within a day prevents most of your long conflicts.`,
    "Money mindset": p.money,
    "Relationships": `${p.relationships} You are most compatible with people carrying ${p.friendlyNumbers.join(", ")} energy, and you have to work harder with rigidly opposite temperaments.`,
    "Marriage tendencies": `${
      [2, 6].includes(n) ? "Marriage is central to your stability, and you invest early." : [1, 8].includes(n) ? "You marry with commitment but keep work as a parallel priority; the partner needs to accept that ordering." : [5, 3].includes(n) ? "You need mental companionship and freedom of movement inside marriage; routine without conversation is what damages it." : "You need privacy and a slow build inside marriage; pressure to be constantly expressive strains you."
    } Long-term satisfaction for you depends more on shared pace than on shared interests.`,
    "Business potential": `Business fit is ${
      rating >= 70 ? "high" : rating >= 55 ? "moderate and depends on the partner" : "conditional, and it improves markedly with a complementary partner"
    }. ${p.career.split(",")[0]} is the closest natural line. Keep a partner who covers ${
      [1, 9, 5].includes(n) ? "operations and finance" : [2, 6, 7].includes(n) ? "sales and negotiation" : "marketing and public communication"
    }.`,
    "Career potential": p.career,
    "Health tendencies": `${
      n === 1 ? "Heart, blood pressure and eye strain respond to your stress. Sunlight and a fixed sleep window help most." :
      n === 2 ? "Sleep, digestion and mood are linked for you. Regular hours matter more than diet detail." :
      n === 3 ? "Liver, weight and blood sugar are your watch areas. Moderation of rich food beats intense dieting." :
      n === 4 ? "Nervous system, skin and irregular sleep are the pattern. Screens before bed cost you more than most." :
      n === 5 ? "Nervous strain, breathing and overthinking. Physical exercise settles your mind faster than rest does." :
      n === 6 ? "Throat, reproductive health and sugar. Comfort eating is the main risk." :
      n === 7 ? "Absorption, hydration and low mood in isolation. Company is medicine for you." :
      n === 8 ? "Bones, knees, teeth and chronic stress. Prevention and annual testing suit your temperament." :
      "Inflammation, injuries and blood pressure from over-exertion. Structured training beats sporadic intensity."
    }`,
    "Spiritual nature": `${
      n === 7 ? "This is the most inward vibration; practice comes naturally and you should keep it private and regular." :
      n === 9 ? "Service is your practice. Devotion expressed as protection of others suits you better than seated meditation." :
      n === 3 ? "Study and teaching are your practice. Scripture, philosophy and discussion feed you." :
      "A short daily practice works better for you than long occasional retreats."
    } ${missing.length ? `The values ${missing.join(", ")} do not appear in your name, so those qualities have to be built consciously rather than expected to arrive.` : "All core values appear in your spelling, so the name is internally complete."}`,
    "Life mission": `${
      n === 1 ? "To originate something that carries your standard after you stop managing it." :
      n === 2 ? "To hold people and agreements together where others would let them break." :
      n === 3 ? "To convert knowledge into something teachable and pass it on." :
      n === 4 ? "To rebuild a broken system into one that actually works." :
      n === 5 ? "To connect people, markets and ideas that would not otherwise meet." :
      n === 6 ? "To make daily life better looking, better run and more comfortable for the people near you." :
      n === 7 ? "To reach the truth of one subject and state it plainly." :
      n === 8 ? "To build a structure that outlasts your involvement." :
      "To protect and defend, and to spend energy on something larger than personal comfort."
    }`,
  };

  return P_TITLES.map((title) => ({ title, body: bodies[title] ?? "" }));
}

function ratingOf(chart: NameChart, root: number): number {
  const base = 52
    + (STRONG_COMPOUNDS.has(chart.compound) ? 18 : 0)
    - (HARSH_COMPOUNDS.has(chart.compound) ? 14 : 0)
    + ([1, 3, 5, 6, 9].includes(root) ? 10 : [2, 7].includes(root) ? 4 : -4)
    + (chart.cells.length >= 6 && chart.cells.length <= 18 ? 6 : 0)
    - Math.min(10, chart.missingValues.length * 1.5)
    - (chart.repeatedValues[0] && chart.repeatedValues[0].count >= 5 ? 6 : 0)
    + (chart.vowelTotal > 0 && chart.consonantTotal > 0 ? 6 : 0);
  return clamp(base);
}

export function analyseName(
  fullName: string,
  system: NameSystem = "Chaldean",
): NameAnalysis {
  const chart = nameChart(fullName || "Name", system);
  const root = chart.root || 1;
  const planet = planetProfile(root);
  const rating = ratingOf(chart, root);
  const harmony = clamp(
    50 + (chart.vowelTotal && chart.consonantTotal
      ? 40 - Math.abs(chart.vowelTotal - chart.consonantTotal) * 1.5
      : 0) + (STRONG_COMPOUNDS.has(chart.compound) ? 10 : 0),
  );

  const luckLevel =
    rating >= 82 ? "Very high" : rating >= 70 ? "High" : rating >= 58 ? "Moderate" : rating >= 45 ? "Mixed" : "Needs support";

  let running = 0;
  const runningParts = chart.cells.map((c) => {
    running += c.value;
    return `${c.letter}${c.value}`;
  });

  const steps = [
    { label: "Letter values", value: runningParts.join("  "), note: `${system} chart applied letter by letter, spaces ignored.` },
    { label: "Running total", value: String(chart.compound), note: "Every letter value added in order of spelling." },
    { label: "Compound number", value: String(chart.compound), note: chart.compoundMeaning },
    { label: "Single number", value: String(root), note: "The compound reduced to one digit. This is the working name number." },
    { label: "Ruling planet", value: planet.planet, note: `Number ${root} is ruled by ${planet.planet}.` },
    { label: "Final reading", value: `${rating} / 100`, note: `${luckLevel} support level for this spelling.` },
  ];

  const letters = chart.cells.map((c) => ({
    letter: c.letter,
    value: c.value,
    planet: PLANET_OF[c.value] ?? "Sun",
    energy: ENERGY_OF[c.value] ?? "Balance",
    isVowel: c.isVowel,
  }));

  const careers = CAREERS.map((c) => {
    const raw = c.base[root] ?? 60;
    const adj = clamp(raw * 0.85 + rating * 0.15);
    return { field: c.field, score: adj, reason: c.reason, strength: c.strength, challenge: c.challenge };
  }).sort((a, b) => b.score - a.score);

  const rel = (area: string, key: StrengthKey, note: string) => ({
    area,
    score: clamp((STRENGTH_WEIGHTS[key][root] ?? 65) * 0.8 + harmony * 0.2),
    note,
  });

  const relationships = [
    rel("Love", "Relationships", "How readily you open the first door with a new person."),
    rel("Marriage", "Relationships", "Stability of a long shared routine, not intensity of attraction."),
    rel("Family", "Discipline", "Duty and presence with parents, siblings and children."),
    rel("Friendship", "Communication", "Ease of forming and keeping a wide circle."),
    rel("Professional relations", "Career", "How colleagues and clients experience working with you."),
    rel("Communication", "Communication", "How clearly your intention reaches the other person."),
    rel("Trust", "Discipline", "Consistency between what you promise and what you deliver."),
    rel("Commitment", "Discipline", "Ability to stay through the boring middle of a bond."),
    rel("Emotional expression", "Relationships", "How visible your feeling is to the person receiving it."),
  ];

  const fin = (area: string, key: StrengthKey, note: string) => ({
    area,
    score: clamp((STRENGTH_WEIGHTS[key][root] ?? 65) * 0.75 + rating * 0.25),
    note,
  });

  const finance = [
    fin("Money attraction", "Finance", "How easily income opportunities reach you without being chased."),
    fin("Saving ability", "Discipline", "What survives from the income after lifestyle."),
    fin("Investment style", "Finance", planet.money),
    fin("Business growth", "Career", "How well earnings scale beyond your own hours."),
    fin("Risk taking", "Confidence", "Comfort with uncertain outcomes for a larger reward."),
    fin("Luxury potential", "Luck", "Access to comfort, travel and quality goods over time."),
    fin("Financial stability", "Discipline", "Resilience of your money through a bad year."),
  ];

  const lucky: Chip[] = [
    { label: "Lucky planet", value: planet.planet },
    { label: "Lucky numbers", value: planet.luckyNumbers.join(", ") },
    { label: "Friendly numbers", value: planet.friendlyNumbers.join(", ") },
    { label: "Supportive numbers", value: planet.supportiveNumbers.join(", ") },
    { label: "Lucky colours", value: planet.colours.join(", ") },
    { label: "Lucky weekdays", value: planet.weekdays.join(", ") },
    { label: "Lucky direction", value: planet.direction },
    { label: "Lucky gemstone", value: planet.gemstone },
    { label: "Lucky metal", value: planet.metal },
    { label: "Lucky dates", value: planet.dates.join(", ") },
  ];

  // Correction study. Birth numbers are unknown here, so the name is tested
  // against its own root for internal balance.
  const opts = spellingOptions(chart.fullName || "NAME", root, root, system, 6);
  const balanced = rating >= 70 && !HARSH_COMPOUNDS.has(chart.compound);
  const weakAreas: string[] = [];
  if (HARSH_COMPOUNDS.has(chart.compound)) weakAreas.push(`The compound ${chart.compound} carries a harsh classical reading, so results arrive with friction.`);
  if (chart.missingValues.length >= 4) weakAreas.push(`The values ${chart.missingValues.join(", ")} are absent, so those qualities are not supported by the spelling.`);
  if (chart.repeatedValues[0] && chart.repeatedValues[0].count >= 4) weakAreas.push(`The value ${chart.repeatedValues[0].value} repeats ${chart.repeatedValues[0].count} times, which over-concentrates one theme.`);
  if (chart.vowelTotal === 0 || chart.consonantTotal === 0) weakAreas.push("The name is entirely vowels or entirely consonants, which leaves inner and outer expression unbalanced.");
  if (!weakAreas.length) weakAreas.push("No structural weakness found. This spelling is internally balanced.");

  const additions = opts.better.filter((o) => o.change.startsWith("add") || o.change.startsWith("double")).slice(0, 4).map((o) => `${o.change} gives ${o.compound} reducing to ${o.root}`);
  const removals = opts.better.filter((o) => o.change.startsWith("remove")).slice(0, 3).map((o) => `${o.change} gives ${o.compound} reducing to ${o.root}`);

  const correction = {
    balanced,
    weakAreas,
    additions: additions.length ? additions : ["No addition improves the score, so adding letters is not advised."],
    removals: removals.length ? removals : ["No removal improves the score, so keep the spelling intact."],
    alternatives: opts.better.slice(0, 5),
    expected: balanced
      ? ["Keep the spelling identical across documents, signature and public profiles so the vibration is not split."]
      : [
          "Smoother first impressions in professional settings.",
          "Fewer repeated delays at the approval stage of work.",
          "Better alignment between the effort you put in and the recognition you receive.",
        ],
    confidence: balanced ? 92 : clamp(40 + (opts.better[0]?.score ?? rating) * 0.5),
  };

  const timeline: Timeline = [
    { phase: "Growth", window: "Years 1 to 9 of using this name", body: `Early traction comes through ${planet.career.split(",")[0]!.trim()}. The name opens doors faster than the resume does.` },
    { phase: "Challenges", window: "The second cycle", body: `The weak side of ${planet.planet} shows here: ${planet.weaknesses[0]!.toLowerCase()}. This is the phase that decides whether the spelling stays.` },
    { phase: "Recognition", window: "After a full nine-year cycle", body: "Consistent spelling starts producing reputation on its own. Referrals outweigh applications." },
    { phase: "Expansion", window: "The scaling phase", body: `Income moves from personal effort to structure. ${planet.money}` },
    { phase: "Learning", window: "Mid-cycle correction", body: `${planet.learning} This is when a deliberate skill upgrade pays the most.` },
    { phase: "Transformation", window: "Late cycle", body: "The name's meaning shifts from what you do to what you are known for. Public identity settles here." },
  ];

  const strengths = STRENGTH_KEYS.map((key) => ({
    key,
    value: clamp((STRENGTH_WEIGHTS[key][root] ?? 65) * 0.82 + rating * 0.18),
  }));

  const best = [...strengths].sort((a, b) => b.value - a.value)[0]!;
  const worst = [...strengths].sort((a, b) => a.value - b.value)[0]!;

  return {
    input: chart.fullName || fullName,
    system,
    chart,
    compound: chart.compound,
    root,
    compoundMeaning: chart.compoundMeaning,
    planet,
    rating,
    luckLevel,
    harmony,
    steps,
    letters,
    personality: personalitySections(planet, chart, rating),
    careers,
    relationships,
    finance,
    lucky,
    correction,
    timeline,
    strengths,
    summary: {
      rating,
      planet: planet.planet,
      bestStrength: `${best.key} at ${best.value} out of 100`,
      mainChallenge: `${worst.key} at ${worst.value} out of 100. ${planet.weaknesses[0]}`,
      career: careers[0]!.field,
      relationship: planet.relationships,
      finance: planet.money,
      advice: ADVICE[root] ?? "",
      affirmation: AFFIRMATIONS[root] ?? "",
    },
  };
}

export const EDUCATION: Section[] = [
  { title: "What is name numerology?", body: "Name numerology converts the letters of a written name into numbers, adds them, and reads the total. It describes the impression a name creates and the pattern of experiences that follow that impression. It does not replace the birth chart; it works alongside it." },
  { title: "Compound number", body: "The compound is the raw total before reduction, for example 37 or 46. Classical Chaldean practice reads this number directly, because two names that both reduce to 1 can behave very differently if one totals 19 and the other 28." },
  { title: "Single number", body: "The single number is the compound reduced to one digit by adding its digits until one remains. It names the ruling planet and the broad temperament of the name." },
  { title: "Planetary influence", body: "Each digit from 1 to 9 is assigned a planet: Sun, Moon, Jupiter, Rahu, Mercury, Venus, Ketu, Saturn and Mars. The planet of your single number describes the tone of how the name lands on other people." },
  { title: "Letter vibrations", body: "Every letter carries a fixed value in the Chaldean table, based on the sound rather than the alphabet order. This is why Chaldean never assigns 9 to a letter and why spelling, not pronunciation alone, changes the total." },
  { title: "Why name correction works", body: "Correction works on the level of usage. Changing a spelling changes what is written, spoken and signed thousands of times a year. The practical effect is a change in the first impression and in the consistency of how you are addressed, which is measurable in professional life." },
  { title: "How pronunciation affects vibration", body: "A name written one way but pronounced another splits the signal. Where the spoken and the written form agree, the reading is cleaner. Prefer a spelling people pronounce correctly on the first attempt." },
  { title: "Birth number versus name number", body: "The birth number comes from the day of birth and cannot change. The name number comes from the spelling and can change. The birth number is what you are; the name number is how the world receives it." },
  { title: "Destiny number versus name number", body: "The destiny number is the total of the full date of birth and describes the direction of the life. The name number describes the vehicle. A strong name with a clashing destiny produces effort without recognition; agreement between them produces smooth progress." },
];
