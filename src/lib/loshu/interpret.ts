import { MISSING_PROFILES, NUMBER_PROFILES } from "./numbers";
import type { Digit, LoShuAnalysis } from "./types";

export type Section = { heading: string; body: string };

const uniq = <T,>(items: T[]): T[] => Array.from(new Set(items));

function dominant(a: LoShuAnalysis): Digit[] {
  return [...a.repeated].sort((x, y) => a.counts[y] - a.counts[x]).slice(0, 3);
}

function topNumbers(a: LoShuAnalysis): Digit[] {
  return uniq([a.strongest, a.birthNumber, a.lifePathNumber, ...dominant(a)]).slice(0, 4);
}

function joinList(items: string[]): string {
  const clean = uniq(items.filter(Boolean));
  if (clean.length <= 1) return clean.join("");
  return `${clean.slice(0, -1).join(", ")} and ${clean[clean.length - 1]}`;
}

/** Section 10 — personality summary. */
export function personalitySummary(a: LoShuAnalysis): Section[] {
  const lead = NUMBER_PROFILES[a.strongest];
  const birth = NUMBER_PROFILES[a.birthNumber];
  const path = NUMBER_PROFILES[a.lifePathNumber];
  const strongZone = [...a.zones].sort((x, y) => y.percent - x.percent)[0];
  const weakZone = [...a.zones].sort((x, y) => x.percent - y.percent)[0];
  const formed = a.arrows.filter((x) => x.polarity === "strength" && x.status === "formed");
  const cautions = a.arrows.filter((x) => x.polarity === "caution" && x.status === "formed");

  return [
    {
      heading: "Core personality",
      body: `Your grid is led by number ${a.strongest}, the energy of ${lead.planet}, appearing ${a.counts[a.strongest]} time${a.counts[a.strongest] > 1 ? "s" : ""}. Day number ${a.birthNumber} sets your instinctive style and life path number ${a.lifePathNumber} sets your longer direction. In practice you present as ${lead.title.toLowerCase()} with the working method of ${birth.title.toLowerCase()} and the long term aim of ${path.title.toLowerCase()}.`,
    },
    {
      heading: "Natural strengths",
      body: `${joinList([...lead.positive.slice(0, 3), ...birth.positive.slice(0, 2)])}. Your strongest field is the ${strongZone?.label.toLowerCase() ?? "mental zone"} at ${strongZone?.percent ?? 0} percent, which is where results come fastest.`,
    },
    {
      heading: "Challenges",
      body: `${joinList([...lead.negative.slice(0, 2), ...(a.missing.length ? [MISSING_PROFILES[a.missing[0] as Digit].weakness] : [])])}. The thinnest field is the ${weakZone?.label.toLowerCase() ?? "action zone"} at ${weakZone?.percent ?? 0} percent, so that area needs structure rather than willpower.`,
    },
    { heading: "Leadership style", body: lead.leadership },
    {
      heading: "Career potential",
      body: `${lead.career} Supporting direction comes from number ${a.birthNumber}: ${birth.career}`,
    },
    {
      heading: "Business ability",
      body: a.counts[8] + a.counts[1] + a.counts[4] >= 2
        ? "Enterprise ability is genuine. Structure, authority and system thinking are available, so independent business is realistic once cash discipline is fixed."
        : "Business is possible but works best in partnership, with a co founder who carries finance discipline and administration.",
    },
    { heading: "Money pattern", body: lead.finance },
    { heading: "Relationship pattern", body: birth.relationships },
    { heading: "Communication style", body: path.communication },
    {
      heading: "Hidden potential",
      body: formed.length
        ? `${formed.map((x) => x.name).join(", ")} sit fully formed in your grid. These are the capacities most often left unused, and developing them raises your overall score fastest.`
        : "No complete strength line is present, which means your capability is spread widely rather than concentrated. Choose one line to complete through habit and it becomes your signature ability.",
    },
    {
      heading: "Life advice",
      body: `${lead.spiritualLesson} ${cautions.length ? `Your working caution is the ${cautions[0]!.name.replace("Arrow of ", "").toLowerCase()} pattern: ${cautions[0]!.advice}` : "With no caution line fully formed, steady maintenance matters more than correction."}`,
    },
  ];
}

const CAREER_LIBRARY: Record<string, string> = {
  Business: "Independent trade, retail chains, distribution and family enterprise.",
  Government: "Administration, civil services, public policy and regulated bodies.",
  Teaching: "Academics, training, coaching and curriculum work.",
  Technology: "Software, data, analytics, systems engineering and product work.",
  Medical: "Clinical practice, surgery, diagnostics and hospital administration.",
  Healing: "Counselling, therapy, wellness, nutrition and rehabilitation.",
  Finance: "Banking, accountancy, audit, investment advisory and insurance.",
  Sales: "Field sales, key accounts, retail leadership and business development.",
  Marketing: "Brand work, content, digital campaigns and market research.",
  Management: "Operations, project delivery, human resources and general management.",
  Creative: "Design, architecture, film, music, fashion and interiors.",
  Writing: "Publishing, journalism, technical writing and scripting.",
  Politics: "Public representation, campaigning, unions and civic leadership.",
  Consulting: "Advisory practice, strategy, legal and specialist consultancy.",
  Entrepreneurship: "Founding ventures, licensing, franchising and independent practice.",
};

