// Drilldown knowledge base for every number / aspect shown in the advanced
// tables. Tapping a value anywhere in the app opens the same explanation, so
// the wording can never drift between two pages.
//
// Every entry has four layers:
//   beginner     — one plain sentence a 10-year-old can read
//   intermediate — what it is used for in a reading
//   advanced     — the classical / astronomical detail
//   formula      — the exact calculation the engine runs (no hidden steps)
//   inputs       — which of your details change this number

export type ExplainEntry = {
  key: string;
  term: string;
  beginner: string;
  intermediate: string;
  advanced: string;
  formula: string;
  inputs: string[];
};

const E = (e: ExplainEntry) => e;

export const EXPLAIN_TERMS: Record<string, ExplainEntry> = Object.fromEntries(
  [
    // ---------------- Panchang: the five limbs ----------------
    E({
      key: "tithi",
      term: "Tithi (Moon day)",
      beginner: "A Tithi is one Moon day. The Moon walks away from the Sun a little every day, and each step is one Tithi.",
      intermediate: "Tithi sets the mood of the day and decides many festival and fasting dates. Tithi 1 to 15 is the bright half, 16 to 30 the dark half.",
      advanced: "Tithi is the elongation of the Moon from the Sun in 12 degree slabs. Paksha is Shukla while the Moon is gaining light and Krishna while it is losing light. A Tithi can be skipped or repeated on a date because its length swings between about 19 and 26 hours.",
      formula: "elongation = (Moon sidereal longitude − Sun sidereal longitude) mod 360; tithi number = floor(elongation / 12) + 1; paksha = Shukla when tithi ≤ 15 else Krishna.",
      inputs: ["Date", "Clock time of the reading", "Place (only through sunrise, which decides which Vedic day it is)"],
    }),
    E({
      key: "nakshatra",
      term: "Nakshatra (Moon's star)",
      beginner: "The sky is cut into 27 star houses. The Nakshatra is the star house the Moon is standing in.",
      intermediate: "Your birth Nakshatra is used for your name letter, your Dasha timeline, matching, and daily good or bad windows.",
      advanced: "27 equal sidereal arcs of 13 degrees 20 minutes each, measured from the Lahiri (Chitrapaksha) zero point. Each is split into 4 padas of 3 degrees 20 minutes which map to the divisional chart signs.",
      formula: "nakshatra index = floor(Moon sidereal longitude / 13.3333); pada = floor((longitude mod 13.3333) / 3.3333) + 1.",
      inputs: ["Date", "Exact time (the Moon moves about 1 star every 22 hours)", "Ayanamsa epoch (fixed to Lahiri)"],
    }),
    E({
      key: "yoga",
      term: "Yoga (Sun + Moon)",
      beginner: "Yoga adds the Sun's place and the Moon's place together. It tells you if the day feels smooth or bumpy.",
      intermediate: "27 Yogas repeat in order. Some, like Vishkumbha or Vyaghata, ask for extra care with big decisions.",
      advanced: "Nitya Yoga is the sum of the two sidereal longitudes divided into 27 arcs of 13 degrees 20 minutes, unrelated to the planetary Yogas of a birth chart.",
      formula: "yoga index = floor(((Sun longitude + Moon longitude) mod 360) / 13.3333).",
      inputs: ["Date", "Exact time"],
    }),
    E({
      key: "karana",
      term: "Karana (half Moon day)",
      beginner: "Cut a Moon day in half and each half is a Karana. There are 60 halves in a Moon month.",
      intermediate: "The Karana called Vishti (Bhadra) is the one people postpone weddings and launches for.",
      advanced: "11 Karanas cycle through the 60 half-Tithis: 4 fixed ones anchor the cycle and 7 movable ones repeat 8 times.",
      formula: "karana index = floor(elongation / 6) mod 60, then mapped onto the 11 classical names.",
      inputs: ["Date", "Exact time"],
    }),
    E({
      key: "paksha",
      term: "Paksha (Moon half)",
      beginner: "Two halves of a Moon month: one where the Moon grows brighter, one where it fades.",
      intermediate: "Shukla (growing) suits new starts, Krishna (fading) suits finishing and clearing.",
      advanced: "Shukla runs from New Moon to Full Moon, Krishna from Full Moon back to New Moon.",
      formula: "Shukla when tithi number ≤ 15, Krishna when 16 to 30.",
      inputs: ["Date", "Exact time"],
    }),
    E({
      key: "moon-age",
      term: "Moon age (days)",
      beginner: "How many days it has been since the last New Moon.",
      intermediate: "A quick way to guess the Moon's shape tonight without any chart.",
      advanced: "Synodic age, counted from the exact New Moon instant, not from a calendar date.",
      formula: "moon age = (now − last New Moon instant) in days, from the searched conjunction of Sun and Moon.",
      inputs: ["Date", "Exact time"],
    }),

    // ---------------- Panchang: timings ----------------
    E({
      key: "sunrise",
      term: "Sunrise",
      beginner: "The moment the top edge of the Sun peeks over the horizon at your place.",
      intermediate: "Almost every Vedic timing on the page is measured from sunrise, not from midnight.",
      advanced: "Geometric rise corrected for the standard 34 arcminutes of atmospheric refraction plus the Sun's semi-diameter, at sea level.",
      formula: "Rise search for the Sun's upper limb at altitude −0.833 degrees for your latitude and longitude.",
      inputs: ["Date", "Place (latitude and longitude)"],
    }),
    E({
      key: "rahu-kaal",
      term: "Rahu Kaal",
      beginner: "A window each day that people skip for new starts. Nothing bad has to happen, it is just avoided.",
      intermediate: "It moves with the weekday, so the same clock time is fine on another day.",
      advanced: "The day from sunrise to sunset is split into 8 equal parts and one part is assigned to Rahu by weekday, in the classical order 8, 2, 7, 5, 6, 4, 3.",
      formula: "part length = (sunset − sunrise) / 8; Rahu Kaal = part number for that weekday.",
      inputs: ["Date", "Weekday", "Place (day length)"],
    }),
    E({
      key: "abhijit",
      term: "Abhijit Muhurat",
      beginner: "A short lucky window right around midday.",
      intermediate: "Good for starting something when nothing else on the day looks clean. Traditionally skipped on Wednesdays.",
      advanced: "The 8th of the 15 muhurats of the day, centred on true solar noon rather than clock noon.",
      formula: "muhurat length = (sunset − sunrise) / 15; Abhijit = solar noon ± (length / 2), with solar noon from the Sun's hour-angle crossing zero.",
      inputs: ["Date", "Place (solar noon shifts with longitude)"],
    }),
    E({
      key: "chaughadiya",
      term: "Chaughadiya",
      beginner: "The day and the night are each cut into 8 small windows, and each one has a name and a mood.",
      intermediate: "Amrit, Shubh and Labh are the friendly ones. Rog, Kaal and Udveg are the ones most people skip.",
      advanced: "Each window is ruled by a planet following the weekday-lord order, so day and night sequences start from different lords.",
      formula: "day window = (sunset − sunrise) / 8, night window = (next sunrise − sunset) / 8; names rotate from the weekday lord.",
      inputs: ["Date", "Weekday", "Place"],
    }),
    E({
      key: "hora",
      term: "Hora (planet hour)",
      beginner: "Every hour of the day is looked after by one planet. Pick the hour that fits your job.",
      intermediate: "24 Horas run sunrise to sunrise, starting with the weekday's own planet.",
      advanced: "Unequal Horas: the 12 daytime Horas share the day length and the 12 night Horas share the night length, following the Chaldean order.",
      formula: "day hora = (sunset − sunrise) / 12, night hora = (next sunrise − sunset) / 12; lords follow Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon repeating from the weekday lord.",
      inputs: ["Date", "Weekday", "Place"],
    }),
    E({
      key: "panchaka",
      term: "Panchaka",
      beginner: "A 5-star stretch when some jobs, like building a roof or travelling, are traditionally put off.",
      intermediate: "The type of Panchaka (Mrityu, Agni, Raja, Chora, Roga) tells which kind of job to postpone.",
      advanced: "Counted from the last 5 nakshatras Dhanishta to Revati, combined with the weekday to name the type.",
      formula: "Panchaka active when nakshatra ∈ {Dhanishta, Shatabhisha, Purva Bhadrapada, Uttara Bhadrapada, Revati}; type from the weekday.",
      inputs: ["Date", "Weekday", "Exact time (the star can change mid-day)"],
    }),
    E({
      key: "bhadra",
      term: "Bhadra / Vishti",
      beginner: "A short window inside a Moon day that people keep away from for weddings and launches.",
      intermediate: "If it is running, shift the ceremony rather than the whole date.",
      advanced: "Vishti is the 7th movable Karana, and its effect is split between the day and night halves in classical texts.",
      formula: "Bhadra active when the current karana name is Vishti.",
      inputs: ["Date", "Exact time"],
    }),

    // ---------------- Kundli / chart ----------------
    E({
      key: "ascendant",
      term: "Ascendant (Lagna)",
      beginner: "The sign that was climbing over the eastern horizon at the exact minute you were born.",
      intermediate: "It sets your first house and therefore where every other planet sits in your chart.",
      advanced: "Sidereal Lagna: the ecliptic point on the eastern horizon, from local apparent sidereal time and true obliquity, minus the Lahiri ayanamsa.",
      formula: "Asc = atan2(cos H, −(sin ε · tan φ + cos ε · sin H)) with H = local apparent sidereal time, φ = latitude, ε = true obliquity; then subtract ayanamsa.",
      inputs: ["Birth date", "Birth time to the minute", "Birth place (latitude and longitude)"],
    }),
    E({
      key: "house",
      term: "House (bhava)",
      beginner: "Twelve rooms of life: money, family, work, and so on. Planets sit in these rooms.",
      intermediate: "This app uses whole-sign houses, the classical Vedic default, so one sign is one house.",
      advanced: "House 1 is the Lagna sign and the rest follow in zodiac order. Cusp-based systems can move a planet by one house near a sign edge.",
      formula: "house of a planet = ((planet sign − Lagna sign) mod 12) + 1.",
      inputs: ["Birth time", "Birth place", "House system (fixed to whole sign)"],
    }),
    E({
      key: "retrograde",
      term: "Retrograde",
      beginner: "The planet looks like it is walking backwards in the sky. It is an illusion from Earth moving.",
      intermediate: "A retrograde planet often works slower or turns its effects inward.",
      advanced: "Apparent geocentric motion reversal between the stations; the Sun and Moon are never retrograde, Rahu and Ketu are always counted as retrograde.",
      formula: "retrograde when the geocentric ecliptic longitude one hour later is less than the current one.",
      inputs: ["Date", "Exact time"],
    }),
    E({
      key: "ayanamsa",
      term: "Ayanamsa",
      beginner: "A small shift that turns the Western sky picture into the Indian one.",
      intermediate: "It is why your Sun sign can be one sign earlier in a Vedic chart than in a magazine horoscope.",
      advanced: "Lahiri (Chitrapaksha) ayanamsa, the angle between the tropical equinox and the fixed sidereal zero point, growing about 50.3 arcseconds a year.",
      formula: "sidereal longitude = tropical longitude − ayanamsa(date).",
      inputs: ["Date only"],
    }),
    E({
      key: "vimshottari",
      term: "Vimshottari Dasha",
      beginner: "A life timetable. Each planet gets a turn to run your story for a set number of years.",
      intermediate: "Your first period is decided by how far the Moon had already walked into its star at birth.",
      advanced: "120-year cycle: Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7, Rahu 18, Jupiter 16, Saturn 19, Mercury 17 years, sub-periods carved in the same proportion.",
      formula: "balance of the first Mahadasha = lord years × (1 − (Moon longitude mod 13.3333) / 13.3333).",
      inputs: ["Birth date", "Birth time to the minute", "Birth place"],
    }),
    E({
      key: "varga",
      term: "Divisional chart (Varga)",
      beginner: "A zoom-in on one part of life, made by chopping every sign into equal slices.",
      intermediate: "D9 (Navamsa) is read for marriage and inner strength, D10 for career.",
      advanced: "Parashara BPHS mapping rules per Varga; the slice a planet lands in becomes its sign in that chart.",
      formula: "Dn slice = floor((degree in sign) / (30 / n)), then the classical Dn rule maps the slice to a sign.",
      inputs: ["Birth date", "Birth time", "Birth place"],
    }),
    E({
      key: "shadbala",
      term: "Shadbala (planet strength)",
      beginner: "A score out of six kinds of strength that says how loud a planet speaks in your chart.",
      intermediate: "A strong planet delivers its promise more clearly, a weak one needs support.",
      advanced: "Sthana, Dig, Kala, Chesta, Naisargika and Drik Bala summed in Virupas, then compared to the classical minimum for each planet.",
      formula: "total Rupas = (sum of the six Balas in Virupas) / 60; strong when total ≥ the planet's classical requirement.",
      inputs: ["Birth date", "Birth time", "Birth place (day/night and hour strength both depend on it)"],
    }),

    // ---------------- Transits and aspects ----------------
    E({
      key: "aspect",
      term: "Aspect",
      beginner: "Two planets standing at a special angle, like two people close enough to talk.",
      intermediate: "Conjunction and opposition are the loudest, trine and sextile the easiest, square the most pushy.",
      advanced: "Angle families: 0, 60, 90, 120, 180 degrees, each with an orb that widens for the Sun and Moon.",
      formula: "separation = shortest arc between the two longitudes; aspect hits when |separation − exact angle| ≤ orb.",
      inputs: ["Both dates and times involved", "Place (only for house-based readings)"],
    }),
    E({
      key: "orb",
      term: "Orb",
      beginner: "How much wobble is allowed before two planets stop talking.",
      intermediate: "A tight orb means the effect is sharp and dated, a wide one means a long background mood.",
      advanced: "Orbs shrink with planet speed and aspect order; near the edge an aspect can appear or vanish with a few minutes of birth-time change.",
      formula: "in orb when |separation − exact angle| ≤ allowed orb in degrees.",
      inputs: ["Exact times of both charts"],
    }),
    E({
      key: "transit",
      term: "Transit",
      beginner: "Where a planet is in the sky right now, compared with where it was when you were born.",
      intermediate: "Slow planets like Saturn and Jupiter mark the big chapters, fast ones colour the day.",
      advanced: "The transit chart is the same engine run for the current instant, then compared to natal points by aspect and by house.",
      formula: "transit house = ((transit planet sign − natal Lagna sign) mod 12) + 1, aspects as above.",
      inputs: ["Your birth details", "The current date and time", "Your current place for house overlays"],
    }),
    E({
      key: "sade-sati",
      term: "Sade Sati",
      beginner: "The long stretch when Saturn walks past your Moon's sign and the two next door.",
      intermediate: "It is a slow lesson period, not a punishment, and it comes to everyone.",
      advanced: "Saturn through the 12th, 1st and 2nd from the natal Moon sign, roughly 7.5 years, with retrograde re-entries counted.",
      formula: "active when Saturn's sidereal sign ∈ {Moon sign − 1, Moon sign, Moon sign + 1} (mod 12).",
      inputs: ["Birth date and time (for the Moon sign)", "Current date"],
    }),

    // ---------------- Numerology ----------------
    E({
      key: "life-path",
      term: "Life Path number",
      beginner: "Add up all the numbers in your birthday until one digit is left. That is your main road.",
      intermediate: "It describes the lesson you keep meeting, whatever job or city you are in.",
      advanced: "Master numbers 11, 22 and 33 are kept as they are instead of being reduced.",
      formula: "reduce(day) + reduce(month) + reduce(year), reduced again to 1–9 unless the result is 11, 22 or 33.",
      inputs: ["Birth date only (time and place do not change it)"],
    }),
    E({
      key: "destiny",
      term: "Destiny / Expression number",
      beginner: "Turn every letter of your full birth name into a number and add them up.",
      intermediate: "It shows the talent you are here to use in public.",
      advanced: "Pythagorean A=1 to I=9 mapping across the full name exactly as first recorded.",
      formula: "sum of letter values of the full birth name, reduced to 1–9 or a master number.",
      inputs: ["Full birth name spelling"],
    }),
    E({
      key: "soul-urge",
      term: "Soul Urge number",
      beginner: "Add up only the vowels in your name. This is what your heart quietly wants.",
      intermediate: "It explains the private wish behind your choices.",
      advanced: "Y counts as a vowel only when it carries the vowel sound in a syllable with no other vowel.",
      formula: "sum of vowel values in the full birth name, reduced to 1–9 or a master number.",
      inputs: ["Full birth name spelling"],
    }),
    E({
      key: "karmic-debt",
      term: "Karmic debt number",
      beginner: "If a total lands on 13, 14, 16 or 19 before reducing, it is called a karmic debt.",
      intermediate: "It points to an old habit to clean up, not a curse.",
      advanced: "Checked on every core total before reduction, so it can be present in one number and absent in another.",
      formula: "flag when any unreduced core total ∈ {13, 14, 16, 19}.",
      inputs: ["Birth date", "Full birth name"],
    }),
    E({
      key: "loshu",
      term: "Lo Shu grid",
      beginner: "A 3 by 3 box. Write your birthday digits inside and see which boxes are empty.",
      intermediate: "Full lines are strengths, empty boxes are the skills to practise.",
      advanced: "Digits of the full date of birth placed in the classical magic-square positions; complete rows, columns and diagonals become arrows.",
      formula: "count of each digit 1–9 in the birth date, then arrow when all three cells of a line are non-empty.",
      inputs: ["Birth date only"],
    }),
    E({
      key: "mulank",
      term: "Mulank (driver)",
      beginner: "Just your birth day number, added down to one digit.",
      intermediate: "It shows how you behave day to day.",
      advanced: "Vedic driver number, read together with Bhagyank for planetary friendship.",
      formula: "reduce(day of birth) to 1–9.",
      inputs: ["Birth date only"],
    }),
    E({
      key: "bhagyank",
      term: "Bhagyank (destiny)",
      beginner: "Add the whole date, month and year down to one digit.",
      intermediate: "It shows the direction life keeps pulling you toward.",
      advanced: "Vedic destiny number; conflicts with the Mulank planet are read as inner friction.",
      formula: "reduce(day + month + year) to 1–9.",
      inputs: ["Birth date only"],
    }),
  ].map((e) => [e.key, e]),
);

export function explainTerm(key: string): ExplainEntry | undefined {
  return EXPLAIN_TERMS[key];
}

export const EXPLAIN_KEYS = Object.keys(EXPLAIN_TERMS);
