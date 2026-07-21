import { describe, it, expect } from "vitest";
import { loShuGrid } from "@/lib/numerology-deep";

describe("Lo Shu grid", () => {
  it("rejects invalid calendar dates", () => {
    expect(() => loShuGrid("2001-02-29")).toThrow();
    expect(() => loShuGrid("2000-13-01")).toThrow();
    expect(() => loShuGrid("not-a-date")).toThrow();
  });
  it("accepts leap-year Feb 29", () => {
    expect(() => loShuGrid("2000-02-29")).not.toThrow();
  });
  it("counts only digits 1..9 (zeros ignored) and adds driver+conductor", () => {
    const g = loShuGrid("2000-01-01");
    // digits: 0,1 / 0,1 / 2,0,0,0 → filtered: 1,1,2 + driver reduce(1)=1 + conductor reduce(2+1+1)=4
    // pool: [1,1,2,1,4]
    expect(g.counts[1]).toBe(3);
    expect(g.counts[2]).toBe(1);
    expect(g.counts[4]).toBe(1);
    expect(g.driver).toBe(1);
    expect(g.conductor).toBe(4);
  });
  it("emits the 8 canonical magic-square lines summing to 15", () => {
    const g = loShuGrid("1990-05-15");
    const keys = Object.keys(g.planes).sort();
    expect(keys).toEqual(
      ["action","emotion","feelings","intellect","prosperity","spirituality","thought","will"]
    );
    for (const k of keys) {
      const [a, b, c] = g.planes[k as keyof typeof g.planes].line;
      expect(a + b + c).toBe(15);
    }
  });
  it("detects strength & weakness arrows correctly", () => {
    const g = loShuGrid("1990-05-15");
    // thought row 4-9-2: 1990-05-15 → digits 1,9,9,0,0,5,1,5 filtered [1,9,9,5,1,5]
    //   + driver reduce(15)=6, conductor reduce(1+9+9+0+0+5+1+5)=reduce(30)=3
    // pool: 1,9,9,5,1,5,6,3 → counts: 1:2, 3:1, 5:2, 6:1, 9:2; missing 2,4,7,8
    expect(g.missing.sort()).toEqual([2, 4, 7, 8]);
    expect(g.planes.thought.weakness).toBe(false); // 9 present
    expect(g.planes.action.present).toBe(2); // 1 & 6 present, 8 missing
    // feelings 2-7-6: 2 missing, 7 missing, 6 present → not full weakness
    expect(g.planes.feelings.weakness).toBe(false);
  });
});
