// Per-module calculation transparency.
//
// Every module (except the Tarot board, which is a free-form spread surface)
// declares the exact chain of steps its numbers come from: which inputs are
// read, which reference frame or table is applied, and which formula produces
// the final figure. The UI renders this verbatim so the working shown to a
// client never drifts from the engine.

export type CalculationSpec = {
  /** One-line description of the method family. */
  method: string;
  /** Inputs the module actually consumes. */
  inputs: string[];
  /** Ordered working, from raw input to final figure. */
  steps: string[];
  /** Key formulas, written in plain notation. */
  formulas?: string[];
  /** Reference the method is taken from. */
  reference?: string;
};

const SIDEREAL_BASE: string[] = [
  "Convert the local birth clock time to Universal Time using the time zone of the birth place on that date, including any historical daylight rule.",
  "Convert Universal Time to Julian Day, then to Terrestrial Time for the ephemeris call.",
  "Compute geocentric apparent ecliptic longitudes of the Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn and the true lunar nodes.",
  "Subtract the Lahiri (Chitrapaksha) ayanamsa for that instant to obtain sidereal longitudes.",
];

const ASCENDANT_STEPS: string[] = [
  "Compute apparent sidereal time at Greenwich, add the birth longitude to get Local Sidereal Time.",
  "Solve the Ascendant from Local Sidereal Time, the latitude of birth and the true obliquity of the ecliptic.",
  "Assign whole-sign houses: the Ascendant sign becomes house 1 and each following sign becomes the next house.",
];

const NUM_BASE: string[] = [
  "Normalise the name: strip accents, uppercase, drop anything that is not a letter or a space.",
  "Map each letter to its value in the chosen table, then sum per word and for the whole name.",
  "Reduce the sum by repeated digit addition, keeping master numbers 11, 22 and 33 unreduced where the school requires it.",
];

