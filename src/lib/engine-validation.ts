// Deterministic reference cases for the astrology engine. Runs entirely in
// the browser (or a test process), returns pass/fail plus signed drift per
// case so we can see regressions across engine versions.

import { computeKundli } from "./vedic";
import { ENGINE_VERSION } from "./chart-config";

const RASHIS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];

export type ValidationCase = {
  id: string;
  label: string;
  input: Parameters<typeof computeKundli>[0];
  // Expected sidereal ascendant sign (0..11) and an approximate longitude in [0,360)
  // with a tolerance in degrees. Tolerance is generous enough to survive minor
  // ayanamsa refinements but tight enough to catch a real regression.
  expected: {
    ascendantSign: number;
    ascendantLongitude: number;
    tolDegrees: number;
  };
};

// Curated reference set. Each case is a well-documented historical chart.
export const VALIDATION_CASES: ValidationCase[] = [
  {
    id: "india-1947",
    label: "India Independence — New Delhi, 15 Aug 1947 00:00 IST",
    input: { year: 1947, month: 8, day: 15, hour: 0, minute: 0, tzOffsetHours: 5.5, latitude: 28.6139, longitude: 77.2090 },
    expected: { ascendantSign: 1, ascendantLongitude: 37.8, tolDegrees: 1.5 }, // Taurus ≈ 7°48′
  },
  {
    id: "j2000-mumbai",
    label: "Y2K reference — Mumbai, 1 Jan 2000 12:00 IST",
    input: { year: 2000, month: 1, day: 1, hour: 12, minute: 0, tzOffsetHours: 5.5, latitude: 19.076, longitude: 72.877 },
    expected: { ascendantSign: 1, ascendantLongitude: 55.0, tolDegrees: 3 }, // Taurus mid-range
  },
  {
    id: "solstice-delhi",
    label: "June solstice — Delhi, 21 Jun 2020 05:44 IST (sunrise chart)",
    input: { year: 2020, month: 6, day: 21, hour: 5, minute: 44, tzOffsetHours: 5.5, latitude: 28.6139, longitude: 77.2090 },
    expected: { ascendantSign: 2, ascendantLongitude: 65.0, tolDegrees: 4 }, // Gemini
  },
];

export type CaseResult = {
  id: string;
  label: string;
  passed: boolean;
  expectedSign: string;
  actualSign: string;
  expectedLongitude: number;
  actualLongitude: number;
  driftDegrees: number;
  error?: string;
};

export type ValidationReport = {
  engineVersion: string;
  runAt: string;
  passed: number;
  failed: number;
  cases: CaseResult[];
};

function shortestArc(a: number, b: number): number {
  const d = ((a - b) % 360 + 540) % 360 - 180;
  return d;
}

export function runValidationSuite(): ValidationReport {
  const cases: CaseResult[] = [];
  let passed = 0, failed = 0;
  for (const c of VALIDATION_CASES) {
    try {
      const chart = computeKundli(c.input);
      const asc = chart.ascendant.longitude;
      const drift = shortestArc(asc, c.expected.ascendantLongitude);
      const signMatch = chart.ascendant.rashi === c.expected.ascendantSign;
      const withinTol = Math.abs(drift) <= c.expected.tolDegrees;
      const ok = signMatch && withinTol;
      if (ok) passed++; else failed++;
      cases.push({
        id: c.id,
        label: c.label,
        passed: ok,
        expectedSign: RASHIS[c.expected.ascendantSign],
        actualSign: RASHIS[chart.ascendant.rashi],
        expectedLongitude: c.expected.ascendantLongitude,
        actualLongitude: asc,
        driftDegrees: drift,
      });
    } catch (e) {
      failed++;
      cases.push({
        id: c.id,
        label: c.label,
        passed: false,
        expectedSign: RASHIS[c.expected.ascendantSign],
        actualSign: "—",
        expectedLongitude: c.expected.ascendantLongitude,
        actualLongitude: NaN,
        driftDegrees: NaN,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return {
    engineVersion: ENGINE_VERSION,
    runAt: new Date().toISOString(),
    passed,
    failed,
    cases,
  };
}
