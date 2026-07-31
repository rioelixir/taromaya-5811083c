import { describe, expect, it } from "vitest";
import { ashtakootMilan, type Person } from "./ashtakoot";
import type { KundliChart } from "./vedic";

/** Minimal chart stub — Guna Milan only reads the Moon rashi and Moon nakshatra. */
function person(moonRashi: number, nakIndex: number): Person {
  const planets = Array.from({ length: 9 }, (_, i) => ({
    rashi: i === 1 ? moonRashi : 0,
  }));
  return {
    chart: {
      planets,
      moonNakshatra: { index: nakIndex },
    } as unknown as KundliChart,
  };
}

const MAXES: Record<string, number> = {
  Varna: 1,
  Vashya: 2,
  Tara: 3,
  "Graha Maitri": 5,
  Yoni: 4,
  Gana: 6,
  Bhakoot: 7,
  Nadi: 8,
};

describe("Ashtakoot (Guna Milan) structure", () => {
  const r = ashtakootMilan(person(0, 0), person(4, 10));

  it("has all 8 kootas with the classical maximums", () => {
    expect(r.kootas).toHaveLength(8);
    for (const k of r.kootas) {
      expect(MAXES[k.name]).toBeDefined();
      expect(k.max).toBe(MAXES[k.name]);
    }
  });

  it("maximums add up to 36", () => {
    expect(r.kootas.reduce((s, k) => s + k.max, 0)).toBe(36);
    expect(r.max).toBe(36);
  });
});

describe("Ashtakoot totals stay in range for every pairing", () => {
  it("0..36 across all 12 x 27 combinations", () => {
    for (let rashi = 0; rashi < 12; rashi++) {
      for (let nak = 0; nak < 27; nak++) {
        const res = ashtakootMilan(person(rashi, nak), person((rashi + 5) % 12, (nak + 9) % 27));
        expect(res.total).toBeGreaterThanOrEqual(0);
        expect(res.total).toBeLessThanOrEqual(36);
        expect(res.total).toBe(res.kootas.reduce((s, k) => s + k.score, 0));
        for (const k of res.kootas) {
          expect(k.score).toBeGreaterThanOrEqual(0);
          expect(k.score).toBeLessThanOrEqual(k.max);
        }
      }
    }
  });
});

describe("Known koota outcomes", () => {
  const koota = (res: ReturnType<typeof ashtakootMilan>, name: string) =>
    res.kootas.find((k) => k.name === name)!;

  it("same nakshatra and sign scores full Gana and full Bhakoot but zero Nadi", () => {
    const res = ashtakootMilan(person(0, 0), person(0, 0));
    expect(koota(res, "Gana").score).toBe(6);
    expect(koota(res, "Bhakoot").score).toBe(7);
    expect(koota(res, "Nadi").score).toBe(0); // same nadi = no flow
    expect(koota(res, "Yoni").score).toBe(4); // same yoni animal
  });

  it("6-8 moon sign distance triggers Bhakoot dosha", () => {
    // Aries (0) and Virgo (5): counts are 6 and 8.
    const res = ashtakootMilan(person(0, 0), person(5, 3));
    expect(koota(res, "Bhakoot").score).toBe(0);
    expect(res.bhakoot).toBe(0);
  });

  it("9-5 and 12-2 distances also trigger Bhakoot dosha", () => {
    // Aries (0) and Sagittarius (8): counts 9 and 5.
    expect(koota(ashtakootMilan(person(0, 0), person(8, 3)), "Bhakoot").score).toBe(0);
    // Aries (0) and Pisces (11): counts 12 and 2.
    expect(koota(ashtakootMilan(person(0, 0), person(11, 3)), "Bhakoot").score).toBe(0);
  });

  it("a friendly sign distance keeps Bhakoot intact", () => {
    // Aries (0) and Leo (4): counts 5 and 9 -> that IS a dosha pair, so use trine 1-1.
    expect(koota(ashtakootMilan(person(0, 0), person(3, 3)), "Bhakoot").score).toBe(7);
  });

  it("Tara is 0, 1.5 or 3 only", () => {
    for (let nak = 0; nak < 27; nak++) {
      const s = koota(ashtakootMilan(person(0, 0), person(0, nak)), "Tara").score;
      expect([0, 1.5, 3]).toContain(s);
    }
  });
});

describe("Table coverage for all 27 nakshatras", () => {
  it("every nakshatra yields a named yoni, gana and nadi", () => {
    for (let nak = 0; nak < 27; nak++) {
      const res = ashtakootMilan(person(0, nak), person(6, (nak + 4) % 27));
      for (const name of ["Yoni", "Gana", "Nadi", "Varna", "Vashya"]) {
        const k = res.kootas.find((x) => x.name === name)!;
        expect(k.boy).toBeTruthy();
        expect(k.girl).toBeTruthy();
        expect(k.boy).not.toContain("undefined");
        expect(k.girl).not.toContain("undefined");
      }
    }
  });

  it("Gana pairings follow the classical scores", () => {
    for (let a = 0; a < 27; a++) {
      for (let b = 0; b < 27; b++) {
        const s = ashtakootMilan(person(0, a), person(0, b)).kootas.find((k) => k.name === "Gana")!.score;
        expect([0, 5, 6]).toContain(s);
      }
    }
  });

  it("Nadi is only 0 or 8", () => {
    for (let a = 0; a < 27; a++) {
      const s = ashtakootMilan(person(0, a), person(0, (a + 1) % 27)).kootas.find((k) => k.name === "Nadi")!.score;
      expect([0, 8]).toContain(s);
    }
  });
});

describe("Reading text stays plain", () => {
  it("has no markdown symbols", () => {
    const res = ashtakootMilan(person(2, 5), person(7, 18));
    const all = [res.interpretation, ...res.kootas.map((k) => k.detail)].join(" ");
    expect(all).not.toMatch(/[*#_`]/);
  });
});
