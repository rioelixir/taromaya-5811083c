import { describe, expect, it } from "vitest";
import {
  numberRelation, relationSets, vedicNumerology, loShuAdvanced,
} from "@/lib/vedic-numerology";

describe("Vedic numerology", () => {
  it("number friendship is symmetric and partitions 1..9", () => {
    for (let a = 1; a <= 9; a++) {
      const s = relationSets(a);
      expect(s.friends.length + s.neutral.length + s.enemies.length).toBe(9);
      expect(s.friends).toContain(a);
      for (let b = 1; b <= 9; b++) {
        expect(numberRelation(a, b)).toBe(numberRelation(b, a));
      }
    }
  });

  it("computes mulank, bhagyank and namank in 1..9", () => {
    const v = vedicNumerology("1995-06-15", "Ria Sharma");
    expect(v.mulank).toBe(6); // 15 → 6
    expect(v.bhagyank).toBe(9); // 1+9+9+5+6+1+5 = 36 → 9
    expect(v.namank).toBeGreaterThanOrEqual(1);
    expect(v.namank).toBeLessThanOrEqual(9);
    expect(v.harmony.score).toBeGreaterThan(0);
    expect(v.luckyDays.length).toBeGreaterThan(0);
  });

  it("has no name number when no name is given", () => {
    const v = vedicNumerology("2000-02-29");
    expect(v.namank).toBeNull();
    expect(v.harmony.mulankNamank).toBeNull();
  });

  it("rejects impossible dates", () => {
    expect(() => vedicNumerology("2001-02-29")).toThrow();
    expect(() => vedicNumerology("15-06-1995")).toThrow();
  });

  it("advanced Lo Shu gives a remedy for every missing number", () => {
    const a = loShuAdvanced("1990-05-15");
    expect(a.remedies.map((r) => r.number).sort()).toEqual(a.missing.sort());
    a.remedies.forEach((r) => expect(r.remedy.length).toBeGreaterThan(10));
    expect(a.summary).toContain(String(a.driver));
  });
});
