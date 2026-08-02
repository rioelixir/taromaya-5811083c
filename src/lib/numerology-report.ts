/**
 * TAROMAYA full numerology report engine.
 *
 * Deterministic: the same (name, birth date, "today") always produces the same
 * report. Nothing here is random and nothing calls an AI model — the AI layer
 * only interprets the values produced below.
 *
 * All wording is original TAROMAYA content written in two registers:
 *  - `expert`  — professional interpretation
 *  - `eli10`   — the same idea in concise, plain professional language
 */

import { computeNumerology, type NumerologyReport, parseBirthDate, reduce } from "@/lib/numerology";
import { lifeCycles, loShuGrid } from "@/lib/numerology-deep";
import { vedicNumerology, loShuAdvanced, relationSets, type VedicNumerology, type LoShuAdvanced } from "@/lib/vedic-numerology";

export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type NumberTraits = {
  planet: string;
  element: string;
  keyword: string;
  positives: string[];
  negatives: string[];
  hidden: string[];
  career: string[];
  money: string;
  love: string;
  marriage: string;
  family: string;
  children: string;
  business: string;
  education: string;
  health: string;
  spiritual: string;
  communication: string;
  leadership: string;
  decision: string;
  emotion: string;
  lesson: string;
  growth: string;
  remedies: string[];
  direction: string;
  metal: string;
  gem: string;
  colors: string[];
  days: string[];
  dates: number[];
  eli10: string;
};

/** Master numbers are read through their reduced root, with a note added. */
export function root(n: number): Digit {
  const r = reduce(n, false);
  return (r === 0 ? 9 : r) as Digit;
}

