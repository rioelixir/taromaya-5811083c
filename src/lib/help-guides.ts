/**
 * Spoken help guides — one short, ELI10 script per module.
 * Used by the Help page (text on screen) and by the audio route (voice).
 * Keep every script plain: no symbols, no jargon, no numbers spelled oddly.
 */

export type HelpGuide = {
  id: string;
  title: string;
  to: string;
  group: string;
  /** One line the reader sees on the card. */
  blurb: string;
  /** What the voice reads out. Short, friendly, step by step. */
  script: string;
};

export const HELP_GUIDES: HelpGuide[] = [
  {
    id: "start",
    title: "Getting started",
    to: "/",
    group: "Start here",
    blurb: "How the whole app works, in one minute.",
    script:
      "Welcome to Taromaya. Think of this app as a friendly guide book about you. " +
      "The home page has big buttons for the things people use most. " +
      "The menu button in the corner opens every section. " +
      "Most sections need three things: your birth date, your birth time, and the city where you were born. " +
      "Save those once in Birth Details and every section will fill them in for you. " +
      "If you do not like typing, tap the microphone card at the top of a section and simply say your details out loud. " +
      "Take your time. Nothing here can break.",
  },
  {
    id: "voice",
    title: "Using your voice",
    to: "/",
    group: "Start here",
    blurb: "Talk instead of typing.",
    script:
      "You can talk to this app instead of typing. " +
      "At the top of most sections you will see a big round microphone. Tap it once. " +
      "When it turns red, it is listening. Say everything in one go, like this: " +
      "my name is Ria, I was born on the eighteenth of August nineteen ninety five, at four thirty five in the evening, in Delhi. " +
      "Then just stop talking. It notices the quiet and closes by itself. " +
      "The boxes below fill in for you, and you can always check and correct them. " +
      "If it did not hear you well, tap Say it again and speak a little slower.",
  },
  {
    id: "birth-details",
    title: "Birth details",
    to: "/birth-details",
    group: "Start here",
    blurb: "Save your details once, use them everywhere.",
    script:
      "This is the one place where you save your birth information. " +
      "Put in your name, the day you were born, the time on the clock when you were born, and the city. " +
      "The city box searches the whole world, so start typing and pick your city from the list. " +
      "Once you save, every other section fills itself in, so you never type this again. " +
      "If you are not sure of your birth time, put your best guess. You can change it any time.",
  },
  {
    id: "tarot",
    title: "Tarot board",
    to: "/tarot",
    group: "Tarot",
    blurb: "Pick a deck, drag cards, ask for a reading.",
    script:
      "The tarot board is a table where you lay out cards. " +
      "First choose a deck from the row of decks. " +
      "Then pick a card from the pile and drag it onto the board with your finger or mouse. " +
      "Place as many cards as you like. " +
      "Tap a card once to make it bigger, and tap the dark area around it to close it again. " +
      "When your cards are ready, press Ask AI. It looks at your cards and tells you one simple story about them. " +
      "There is also a Nakshatra panel on the side that shows the star of this moment and this place, and you can drag that card onto the board too.",
  },
  {
    id: "ai",
    title: "AI guide",
    to: "/ai",
    group: "Tarot",
    blurb: "Ask any question in your own words.",
    script:
      "This is a friendly helper you can ask anything. " +
      "Type or say your question the same way you would ask a friend, for example: how will this month go for my work. " +
      "The answer comes back in plain words, in short pieces, so it is easy to follow. " +
      "You can keep asking follow up questions in the same chat.",
  },
  {
    id: "kundli",
    title: "Kundli",
    to: "/kundli",
    group: "Astrology",
    blurb: "Your birth chart, explained simply.",
    script:
      "A kundli is a picture of the sky at the exact moment you were born. " +
      "Give your birth date, your birth time and your city, then press the button to make the chart. " +
      "You will see a chart picture, a list of planets with the sign they sit in, and simple notes under each part. " +
      "The signs are shown as numbers from one to twelve, so you do not need to learn any names. " +
      "Scroll down for your life periods and for the sky today compared with your chart.",
  },
  {
    id: "astrology",
    title: "Astrology",
    to: "/astrology",
    group: "Astrology",
    blurb: "Signs, planets and plain meanings.",
    script:
      "This section shows where each planet was when you were born and what that usually means for daily life. " +
      "Fill in your birth details and press the button. " +
      "Read one line at a time. Each line is written the way you would explain it to a child.",
  },
  {
    id: "panchang",
    title: "Panchang",
    to: "/panchang",
    group: "Astrology",
    blurb: "Today's sky almanac for your city.",
    script:
      "Panchang is a daily calendar of the sky. " +
      "Choose your city and a date. " +
      "It tells you when the sun rises and sets, which moon day it is, which star the moon is sitting in, and which parts of the day are good or better avoided. " +
      "Use it when you want to pick a good time for something small, like starting a new habit.",
  },
  {
    id: "muhurat",
    title: "Muhurat",
    to: "/muhurat",
    group: "Astrology",
    blurb: "Find a good time to begin something.",
    script:
      "Muhurat means a good moment to start something important, like signing papers or travelling. " +
      "Pick your city, pick the day, and choose what you want to do. " +
      "The app shows the friendly windows of time and the ones to skip, with a short reason for each.",
  },
  {
    id: "nakshatra",
    title: "Nakshatra",
    to: "/nakshatra",
    group: "Astrology",
    blurb: "Your birth star and what it says about you.",
    script:
      "The sky is split into twenty seven small star groups called nakshatras. " +
      "The one the moon was in when you were born is your birth star. " +
      "Give your birth details and the app finds it for you, then explains your nature, your strengths and what helps you, in easy words.",
  },
  {
    id: "nakshatra-location",
    title: "Nakshatra for a place",
    to: "/nakshatra-location",
    group: "Astrology",
    blurb: "The star of a city, right now.",
    script:
      "This tells you which star the moon is sitting in for a chosen city at a chosen time. " +
      "Type the city, pick the time, and read the short note. " +
      "It is useful when you want to know the mood of a place before a trip or a meeting.",
  },
  {
    id: "transits",
    title: "Transits",
    to: "/transits",
    group: "Sky",
    blurb: "What the sky is doing to your chart now.",
    script:
      "Transits show where the planets are moving today and how they touch your own chart. " +
      "Fill in your birth details and look at the list. " +
      "Each line says which planet is passing, what it usually stirs up, and roughly how long it lasts. " +
      "Slow planets matter more, so start from the top.",
  },
  {
    id: "timeline",
    title: "Timeline",
    to: "/timeline",
    group: "Sky",
    blurb: "Your months ahead at a glance.",
    script:
      "The timeline lays your coming months out in a row so you can see busy patches and calm patches. " +
      "Fill in your birth details, then read the bars from left to right. " +
      "Tap any bar to read what it is about.",
  },
  {
    id: "horoscope",
    title: "Horoscope",
    to: "/horoscope",
    group: "Life",
    blurb: "Your day, week and month.",
    script:
      "This gives you a short reading for today, this week and this month. " +
      "Fill in your birth details once and come back whenever you like. " +
      "Read it as gentle weather for your mood, not as a rule.",
  },
  {
    id: "compatibility",
    title: "Match making",
    to: "/compatibility",
    group: "Life",
    blurb: "How two people fit together.",
    script:
      "Match making compares two birth charts. " +
      "Put in the birth details of the first person, then of the second person, and press the button. " +
      "You get a friendliness score, then simple notes on how the two get along in feelings, in habits and in daily life, plus what can help where they clash.",
  },
  {
    id: "numerology",
    title: "Numerology",
    to: "/numerology",
    group: "Life",
    blurb: "Your numbers from your name and birthday.",
    script:
      "Numerology turns your name and your birthday into a few key numbers. " +
      "Type your full name as it is written, and your birth date. " +
      "You then see your life path number, your destiny number and a few more, each with a short meaning and a personal year, month and day. " +
      "You do not need any maths. The app does all of it.",
  },
  {
    id: "baby-names",
    title: "Baby names",
    to: "/baby-names",
    group: "Life",
    blurb: "Names that suit a child's star.",
    script:
      "This helps you choose a name for a baby. " +
      "Put in the baby's birth date, birth time and city. " +
      "The app finds the baby's star, then suggests names that match, with meanings, so you can pick one you love.",
  },
  {
    id: "remedies",
    title: "Remedies",
    to: "/remedies",
    group: "Life",
    blurb: "Simple, gentle things you can do.",
    script:
      "Remedies are small, kind actions, like a habit, a colour, a chant or a charity. " +
      "Fill in your birth details and read the list. " +
      "Pick only one or two that feel easy, and do them for a few weeks. Nothing here needs money or hard work.",
  },
  {
    id: "reports",
    title: "Reports",
    to: "/reports",
    group: "Life",
    blurb: "One full write up you can keep.",
    script:
      "A report gathers everything into one long, easy write up you can save or print. " +
      "Fill in your birth details, choose the kind of report, and press the button. " +
      "When it is ready you can download it and read it later, even without the internet.",
  },
  {
    id: "festivals",
    title: "Festivals",
    to: "/festivals",
    group: "Life",
    blurb: "Dates for your city.",
    script:
      "This shows festival dates worked out for your own city, because they can shift by a day from place to place. " +
      "Choose your city and a year, then scroll the list. Each entry has a short line about what the day is for.",
  },
  {
    id: "dreams",
    title: "Dream oracle",
    to: "/dreams",
    group: "Life",
    blurb: "Tell a dream, get a plain reading.",
    script:
      "Had a dream you keep thinking about? " +
      "Tap the microphone and describe it out loud, or type it, then press the button. " +
      "You get a calm, simple reading of what your mind may be chewing on, with one small suggestion.",
  },
  {
    id: "history",
    title: "History and saved work",
    to: "/history",
    group: "Your things",
    blurb: "Find anything you did before.",
    script:
      "Everything you make is kept for you. " +
      "History shows your past readings and charts, newest first. " +
      "Tap any item to open it again exactly as it was. " +
      "Saved charts and bookmarks live nearby in the menu, under Library.",
  },
  {
    id: "settings",
    title: "Settings and language",
    to: "/settings",
    group: "Your things",
    blurb: "Change your language and how things look.",
    script:
      "In settings you can change your language, and the app will speak and write in it. " +
      "There are more than thirty languages, including many Indian ones. " +
      "You can also pick a language quickly from the small language button at the top of any page.",
  },
];

export function guideById(id: string): HelpGuide | undefined {
  return HELP_GUIDES.find((g) => g.id === id);
}

export function helpGroups(): string[] {
  return Array.from(new Set(HELP_GUIDES.map((g) => g.group)));
}
