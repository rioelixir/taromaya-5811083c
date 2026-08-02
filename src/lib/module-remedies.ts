// Module-aware planetary remedy engine.
//
// Every module in the platform is governed by one or more grahas. This engine
// maps a module to its ruling planets, reads the person's chart to judge which
// of those planets need support, and returns a professional, sequenced remedy
// dossier drawn from the classical catalogue. It is fully deterministic: the
// same chart and module always produce the same guidance.

import type { KundliChart } from "@/lib/vedic";
import { REMEDY_CATALOG, prioritiseRemedies, type PlanetKey } from "@/lib/remedies";
import {
  prescribeGemstone, rudrakshaFor, yantraFor, planJapa,
  type GemPrescription, type JapaPlan,
} from "@/lib/remedies-deep";

export type ModulePlanetRole = { planet: PlanetKey; role: string };

export type ModuleRemedyBinding = {
  /** Human title used in the panel heading. */
  focus: string;
  /** What the module is actually judging, in consultation language. */
  purpose: string;
  planets: ModulePlanetRole[];
};

/**
 * Which grahas own which module. Roles are stated the way a consulting
 * astrologer would justify the choice, not as loose associations.
 */
export const MODULE_PLANETS: Record<string, ModuleRemedyBinding> = {
  "/kundli": {
    focus: "Birth chart",
    purpose: "the whole natal blueprint, so remedies follow the planets that are least supported in it",
    planets: [
      { planet: "Sun", role: "Governs the self, vitality and the father line; the first thing a chart reading tests." },
      { planet: "Moon", role: "Governs the mind and emotional steadiness, which decides how the chart is actually lived." },
      { planet: "Saturn", role: "Governs discipline, delay and the karmic account the chart is settling." },
    ],
  },
  "/astrology": {
    focus: "Western chart",
    purpose: "the natal wheel, aspects and house cusps behind your Western reading",
    planets: [
      { planet: "Sun", role: "The core identity and the Ascendant ruler's counterpart in a Western wheel." },
      { planet: "Mercury", role: "Governs aspect interpretation, reasoning and how you translate the chart into decisions." },
      { planet: "Venus", role: "Governs the relational and value axis that Western readings weigh heavily." },
    ],
  },
  "/horoscope": {
    focus: "Forecast",
    purpose: "day-to-day and monthly transit pressure",
    planets: [
      { planet: "Moon", role: "Rules the daily cycle; the fastest-moving trigger in any forecast." },
      { planet: "Saturn", role: "Sets the slow themes a forecast has to respect." },
      { planet: "Sun", role: "Sets the monthly frame through solar ingress." },
    ],
  },
  "/panchang": {
    focus: "Almanac",
    purpose: "tithi, nakshatra, yoga and karana for the chosen day",
    planets: [
      { planet: "Moon", role: "Tithi and nakshatra are lunar measures; the Moon is the almanac itself." },
      { planet: "Sun", role: "Fixes sunrise, sunset and the solar half of every panchang limb." },
      { planet: "Jupiter", role: "Rules the auspiciousness a panchang is consulted for." },
    ],
  },
  "/muhurat": {
    focus: "Timing",
    purpose: "choosing a supported window for an action",
    planets: [
      { planet: "Jupiter", role: "Primary benefic for sanctioning any beginning." },
      { planet: "Moon", role: "Tara and tithi strength decide whether a window holds." },
      { planet: "Saturn", role: "Shows where a rushed start will later be delayed." },
    ],
  },
  "/transits": {
    focus: "Transits",
    purpose: "current planetary movement over your natal points",
    planets: [
      { planet: "Saturn", role: "The slowest and most consequential transit in a working life." },
      { planet: "Jupiter", role: "Marks the year's expansion and where help arrives." },
      { planet: "Rahu", role: "Marks the restless, ambitious pull in any transit period." },
    ],
  },
  "/vedic-transits": {
    focus: "Vedic transits",
    purpose: "gochara over the Moon sign and natal houses",
    planets: [
      { planet: "Saturn", role: "Gochara judgement begins with Saturn's house from the Moon." },
      { planet: "Jupiter", role: "Sets the supportive counterweight in gochara." },
      { planet: "Moon", role: "The reference point all Vedic transit measurement uses." },
    ],
  },
  "/sadesati": {
    focus: "Sade Sati",
    purpose: "Saturn's passage over and around the natal Moon",
    planets: [
      { planet: "Saturn", role: "The whole period is Saturn's transit; every remedy starts here." },
      { planet: "Moon", role: "The point under pressure; the mind needs protecting, not only Saturn appeasing." },
    ],
  },
  "/mangal-dosha": {
    focus: "Mangal Dosha",
    purpose: "Mars placement in the marriage-sensitive houses",
    planets: [
      { planet: "Mars", role: "The dosha is defined by Mars's house from Lagna, Moon and Venus." },
      { planet: "Venus", role: "Governs the marriage significations Mars is disturbing." },
      { planet: "Saturn", role: "Decides whether the friction hardens into delay." },
    ],
  },
  "/kaalsarp": {
    focus: "Kaal Sarp",
    purpose: "the axis of Rahu and Ketu holding all planets on one side",
    planets: [
      { planet: "Rahu", role: "The forward head of the axis; it drives the compulsion in the pattern." },
      { planet: "Ketu", role: "The tail; it shows what is being released and where confidence leaks." },
      { planet: "Saturn", role: "Adds the endurance the pattern demands." },
    ],
  },
  "/compatibility": {
    focus: "Kundli matching",
    purpose: "Ashtakoot and Dashakoot agreement between two charts",
    planets: [
      { planet: "Venus", role: "Rules attraction, comfort and the marital contract itself." },
      { planet: "Moon", role: "Ashtakoot is calculated from both Moons; emotional fit is measured here." },
      { planet: "Jupiter", role: "Rules sanction, children and the long stability of the union." },
      { planet: "Mars", role: "Rules the friction and drive that either energises or strains the match." },
    ],
  },
  "/numerology": {
    focus: "Numerology",
    purpose: "birth, destiny and name vibrations and their planetary rulers",
    planets: [
      { planet: "Sun", role: "Rules number 1 and the driver of the whole chart." },
      { planet: "Moon", role: "Rules number 2 and the emotional reading of every number." },
      { planet: "Mercury", role: "Rules number 5, the name value and all calculation." },
      { planet: "Saturn", role: "Rules number 8, where numerology most often shows delay." },
    ],
  },
  "/nadi": {
    focus: "Nadi",
    purpose: "the fine nadi amsa division and the Bhrigu Bindu",
    planets: [
      { planet: "Jupiter", role: "Rules the leaf-bundle tradition and the guidance being sought." },
      { planet: "Rahu", role: "Bhrigu Bindu is measured from Rahu; it defines the karmic pointer." },
      { planet: "Moon", role: "The second reference for Bhrigu Bindu and the reading's timing." },
    ],
  },
  "/nakshatra": {
    focus: "Nakshatra",
    purpose: "the birth star, its lord and pada",
    planets: [
      { planet: "Moon", role: "The nakshatra is where the Moon sits; it is the star itself." },
      { planet: "Ketu", role: "Rules the first cycle of nakshatras and the detachment they carry." },
    ],
  },
  "/nakshatra-location": {
    focus: "Current Nakshatra",
    purpose: "the star ruling this moment at your place",
    planets: [
      { planet: "Moon", role: "The present nakshatra is the Moon's present position." },
      { planet: "Mercury", role: "Rules the practical use of a live reading: what to say and send now." },
    ],
  },
  "/health": {
    focus: "Health",
    purpose: "constitutional tendencies in the chart, not diagnosis",
    planets: [
      { planet: "Sun", role: "Rules vitality, bones and the eyes; the base of physical resilience." },
      { planet: "Moon", role: "Rules fluids, sleep and mental rest." },
      { planet: "Saturn", role: "Rules chronic patterns, joints and long recovery." },
      { planet: "Mars", role: "Rules blood, inflammation and accident-proneness." },
    ],
  },
  "/ayurveda": {
    focus: "Ayurveda",
    purpose: "dosha balance read from the chart",
    planets: [
      { planet: "Saturn", role: "Carries vata: dryness, irregularity and restlessness." },
      { planet: "Mars", role: "Carries pitta: heat, acidity and sharpness." },
      { planet: "Moon", role: "Carries kapha: heaviness, retention and calm." },
      { planet: "Jupiter", role: "Governs digestion, liver and the nourishment side of any regimen." },
    ],
  },
  "/career": {
    focus: "Career",
    purpose: "the tenth house, its lord and professional dasha",
    planets: [
      { planet: "Saturn", role: "The natural karma-karaka; all sustained work is judged through Saturn." },
      { planet: "Sun", role: "Rules authority, recognition and government-linked work." },
      { planet: "Mercury", role: "Rules trade, communication, analysis and paperwork." },
      { planet: "Mars", role: "Rules initiative, execution and technical skill." },
    ],
  },
  "/finance": {
    focus: "Finance",
    purpose: "the second and eleventh houses and their lords",
    planets: [
      { planet: "Jupiter", role: "Rules wealth accumulation, advisors and honest gain." },
      { planet: "Venus", role: "Rules assets, comfort spending and liquidity." },
      { planet: "Saturn", role: "Rules debt, structure and the discipline that keeps money." },
      { planet: "Mercury", role: "Rules accounts, contracts and market decisions." },
    ],
  },
  "/dharma": {
    focus: "Dharma",
    purpose: "the ninth house and the guiding principle of the chart",
    planets: [
      { planet: "Jupiter", role: "Rules dharma, teachers and considered judgement." },
      { planet: "Sun", role: "Rules the father line and the authority you answer to." },
      { planet: "Ketu", role: "Rules renunciation and where duty asks you to let go." },
    ],
  },
  "/karma": {
    focus: "Karma",
    purpose: "the sixth, eighth and twelfth axis and the nodes",
    planets: [
      { planet: "Saturn", role: "The account keeper; karma is settled on Saturn's terms." },
      { planet: "Rahu", role: "Shows the unfinished appetite carried into this life." },
      { planet: "Ketu", role: "Shows the mastery already earned and the attachment to drop." },
    ],
  },
  "/chakra": {
    focus: "Chakras",
    purpose: "the energetic centres and the planets that feed them",
    planets: [
      { planet: "Sun", role: "Feeds the solar plexus and the will to act." },
      { planet: "Moon", role: "Feeds the sacral and brow centres, emotion and imagination." },
      { planet: "Jupiter", role: "Feeds the heart and crown, meaning and expansion." },
      { planet: "Saturn", role: "Feeds the root; grounding and safety." },
    ],
  },
  "/vastu": {
    focus: "Vastu",
    purpose: "direction, layout and the planet ruling each quarter",
    planets: [
      { planet: "Mars", role: "Rules the south-east, fire and the kitchen." },
      { planet: "Saturn", role: "Rules the west and south-west, storage and stability." },
      { planet: "Jupiter", role: "Rules the north-east, the study and the prayer space." },
      { planet: "Venus", role: "Rules the south-east comfort zone and interiors." },
    ],
  },
  "/yantra": {
    focus: "Yantra",
    purpose: "the geometric instrument of a chosen graha",
    planets: [
      { planet: "Jupiter", role: "Rules consecration and the discipline a yantra needs to work." },
      { planet: "Saturn", role: "Rules the persistence that turns installation into result." },
    ],
  },
  "/baby-names": {
    focus: "Naming",
    purpose: "nakshatra syllable, name value and its planetary ruler",
    planets: [
      { planet: "Moon", role: "The birth nakshatra decides the opening syllable." },
      { planet: "Mercury", role: "Rules speech, spelling and the name value." },
      { planet: "Jupiter", role: "Rules blessing, meaning and the name's long reputation." },
    ],
  },
  "/dreams": {
    focus: "Dreams",
    purpose: "the symbolic material the mind is processing",
    planets: [
      { planet: "Moon", role: "Rules dreaming, memory and the subconscious itself." },
      { planet: "Ketu", role: "Rules symbolic, past-life and prophetic imagery." },
      { planet: "Mercury", role: "Rules the interpretation and recording of a dream." },
    ],
  },
  "/tarot": {
    focus: "Tarot",
    purpose: "the spread you have laid and the question behind it",
    planets: [
      { planet: "Moon", role: "Rules intuition and the reading of images." },
      { planet: "Mercury", role: "Rules the framing of the question and the message drawn." },
      { planet: "Jupiter", role: "Rules the counsel a reading is finally used for." },
    ],
  },
  "/varshphal": {
    focus: "Annual chart",
    purpose: "the Tajika year chart and its Muntha",
    planets: [
      { planet: "Sun", role: "The solar return defines the year; the Sun opens it." },
      { planet: "Saturn", role: "Sets the year's discipline and its unavoidable work." },
      { planet: "Jupiter", role: "Sets the year's support and where growth is sanctioned." },
    ],
  },
  "/strength": {
    focus: "Planetary strength",
    purpose: "Shadbala and Ashtakavarga scoring",
    planets: [
      { planet: "Sun", role: "Reference point for sthana and dig bala comparison." },
      { planet: "Saturn", role: "Usually the lowest-scoring graha and the one worth supporting first." },
      { planet: "Moon", role: "Its bala decides how steadily the whole chart performs." },
    ],
  },
  "/timeline": {
    focus: "Timeline",
    purpose: "dasha and bhukti sequence across the years",
    planets: [
      { planet: "Saturn", role: "Its periods set the long, formative stretches of a life." },
      { planet: "Jupiter", role: "Its periods carry expansion, teaching and family growth." },
      { planet: "Rahu", role: "Its periods bring sudden movement that needs handling, not chasing." },
    ],
  },
  "/avakhada": {
    focus: "Avakhada",
    purpose: "the classical birth particulars: varna, vashya, yoni, gana and nadi",
    planets: [
      { planet: "Moon", role: "Every avakhada limb is derived from the Moon's nakshatra and pada." },
      { planet: "Jupiter", role: "Rules the gana and the temperament classification." },
    ],
  },
  "/festivals": {
    focus: "Festivals",
    purpose: "the lunar calendar behind each observance",
    planets: [
      { planet: "Moon", role: "Festivals are fixed by tithi; the Moon rules the calendar." },
      { planet: "Sun", role: "Rules sankranti and the solar festivals." },
      { planet: "Jupiter", role: "Rules observance, fasting and the merit of the day." },
    ],
  },
  "/moon-calendar": {
    focus: "Moon calendar",
    purpose: "the lunar month, phase and void periods",
    planets: [
      { planet: "Moon", role: "The calendar is the Moon's own cycle." },
      { planet: "Saturn", role: "Marks the phases where rest, not action, is indicated." },
    ],
  },
  "/sky": {
    focus: "Live sky",
    purpose: "current planetary positions overhead",
    planets: [
      { planet: "Moon", role: "Fastest body; sets the mood of the present hour." },
      { planet: "Mercury", role: "Rules whether the present hour suits messages and decisions." },
      { planet: "Saturn", role: "Marks the standing pressure behind the day." },
    ],
  },
  "/calculators": {
    focus: "Calculators",
    purpose: "the individual measures behind a full reading",
    planets: [
      { planet: "Mercury", role: "Rules calculation, measurement and accurate record keeping." },
      { planet: "Saturn", role: "Rules the patience to check a figure twice before acting on it." },
    ],
  },
  "/reports": {
    focus: "Reports",
    purpose: "the compiled dossier drawn from your chart",
    planets: [
      { planet: "Mercury", role: "Rules documentation and the written reading." },
      { planet: "Jupiter", role: "Rules the counsel a report is meant to carry." },
    ],
  },
  "/life-dashboard": {
    focus: "Life dashboard",
    purpose: "the standing balance across work, money, health and relationships",
    planets: [
      { planet: "Sun", role: "Sets direction and the sense of self across every area." },
      { planet: "Moon", role: "Sets the mood in which the whole dashboard is read." },
      { planet: "Saturn", role: "Sets the workload and the areas that need patience." },
      { planet: "Jupiter", role: "Sets where support and growth are already available." },
    ],
  },
  "/remedies": {
    focus: "Remedies",
    purpose: "the classical upaya toolkit for your weakest grahas",
    planets: [
      { planet: "Saturn", role: "Most remedial work in practice is Saturn work." },
      { planet: "Rahu", role: "Needs conduct-based remedies more than ritual." },
      { planet: "Sun", role: "The first graha strengthened in any classical sequence." },
    ],
  },
  "/history": {
    focus: "Saved readings",
    purpose: "what you have already been told and what you acted on",
    planets: [
      { planet: "Mercury", role: "Rules records, review and honest comparison over time." },
      { planet: "Saturn", role: "Rules follow-through; a remedy only counts if it was continued." },
    ],
  },
  "/bookmarks": {
    focus: "Saved items",
    purpose: "the guidance you chose to keep",
    planets: [
      { planet: "Mercury", role: "Rules selection, notes and revisiting advice." },
      { planet: "Jupiter", role: "Rules the discernment behind what is worth keeping." },
    ],
  },
};