export const TRAITS: Record<Digit, NumberTraits> = {
  1: {
    planet: "Sun", element: "Fire", keyword: "The Starter",
    positives: ["Independent and self-driven", "Starts things others only talk about", "Clear sense of direction", "Natural authority"],
    negatives: ["Can be stubborn", "Dislikes taking orders", "Impatient with slow people", "Hides self-doubt behind pride"],
    hidden: ["Quiet loyalty to the few people it trusts", "Talent for rescuing a stuck project"],
    career: ["Founder or self-employed work", "Leadership and management", "Design, engineering, sport", "Anything with visible ownership"],
    money: "Money arrives through initiative and ownership, not through waiting. Income is steadier once one main venture is chosen over many side experiments.",
    love: "Warm but proud. Needs a partner who admires without competing, and gets bored by constant agreement.",
    marriage: "Works best with a partner who has their own centre of gravity; struggles when either side tries to control the other.",
    family: "Acts as the decision-maker of the family, which helps in a crisis and irritates everyone the rest of the time.",
    children: "Teaches children courage and self-belief; should also make room for their disagreement.",
    business: "Best as the head, not the junior partner. Solo or majority-owned ventures suit this number.",
    education: "Learns fastest by doing rather than reading; needs a goal to aim at.",
    health: "Watch the heart, eyes, blood pressure and stress from over-work. Regular rest and movement matter more than intensity. This is general wellbeing guidance, not medical advice.",
    spiritual: "Grows through humility — service done without credit.",
    communication: "Direct, brief, sometimes blunt. Says the conclusion before the reasoning.",
    leadership: "Leads from the front by example and expects others to keep up.",
    decision: "Decides quickly and reviews later; should sleep on the biggest calls.",
    emotion: "Feels deeply but shows little; pride is the usual mask.",
    lesson: "Learning that asking for help is not weakness.",
    growth: "Finish one thing completely before starting the next.",
    remedies: ["Start the day early, with sunlight on the face", "Keep one promise to yourself daily", "Give credit publicly to someone else once a week"],
    direction: "East", metal: "Gold", gem: "Ruby",
    colors: ["Gold", "Orange", "Deep Yellow"], days: ["Sunday", "Monday"], dates: [1, 10, 19, 28],
    eli10: "A natural initiator who is most effective when leading from the front. Decisive and self-directed; the developmental task is to make genuine room for other voices.",
  },
  2: {
    planet: "Moon", element: "Water", keyword: "The Peacemaker",
    positives: ["Reads people quickly", "Gentle and cooperative", "Excellent partner and second-in-command", "Patient"],
    negatives: ["Over-thinks", "Takes things personally", "Avoids conflict until it explodes", "Mood follows other people"],
    hidden: ["Strong intuition about who to trust", "Quiet stubbornness once truly decided"],
    career: ["Counselling, teaching, HR", "Care and hospitality", "Design and music", "Any partnership role"],
    money: "Income is steady rather than dramatic. Saving works better than speculation, and joint ventures usually pay more than solo ones.",
    love: "Deeply devoted and needs reassurance. Small daily kindness matters more than grand gestures.",
    marriage: "Very marriage-friendly; the risk is losing your own opinions inside the relationship.",
    family: "The emotional glue of the household, and often the one who absorbs everyone's stress.",
    children: "Very nurturing; should teach children to handle small conflicts rather than shield them.",
    business: "Thrives in partnership and client-facing work; avoid businesses that need constant confrontation.",
    education: "Learns well in groups and with a kind teacher; nervous under harsh pressure.",
    health: "Watch sleep, digestion, and anxiety carried in the stomach. Routine and water help. General wellbeing guidance only.",
    spiritual: "Grows through devotion, music and quiet water-side time.",
    communication: "Soft, indirect, tactful — sometimes so gentle the message is missed.",
    leadership: "Leads by consensus and by making everyone feel included.",
    decision: "Slow and consultative; should set a deadline for deciding.",
    emotion: "Feels everything, including other people's feelings.",
    lesson: "Saying no without guilt.",
    growth: "Decide first, then ask opinions — not the other way round.",
    remedies: ["Keep a fixed sleep time", "Write the decision down before discussing it", "Spend ten minutes alone daily in silence"],
    direction: "North-West", metal: "Silver", gem: "Pearl",
    colors: ["White", "Silver", "Pale Green"], days: ["Monday", "Friday"], dates: [2, 11, 20, 29],
    eli10: "Diplomatic and highly perceptive, valued as a confidant and a partner. Works best in cooperation; the developmental task is to weigh your own needs as seriously as everyone else's.",
  },
  3: {
    planet: "Jupiter", element: "Ether", keyword: "The Expresser",
    positives: ["Naturally expressive and funny", "Optimistic", "Learns fast", "Popular and well-liked"],
    negatives: ["Scatters energy across too many interests", "Talks more than finishes", "Avoids boring detail", "Spends easily"],
    hidden: ["A serious teacher hides behind the jokes", "Good at spotting the moral of a situation"],
    career: ["Teaching, writing, media", "Law, counselling, advisory work", "Performance and content", "Training and coaching"],
    money: "Money comes through knowledge and voice. The leak is impulse spending and generosity without a budget.",
    love: "Playful and affectionate; needs conversation more than luxury.",
    marriage: "Happy when the partner is also a friend to talk to; unhappy in silence.",
    family: "The story-teller and the advisor of the family.",
    children: "Fills the house with learning and laughter; must also model finishing things.",
    business: "Best in knowledge businesses — training, publishing, consulting.",
    education: "A natural student; the risk is starting many courses and finishing few.",
    health: "Watch weight, liver, and over-indulgence. Regular walking suits this number. General wellbeing guidance only.",
    spiritual: "Grows through study, teaching and honest speech.",
    communication: "Vivid, warm, story-driven; can over-explain.",
    leadership: "Leads by inspiring and explaining the why.",
    decision: "Decides optimistically; should check the numbers before saying yes.",
    emotion: "Bounces back fast, sometimes before actually processing the hurt.",
    lesson: "Depth over variety.",
    growth: "Pick three priorities for the year and refuse the fourth.",
    remedies: ["Finish one unfinished task each week", "Keep a written monthly budget", "Teach someone what you learned"],
    direction: "North-East", metal: "Brass/Gold", gem: "Yellow Sapphire",
    colors: ["Yellow", "Golden", "Violet"], days: ["Thursday"], dates: [3, 12, 21, 30],
    eli10: "Expressive, socially fluent and creatively prolific. Communication is the core strength; the developmental task is completion rather than continual new starts.",
  },
  4: {
    planet: "Rahu (and the discipline of Uranus-like change)", element: "Earth", keyword: "The Builder",
    positives: ["Reliable and hard-working", "Practical problem-solver", "Sees the flaw others miss", "Builds things that last"],
    negatives: ["Rigid about method", "Argues over small points", "Pessimism under stress", "Slow to trust change"],
    hidden: ["Unusual, original thinking behind the conservative face", "Great crisis manager"],
    career: ["Engineering, IT, operations", "Real estate and construction", "Research and analysis", "Administration and compliance"],
    money: "Money grows by system: fixed savings, low debt, boring consistency. Shortcuts cost this number more than most.",
    love: "Loyal and undramatic; shows love through doing, not saying.",
    marriage: "Very stable once committed; needs to speak feelings out loud more often.",
    family: "The one who quietly keeps the household running.",
    children: "Gives children structure and safety; should allow some mess and play.",
    business: "Excellent in service, systems and manufacturing; avoid ventures that need constant improvisation.",
    education: "Methodical learner; excels with a syllabus and a schedule.",
    health: "Watch nerves, back, and sleeping too little. Fixed routine and stretching help. General wellbeing guidance only.",
    spiritual: "Grows through discipline and honest work.",
    communication: "Precise and factual; can sound critical when only being accurate.",
    leadership: "Leads through process and dependability.",
    decision: "Slow, evidence-first; should set a decision deadline.",
    emotion: "Holds stress internally until it shows in the body.",
    lesson: "Flexibility.",
    growth: "Change one small habit every month on purpose.",
    remedies: ["Keep a written plan and cross items off", "Do one thing differently each week", "Avoid loans taken in a rush"],
    direction: "South-West", metal: "Iron/Steel", gem: "Hessonite",
    colors: ["Grey", "Blue", "Khaki"], days: ["Saturday", "Sunday"], dates: [4, 13, 22, 31],
    eli10: "Methodical and dependable, with a talent for building durable structures and systems. The developmental task is allowing flexibility when circumstances change.",
  },
  5: {
    planet: "Mercury", element: "Air", keyword: "The Explorer",
    positives: ["Quick-witted and adaptable", "Great at selling and negotiating", "Learns any skill fast", "Loves travel and new people"],
    negatives: ["Restless", "Starts before thinking", "Bored by routine", "Over-commits"],
    hidden: ["Sharp analytical mind under the casual surface", "Can calm a crisis with humour"],
    career: ["Sales, marketing, trading", "Communication and media", "Travel, logistics, tech", "Anything varied"],
    money: "Money moves fast in both directions. Automatic savings and one long-term asset fix the leak.",
    love: "Charming and fun; needs freedom and mental spark, dislikes being monitored.",
    marriage: "Happy with a partner who is also a travel companion; unhappy in a rigid routine.",
    family: "Brings energy and news into the family; should be more present, not just entertaining.",
    children: "Raises curious children; should model consistency.",
    business: "Great at trading, distribution and anything with fast turnover.",
    education: "Learns by trying, in short bursts; struggles with long silent study.",
    health: "Watch nervous system, skin and screen fatigue. Breathing exercises help. General wellbeing guidance only.",
    spiritual: "Grows through stillness — the opposite of its nature.",
    communication: "Fast, persuasive, adaptable to the audience.",
    leadership: "Leads by energy and by being everywhere at once.",
    decision: "Fast and revisable; should write down the reason before deciding.",
    emotion: "Moves on quickly; sometimes skips the feeling entirely.",
    lesson: "Commitment.",
    growth: "Stay with one path long enough to see the result.",
    remedies: ["Ten minutes of silence daily", "Automate savings on payday", "Say no to one new opportunity each month"],
    direction: "North", metal: "Bronze", gem: "Emerald",
    colors: ["Green", "Light Grey", "Turquoise"], days: ["Wednesday", "Friday"], dates: [5, 14, 23],
    eli10: "Adaptable, curious and quick to seize opportunity, with a strong need for variety. The developmental task is remaining with a commitment long enough to realise its return.",
  },
  6: {
    planet: "Venus", element: "Earth/Water", keyword: "The Caregiver",
    positives: ["Loving and responsible", "Creates beauty and comfort", "People feel safe around you", "Very dependable to family"],
    negatives: ["Over-gives and then resents it", "Worries about everyone", "Can be controlling in the name of care", "Struggles to receive help"],
    hidden: ["A strong artistic streak", "Real business sense in beauty, food and home"],
    career: ["Design, fashion, interiors", "Food, hospitality, wellness", "Teaching and care work", "Family business"],
    money: "Money comes through beauty, service and people. The leak is spending on others and on comfort.",
    love: "Deeply romantic and loyal; the classic relationship number.",
    marriage: "Naturally suited to married life; must avoid parenting the partner.",
    family: "The heart of the home, often carrying everyone's responsibilities.",
    children: "Devoted parent; should let children face small failures.",
    business: "Strong in anything customer-facing where taste matters.",
    education: "Learns well in a warm, aesthetic environment.",
    health: "Watch throat, reproductive health and comfort-eating. Balance giving with rest. General wellbeing guidance only.",
    spiritual: "Grows through selfless service that expects nothing back.",
    communication: "Warm, diplomatic, occasionally guilt-flavoured.",
    leadership: "Leads by caring for the team's wellbeing.",
    decision: "Decides based on who it affects; should also check the facts.",
    emotion: "Emotionally generous, easily hurt by ingratitude.",
    lesson: "Boundaries.",
    growth: "Ask for help before you are exhausted.",
    remedies: ["Fix one weekly hour that is only yours", "Say what you need out loud", "Keep the home tidy and fragrant — it steadies this number"],
    direction: "South-East", metal: "Silver/Copper", gem: "Diamond or White Sapphire",
    colors: ["Pink", "Cream", "Pastel Blue"], days: ["Friday", "Wednesday"], dates: [6, 15, 24],
    eli10: "Responsible and aesthetically attuned, naturally relied upon for care and harmony. The developmental task is sustaining your own wellbeing alongside everyone else's.",
  },
  7: {
    planet: "Ketu", element: "Water/Ether", keyword: "The Seeker",
    positives: ["Deep thinker and researcher", "Strong intuition", "Independent mind", "Sees through pretence"],
    negatives: ["Withdraws when hurt", "Over-analyses", "Hard to reach emotionally", "Suspicious of easy answers"],
    hidden: ["Healing ability", "Unusual luck arriving through unexpected routes"],
    career: ["Research and analysis", "Spiritual work, psychology, healing", "IT, data, forensic work", "Writing"],
    money: "Money is rarely the motive, so it must be systematised. Long-term, quiet investments suit this number better than trading.",
    love: "Needs space and depth; small talk exhausts it, honesty attracts it.",
    marriage: "Best with a partner who respects solitude and does not demand constant reassurance.",
    family: "The quiet observer who is relied on for wise judgement.",
    children: "Teaches children to think for themselves; should give more open affection.",
    business: "Best in specialist, expertise-led ventures rather than mass-market ones.",
    education: "A natural researcher who prefers depth in one subject.",
    health: "Watch the nervous system, sleep and over-thinking. Time in nature helps. General wellbeing guidance only.",
    spiritual: "The most naturally spiritual number; grows through meditation and study.",
    communication: "Few words, carefully chosen; silence is also a message.",
    leadership: "Leads through expertise, not authority.",
    decision: "Decides internally, then announces; should explain the reasoning to others.",
    emotion: "Processes privately; can seem cold while feeling a lot.",
    lesson: "Trusting people.",
    growth: "Share the conclusion and the feeling behind it.",
    remedies: ["Daily meditation, even five minutes", "Write down worries to stop the loop", "Spend time near water or trees"],
    direction: "South-West", metal: "Iron", gem: "Cat's Eye",
    colors: ["Sea Green", "Grey", "Smoky White"], days: ["Sunday", "Monday"], dates: [7, 16, 25],
    eli10: "Analytical and research-minded, drawn to depth and solitude. The developmental task is permitting trusted people close enough to share the thinking.",
  },
  8: {
    planet: "Saturn", element: "Earth", keyword: "The Achiever",
    positives: ["Disciplined and enduring", "Strong at organisation and money", "Fair and responsible", "Grows stronger through difficulty"],
    negatives: ["Slow rewards can cause bitterness", "Over-serious", "Workaholic tendencies", "Trusts too late or too much"],
    hidden: ["Real generosity behind the strict face", "Long-game vision most people lack"],
    career: ["Finance, law, administration", "Large organisations and government", "Mining, machinery, infrastructure", "Long-term investment"],
    money: "Wealth is built slowly and holds. Fast schemes and unsecured lending are the classic losses for this number.",
    love: "Serious and committed; expresses love through security and responsibility.",
    marriage: "Long-lasting once formed, but needs deliberate warmth and time together.",
    family: "The provider and the one who handles hard duties.",
    children: "Gives structure and ambition; should praise effort, not only results.",
    business: "Excellent for long-cycle, asset-heavy or regulated businesses.",
    education: "Late bloomer who eventually outlasts everyone.",
    health: "Watch bones, joints, teeth and chronic stress. Consistent rest matters. General wellbeing guidance only.",
    spiritual: "Grows through patience, justice and charity done quietly.",
    communication: "Measured, formal, sparing with praise.",
    leadership: "Leads through responsibility and accountability.",
    decision: "Slow, risk-aware, hard to reverse.",
    emotion: "Contained; expresses care by fixing problems.",
    lesson: "Patience without bitterness.",
    growth: "Celebrate the milestones instead of only the destination.",
    remedies: ["Give service or charity every month, quietly", "Keep debt low and documented", "Protect one full rest day each week"],
    direction: "West", metal: "Iron", gem: "Blue Sapphire (test carefully)",
    colors: ["Deep Blue", "Black", "Dark Grey"], days: ["Saturday"], dates: [8, 17, 26],
    eli10: "Persistent and resilient, with results that arrive later but hold. The developmental task is valuing the process rather than only the eventual outcome.",
  },
  9: {
    planet: "Mars", element: "Fire", keyword: "The Warrior",
    positives: ["Brave and energetic", "Protects the weak", "Finishes what it starts", "Generous"],
    negatives: ["Quick temper", "Impatient", "Takes on other people's fights", "Burns out"],
    hidden: ["Deep compassion behind the fight", "Natural healer and defender"],
    career: ["Defence, police, sport, surgery", "Engineering and land work", "Social causes and NGOs", "Any high-pressure field"],
    money: "Money comes in bursts through effort and courage. The leak is anger-driven spending and disputes.",
    love: "Passionate and protective; must guard against dominating.",
    marriage: "Intense and loyal; needs a calm partner and cooling-off habits.",
    family: "The protector who will fight for the family, sometimes with the family.",
    children: "Raises confident children; should soften the tone.",
    business: "Strong in competitive, physical or turnaround businesses.",
    education: "Learns through challenge and competition.",
    health: "Watch inflammation, blood pressure, injuries and anger-driven stress. Physical exercise is the main release. General wellbeing guidance only.",
    spiritual: "Grows through forgiveness and controlled strength.",
    communication: "Blunt, honest, high energy.",
    leadership: "Leads from the front in a crisis.",
    decision: "Fast and committed; should pause when angry.",
    emotion: "Hot and quick, and over as fast as it started.",
    lesson: "Anger management and forgiveness.",
    growth: "Pause for six seconds before responding.",
    remedies: ["Daily physical exercise", "Never send a message written in anger", "Give time to a cause you believe in"],
    direction: "South", metal: "Copper", gem: "Red Coral",
    colors: ["Red", "Maroon", "Coral"], days: ["Tuesday"], dates: [9, 18, 27],
    eli10: "Courageous and protective, willing to act on principle. The developmental task is deliberate pacing before reacting.",
  },
};

