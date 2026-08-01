/**
 * Spoken help guides — one short, very simple script per part of the app.
 *
 * Every module in the app has an entry here. The Help page uses the titles,
 * blurbs and groups for browsing; the audio route reads the script out loud.
 * Keep every script plain: no symbols, no jargon, no long sentences.
 */

export type HelpGuide = {
  id: string;
  title: string;
  to: string;
  group: string;
  /** One line the reader sees on the card. */
  blurb: string;
  /** Extra words people might search for. */
  tags?: string[];
  /** What the voice reads out. Short, friendly, step by step. */
  script: string;
};

/** Everything most sections need, said the same way in every script. */
const NEEDS_BIRTH =
  "It needs three things: the day you were born, the time on the clock, and the city. " +
  "Save them once in Birth Details and they fill in by themselves after that. ";

export const HELP_GUIDES: HelpGuide[] = [
  // ---------------------------------------------------------------- Start
  {
    id: "start",
    title: "Getting started",
    to: "/",
    group: "Start here",
    blurb: "How the whole app works, in one minute.",
    tags: ["begin", "first time", "home"],
    script:
      "Welcome to Taromaya. Think of this app as a friendly guide book about you. " +
      "The home page has big buttons for the things people use most. " +
      "The menu button in the corner opens every section. " +
      NEEDS_BIRTH +
      "If you do not like typing, tap the microphone at the top of a section and just say your details out loud. " +
      "Take your time. Nothing here can break.",
  },
  {
    id: "voice",
    title: "Using your voice",
    to: "/",
    group: "Start here",
    blurb: "Talk instead of typing.",
    tags: ["microphone", "speak", "mic"],
    script:
      "You can talk to this app instead of typing. " +
      "At the top of most sections there is a big round microphone. Tap it once. " +
      "When it turns red it is listening. Say everything in one go, like this: " +
      "my name is Ria, I was born on the eighteenth of August nineteen ninety five, at four thirty five in the evening, in Delhi. " +
      "Tap it again to stop. The boxes below fill in for you, and you can always fix anything that came out wrong. " +
      "You can also say things like open tarot or go to kundli, and the app will take you there.",
  },
  {
    id: "birth-details",
    title: "Birth details",
    to: "/birth-details",
    group: "Start here",
    blurb: "Save your details once, use them everywhere.",
    tags: ["profile", "date", "time", "city"],
    script:
      "This is the one place where you save your birth information. " +
      "Put in your name, the day you were born, the time on the clock when you were born, and the city. " +
      "The city box searches the whole world, so start typing and pick your city from the list. " +
      "Once you save, every other section fills itself in, so you never type this again. " +
      "If you are not sure of your birth time, put your best guess. You can change it any time.",
  },
  {
    id: "help",
    title: "Using this help page",
    to: "/help",
    group: "Start here",
    blurb: "How to find and hear any guide.",
    tags: ["audio", "listen", "language"],
    script:
      "This page has one short voice guide for every part of the app. " +
      "Tap a group name to see only that group, or type a word in the search box. " +
      "Press the round play button and someone will explain that section in easy words. " +
      "Pick your language at the top and the voice will speak in it. " +
      "Under each guide there is a link that opens the real section, so you can listen and try at the same time.",
  },
  {
    id: "settings",
    title: "Settings and language",
    to: "/settings",
    group: "Start here",
    blurb: "Change your language and how things look.",
    tags: ["language", "translate"],
    script:
      "In settings you can change your language, and the app will speak and write in it. " +
      "There are more than thirty languages, including many Indian ones. " +
      "You can also pick a language quickly from the small language button at the top of any page.",
  },

  // ---------------------------------------------------------------- Tarot
  {
    id: "tarot",
    title: "Tarot board",
    to: "/tarot",
    group: "Tarot",
    blurb: "Pick a deck, drag cards, ask for a reading.",
    tags: ["cards", "spread", "deck"],
    script:
      "The tarot board is a table where you lay out cards. " +
      "First choose a deck from the row of decks. " +
      "Then pick a card from the pile and drag it onto the board with your finger. " +
      "Place as many cards as you like. " +
      "Tap a card once to make it bigger, and tap the dark area around it to close it again. " +
      "When your cards are ready, press Ask AI. It looks at your cards and tells you one simple story about them. " +
      "The panel on the side shows the star of this moment and this place, and you can drag that card onto the board too.",
  },
  {
    id: "ai",
    title: "AI guide",
    to: "/ai",
    group: "Tarot",
    blurb: "Ask any question in your own words.",
    tags: ["chat", "ask", "question"],
    script:
      "This is a friendly helper you can ask anything. " +
      "Type or say your question the way you would ask a friend, for example: how will this month go for my work. " +
      "The answer comes back in plain words, in short pieces, so it is easy to follow. " +
      "You can keep asking more questions in the same chat.",
  },
  {
    id: "prashna",
    title: "Question chart",
    to: "/prashna",
    group: "Tarot",
    blurb: "A chart for one question, asked right now.",
    tags: ["prashna", "horary", "yes no"],
    script:
      "Sometimes you do not want your whole life, only an answer to one question. " +
      "Type your question, and the app makes a small chart for this exact moment. " +
      "It then tells you, in simple words, which way things are leaning and what would help. " +
      "Ask about one thing at a time and keep the question clear.",
  },
  {
    id: "dreams",
    title: "Dream oracle",
    to: "/dreams",
    group: "Tarot",
    blurb: "Tell a dream, get a plain reading.",
    tags: ["sleep", "dream"],
    script:
      "Had a dream you keep thinking about? " +
      "Tap the microphone and describe it out loud, or type it, then press the button. " +
      "You get a calm, simple reading of what your mind may be chewing on, with one small suggestion.",
  },

  // ------------------------------------------------------------ Your chart
  {
    id: "kundli",
    title: "Kundli",
    to: "/kundli",
    group: "Your chart",
    blurb: "Your birth chart, explained simply.",
    tags: ["birth chart", "janam", "horoscope chart"],
    script:
      "A kundli is a picture of the sky at the exact moment you were born. " +
      NEEDS_BIRTH +
      "You get a chart picture, a list of planets with the sign they sit in, and short notes under each part. " +
      "The signs are shown as numbers from one to twelve, so you do not need to learn any names. " +
      "Scroll down for your life periods and for how today's sky meets your chart.",
  },
  {
    id: "astrology",
    title: "Astrology",
    to: "/astrology",
    group: "Your chart",
    blurb: "Signs, planets and plain meanings.",
    tags: ["western", "planets", "signs"],
    script:
      "This section shows where each planet was when you were born and what that usually means in daily life. " +
      NEEDS_BIRTH +
      "Read one line at a time. Each line is written the way you would explain it to a child.",
  },
  {
    id: "nakshatra",
    title: "Nakshatra",
    to: "/nakshatra",
    group: "Your chart",
    blurb: "Your birth star and what it says about you.",
    tags: ["star", "moon", "birth star"],
    script:
      "The sky is split into twenty seven small star groups called nakshatras. " +
      "The one the moon was in when you were born is your birth star. " +
      NEEDS_BIRTH +
      "The app finds your star and explains your nature, your strengths and what helps you, in easy words.",
  },
  {
    id: "avakhada",
    title: "Birth summary",
    to: "/avakhada",
    group: "Your chart",
    blurb: "All your birth basics on one card.",
    tags: ["avakhada", "details", "summary"],
    script:
      "This is a one page summary of your birth basics: your moon sign, your star, your first letter for naming, and a few other traditional details. " +
      NEEDS_BIRTH +
      "It is handy to keep or show to a family astrologer.",
  },
  {
    id: "strength",
    title: "Planet strength",
    to: "/strength",
    group: "Your chart",
    blurb: "Which planets are strong for you.",
    tags: ["shadbala", "power", "weak"],
    script:
      "Some planets in your chart are strong and some are tired. " +
      NEEDS_BIRTH +
      "The list shows which ones are working well for you and which need a little help, with one plain line for each. " +
      "Start with the strongest and lean on it.",
  },
  {

    id: "deep-jyotish",
    title: "Deep study",
    to: "/deep-jyotish",
    group: "Your chart",
    blurb: "For people who want the full detail.",
    tags: ["advanced", "jaimini", "divisional"],
    script:
      "This is the deep end of the pool, for people who already enjoy astrology. " +
      "It shows extra charts and older methods that specialists use. " +
      "Every part still has a simple line under it, so you can read as much or as little as you like.",
  },

  // ------------------------------------------------------ Timing & calendar
  {
    id: "panchang",
    title: "Panchang",
    to: "/panchang",
    group: "Timing and calendar",
    blurb: "Today's sky almanac for your city.",
    tags: ["tithi", "calendar", "sunrise"],
    script:
      "Panchang is a daily calendar of the sky. " +
      "Choose your city and a date. " +
      "It tells you when the sun rises and sets, which moon day it is, which star the moon is in, and which parts of the day are good or better avoided. " +
      "Use it when you want to pick a good time for something small, like starting a new habit.",
  },
  {
    id: "muhurat",
    title: "Muhurat",
    to: "/muhurat",
    group: "Timing and calendar",
    blurb: "Find a good time to begin something.",
    tags: ["good time", "start", "auspicious"],
    script:
      "Muhurat means a good moment to start something important, like signing papers or travelling. " +
      "Pick your city, pick the day, and choose what you want to do. " +
      "The app shows the friendly windows of time and the ones to skip, with a short reason for each.",
  },
  {
    id: "festivals",
    title: "Festivals",
    to: "/festivals",
    group: "Timing and calendar",
    blurb: "Dates worked out for your city.",
    tags: ["holiday", "puja", "dates"],
    script:
      "This shows festival dates worked out for your own city, because they can shift by a day from place to place. " +
      "Choose your city and a year, then scroll the list. Each entry has a short line about what the day is for.",
  },
  {
    id: "moon-calendar",
    title: "Moon calendar",
    to: "/moon-calendar",
    group: "Timing and calendar",
    blurb: "Full moons, new moons and moods.",
    tags: ["moon", "full moon", "phase"],
    script:
      "The moon changes shape through the month and many people feel it. " +
      "This calendar shows each new moon and full moon, and what people usually do around them: start something fresh, or finish and let go. " +
      "Pick a month and read the short note on any day.",
  },
  {
    id: "varshphal",
    title: "Your year ahead",
    to: "/varshphal",
    group: "Timing and calendar",
    blurb: "A chart just for this birthday year.",
    tags: ["annual", "solar return", "year"],
    script:
      "Every birthday, the sky makes a fresh chart for your coming year. " +
      NEEDS_BIRTH +
      "You get the main theme of the year, the months that feel busy, and one gentle piece of advice.",
  },
  {
    id: "timeline",
    title: "Timeline",
    to: "/timeline",
    group: "Timing and calendar",
    blurb: "Your months ahead at a glance.",
    tags: ["future", "months", "periods"],
    script:
      "The timeline lays your coming months out in a row so you can see busy patches and calm patches. " +
      NEEDS_BIRTH +
      "Read the bars from left to right and tap any bar to read what it is about.",
  },

  // ------------------------------------------------------------ Sky watching
  {
    id: "transits",
    title: "Transits",
    to: "/transits",
    group: "Sky watching",
    blurb: "What the sky is doing to your chart now.",
    tags: ["today", "planets moving"],
    script:
      "Transits show where the planets are moving today and how they touch your own chart. " +
      NEEDS_BIRTH +
      "Each line says which planet is passing, what it usually stirs up, and roughly how long it lasts. " +
      "Slow planets matter more, so start from the top.",
  },
  {
    id: "vedic-transits",
    title: "Vedic transits",
    to: "/vedic-transits",
    group: "Sky watching",
    blurb: "The Indian way of reading today's sky.",
    tags: ["gochar", "moon sign"],
    script:
      "This reads today's sky the traditional Indian way, counted from your moon sign instead of your sun sign. " +
      NEEDS_BIRTH +
      "It tells you which planets are helping right now and which are asking for patience.",
  },
  {
    id: "sky",
    title: "Live sky",
    to: "/sky",
    group: "Sky watching",
    blurb: "Where the planets are right now.",
    tags: ["now", "live", "planets"],
    script:
      "This is a simple picture of the sky at this very moment. " +
      "You can see which sign each planet is sitting in and whether it is moving forward or looking like it is going backwards. " +
      "It updates by itself, so you can just watch.",
  },
  {
    id: "observatory",
    title: "Observatory",
    to: "/observatory",
    group: "Sky watching",
    blurb: "Look closer at the sky.",
    tags: ["telescope", "planets", "watch"],
    script:
      "The observatory is for looking, not for predicting. " +
      "It shows the planets and their positions in a bigger, clearer view, so you can learn what is up there tonight.",
  },
  {
    id: "weather",
    title: "Cosmic weather",
    to: "/weather",
    group: "Sky watching",
    blurb: "The mood of the sky today.",
    tags: ["mood", "today", "energy"],
    script:
      "Think of this as a weather report for the sky's mood. " +
      "Pick your city and read the short forecast: calm, busy, or a bit bumpy, and one simple tip for the day.",
  },
  {
    id: "astrocartography",
    title: "Places on the map",
    to: "/astrocartography",
    group: "Sky watching",
    blurb: "Where in the world suits you.",
    tags: ["travel", "move", "map", "city"],
    script:
      "Your chart feels different in different places. " +
      NEEDS_BIRTH +
      "The map shows lines across the world and tells you, in plain words, what kind of place each line brings: good for work, good for love, good for rest. " +
      "Use it when you are thinking about travelling or moving.",
  },

  // ------------------------------------------------------------- Life areas
  {
    id: "horoscope",
    title: "Horoscope",
    to: "/horoscope",
    group: "Life areas",
    blurb: "Your day, week and month.",
    tags: ["daily", "weekly", "prediction"],
    script:
      "This gives you a short reading for today, this week and this month. " +
      NEEDS_BIRTH +
      "Read it as gentle weather for your mood, not as a rule.",
  },
  {
    id: "life-dashboard",
    title: "Life dashboard",
    to: "/life-dashboard",
    group: "Life areas",
    blurb: "Everything important on one screen.",
    tags: ["overview", "summary", "home"],
    script:
      "The dashboard puts the important bits together on one screen: today's sky, your current period, your numbers and what is coming. " +
      NEEDS_BIRTH +
      "Start here when you only have a minute.",
  },
  {
    id: "compatibility",
    title: "Match making",
    to: "/compatibility",
    group: "Life areas",
    blurb: "How two people fit together.",
    tags: ["marriage", "guna", "partner", "kundli matching"],
    script:
      "Match making compares two birth charts. " +
      "Put in the birth details of the first person, then the second person, and press the button. " +
      "You get a friendliness score, then simple notes on how the two get along in feelings, in habits and in daily life, plus what helps where they clash. " +
      "A low score is not a no. It only shows where the work is.",
  },
  {
    id: "career",
    title: "Career",
    to: "/career",
    group: "Life areas",
    blurb: "Work that suits you.",
    tags: ["job", "work", "business"],
    script:
      "This looks at your chart for the kind of work that fits you naturally. " +
      NEEDS_BIRTH +
      "You get the fields that suit you, how you work best, the times of year that favour a change, and one practical next step.",
  },
  {
    id: "finance",
    title: "Money",
    to: "/finance",
    group: "Life areas",
    blurb: "Your money habits and timing.",
    tags: ["wealth", "savings", "income"],
    script:
      "This looks at how money tends to come and go for you and when the easier stretches are. " +
      NEEDS_BIRTH +
      "It never promises money. It only shows habits and timing, so you can plan calmly.",
  },
  {
    id: "health",
    title: "Health",
    to: "/health",
    group: "Life areas",
    blurb: "Gentle care ideas, not medicine.",
    tags: ["body", "wellness"],
    script:
      "This points to the parts of your body your chart says to look after, and simple habits that help. " +
      NEEDS_BIRTH +
      "It is not a doctor and never gives a diagnosis. For anything that worries you, please see a real doctor.",
  },
  {
    id: "ayurveda",
    title: "Ayurveda",
    to: "/ayurveda",
    group: "Life areas",
    blurb: "Your body type and simple routines.",
    tags: ["dosha", "vata", "pitta", "kapha"],
    script:
      "Ayurveda sorts people into a few body types. " +
      NEEDS_BIRTH +
      "You get your type in plain words, with food, sleep and exercise ideas that suit it. " +
      "Pick one small change and keep it for a few weeks.",
  },
  {
    id: "numerology",
    title: "Numerology",
    to: "/numerology",
    group: "Life areas",
    blurb: "Your numbers from your name and birthday.",
    tags: ["life path", "lo shu", "numbers", "destiny"],
    script:
      "Numerology turns your name and your birthday into a few key numbers. " +
      "Type your full name as it is written, and your birth date. " +
      "The full report opens first: your main numbers, what you are good at, what is hard, and what this year, month and day feel like. " +
      "There are more tabs for your grid, your name and matching two people. " +
      "You do not need any maths. The app does all of it.",
  },
  {
    id: "baby-names",
    title: "Baby names",
    to: "/baby-names",
    group: "Life areas",
    blurb: "Names that suit a child's star.",
    tags: ["child", "naming", "newborn"],
    script:
      "This helps you choose a name for a baby. " +
      "Put in the baby's birth date, birth time and city. " +
      "The app finds the baby's star, then suggests names that match, with meanings, so you can pick one you love.",
  },
  {
    id: "dharma",
    title: "Life purpose",
    to: "/dharma",
    group: "Life areas",
    blurb: "What you are here to do.",
    tags: ["purpose", "meaning", "dharma"],
    script:
      "This looks at your chart for the thread that runs through your life: the thing you keep coming back to. " +
      NEEDS_BIRTH +
      "It is written as encouragement, not as a rule, with one small way to lean into it this month.",
  },
  {
    id: "karma",
    title: "Karma",
    to: "/karma",
    group: "Life areas",
    blurb: "Old patterns and how to soften them.",
    tags: ["past life", "lessons"],
    script:
      "This talks about patterns that keep repeating and what usually helps them settle. " +
      NEEDS_BIRTH +
      "Read it kindly. Nothing here is a punishment, only a habit that can change.",
  },

  // -------------------------------------------------------------- Remedies
  {
    id: "remedies",
    title: "Remedies",
    to: "/remedies",
    group: "Calm and remedies",
    blurb: "Simple, gentle things you can do.",
    tags: ["upay", "mantra", "gem", "colour"],
    script:
      "Remedies are small, kind actions, like a habit, a colour, a chant or a charity. " +
      NEEDS_BIRTH +
      "Pick only one or two that feel easy and do them for a few weeks. Nothing here needs money or hard work.",
  },
  {
    id: "meditation",
    title: "Meditation",
    to: "/meditation",
    group: "Calm and remedies",
    blurb: "Short guided calm.",
    tags: ["breathe", "relax", "calm"],
    script:
      "This is a short, guided quiet time. " +
      "Choose how many minutes you have, press start, and follow the voice. " +
      "If your mind wanders, that is normal. Just come back to the breathing.",
  },
  {
    id: "chakra",
    title: "Chakras",
    to: "/chakra",
    group: "Calm and remedies",
    blurb: "Your energy centres, made simple.",
    tags: ["energy", "balance"],
    script:
      "Chakras are seven energy points people picture along the body, from the base to the top of the head. " +
      NEEDS_BIRTH +
      "The app shows which ones feel strong for you and which want attention, with one easy practice for each.",
  },
  {
    id: "yantra",
    title: "Yantra",
    to: "/yantra",
    group: "Calm and remedies",
    blurb: "A picture to focus on.",
    tags: ["symbol", "focus"],
    script:
      "A yantra is a simple pattern people look at while they sit quietly. " +
      "Choose the one the app suggests for you, look at the centre, and breathe slowly for a few minutes. " +
      "That is all there is to it.",
  },
  {
    id: "vastu",
    title: "Vastu",
    to: "/vastu",
    group: "Calm and remedies",
    blurb: "Simple ideas for your home.",
    tags: ["house", "direction", "home"],
    script:
      "Vastu is about how a home is arranged. " +
      "Tell the app which way your main door faces and pick the room you want help with. " +
      "You get easy, no cost ideas, like where to keep light, air and clutter. " +
      "Never break walls for this. Small changes are enough.",
  },
  {
    id: "kaalsarp",
    title: "Kaal Sarp",
    to: "/kaalsarp",
    group: "Calm and remedies",
    blurb: "Checks one much talked about pattern.",
    tags: ["dosha", "snake"],
    script:
      "Kaal Sarp is a chart pattern people worry about far more than they need to. " +
      NEEDS_BIRTH +
      "The app tells you plainly whether it is there, how strong it is, and the gentle things that help. " +
      "Even when it is present, it is not a curse.",
  },
  {
    id: "mangal-dosha",
    title: "Mangal Dosha",
    to: "/mangal-dosha",
    group: "Calm and remedies",
    blurb: "The marriage worry, checked honestly.",
    tags: ["manglik", "marriage"],
    script:
      "Manglik, or Mangal Dosha, is often mentioned before a marriage. " +
      NEEDS_BIRTH +
      "The app checks it properly, says how strong it really is, whether it cancels out, and what usually helps. " +
      "Most of the time it matters far less than people say.",
  },
  {
    id: "sadesati",
    title: "Sade Sati",
    to: "/sadesati",
    group: "Calm and remedies",
    blurb: "Saturn's seven and a half years.",
    tags: ["saturn", "shani", "hard time"],
    script:
      "Sade Sati is a long stretch when Saturn walks past your moon. " +
      NEEDS_BIRTH +
      "The app shows whether you are in it, which part you are in, and when it ends. " +
      "It is a slow, tiring time, not a disaster, and steady habits carry you through it.",
  },

  // ----------------------------------------------------------- Your things
  {
    id: "history",
    title: "History",
    to: "/history",
    group: "Your things",
    blurb: "Find anything you did before.",
    tags: ["past", "recent"],
    script:
      "Everything you make is kept for you. " +
      "History shows your past readings and charts, newest first. " +
      "Tap any item to open it again exactly as it was.",
  },
  {
    id: "saved",
    title: "Saved charts",
    to: "/saved",
    group: "Your things",
    blurb: "Charts you kept for later.",
    tags: ["library", "keep"],
    script:
      "When you make a chart you like, save it and it lands here. " +
      "You can keep charts for your family too, and open any of them again without typing the details.",
  },
  {
    id: "bookmarks",
    title: "Bookmarks",
    to: "/bookmarks",
    group: "Your things",
    blurb: "Lines you wanted to remember.",
    tags: ["favourites", "star"],
    script:
      "Whenever a line in a reading feels important, bookmark it. " +
      "They all collect here so you can come back and read them together later.",
  },
  {
    id: "journal",
    title: "Journal",
    to: "/journal",
    group: "Your things",
    blurb: "Write down how a day felt.",
    tags: ["diary", "notes"],
    script:
      "The journal is your own private notebook inside the app. " +
      "Write a few lines about your day or a reading you had. " +
      "Over time you can look back and see your own patterns, which is often more useful than any prediction.",
  },
  {
    id: "reports",
    title: "Reports",
    to: "/reports",
    group: "Your things",
    blurb: "One full write up you can keep.",
    tags: ["pdf", "download", "print"],
    script:
      "A report gathers everything into one long, easy write up you can save or print. " +
      NEEDS_BIRTH +
      "Choose the kind of report and press the button. When it is ready you can download it and read it later, even without the internet.",
  },
  {
    id: "profile",
    title: "Your account",
    to: "/profile",
    group: "Your things",
    blurb: "Your name, email and access.",
    tags: ["account", "login", "subscription"],
    script:
      "This is your account page. " +
      "You can see the name and email you signed up with, and what your access includes. " +
      "You can also sign out from here.",
  },
  {
    id: "faq",
    title: "Common questions",
    to: "/faq",
    group: "Your things",
    blurb: "Short answers to what people ask most.",
    tags: ["questions", "support"],
    script:
      "This page answers the questions people ask most often, in a line or two each. " +
      "If your question is not there, open the AI guide and just ask it.",
  },
];

export function guideById(id: string): HelpGuide | undefined {
  return HELP_GUIDES.find((g) => g.id === id);
}

export function helpGroups(): string[] {
  return Array.from(new Set(HELP_GUIDES.map((g) => g.group)));
}

/** Search titles, blurbs, groups and extra words with one plain needle. */
export function searchGuides(query: string): HelpGuide[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return HELP_GUIDES;
  return HELP_GUIDES.filter((g) =>
    `${g.title} ${g.blurb} ${g.group} ${(g.tags ?? []).join(" ")}`.toLowerCase().includes(needle),
  );
}
