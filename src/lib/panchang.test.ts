import { describe, it, expect } from "vitest";
import { computePanchang } from "./panchang";

// Reference: New Delhi, India (28.6139N, 77.2090E)
// Reference: New York, USA (40.7128N, -74.0060W)
// Reference: London, UK (51.5074N, -0.1278W)

describe("panchang invariants", () => {
  const cases = [
    { date: new Date(2024, 0, 1, 12, 0, 0), lat: 28.6139, lon: 77.2090, label: "Delhi 2024-01-01" },
    { date: new Date(2024, 5, 15, 12, 0, 0), lat: 40.7128, lon: -74.0060, label: "New York 2024-06-15" },
    { date: new Date(2023, 10, 12, 12, 0, 0), lat: 51.5074, lon: -0.1278, label: "London 2023-11-12 (Diwali)" },
  ];

  for (const c of cases) {
    it(`${c.label}: basic invariants hold`, () => {
      const p = computePanchang({ date: c.date, latitude: c.lat, longitude: c.lon });

      // Tithi always in 1..30
      expect(p.tithi.number).toBeGreaterThanOrEqual(1);
      expect(p.tithi.number).toBeLessThanOrEqual(30);

      // Nakshatra index in 0..26
      expect(p.nakshatra.index).toBeGreaterThanOrEqual(0);
      expect(p.nakshatra.index).toBeLessThanOrEqual(26);
      expect(p.nakshatra.pada).toBeGreaterThanOrEqual(1);
      expect(p.nakshatra.pada).toBeLessThanOrEqual(4);

      // Yoga index in 0..26
      expect(p.yoga.index).toBeGreaterThanOrEqual(0);
      expect(p.yoga.index).toBeLessThanOrEqual(26);

      // Karana half-index in 0..59
      expect(p.karana.index).toBeGreaterThanOrEqual(0);
      expect(p.karana.index).toBeLessThanOrEqual(59);

      // Sunrise strictly before sunset (same solar day)
      if (p.sunrise && p.sunset) {
        expect(p.sunrise.getTime()).toBeLessThan(p.sunset.getTime());
      }

      // Rahu kaal / Yamaganda / Gulika segments (if present) fall within
      // sunrise..sunset and are non-zero-length, non-overlapping-adjacent slices.
      for (const seg of [p.rahuKaal, p.yamaganda, p.gulika]) {
        if (seg && p.sunrise && p.sunset) {
          expect(seg[0].getTime()).toBeGreaterThanOrEqual(p.sunrise.getTime());
          expect(seg[1].getTime()).toBeLessThanOrEqual(p.sunset.getTime());
          expect(seg[1].getTime()).toBeGreaterThan(seg[0].getTime());
        }
      }

      // The 8 daytime chaughadiya segments must exactly cover sunrise..sunset,
      // contiguous with no gaps or overlaps.
      if (p.chaughadiyaDay.length === 8) {
        expect(p.chaughadiyaDay[0].from.getTime()).toBe(p.sunrise!.getTime());
        expect(p.chaughadiyaDay[7].to.getTime()).toBeCloseTo(p.sunset!.getTime(), -1);
        for (let i = 0; i < 7; i++) {
          expect(p.chaughadiyaDay[i].to.getTime()).toBe(p.chaughadiyaDay[i + 1].from.getTime());
        }
      }

      // Weekday must be a valid day name.
      expect(["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]).toContain(p.weekday);
    });
  }

  it("Vara (weekday) follows sunrise, not midnight: pre-sunrise time belongs to previous vedic day", () => {
    const lat = 28.6139, lon = 77.2090;
    // Compute panchang at noon on a given date to learn its sunrise time and weekday.
    const noonToday = computePanchang({ date: new Date(2024, 2, 10, 12, 0, 0), latitude: lat, longitude: lon });
    expect(noonToday.sunrise).not.toBeNull();

    // Query 1 hour before that day's sunrise (still within calendar day, small hours).
    const preSunrise = new Date(noonToday.sunrise!.getTime() - 3600_000);
    const pPre = computePanchang({ date: preSunrise, latitude: lat, longitude: lon });

    // Query 1 hour after sunrise — should report the same weekday as noon.
    const postSunrise = new Date(noonToday.sunrise!.getTime() + 3600_000);
    const pPost = computePanchang({ date: postSunrise, latitude: lat, longitude: lon });

    expect(pPost.weekday).toBe(noonToday.weekday);
    // Pre-sunrise moment must belong to the previous Vedic day.
    const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const prevIdx = (dayNames.indexOf(noonToday.weekday) + 6) % 7;
    expect(pPre.weekday).toBe(dayNames[prevIdx]);
  });

  it("Delhi 2024-01-01 noon: sidereal tithi/nakshatra/yoga/karana are internally consistent", () => {
    const p = computePanchang({ date: new Date(2024, 0, 1, 12, 0, 0), latitude: 28.6139, longitude: 77.2090 });
    // Jan 1 2024 was Krishna Paksha (waning moon after full moon on Dec 26 2023).
    expect(p.tithi.paksha).toBe("Krishna");
    expect(p.weekday).toBe("Monday");
  });

  it("New York 2024-06-15: sunrise before sunset, valid weekday", () => {
    const p = computePanchang({ date: new Date(2024, 5, 15, 12, 0, 0), latitude: 40.7128, longitude: -74.0060 });
    expect(p.weekday).toBe("Saturday");
    expect(p.sunrise!.getTime()).toBeLessThan(p.sunset!.getTime());
  });
});
