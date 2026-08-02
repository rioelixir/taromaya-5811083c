import { describe, expect, it } from "vitest";
import { qualityGate, runPipeline, GENERIC_FAILURE } from "./report-quality";

const LONG =
  "Based on the available birth data and the calculated positions, this combination commonly suggests steady progress in work over the coming months, with careful attention to paperwork.";

describe("qualityGate", () => {
  it("keeps clean professional text untouched", () => {
    const r = qualityGate(LONG);
    expect(r.clean).toBe(true);
    expect(r.confidence).toBe("high");
    expect(r.text).toBe(LONG);
  });

  it("softens absolute-certainty claims", () => {
    const r = qualityGate(`This is 100% guaranteed and will definitely happen. ${LONG}`);
    expect(r.text).not.toMatch(/100\s*%/);
    expect(r.text).not.toMatch(/definitely/i);
    expect(r.issues.some((i) => i.code === "overclaim")).toBe(true);
  });

  it("removes assistant boilerplate and markdown symbols", () => {
    const r = qualityGate(`As an AI language model, I cannot provide this. **${LONG}**`);
    expect(r.text).not.toMatch(/ai language model/i);
    expect(r.text).not.toContain("*");
  });

  it("flags placeholder and too-short output", () => {
    const r = qualityGate("Lorem ipsum placeholder");
    expect(r.confidence).toBe("sensitive");
    expect(r.issues.map((i) => i.code)).toContain("placeholder");
    expect(r.issues.map((i) => i.code)).toContain("too-short");
  });

  it("is deterministic", () => {
    expect(qualityGate(LONG)).toEqual(qualityGate(LONG));
  });
});

describe("runPipeline", () => {
  it("returns validation messages before computing", () => {
    const r = runPipeline({
      validate: () => "Please enter your birth date.",
      compute: () => 1,
    });
    expect(r).toEqual({ ok: false, message: "Please enter your birth date." });
  });

  it("never leaks technical errors", () => {
    const r = runPipeline({
      validate: () => null,
      compute: () => {
        throw new Error("ephemeris index out of range");
      },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toBe(GENERIC_FAILURE);
  });

  it("passes cross-check warnings through", () => {
    const r = runPipeline({
      validate: () => null,
      compute: () => 42,
      crossCheck: (v) => (v === 42 ? ["Time is approximate."] : []),
    });
    expect(r).toEqual({ ok: true, value: 42, warnings: ["Time is approximate."] });
  });
});
