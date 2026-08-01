import { describe, expect, it } from "vitest";
import { computeKundli, type KundliChart } from "./vedic";
import { computeShadbala } from "./vedic-deep";

function chartWithSunHouse(sunHouse: number): KundliChart {
  // Build a minimal fake chart: ascendant in Aries (rashi 0), Sun placed
  // `sunHouse` signs away so it lands in that house from the ascendant.
  const base = computeKundli({
    year: 1995, month: 6, day: 15, hour: 7, minute: 45,
    tzOffsetHours: 5.5, latitude: 28.6139, longitude: 77.209,
  });
  const chart: KundliChart = JSON.parse(JSON.stringify(base));
  chart.ascendant.rashi = 0;
  const sun = chart.planets.find((p) => p.name === "Sun")!;
  sun.rashi = (sunHouse - 1) % 12;
  return chart;
}

describe("computeShadbala() — Kala bala (day/night)", () => {
  it("treats Sun in houses 7-12 from ascendant as a day birth (benefics favoured)", () => {
    const chart = chartWithSunHouse(10); // Sun in the 10th house = day birth
    const rows = computeShadbala(chart);
    const jupiter = rows.find((r) => r.planet === "Jupiter")!;
    const mars = rows.find((r) => r.planet === "Mars")!;
    // Day birth: benefic (Jupiter) gets the smaller/favourable kala value,
    // malefic (Mars) gets the larger "against nature" value.
    expect(jupiter.kala).toBeLessThan(mars.kala);
  });

  it("treats Sun in houses 1-6 from ascendant as a night birth (malefics favoured)", () => {
    const chart = chartWithSunHouse(3); // Sun in the 3rd house = night birth
    const rows = computeShadbala(chart);
    const jupiter = rows.find((r) => r.planet === "Jupiter")!;
    const mars = rows.find((r) => r.planet === "Mars")!;
    expect(mars.kala).toBeLessThan(jupiter.kala);
  });
});

describe("computeShadbala() — Drig bala special aspects", () => {
  it("reduces a planet's drig bala when Mars aspects it from the 8th house (4/8 special aspect)", () => {
    const base = computeKundli({
      year: 1995, month: 6, day: 15, hour: 7, minute: 45,
      tzOffsetHours: 5.5, latitude: 28.6139, longitude: 77.209,
    });
    const chart: KundliChart = JSON.parse(JSON.stringify(base));
    chart.ascendant.rashi = 0;
    const mars = chart.planets.find((p) => p.name === "Mars")!;
    const venus = chart.planets.find((p) => p.name === "Venus")!;
    venus.rashi = 0; // Venus in sign 0
    mars.rashi = 7;  // Mars 8 signs away from Venus -> 8th-house special aspect
    const withAspect = computeShadbala(chart)
      .find((r) => r.planet === "Venus")!.drig;

    const chart2: KundliChart = JSON.parse(JSON.stringify(chart));
    const mars2 = chart2.planets.find((p) => p.name === "Mars")!;
    mars2.rashi = 1; // no special aspect on Venus from here (diff = 2)
    const withoutAspect = computeShadbala(chart2)
      .find((r) => r.planet === "Venus")!.drig;

    expect(withAspect).toBeLessThan(withoutAspect);
  });
});
