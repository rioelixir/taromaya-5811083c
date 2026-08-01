// The four "same sky" pages must never contradict each other for the same
// birth and time inputs. These tests run the cross-check engine over several
// birth profiles, hemispheres and boundary cases.

import { describe, expect, it } from "vitest";
import { runCrossCheck, tithiFromLongitudes, birthInstant } from "./cross-check";

const NOW = new Date(Date.UTC(2026, 6, 31, 4, 0, 0));

const PROFILES: { name: string; input: Parameters<typeof runCrossCheck>[0] }[] = [
  {
    name: "Delhi afternoon",
    input: { year: 1990, month: 5, day: 12, hour: 14, minute: 35, tzOffsetHours: 5.5, latitude: 28.6139, longitude: 77.209, now: NOW },
  },
  {
    name: "Sydney early morning (southern hemisphere)",
    input: { year: 1984, month: 11, day: 3, hour: 5, minute: 10, tzOffsetHours: 11, latitude: -33.8688, longitude: 151.2093, now: NOW },
  },
  {
    name: "New York near midnight (negative offset)",
    input: { year: 2001, month: 2, day: 28, hour: 23, minute: 55, tzOffsetHours: -5, latitude: 40.7128, longitude: -74.006, now: NOW },
  },
  {
    name: "Reykjavik summer (long day, sunrise edge case)",
    input: { year: 1975, month: 6, day: 21, hour: 3, minute: 5, tzOffsetHours: 0, latitude: 64.1466, longitude: -21.9426, now: NOW },
  },
  {
    name: "Chennai exact sunrise",
    input: { year: 1996, month: 1, day: 1, hour: 6, minute: 30, tzOffsetHours: 5.5, latitude: 13.0827, longitude: 80.2707, now: NOW },
  },
];

describe("cross-module consistency", () => {
  for (const p of PROFILES) {
    it(`keeps Kundli, Panchang, Transits and Horoscope aligned — ${p.name}`, () => {
      const report = runCrossCheck(p.input);
      const failures = report.items.filter((i) => !i.ok);
      expect(
        failures.map((f) => `${f.label}: ${JSON.stringify(f.values)}`).join("\n"),
      ).toBe("");
      expect(report.ok).toBe(true);
      expect(report.checked).toBeGreaterThanOrEqual(10);
    });
  }

  it("is deterministic for the same inputs", () => {
    const a = runCrossCheck(PROFILES[0]!.input);
    const b = runCrossCheck({ ...PROFILES[0]!.input });
    expect(JSON.stringify(b.items)).toBe(JSON.stringify(a.items));
  });

  it("converts local clock time to the right UTC instant", () => {
    const at = birthInstant({
      year: 2020, month: 1, day: 1, hour: 12, minute: 0,
      tzOffsetHours: 5.5, latitude: 0, longitude: 0,
    });
    expect(at.toISOString()).toBe("2020-01-01T06:30:00.000Z");
  });

  it("uses one shared Moon-day rule", () => {
    expect(tithiFromLongitudes(0, 0)).toBe(1);
    expect(tithiFromLongitudes(0, 11.99)).toBe(1);
    expect(tithiFromLongitudes(0, 12)).toBe(2);
    expect(tithiFromLongitudes(10, 358)).toBe(30);
  });
});