const FALLBACK: ModuleRemedyBinding = {
  focus: "This module",
  purpose: "the reading on this page",
  planets: [
    { planet: "Sun", role: "Rules the self and the direction any reading is applied to." },
    { planet: "Moon", role: "Rules the mind that has to act on the reading." },
    { planet: "Saturn", role: "Rules the discipline that turns advice into result." },
  ],
};

export function bindingFor(pathname: string): ModuleRemedyBinding {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return MODULE_PLANETS[clean] ?? FALLBACK;
}

export type PlanetRemedyBlock = {
  planet: PlanetKey;
  role: string;
  /** attention = chart flags it, support = mild, steady = no flag found. */
  priority: "attention" | "support" | "steady";
  condition: string;
  reasons: string[];
  deity: string;
  mantra: string;
  japa: JapaPlan;
  day: string;
  colour: string;
  fast: string;
  charity: string[];
  donation: string[];
  food: string[];
  conduct: string[];
  temple: string;
  duration: string;
  yantra: string;
  rudraksha: string;
  gem: GemPrescription;
};

export type ModuleRemedyPlan = {
  focus: string;
  purpose: string;
  chartUsed: boolean;
  blocks: PlanetRemedyBlock[];
  /** What to change, in the order a consultant would actually give it. */
  sequence: string[];
  cautions: string[];
};

