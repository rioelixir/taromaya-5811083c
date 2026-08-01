/**
 * Beginner to advanced learning content for every module, in ELI10 language.
 * Plain words only: no symbols, no jargon, no Roman numerals.
 *
 * Each module gets three steps:
 *  - beginner: what this is, in one breath
 *  - growing:  how to actually use it today
 *  - deeper:   the advanced ideas, still explained simply
 */

export type ModuleLevels = {
  /** Route path this belongs to. */
  to: string;
  /** Friendly name shown on the card. */
  title: string;
  beginner: string[];
  growing: string[];
  deeper: string[];
};

const LEVELS: ModuleLevels[] = [
  {
    to: "/tarot",
    title: "Tarot board",
    beginner: [
      "Tarot is a deck of picture cards. Each picture tells a small story about life.",
      "Pick a deck, think of one clear question, then drag a few cards onto the board.",
      "Three cards is plenty when you are starting out.",
    ],
    growing: [
      "Give each card a job before you pull it. For example: first card is now, second card is what helps, third card is what happens next.",
      "Turn a card over and say out loud what you see in the picture. That is already a reading.",
      "Tap Ask AI and it will join all the cards into one simple story for you.",
    ],
    deeper: [
      "Cards repeat for a reason. If the same picture keeps coming back, that part of your life is asking for attention.",
      "A card lying upside down usually means the same idea, but slower, quieter, or still stuck inside.",
      "Bigger spreads work best when you group cards: a few for you, a few for the other person, one for the outcome.",
      "The Nakshatra panel on the left adds the sky of this exact moment, so the same cards can read a little differently on a different day.",
    ],
  },
  {
    to: "/kundli",
    title: "Kundli",
    beginner: [
      "A Kundli is a photo of the sky taken at the minute you were born.",
      "It shows where the sun, the moon and the planets were sitting.",
      "Put in your birth date, birth time and birth city, and it draws itself.",
    ],
    growing: [
      "The chart is split into twelve boxes. Each box is one part of life, like money, family, work or health.",
      "A planet sitting in a box colours that part of your life.",
      "Start with three things only: your moon, your rising sign, and your sun. They cover feelings, first impressions and purpose.",
    ],
    deeper: [
      "Planets also look across the chart at other boxes, so one planet can touch several parts of life at once.",
      "Time periods, called dasha, tell you which planet is running your life right now. That is why the same chart feels different at different ages.",
      "Current transits are today's sky laid over your birth sky. Where they meet is where life is busy at the moment.",
      "Strength scores tell you which planets are doing well and which need support through simple remedies.",
    ],
  },
  {
    to: "/astrology",
    title: "Western astrology",
    beginner: [
      "This is the same sky, read in the western style.",
      "It talks mostly about your personality and your feelings.",
      "Fill in your birth details once and the chart appears.",
    ],
    growing: [
      "Three pieces do most of the work: sun for what you want, moon for what you feel, rising sign for how you come across.",
      "Each planet also sits in a house, which is simply an area of daily life.",
    ],
    deeper: [
      "Angles between planets matter. Easy angles feel like help, hard angles feel like pressure that makes you grow.",
      "Progressions are a slow version of your chart that moves as you age, and they show how you are quietly changing.",
      "Return charts, like a birthday chart, set the mood for a whole year ahead.",
    ],
  },
  {
    to: "/numerology",
    title: "Numerology",
    beginner: [
      "Numerology turns your birth date and your name into single numbers.",
      "Each number has a personality, from one, the leader, to nine, the helper.",
      "Type your name and birth date and the numbers appear.",
    ],
    growing: [
      "Life path comes from your full birth date and describes your main road in life.",
      "Destiny comes from your full name and describes what you are here to build.",
      "Soul urge is what you secretly want, and personality is what strangers notice first.",
    ],
    deeper: [
      "Vedic numerology adds Mulank, your birth day number, and Bhagyank, your whole date number, plus friendly and unfriendly planets.",
      "Personal year, month and day numbers show the mood of the time you are in, so you can plan around it.",
      "Some numbers, called karmic debt numbers, point to old habits that need extra care.",
      "The Lo Shu grid places your numbers in a square. Missing numbers show gaps, and repeated numbers show strong traits.",
    ],
  },
  {
    to: "/panchang",
    title: "Panchang",
    beginner: [
      "Panchang is the traditional daily calendar of the sky.",
      "It tells you what kind of day today is.",
      "Pick your city and the day fills in by itself.",
    ],
    growing: [
      "Five parts make the day: the moon day, the moon star, the weekday, and two timing pieces.",
      "Sunrise and sunset matter because the traditional day starts at sunrise, not at midnight.",
    ],
    deeper: [
      "Some stretches of the day are treated as unhelpful for new beginnings, and the page marks them for you.",
      "The moon day tells you whether energy is growing or shrinking, which is why some days suit starting and others suit finishing.",
      "Because everything is tied to your city's sunrise, the same date can look different in two cities.",
    ],
  },
  {
    to: "/muhurat",
    title: "Good timing",
    beginner: [
      "This finds a good moment to start something.",
      "Choose what you are doing and where you are, and it suggests time windows.",
    ],
    growing: [
      "Green windows are supportive, and marked windows are better avoided.",
      "For big plans, pick a window that is also convenient in real life. A supportive time you cannot attend is useless.",
    ],
    deeper: [
      "Timing mixes the moon day, the moon star and the rising sign of that moment.",
      "Different jobs want different qualities. Travel likes movement, signing likes steadiness, healing likes gentleness.",
      "When your own chart is added, the best windows are the ones that also agree with your running time period.",
    ],
  },
  {
    to: "/compatibility",
    title: "Match making",
    beginner: [
      "This compares two people and gives a friendly score.",
      "Enter both sets of birth details and it does the rest.",
    ],
    growing: [
      "The score is built from several small tests about temperament, health, family life and mental fit.",
      "A middling score is not a no. It only shows which areas need patience.",
    ],
    deeper: [
      "Traditional matching compares the two moon stars across eight areas, each with its own weight.",
      "Certain warnings, like Mangal Dosha, are checked separately and often cancel out on both sides.",
      "Comparing the two whole charts, not just the stars, shows how daily life together will actually feel.",
    ],
  },
  {
    to: "/transits",
    title: "Transits",
    beginner: [
      "Transits are simply where the planets are today.",
      "Compared with your birth sky, they show what is stirring right now.",
    ],
    growing: [
      "Fast movers like the moon change the mood for hours or days.",
      "Slow movers set the theme of a whole year or more.",
    ],
    deeper: [
      "The strongest moments are when a moving planet lands exactly on a spot from your birth chart.",
      "Planets sometimes appear to go backwards, which usually means review rather than progress.",
      "Read transits together with your running time period. The period picks the topic, the transit picks the date.",
    ],
  },
  {
    to: "/nakshatra",
    title: "Nakshatra",
    beginner: [
      "The sky is split into twenty seven small star groups.",
      "The one the moon was in when you were born is your birth star.",
    ],
    growing: [
      "Your birth star describes your natural style, your instincts and what soothes you.",
      "Each star is also split into four quarters, and the quarter fine tunes the meaning.",
    ],
    deeper: [
      "Every star has a ruling planet, which links your star to your running time periods.",
      "Stars are grouped by nature, which is why some suit action and others suit rest or repair.",
      "The star the moon is in today can be compared with your birth star to explain why a day feels easy or heavy.",
    ],
  },
  {
    to: "/nakshatra-location",
    title: "Place star",
    beginner: [
      "This shows the star of the sky above a place, right now.",
      "Search a city and it appears.",
    ],
    growing: [
      "Use it before travel, meetings or moving house to sense the mood of a place.",
    ],
    deeper: [
      "Comparing a place star with your birth star hints at whether a city will feel supportive or tiring for you.",
      "Because it follows the moon, the picture changes through the day, so check it close to the time that matters.",
    ],
  },
  {
    to: "/horoscope",
    title: "Horoscope",
    beginner: [
      "A short reading for today, this week or this month.",
      "It uses your saved birth details, so it is about you, not a generic sign.",
    ],
    growing: [
      "Read it as weather, not as a rule. It tells you what to dress for.",
    ],
    deeper: [
      "Daily notes follow the moon, weekly notes follow the faster planets, monthly notes follow the slower ones.",
      "Predictions get sharper when your birth time is accurate, because the houses shift quickly.",
    ],
  },
  {
    to: "/remedies",
    title: "Remedies",
    beginner: [
      "Simple, gentle actions that support a weak part of your chart.",
      "Things like a colour, a day, a small habit or a short chant.",
    ],
    growing: [
      "Pick one remedy and keep it for forty days. One kept habit beats ten forgotten ones.",
    ],
    deeper: [
      "Remedies are matched to the planet that needs support, not to the problem you feel.",
      "Support the planet running your current time period first. That is where the effect shows fastest.",
    ],
  },
  {
    to: "/reports",
    title: "Reports",
    beginner: [
      "A full write up of your chart you can save or print.",
    ],
    growing: [
      "Choose the sections you care about so the report stays short and readable.",
    ],
    deeper: [
      "Every number in the report comes from the same engine as the screens, so nothing can disagree with itself.",
      "Reports include your running time periods, which makes them useful for planning a year ahead.",
    ],
  },
  {
    to: "/ai",
    title: "Ask AI",
    beginner: [
      "Ask any question in your own words and get a plain answer.",
    ],
    growing: [
      "Be specific. Instead of asking about work, ask whether to accept a new job offer this month.",
    ],
    deeper: [
      "The answer is grounded in your saved chart and today's sky, so it will not contradict the other pages.",
      "You can ask follow up questions and it keeps the thread of the conversation.",
    ],
  },
  {
    to: "/dreams",
    title: "Dreams",
    beginner: [
      "Tell it your dream and it explains what the pictures might mean.",
    ],
    growing: [
      "Write the dream down as soon as you wake up, and include how you felt, not just what happened.",
    ],
    deeper: [
      "Repeating dreams usually point to one unfinished feeling rather than a future event.",
      "Comparing dream dates with the sky of those nights can show a pattern worth noticing.",
    ],
  },
  {
    to: "/timeline",
    title: "Life timeline",
    beginner: [
      "A long line of your life showing which planet is in charge when.",
    ],
    growing: [
      "Look at the period you are in now, then at the next one, so you can prepare instead of react.",
    ],
    deeper: [
      "Periods sit inside periods, so a difficult big period can still hold easy smaller stretches.",
      "The most eventful times are when a period change lines up with a slow moving transit.",
    ],
  },
];

const FALLBACK: Omit<ModuleLevels, "to" | "title"> = {
  beginner: [
    "Fill in the boxes at the top. If your birth details are saved, most of it fills in by itself.",
    "Then read the first card of results. That is the short answer.",
  ],
  growing: [
    "Open one section at a time and read it slowly. Every heading is written in plain words.",
    "You can talk instead of typing. Tap the microphone, say your details, and tap it again to stop.",
  ],
  deeper: [
    "All the deeper detail below is calculated from your exact birth time and place, so keep those accurate.",
    "Every page uses the same calculation engine, so numbers here will always agree with the other pages.",
    "If a term is new to you, ask about it on the Ask AI page and you will get a simple explanation.",
  ],
};

export function getModuleLevels(pathname: string, title: string): ModuleLevels {
  const path = pathname.replace(/\/+$/, "") || "/";
  const found = LEVELS.find((l) => l.to === path);
  if (found) return found;
  return { to: path, title, ...FALLBACK };
}

export const MODULE_LEVELS = LEVELS;