const MASTER_NOTE: Record<number, string> = {
  11: "11 is a master number: the qualities of 2 raised to a higher, more intuitive and inspirational level, with more nervous pressure to match.",
  22: "22 is a master number: the qualities of 4 raised to the scale of building something that outlives you, with a heavier workload.",
  33: "33 is a master number: the qualities of 6 raised to teaching and healing at community scale, with a strong risk of self-neglect.",
};

export type ReportSection = {
  id: string;
  title: string;
  eli10: string;
  expert: string;
  bullets?: string[];
  rows?: { label: string; value: string }[];
};

export type CoreNumber = {
  key: string;
  label: string;
  value: number;
  root: Digit;
  planet: string;
  what: string;
  why: string;
  influence: string;
  eli10: string;
  positives: string[];
  negatives: string[];
  hidden: string[];
  opportunities: string;
  challenges: string;
  remedies: string[];
  master?: string;
};

export type FullNumerologyReport = {
  input: { fullName: string; birthDate: string; today: string };
  base: NumerologyReport;
  vedic: VedicNumerology;
  loshu: LoShuAdvanced;
  core: CoreNumber[];
  lucky: {
    numbers: number[];
    colors: string[];
    days: string[];
    dates: number[];
    direction: string;
    metal: string;
    gem: string;
    friendly: number[];
    neutral: number[];
    challenging: number[];
  };
  balanceNumber: number;
  missingNumbers: number[];
  hiddenStrengths: number[];
  karmicDebts: number[];
  karmicLessons: number[];
  favourableYears: number[];
  challengingYears: number[];
  cycles: { label: string; from: number; to: number; n: number; note: string }[];
  pinnacles: { label: string; from: number; to: number; n: number; note: string }[];
  challenges: { label: string; n: number; note: string }[];
  sections: ReportSection[];
  confidence: { score: number; note: string; factors: string[] };
};

