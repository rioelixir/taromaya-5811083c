// Per-section accuracy and confidence notes.
//
// Each note says, in plain words: how sure we are, what we assume, which
// edge cases can shift the answer (day/night boundaries, sign edges,
// sunrise-based day rollover), and which of your inputs matter.
// Sections reference these by key so the wording never drifts.

export type Confidence = "high" | "good" | "sensitive";

export type AccuracyNote = {
  key: string;
  section: string;
  confidence: Confidence;
  summary: string;      // one plain sentence
  assumptions: string[];
  edgeCases: string[];
  inputs: string[];
};

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: "Very reliable",
  good: "Reliable",
  sensitive: "Reliable, but sensitive to exact time",
};

const N = (n: AccuracyNote) => n;

export const ACCURACY_NOTES: Record<string, AccuracyNote> = Object.fromEntries(
  [
    // ---------- Panchang ----------
    N({
      key: "panchang-core",
      section: "Panchang — the five limbs",
      confidence: "high",
      summary: "Tithi, Nakshatra, Yoga and Karana come from real sky positions, so they match a printed almanac closely.",
      assumptions: [
        "Lahiri (Chitrapaksha) ayanamsa, the standard used by most Indian almanacs.",
        "The five limbs are read at noon of the date you picked unless you change the time.",
        "The Vedic day runs sunrise to sunrise, so a very early morning belongs to the previous day.",
      ],
      edgeCases: [
        "A Tithi lasts 19 to 26 hours, so it can be skipped or repeated on a date. Near a changeover a printed panchang may show the next one.",
        "The Moon changes star roughly every 22 hours. Within about 15 minutes of that change, two sources can disagree.",
        "Almanacs that use a different ayanamsa can be one Nakshatra pada off.",
      ],
      inputs: ["Date", "Place (only through sunrise)", "Time of day when a limb changes"],
    }),
    N({
      key: "panchang-timings",
      section: "Muhurats, Rahu Kaal, Chaughadiya and Hora",
      confidence: "high",
      summary: "All these windows are slices of your local day length, so they are as accurate as your place.",
      assumptions: [
        "Sunrise and sunset are for sea level with standard atmospheric refraction.",
        "Day windows split sunrise to sunset, night windows split sunset to the next sunrise.",
        "Abhijit is centred on true solar noon, not on 12 o'clock.",
      ],
      edgeCases: [
        "Day and night boundary: a window listed at, say, 6:40 pm belongs to the night set once the Sun has set, so the same clock time can change meaning by a minute.",
        "Far north or south places in summer or winter can have no true sunrise or sunset. Those rows show a dash instead of guessing.",
        "Hills and tall buildings delay your visible sunrise by a few minutes, which shifts every window equally.",
      ],
      inputs: ["Date", "Weekday", "Place (latitude and longitude)"],
    }),

    // ---------- Kundli ----------
    N({
      key: "kundli-chart",
      section: "Birth chart (Kundli)",
      confidence: "sensitive",
      summary: "Planet signs are very reliable. Your Ascendant and houses depend on your birth time to the minute.",
      assumptions: [
        "Whole-sign houses, the classical Vedic default.",
        "Lahiri ayanamsa and true (not mean) lunar nodes.",
        "The birth time you enter is local clock time for the birth place, and we apply that place's offset for that date.",
      ],
      edgeCases: [
        "The Ascendant moves about one degree every 4 minutes, so 15 wrong minutes can move it into the next sign and rotate every house.",
        "A planet within a degree of a sign edge can flip sign with a small time correction.",
        "Very high latitudes stretch house sizes; whole-sign houses stay stable there while cusp systems do not.",
        "Historic war-time or daylight-saving rules at the birth place can shift the recorded time by an hour.",
      ],
      inputs: ["Birth date", "Birth time to the minute", "Birth place"],
    }),
    N({
      key: "kundli-dasha",
      section: "Dasha timeline",
      confidence: "sensitive",
      summary: "The order of periods is fixed; the exact dates lean on your birth minute.",
      assumptions: [
        "Vimshottari 120-year cycle started from the Moon's position in its star at birth.",
        "Sub-periods are cut in the same proportion as the main periods.",
      ],
      edgeCases: [
        "A few minutes of birth-time change can move a period start by weeks, because the Moon covers a star in about 22 hours.",
        "If the Moon sits right at the edge of a star, the very first ruling planet can change.",
      ],
      inputs: ["Birth date", "Birth time", "Birth place"],
    }),
    N({
      key: "strength",
      section: "Planet strength (Shadbala)",
      confidence: "good",
      summary: "Strength scores follow the classical six-fold method, so use them for comparison rather than as a hard grade.",
      assumptions: [
        "Six Balas summed in Virupas and shown in Rupas.",
        "Day or night birth is decided by your local sunrise and sunset, not by clock hours.",
      ],
      edgeCases: [
        "A birth within minutes of sunrise or sunset sits on the day/night boundary, which changes several strength parts at once.",
        "Classical texts differ slightly on some sub-parts, so other software can show a small difference in totals.",
      ],
      inputs: ["Birth date", "Birth time", "Birth place"],
    }),

    // ---------- Transits ----------
    N({
      key: "transits",
      section: "Transits",
      confidence: "good",
      summary: "Where planets are now is precise. Whether an aspect counts depends on the orb we allow.",
      assumptions: [
        "The transit chart uses the same engine as your birth chart, run for the current instant.",
        "House overlays use your current place; aspects do not need a place at all.",
      ],
      edgeCases: [
        "An aspect at the edge of its orb can appear or disappear with a small birth-time correction.",
        "Retrograde planets can make the same aspect three times, so one theme returns.",
        "Slow planets sit in orb for months, so their date is a window, not a day.",
      ],
      inputs: ["Your birth details", "Current date and time", "Current place for houses"],
    }),

    // ---------- Horoscope ----------
    N({
      key: "horoscope",
      section: "Horoscope",
      confidence: "good",
      summary: "The sky facts here are calculated; the wording around them is guidance, not a prediction.",
      assumptions: [
        "Vedic Rashiphal is read from your Moon sign, Western sections from your Sun sign.",
        "Moon phase, Nakshatra of the day and Sade Sati status all come from the same engine as the rest of the app.",
      ],
      edgeCases: [
        "Your Western Sun sign and your Vedic Sun sign can differ by one sign; that is the ayanamsa, not an error.",
        "Sign changes near your birthday mean your Sun sign depends on your birth time too.",
        "Sade Sati can switch on and off while Saturn is retrograde near a sign edge.",
      ],
      inputs: ["Birth date", "Birth time (near a sign change)", "Current date"],
    }),

    // ---------- Numerology ----------
    N({
      key: "numerology",
      section: "Numerology",
      confidence: "high",
      summary: "Numerology is pure arithmetic, so the same inputs always give the same numbers.",
      assumptions: [
        "Pythagorean letter values for Western numbers and Chaldean values for the Vedic name number.",
        "Master numbers 11, 22 and 33 are kept instead of reduced.",
        "The full name is used exactly as first recorded at birth.",
      ],
      edgeCases: [
        "A different spelling, a middle name, or a married surname gives different name numbers. That is not a bug.",
        "Y is treated as a vowel only when it carries the vowel sound.",
        "Personal year and month numbers roll over on your birthday in some traditions and on 1 January in others; we use the calendar year and say so.",
      ],
      inputs: ["Birth date", "Full birth name spelling"],
    }),
  ].map((n) => [n.key, n]),
);

export function accuracyNote(key: string): AccuracyNote | undefined {
  return ACCURACY_NOTES[key];
}