/** Section 11 — career suggestions weighted by grid strength. */
export function careerAnalysis(a: LoShuAnalysis): { field: string; detail: string; weight: number }[] {
  const score = new Map<string, number>();
  for (const d of [1, 2, 3, 4, 5, 6, 7, 8, 9] as Digit[]) {
    const c = a.counts[d];
    if (!c) continue;
    const bonus = d === a.birthNumber || d === a.lifePathNumber ? 1 : 0;
    for (const field of NUMBER_PROFILES[d].careerFields) {
      score.set(field, (score.get(field) ?? 0) + c + bonus);
    }
  }
  return Object.keys(CAREER_LIBRARY)
    .map((field) => ({ field, detail: CAREER_LIBRARY[field]!, weight: score.get(field) ?? 0 }))
    .sort((x, y) => y.weight - x.weight);
}

/** Section 12 — relationship analysis. */
export function relationshipAnalysis(a: LoShuAnalysis): Section[] {
  const p = NUMBER_PROFILES[a.birthNumber];
  const lead = NUMBER_PROFILES[a.strongest];
  const soft = a.counts[2] + a.counts[6];
  const fire = a.counts[1] + a.counts[9];
  return [
    { heading: "Love nature", body: p.relationships },
    { heading: "Marriage tendencies", body: p.marriage },
    { heading: "Communication style", body: lead.communication },
    {
      heading: "Trust",
      body: a.counts[7] > 0
        ? "Trust is granted slowly and tested quietly before it is given fully. Once given it is durable."
        : "Trust is offered early and generously, so clear agreements protect you from disappointment.",
    },
    {
      heading: "Commitment",
      body: a.counts[8] > 0 || a.counts[4] > 0
        ? "Commitment is expressed through responsibility carried over years rather than through frequent declarations."
        : "Commitment is emotional rather than structural, so shared plans should be written down and reviewed.",
    },
    {
      heading: "Conflict style",
      body: fire > soft
        ? "Conflict is met head on and resolved quickly, though the first minute carries most of the damage. A deliberate pause changes the outcome."
        : "Conflict is avoided and postponed, which lets small issues accumulate. Raising matters within a day prevents build up.",
    },
    {
      heading: "Family behaviour",
      body: soft >= 2
        ? "You are the emotional centre of the family and carry its mood. Guard against absorbing every problem as your own."
        : "You support the family through provision and problem solving. Adding spoken warmth completes what your actions already say.",
    },
  ];
}

/** Section 13 — financial analysis. */
export function financialAnalysis(a: LoShuAnalysis): Section[] {
  const lead = NUMBER_PROFILES[a.strongest];
  const risk = a.counts[9] + a.counts[5] + a.counts[1];
  const caution = a.counts[8] + a.counts[4] + a.counts[7];
  return [
    { heading: "Money mindset", body: lead.finance },
    {
      heading: "Risk taking",
      body: risk > caution
        ? "Your appetite for risk is above average, and decisions are taken on conviction. Written limits per decision protect the upside."
        : "You prefer verified, slow gains and step away from uncertainty. Small measured exposure prevents opportunity loss.",
    },
    {
      heading: "Saving behaviour",
      body: a.counts[8] || a.counts[4]
        ? "Saving comes naturally once a target exists. Automatic transfers on income day work best for you."
        : "Saving depends on mood unless automated. Fix a percentage and remove the decision from monthly life.",
    },
    {
      heading: "Investment nature",
      body: a.counts[7] || a.counts[4]
        ? "You research thoroughly and hold for the long term, which suits index style and property investment."
        : "You act on recommendation rather than research, so a written checklist before every investment is essential.",
    },
    {
      heading: "Business potential",
      body: a.counts[1] + a.counts[8] >= 2
        ? "Strong. Authority and structure are present together, which is the usual signature of a durable enterprise."
        : "Moderate. Enterprise succeeds in partnership, with clearly divided roles and a documented agreement.",
    },
    {
      heading: "Financial growth pattern",
      body: `Your grid suggests growth in stages tied to number ${a.strongest}. Expect the first solid consolidation after a full cycle of disciplined saving, with the sharpest rise when the ${a.missing.length ? `missing number ${a.missing[0]} habit` : "weakest zone"} is actively corrected.`,
    },
  ];
}