/**
 * Build the remedy dossier for a module. Pass the person's chart to grade each
 * ruling planet; without a chart the guidance stays general but still correct.
 */
export function moduleRemedyPlan(pathname: string, chart: KundliChart | null): ModuleRemedyPlan {
  const binding = bindingFor(pathname);
  const flagged = chart ? prioritiseRemedies(chart) : [];
  const flagMap = new Map(flagged.map((f) => [f.planet, f]));

  const blocks: PlanetRemedyBlock[] = binding.planets.map(({ planet, role }) => {
    const cat = REMEDY_CATALOG[planet];
    const flag = flagMap.get(planet);
    const score = flag?.score ?? 0;
    const priority: PlanetRemedyBlock["priority"] =
      score >= 3 ? "attention" : score >= 1 ? "support" : "steady";
    const malas = priority === "attention" ? 3 : priority === "support" ? 2 : 1;
    const condition = !chart
      ? "General guidance. Save your birth details and this planet is graded against your own chart."
      : priority === "attention"
        ? `Your chart flags ${planet} for attention, so this set is the one to begin with.`
        : priority === "support"
          ? `${planet} is mildly stressed in your chart. Light, steady support is enough.`
          : `${planet} is reasonably placed in your chart. Keep the practice light and preventive.`;

    return {
      planet,
      role,
      priority,
      condition,
      reasons: flag?.reasons ?? [],
      deity: cat.deity,
      mantra: cat.beejMantra,
      japa: planJapa({ totalJapa: cat.beejCount, dailyMalas: malas, planet }),
      day: cat.day,
      colour: cat.color,
      fast: cat.fast,
      charity: cat.charity,
      donation: cat.donation,
      food: cat.food,
      conduct: cat.behaviour,
      temple: cat.temple,
      duration: cat.duration,
      yantra: yantraFor(planet)?.name ?? cat.yantra,
      rudraksha: rudrakshaFor(planet)
        .map((r) => `${r.mukhi} mukhi`)
        .join(" or ") || "Not indicated",
      gem: prescribeGemstone(planet, {
        deficit: priority === "attention" ? 0.85 : priority === "support" ? 0.55 : 0.3,
      }),
    };
  });

  const primary = blocks.find((b) => b.priority === "attention") ?? blocks[0]!;
  const sequence = [
    `Begin with ${primary.planet}. It carries the most weight for ${binding.focus.toLowerCase()} in your case, and one planet at a time is how remedies are correctly given.`,
    `Days 1 to 7 — conduct only. ${primary.conduct[0] ?? "Keep the daily routine steady."} Nothing is bought and nothing is worn in this first week.`,
    `Days 8 to 40 — add the practice. ${primary.japa.dailyMalas} mala of ${primary.mantra} at ${primary.japa.bestTime}, facing ${primary.japa.bestDirection === "E" ? "east" : primary.japa.bestDirection === "N" ? "north" : "north-east"}, about ${primary.japa.minutesPerDay} minutes daily.`,
    `Every ${primary.day} — the weekly anchor. ${primary.fast} Wear ${primary.colour.toLowerCase()} and give ${primary.charity.slice(0, 2).join(" or ").toLowerCase()} to someone who needs it, quietly.`,
    `Keep a one-line note each day. After 40 days you should be able to point to a specific change in ${binding.focus.toLowerCase()}, not a vague feeling.`,
    blocks.length > 1
      ? `Only after that cycle, take up ${blocks.filter((b) => b.planet !== primary.planet).map((b) => b.planet).join(" and ")} in the same way.`
      : `Repeat the cycle once more before judging the result.`,
  ];

  const cautions = [
    "Gemstones are given here with weights for completeness. Do not wear a stone for a planet flagged for attention without a consultation: a wrongly chosen stone strengthens the wrong significations.",
    "Blue sapphire, hessonite and cat's eye are tested for fifteen days before being worn permanently.",
    "Fasting is adjusted to your body. Anyone pregnant, diabetic or on medication keeps food and only follows the conduct and practice parts.",
    "Remedies support a chart. They do not replace medical, legal or financial professionals, and nothing here is a diagnosis or a guarantee.",
    "Consistency decides the outcome. A short practice held for forty days does more than an elaborate one abandoned in a week.",
  ];

  return {
    focus: binding.focus,
    purpose: binding.purpose,
    chartUsed: !!chart,
    blocks,
    sequence,
    cautions,
  };
}