const ORD = ["first", "second", "third", "fourth"];

function ordinalYearsFrom(birthYear: number, personalYear: number, target: number[]): number[] {
  // Years (calendar) in the next 12 whose personal-year value is in `target`.
  const out: number[] = [];
  const thisYear = new Date().getFullYear();
  let py = personalYear;
  for (let i = 0; i < 12; i++) {
    if (target.includes(py)) out.push(thisYear + i);
    py = py === 9 ? 1 : py + 1;
  }
  void birthYear;
  return out;
}

function coreOf(key: string, label: string, value: number, why: string, influence: string): CoreNumber {
  const r = root(value);
  const t = TRAITS[r];
  return {
    key, label, value, root: r, planet: t.planet,
    what: `${label} ${value}${value !== r ? ` (root ${r})` : ""} — ${t.keyword}, ruled by ${t.planet}, element ${t.element}.`,
    why,
    influence,
    eli10: t.eli10,
    positives: t.positives,
    negatives: t.negatives,
    hidden: t.hidden,
    opportunities: `Best openings come through ${t.career.slice(0, 3).join(", ").toLowerCase()}. ${t.growth}`,
    challenges: `The recurring test is: ${t.lesson.toLowerCase()}`,
    remedies: t.remedies,
    ...(MASTER_NOTE[value] ? { master: MASTER_NOTE[value] } : {}),
  };
}

