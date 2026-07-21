import { describe, it, expect } from "vitest";
import {
  TAROT_DECK,
  shuffleAndDraw,
  secureRandInt,
  SPREADS,
} from "./tarot-deck";

describe("tarot-deck", () => {
  it("has 78 unique cards (22 major + 56 minor)", () => {
    expect(TAROT_DECK).toHaveLength(78);
    const ids = new Set(TAROT_DECK.map((c) => c.id));
    expect(ids.size).toBe(78);
    expect(TAROT_DECK.filter((c) => c.arcana === "major")).toHaveLength(22);
    expect(TAROT_DECK.filter((c) => c.arcana === "minor")).toHaveLength(56);
  });

  it("shuffleAndDraw returns distinct upright cards", () => {
    const draw = shuffleAndDraw(5, ["a", "b", "c", "d", "e"]);
    expect(draw).toHaveLength(5);
    expect(new Set(draw.map((d) => d.card.id)).size).toBe(5);
    expect(draw.every((d) => d.reversed === false)).toBe(true);
    expect(draw.map((d) => d.position)).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("secureRandInt stays in [0, max) and is not biased to zero", () => {
    const buckets = new Array(10).fill(0);
    for (let i = 0; i < 2000; i++) buckets[secureRandInt(10)]++;
    for (const b of buckets) {
      // Each bucket should have ~200; give a wide bound to avoid flakiness.
      expect(b).toBeGreaterThan(100);
      expect(b).toBeLessThan(320);
    }
  });

  it("SPREADS has exactly the four allowed modes", () => {
    expect(Object.keys(SPREADS).sort()).toEqual(
      ["freestyle", "one", "ppf", "yesno"].sort(),
    );
  });

  it("two consecutive shuffles rarely match (CSPRNG entropy)", () => {
    const a = shuffleAndDraw(10, Array(10).fill("x")).map((d) => d.card.id);
    const b = shuffleAndDraw(10, Array(10).fill("x")).map((d) => d.card.id);
    expect(a.join(",")).not.toBe(b.join(","));
  });
});
