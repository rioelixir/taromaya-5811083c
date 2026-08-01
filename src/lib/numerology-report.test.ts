import { describe, expect, it } from "vitest";
import { buildNumerologyReport, TRAITS, root } from "@/lib/numerology-report";

const NOW = new Date("2026-08-01T00:00:00Z");

describe("full numerology report", () => {
  it("is deterministic for the same inputs", () => {
    const a = buildNumerologyReport({ fullName: "Ria Sharma", birthDate: "1995-06-15", now: NOW });
    const b = buildNumerologyReport({ fullName: "Ria Sharma", birthDate: "1995-06-15", now: NOW });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("agrees with the Vedic engine on driver and destiny", () => {
    const r = buildNumerologyReport({ fullName: "Ram", birthDate: "1990-05-15", now: NOW });
    expect(r.vedic.mulank).toBe(r.loshu.driver);
    expect(r.vedic.bhagyank).toBe(r.loshu.conductor);
    expect(r.core.find((c) => c.key === "birth")!.value).toBe(r.vedic.mulank);
  });

  it("covers every required section", () => {
    const r = buildNumerologyReport({ fullName: "Ria Sharma", birthDate: "1995-06-15", now: NOW });
    const ids = r.sections.map((s) => s.id);
    [
      "overview", "planet", "strengths", "challenges", "hidden", "career", "money",
      "relationships", "marriage", "family", "children", "business", "education",
      "health", "spiritual", "year", "remedies", "action", "daily", "monthly", "summary",
    ].forEach((id) => expect(ids).toContain(id));
    r.sections.forEach((s) => {
      expect(s.eli10.length).toBeGreaterThan(10);
      expect(s.expert.length).toBeGreaterThan(10);
    });
  });

  it("omits name numbers when no name is given and keeps confidence bounded", () => {
    const r = buildNumerologyReport({ fullName: "", birthDate: "1995-06-15", now: NOW });
    expect(r.core.some((c) => c.key === "soul")).toBe(false);
    expect(r.confidence.score).toBeGreaterThanOrEqual(20);
    expect(r.confidence.score).toBeLessThanOrEqual(100);
  });

  it("maps every digit to complete trait content", () => {
    ([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).forEach((n) => {
      const t = TRAITS[n];
      expect(t.positives.length).toBeGreaterThan(2);
      expect(t.negatives.length).toBeGreaterThan(2);
      expect(t.career.length).toBeGreaterThan(2);
      expect(t.remedies.length).toBeGreaterThan(1);
      expect(t.eli10.length).toBeGreaterThan(20);
    });
    expect(root(11)).toBe(2);
    expect(root(22)).toBe(4);
  });

  it("rejects impossible dates", () => {
    expect(() => buildNumerologyReport({ fullName: "X", birthDate: "2001-02-29", now: NOW })).toThrow();
  });
});