/** Section 14 — lifestyle observations only. */
export function healthObservations(a: LoShuAnalysis): Section[] {
  const lead = NUMBER_PROFILES[a.strongest];
  return [
    { heading: "Stress", body: `Under load, your pattern follows number ${a.strongest}: ${lead.health} These are lifestyle observations, not medical findings.` },
    {
      heading: "Routine",
      body: a.counts[4] || a.counts[8]
        ? "Routine is natural for you and becomes your main stabiliser during difficult phases."
        : "Routine is your weakest support. A fixed wake time is the single change with the largest effect.",
    },
    {
      heading: "Discipline",
      body: a.counts[8] ? "Discipline is available and reliable once a rule is accepted." : "Discipline works better with external accountability than with private resolve.",
    },
    {
      heading: "Energy",
      body: a.energyScore >= 70
        ? "Your grid carries high overall charge, so pacing matters more than stimulation."
        : "Your grid carries a moderate charge, so recovery habits deliver more than extra effort.",
    },
    {
      heading: "Sleep",
      body: a.counts[7] || a.counts[2]
        ? "Sleep is sensitive to unresolved thought. A screen free wind down changes quality noticeably."
        : "Sleep is generally sound and is disturbed mainly by irregular timing.",
    },
    {
      heading: "Work life balance",
      body: a.zones.find((z) => z.key === "action")!.percent > 65
        ? "Activity dominates your chart, so a protected rest day is a performance decision, not a luxury."
        : "Balance is achievable. The risk is drift rather than overwork, so a weekly plan keeps momentum.",
    },
  ];
}

/** Section 15 — lucky factors. */
export function luckyFactors(a: LoShuAnalysis) {
  const key = topNumbers(a);
  const profiles = key.map((d) => NUMBER_PROFILES[d]);
  return {
    numbers: uniq([...key, a.birthNumber, a.lifePathNumber]),
    colours: uniq(profiles.flatMap((p) => p.luckyColours)).slice(0, 5),
    days: uniq(profiles.flatMap((p) => p.luckyDays)).slice(0, 3),
    directions: uniq(profiles.map((p) => p.luckyDirection)).slice(0, 3),
    activities: uniq(profiles.flatMap((p) => p.tips)).slice(0, 5),
    habits: uniq([
      "A fixed wake time every day of the week",
      "Twenty minutes of movement before the working day",
      "A weekly review of money, tasks and relationships",
      "One unhurried conversation each day",
    ]),
  };
}

/** Section 16 — practical, non superstitious remedies. */
export function remedies(a: LoShuAnalysis) {
  const missingRemedies = a.missing.flatMap((d) => MISSING_PROFILES[d].remedies);
  const lead = NUMBER_PROFILES[a.strongest];
  const lucky = luckyFactors(a);
  return {
    lifestyle: uniq([...missingRemedies, ...lead.tips]).slice(0, 8),
    colour: [
      `Use ${joinList(lucky.colours.slice(0, 3))} in clothing or workspace on demanding days`,
      "Keep the working space uncluttered and well lit, since visual noise raises decision fatigue",
    ],
    meditation: [
      "Ten minutes of seated attention on the breath each morning",
      a.counts[7] ? "One weekly silent hour with no device" : "A five minute pause between work and home",
      "A short body scan before sleep",
    ],
    affirmations: [
      `I complete what I begin, one step at a time`,
      a.missing.length
        ? `I am building the discipline of number ${a.missing[0]} through daily practice`
        : `I use my full grid consciously rather than automatically`,
      "My decisions are calm, informed and my own",
    ],
    breathing: [
      "Equal breathing, four counts in and four counts out, for three minutes",
      "Extended exhale, four in and six out, before difficult conversations",
      "Three slow breaths before replying when irritated",
    ],
    charity: [
      "Fix a monthly giving amount rather than giving on impulse",
      "Give time as well as money, ideally in a field connected to your work",
    ],
    nature: [
      "Twenty minutes of daylight walking each day",
      a.counts[2] ? "Time near water once a week" : "Time among trees or open ground once a week",
      "Keep one living plant in the room where you work",
    ],
    daily: [
      "Plan tomorrow before ending today",
      "One priority task before opening messages",
      "A written record of money spent",
    ],
    weekly: [
      "A single review hour for finances and commitments",
      "One full rest day with no work input",
      "One learning session on a chosen subject",
    ],
  };
}

/** Today's numerology tip for the dashboard. */
export function dailyTip(seed = new Date()): string {
  const tips = [
    "A repeated number in the grid is not automatically a gift. Beyond three occurrences, moderation helps more than practice.",
    "Zeros are ignored in a Lo Shu grid, so two people born in the same month can carry very different charts.",
    "Missing numbers describe skills to build, never fixed limits.",
    "An empty row or column is read as an arrow. It explains recurring patterns better than any single number.",
    "The day number shows your instinct, while the life path number shows your longer direction. Read them together.",
    "The strongest number in your grid usually explains how you behave under pressure.",
    "Balance in a grid matters more than intensity. A spread chart handles change better than a concentrated one.",
  ];
  const idx = Math.floor(seed.getTime() / 86_400_000) % tips.length;
  return tips[idx]!;
}