export const CALCULATION_SPECS: Record<string, CalculationSpec> = {
  kundli: {
    method: "Sidereal (Nirayana) birth chart with whole-sign houses.",
    inputs: ["Date of birth", "Time of birth to the minute", "Place of birth (city, country)"],
    steps: [...SIDEREAL_BASE, ...ASCENDANT_STEPS,
      "Derive nakshatra and pada by dividing the sidereal Moon longitude by 13 degrees 20 minutes, then by 3 degrees 20 minutes.",
      "Start Vimshottari dasha from the elapsed portion of the birth nakshatra, scaled across the 120-year cycle.",
    ],
    formulas: [
      "Sidereal longitude = tropical longitude − ayanamsa",
      "Nakshatra index = floor(Moon sidereal longitude ÷ 13.3333) + 1",
      "House number = ((sign of planet − sign of Ascendant + 12) mod 12) + 1",
    ],
    reference: "Brihat Parashara Hora Shastra house and dasha rules; positions from a DE440-grade ephemeris.",
  },
  panchang: {
    method: "Five limbs of the day from real Sun and Moon positions, anchored to local sunrise.",
    inputs: ["Date", "Place (for sunrise, sunset and local day length)"],
    steps: [
      "Compute local sunrise and sunset for sea level with standard refraction.",
      "Compute sidereal Sun and Moon longitudes at the reference instant.",
      "Tithi from the elongation of the Moon from the Sun in 12-degree steps.",
      "Nakshatra from the Moon in 13 degree 20 minute steps; Yoga from the sum of both longitudes in the same step size.",
      "Karana from half-tithi steps; Paksha and lunar month from the elongation and the solar month.",
      "Split sunrise to sunset into the Chaughadiya, Hora, Rahu Kaal and Gulika windows for that weekday.",
    ],
    formulas: [
      "Tithi = floor(((Moon − Sun) mod 360) ÷ 12) + 1",
      "Yoga = floor(((Moon + Sun) mod 360) ÷ 13.3333) + 1",
      "Rahu Kaal = day length ÷ 8, taken at the weekday's fixed slot",
    ],
    reference: "Classical Drik Ganita panchang practice with Lahiri ayanamsa.",
  },
  numerology: {
    method: "Pythagorean, Chaldean, Vedic and Lo Shu charts computed side by side.",
    inputs: ["Full birth name", "Date of birth"],
    steps: [...NUM_BASE,
      "Birth number from the day of the month; destiny number from the full date digit sum.",
      "Soul urge from vowels, personality from consonants, expression from the whole name.",
      "Place each birth digit in the Lo Shu grid to expose repeated and missing numbers.",
      "Build the personal year, month and day cycles from the birth month and day added to the calendar year.",
    ],
    formulas: [
      "Destiny = reduce(day + month + year digits)",
      "Personal year = reduce(birth day + birth month + current year)",
    ],
    reference: "Standard Pythagorean and Chaldean tables; Vedic values from the Kro Panchang letter set.",
  },
  "hebrew and tarot": {
    method: "Gematria of the name mapped onto the 22 paths of the Tree of Life and their Major Arcana cards.",
    inputs: ["Full name in Latin letters"],
    steps: [
      "Normalise the name and match the digraphs SH, CH, TZ and TH before single letters.",
      "Replace each match with its Hebrew letter and take the standard gematria value; final-form values are noted but not summed.",
      "Sum per word and for the whole name.",
      "Reduce the total modulo 22 to select the ruling path, where a remainder of zero maps to path 22.",
      "Read the Major Arcana card of that path through the Golden Dawn attribution used by Waite.",
      "Reduce the total to a single digit as well, so the path can be cross-read with the Chaldean and Pythagorean charts.",
    ],
    formulas: [
      "Path index = ((gematria total − 1) mod 22) + 1",
      "Tree of Life path number = path index + 10",
    ],
    reference: "Golden Dawn letter and card attributions; standard Western transliteration table.",
  },
  horoscope: {
    method: "Transit-to-natal comparison scored per house and per domain of life.",
    inputs: ["Birth details", "Target date"],
    steps: [...SIDEREAL_BASE,
      "Compute the same set of longitudes for the target date to obtain the transit chart.",
      "Place each transiting planet into a natal house and note aspects to natal points.",
      "Weight each contact by the natural benefic or malefic nature of the planet and its dignity, then aggregate per domain.",
    ],
    reference: "Gochara transit rules with Vimshottari dasha as the timing filter.",
  },
  "kundli matching": {
    method: "Ashtakoot and Dashakoot scoring plus dosha checks on both charts.",
    inputs: ["Both birth dates", "Both birth times", "Both birth places"],
    steps: [
      "Compute both sidereal charts and both birth nakshatras with pada.",
      "Score Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot and Nadi from the classical tables (36 points).",
      "Check Mangal dosha for both charts from Mars in houses 1, 2, 4, 7, 8 and 12.",
      "Apply the traditional exceptions before reporting the final total.",
    ],
    formulas: ["Total = Varna 1 + Vashya 2 + Tara 3 + Yoni 4 + Maitri 5 + Gana 6 + Bhakoot 7 + Nadi 8"],
    reference: "Ashtakoot Milan tables from Brihat Parashara Hora Shastra.",
  },
  astrology: {
    method: "Tropical chart with the requested house system, aspects and predictive layers.",
    inputs: ["Date of birth", "Time of birth", "Place of birth"],
    steps: [
      "Compute apparent tropical longitudes, speeds and declinations for all bodies.",
      "Derive Ascendant and Midheaven, then house cusps in the selected system.",
      "Match aspects within orb, then group them into patterns and chart shape.",
      "Derive returns, secondary progressions, solar arc directions and midpoints from the same base chart.",
    ],
    reference: "Meeus, Astronomical Algorithms; standard aspect orbs.",
  },
};

/** Steps shared by every chart-driven module, used when no specific spec exists. */
export const DEFAULT_SPEC: CalculationSpec = {
  method: "Sidereal chart calculation, then rule evaluation on the resulting positions.",
  inputs: ["Date of birth", "Time of birth", "Place of birth"],
  steps: [...SIDEREAL_BASE, ...ASCENDANT_STEPS,
    "Evaluate the classical rules of this module against the resulting sign, house and lordship placements.",
    "Grade each rule by the strength and dignity of the planets involved before writing the reading.",
  ],
  reference: "Brihat Parashara Hora Shastra rules; positions from a DE440-grade ephemeris.",
};

export function calculationSpec(moduleName: string): CalculationSpec {
  const key = moduleName.trim().toLowerCase();
  if (CALCULATION_SPECS[key]) return CALCULATION_SPECS[key]!;
  const hit = Object.keys(CALCULATION_SPECS).find((k) => key.includes(k));
  return hit ? CALCULATION_SPECS[hit]! : DEFAULT_SPEC;
}
