import { describe, it, expect } from "vitest";
import { computeKundli } from "@/lib/vedic";
import { MODULE_PLANETS, bindingFor, moduleRemedyPlan } from "@/lib/module-remedies";

const chart = computeKundli({
  year: 1990, month: 1, day: 15, hour: 10, minute: 30,
  tzOffsetHours: 5.5, latitude: 28.6139, longitude: 77.209,
});

describe("module remedies", () => {
  it("binds every mapped module to at least one planet with a stated role", () => {
    for (const [path, b] of Object.entries(MODULE_PLANETS)) {
      expect(b.planets.length, path).toBeGreaterThan(0);
      for (const p of b.planets) expect(p.role.length, `${path} ${p.planet}`).toBeGreaterThan(20);
    }
  });

  it("falls back to a valid binding for an unmapped route", () => {
    const b = bindingFor("/some-new-page");
    expect(b.planets.length).toBe(3);
  });

  it("ignores a trailing slash", () => {
    expect(bindingFor("/health/").focus).toBe(bindingFor("/health").focus);
  });

  it("produces a complete dossier without a chart", () => {
    const plan = moduleRemedyPlan("/career", null);
    expect(plan.chartUsed).toBe(false);
    expect(plan.blocks.length).toBeGreaterThan(2);
    expect(plan.sequence.length).toBeGreaterThan(4);
    expect(plan.cautions.length).toBeGreaterThan(3);
  });

  it("grades planets against the chart and keeps japa counts sane", () => {
    const plan = moduleRemedyPlan("/kundli", chart);
    expect(plan.chartUsed).toBe(true);
    for (const b of plan.blocks) {
      expect(b.japa.dailyJapa % 108).toBe(0);
      expect(b.japa.daysToComplete).toBeGreaterThan(0);
      expect(b.gem.ratti).toBeGreaterThanOrEqual(b.gem.minRatti);
      expect(b.gem.ratti).toBeLessThanOrEqual(b.gem.maxRatti);
      expect(["attention", "support", "steady"]).toContain(b.priority);
    }
  });

  it("is deterministic for the same input", () => {
    expect(JSON.stringify(moduleRemedyPlan("/finance", chart)))
      .toBe(JSON.stringify(moduleRemedyPlan("/finance", chart)));
  });

  it("keeps remedy text free of markdown symbols", () => {
    const plan = moduleRemedyPlan("/health", chart);
    const all = [...plan.sequence, ...plan.cautions].join(" ");
    expect(all).not.toMatch(/[*#]/);
  });
});