export function buildNumerologyReport(input: {
  fullName: string;
  birthDate: string;
  now?: Date;
}): FullNumerologyReport {
  const fullName = input.fullName.trim();
  const now = input.now ?? new Date();
  const parsed = parseBirthDate(input.birthDate);
  if (!parsed) throw new Error("Please give a real date of birth in YYYY-MM-DD form.");

  const base = computeNumerology({ fullName, birthDate: input.birthDate, now }, "Pythagorean");
  const vedic = vedicNumerology(input.birthDate, fullName);
  const loshu = loShuAdvanced(input.birthDate);
  const grid = loShuGrid(input.birthDate);
  const cyc = lifeCycles(input.birthDate);

  const lpT = TRAITS[root(base.lifePath)];

  const core: CoreNumber[] = [
    coreOf("lifePath", "Life Path / Destiny", base.lifePath,
      "It is the reduced total of your whole date of birth, so it never changes.",
      "It describes the main road of your life — the situations that keep coming back until you learn them."),
    coreOf("birth", "Birth Number (Mulank)", vedic.mulank,
      "It is your day of birth reduced to one digit.",
      "It shows your day-to-day personality: how you behave, react and start things."),
    coreOf("bhagyank", "Bhagyank (Vedic Destiny)", vedic.bhagyank,
      "It is the whole birth date added in the Vedic way and reduced to one digit.",
      "It shows the results life hands you over time, regardless of your daily habits."),
  ];
  if (fullName) {
    core.push(
      coreOf("expression", "Expression / Name Number", base.destiny,
        "It is the letter value of your full name (Pythagorean).",
        "It shows the talents you carry and how the world reads you."),
      coreOf("namank", "Namank (Chaldean Name Number)", vedic.namank ?? 0,
        "It is the letter value of your used name in the Chaldean chart.",
        "It shows the vibration your name creates each time it is spoken or written."),
      coreOf("soul", "Soul Urge", base.soulUrge,
        "It is the value of the vowels in your name.",
        "It shows what you privately want, even when you do not say it."),
      coreOf("personality", "Personality", base.personality,
        "It is the value of the consonants in your name.",
        "It shows the first impression you make before people know you."),
      coreOf("maturity", "Maturity", base.maturity,
        "It is Life Path plus Expression, reduced.",
        "It shows what your life turns into after about age 35."),
    );
  }

  // Balance number: reduced sum of the initials of each word of the name.
  const initials = fullName.toUpperCase().replace(/[^A-Z ]/g, " ").split(/\s+/).filter(Boolean).map((w) => w[0]!);
  const PY: Record<string, number> = {};
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((c, i) => { PY[c] = (i % 9) + 1; });
  const balanceNumber = initials.length ? reduce(initials.reduce((s, c) => s + (PY[c] ?? 0), 0), false) : 0;

  // Karmic lessons: numbers 1..9 absent from the name letters.
  const nameDigits = new Set(fullName.toUpperCase().replace(/[^A-Z]/g, "").split("").map((c) => PY[c]!));
  const karmicLessons = fullName ? [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => !nameDigits.has(n)) : [];

  const missingNumbers = loshu.missing;
  const hiddenStrengths = Object.entries(grid.counts ?? {})
    .filter(([, c]) => (c as number) >= 2)
    .map(([n]) => Number(n))
    .sort((a, b) => a - b);

  const favourableYears = ordinalYearsFrom(parsed.y, base.personalYear, [1, 3, 5, 6, 8]);
  const challengingYears = ordinalYearsFrom(parsed.y, base.personalYear, [4, 7, 9]);

  const rel = relationSets(vedic.mulank);

  const cycles = [
    { label: "Formative cycle", from: cyc.formative.from, to: cyc.formative.to, n: cyc.formative.n,
      note: `Early life is coloured by ${TRAITS[root(cyc.formative.n)].keyword.toLowerCase()} energy: ${TRAITS[root(cyc.formative.n)].growth}` },
    { label: "Productive cycle", from: cyc.productive.from, to: cyc.productive.to, n: cyc.productive.n,
      note: `The working years run on ${TRAITS[root(cyc.productive.n)].keyword.toLowerCase()} energy: ${TRAITS[root(cyc.productive.n)].growth}` },
    { label: "Harvest cycle", from: cyc.harvest.from, to: cyc.harvest.to, n: cyc.harvest.n,
      note: `Later life rewards ${TRAITS[root(cyc.harvest.n)].keyword.toLowerCase()} qualities: ${TRAITS[root(cyc.harvest.n)].growth}` },
  ];

  const pinnacleAges = [
    [0, 36 - reduce(base.lifePath, false)],
    [37 - reduce(base.lifePath, false), 45 - reduce(base.lifePath, false)],
    [46 - reduce(base.lifePath, false), 54 - reduce(base.lifePath, false)],
    [55 - reduce(base.lifePath, false), 99],
  ];
  const pinnacles = base.pinnacles.map((n, i) => ({
    label: `Pinnacle ${i + 1}`,
    from: Math.max(0, pinnacleAges[i]![0]!),
    to: pinnacleAges[i]![1]!,
    n,
    note: `${TRAITS[root(n)].keyword}: opportunities arrive through ${TRAITS[root(n)].career[0]!.toLowerCase()} and similar paths.`,
  }));

  const challenges = base.challenges.map((n, i) => ({
    label: `Challenge ${i + 1} (${ORD[i]} quarter of life)`,
    n,
    note: n === 0
      ? "A zero challenge means no single fixed obstacle here — you choose your own test."
      : `The lesson is ${TRAITS[root(n)].lesson.toLowerCase()} ${TRAITS[root(n)].growth}`,
  }));

  const y = base.personalYear;
  const yearMeaning: Record<number, string> = {
    1: "a starting year — begin things, plant seeds, expect slow visible results",
    2: "a partnership and patience year — build relationships rather than force outcomes",
    3: "an expressive year — visibility, learning, creativity and social growth",
    4: "a building year — systems, hard work, paperwork and foundations",
    5: "a change year — movement, travel, new offers, but scattered focus",
    6: "a responsibility year — home, family, care and commitments",
    7: "an inward year — study, rest, review; a poor year to force big launches",
    8: "a results year — money, authority and recognition for earlier effort",
    9: "a completion year — endings, clearing, letting go before the next cycle",
  };

  const sections: ReportSection[] = [
    {
      id: "overview", title: "Overview",
      eli10: `Your main number is ${base.lifePath}. Think of it as your team colour. It shows what you are naturally good at and what you keep having to practise.`,
      expert: `The chart is anchored by Life Path ${base.lifePath} (${lpT.keyword}, ${lpT.planet}) with Birth Number ${vedic.mulank} and Bhagyank ${vedic.bhagyank}. ${vedic.harmony.note} Together these describe a person whose daily behaviour is ${TRAITS[root(vedic.mulank)].keyword.toLowerCase()} while long-term results follow ${TRAITS[root(vedic.bhagyank)].keyword.toLowerCase()} rules.`,
      rows: [
        { label: "Life Path", value: String(base.lifePath) },
        { label: "Birth Number (Mulank)", value: String(vedic.mulank) },
        { label: "Bhagyank", value: String(vedic.bhagyank) },
        ...(fullName ? [
          { label: "Expression", value: String(base.destiny) },
          { label: "Soul Urge", value: String(base.soulUrge) },
          { label: "Personality", value: String(base.personality) },
          { label: "Maturity", value: String(base.maturity) },
          { label: "Balance", value: String(balanceNumber) },
        ] : []),
        { label: "Ruling planet", value: lpT.planet },
        { label: "Element", value: lpT.element },
      ],
    },
    {
      id: "planet", title: "Planet Influence",
      eli10: `Each number has a planet friend. Yours is ${lpT.planet}. When you act like your best self, that planet works for you.`,
      expert: `Life Path ${base.lifePath} answers to ${lpT.planet}. Strength shows as ${lpT.positives.slice(0, 2).join(" and ").toLowerCase()}. Weakness shows as ${lpT.negatives.slice(0, 2).join(" and ").toLowerCase()}. Birth Number ${vedic.mulank} adds ${TRAITS[root(vedic.mulank)].planet}, and Bhagyank ${vedic.bhagyank} adds ${TRAITS[root(vedic.bhagyank)].planet}.`,
      bullets: [
        `Planet strength: ${lpT.positives.join("; ")}`,
        `Planet weakness: ${lpT.negatives.join("; ")}`,
        `Element: ${lpT.element}`,
      ],
    },
    {
      id: "strengths", title: "Strengths",
      eli10: "Capabilities that come to you naturally and can be relied upon under pressure.",
      expert: `Core strengths follow from Life Path ${base.lifePath} and Birth Number ${vedic.mulank}.`,
      bullets: Array.from(new Set([...lpT.positives, ...TRAITS[root(vedic.mulank)].positives])),
    },
    {
      id: "challenges", title: "Challenges",
      eli10: "Recurring difficulties worth managing consciously; recognising them is most of the remedy.",
      expert: `Recurring friction points across the chart. Numbers ${missingNumbers.join(", ") || "—"} are absent from the Lo Shu grid, which usually shows where effort has to be conscious rather than natural.`,
      bullets: Array.from(new Set([...lpT.negatives, ...TRAITS[root(vedic.mulank)].negatives])),
    },
    {
      id: "hidden", title: "Hidden Gifts",
      eli10: "Less visible strengths that others tend to overlook.",
      expert: `Repeated grid numbers (${hiddenStrengths.join(", ") || "none"}) mark reinforced abilities. Karmic lessons (${karmicLessons.join(", ") || "none"}) are missing name-values — skills that must be learned deliberately in this life.`,
      bullets: Array.from(new Set([...lpT.hidden, ...TRAITS[root(vedic.bhagyank)].hidden])),
    },
    {
      id: "career", title: "Career",
      eli10: `Jobs where you shine: ${lpT.career.slice(0, 3).join(", ").toLowerCase()}.`,
      expert: `Career suitability is read from Expression${fullName ? ` ${base.destiny}` : ""} and Life Path ${base.lifePath}. ${lpT.leadership} ${lpT.decision}`,
      bullets: lpT.career,
    },
    {
      id: "money", title: "Money",
      eli10: "Your characteristic patterns of earning, spending and saving.",
      expert: `${lpT.money} Saturn-ruled 8 energy in the chart (${[base.lifePath, vedic.mulank, vedic.bhagyank].filter((n) => root(n) === 8).length > 0 ? "present" : "absent"}) affects how slowly wealth consolidates.`,
      bullets: [`Financial tendency: ${lpT.money}`, `Lucky days for money decisions: ${lpT.days.join(", ")}`],
    },
    {
      id: "relationships", title: "Relationships",
      eli10: "How you form attachments and what you require from close relationships.",
      expert: `${lpT.love} Emotional nature: ${lpT.emotion} Communication: ${lpT.communication}`,
      bullets: [`Friendly numbers: ${rel.friends.join(", ")}`, `Neutral numbers: ${rel.neutral.join(", ")}`, `Challenging numbers: ${rel.enemies.join(", ")}`],
    },
    { id: "marriage", title: "Marriage", eli10: "What married life asks of you.", expert: lpT.marriage },
    { id: "family", title: "Family", eli10: "Your role at home.", expert: lpT.family },
    { id: "children", title: "Children", eli10: "How you parent, and what to watch.", expert: lpT.children },
    { id: "business", title: "Business", eli10: "What kind of business fits you.", expert: `${lpT.business} Business partnerships work best with numbers ${rel.friends.join(", ")}.` },
    { id: "education", title: "Education", eli10: "How you learn best.", expert: lpT.education },
    {
      id: "health", title: "Health Guidance",
      eli10: "Habits that support steady energy. This is general guidance, not medical advice; consult a qualified doctor for any health concern.",
      expert: `${lpT.health} Missing grid numbers ${missingNumbers.join(", ") || "none"} often correlate with the areas that need conscious routine.`,
    },
    { id: "spiritual", title: "Spiritual Path", eli10: "The quiet part of your growth.", expert: `${lpT.spiritual} Suggested practices: ${vedic.mantras.join(", ")}.` },
    {
      id: "year", title: "Current Year Energy",
      eli10: `This year is a ${y} year for you — ${yearMeaning[y] ?? "a mixed year"}.`,
      expert: `Personal Year ${y}, Personal Month ${base.personalMonth}, Personal Day ${base.personalDay}. ${vedic.yearNote}`,
      rows: [
        { label: "Personal Year", value: `${y} — ${yearMeaning[y] ?? ""}` },
        { label: "Personal Month", value: String(base.personalMonth) },
        { label: "Personal Day", value: String(base.personalDay) },
        { label: "Favourable years ahead", value: favourableYears.slice(0, 5).join(", ") },
        { label: "Years needing care", value: challengingYears.slice(0, 5).join(", ") },
      ],
    },
    {
      id: "remedies", title: "Remedies",
      eli10: "Practical, low-cost adjustments that reduce friction in daily life.",
      expert: "Practical, behaviour-first remedies derived from the weak points of the chart, with the traditional Vedic supports listed after them.",
      bullets: [
        ...lpT.remedies,
        ...loshu.remedies.map((r) => `Missing ${r.number}: ${r.remedy}`),
        `Traditional supports — colours ${vedic.luckyColors.join(", ")}; days ${vedic.luckyDays.join(", ")}; gemstones ${vedic.gems.join(", ")} (always test before wearing).`,
      ],
    },
    {
      id: "action", title: "Action Plan",
      eli10: "Three concrete actions to take this month.",
      expert: "A short, deterministic plan built from the weakest points of the chart.",
      bullets: [
        `This week: ${lpT.remedies[0]}`,
        `This month: ${lpT.growth}`,
        `This year (${y} year): ${yearMeaning[y] ?? "keep steady"} — plan around that, not against it.`,
      ],
    },
    {
      id: "daily", title: "Daily Tips",
      eli10: "Small daily practices worth sustaining.",
      expert: `Daily rhythm suited to ${lpT.planet}.`,
      bullets: [
        `Best days: ${lpT.days.join(", ")}; best dates: ${lpT.dates.join(", ")}`,
        `Colours that steady you: ${lpT.colors.join(", ")}`,
        `Direction to face for important work: ${lpT.direction}`,
      ],
    },
    {
      id: "monthly", title: "Monthly Tips",
      eli10: "Where to concentrate your attention this month.",
      expert: `Personal Month ${base.personalMonth} inside Personal Year ${y}: ${yearMeaning[base.personalMonth] ?? ""}.`,
    },
    {
      id: "summary", title: "Summary",
      eli10: `You are a ${base.lifePath}. ${lpT.eli10}`,
      expert: `Strongest energies: ${[base.lifePath, vedic.mulank, vedic.bhagyank].map((n) => `${n} (${TRAITS[root(n)].keyword})`).join(", ")}. Weakest areas: ${missingNumbers.join(", ") || "none missing"}. The single highest-leverage change is: ${lpT.growth}`,
    },
  ];

  // Consistency confidence — how well the chart's numbers agree with each other.
  const factors: string[] = [];
  let score = vedic.harmony.score;
  factors.push(`Number friendship across Mulank / Bhagyank${vedic.namank ? " / Namank" : ""}: ${vedic.harmony.score}/100`);
  if (!fullName) { score -= 15; factors.push("No name given — name-based numbers are not included (-15)"); }
  if (base.karmicDebts.length) { score -= 5 * base.karmicDebts.length; factors.push(`Karmic debt numbers present: ${base.karmicDebts.join(", ")}`); }
  if (missingNumbers.length > 4) { score -= 5; factors.push("More than four grid numbers missing — reading needs more remedial focus"); }
  score = Math.max(20, Math.min(100, Math.round(score)));

  return {
    input: { fullName, birthDate: input.birthDate, today: now.toISOString().slice(0, 10) },
    base, vedic, loshu, core,
    lucky: {
      numbers: Array.from(new Set([...vedic.luckyNumbers, ...base.luckyNumbers])).filter(Boolean),
      colors: Array.from(new Set([...lpT.colors, ...vedic.luckyColors])),
      days: Array.from(new Set([...lpT.days, ...vedic.luckyDays])),
      dates: lpT.dates,
      direction: lpT.direction,
      metal: lpT.metal,
      gem: lpT.gem,
      friendly: rel.friends,
      neutral: rel.neutral,
      challenging: rel.enemies,
    },
    balanceNumber,
    missingNumbers,
    hiddenStrengths,
    karmicDebts: base.karmicDebts,
    karmicLessons,
    favourableYears,
    challengingYears,
    cycles,
    pinnacles,
    challenges,
    sections,
    confidence: {
      score,
      note: "This score measures how well the numbers in your own chart agree with each other. It is not a claim about the future.",
      factors,
    },
  };
}
