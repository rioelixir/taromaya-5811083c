import { describe, it, expect } from "vitest";
import {
  birthDateSchema,
  birthTimeSchema,
  tzOffsetSchema,
  latitudeSchema,
  longitudeSchema,
  birthDetailsSchema,
  firstError,
  fieldErrors,
} from "./validation";

describe("birthDateSchema", () => {
  it("accepts a real date", () => {
    expect(birthDateSchema.safeParse("1994-08-21").success).toBe(true);
  });
  it("rejects Feb 30", () => {
    expect(birthDateSchema.safeParse("2000-02-30").success).toBe(false);
  });
  it("rejects wrong format", () => {
    expect(birthDateSchema.safeParse("21/08/1994").success).toBe(false);
  });
  it("rejects year 1800", () => {
    expect(birthDateSchema.safeParse("1800-01-01").success).toBe(false);
  });
});

describe("birthTimeSchema", () => {
  it("accepts HH:MM", () => {
    expect(birthTimeSchema.safeParse("14:30").success).toBe(true);
  });
  it("accepts HH:MM:SS", () => {
    expect(birthTimeSchema.safeParse("14:30:15").success).toBe(true);
  });
  it("rejects 25:00", () => {
    expect(birthTimeSchema.safeParse("25:00").success).toBe(false);
  });
  it("rejects garbage", () => {
    expect(birthTimeSchema.safeParse("morning").success).toBe(false);
  });
});

describe("bounds", () => {
  it("tz within range", () => {
    expect(tzOffsetSchema.safeParse(5.5).success).toBe(true);
    expect(tzOffsetSchema.safeParse(15).success).toBe(false);
  });
  it("lat/lon bounds", () => {
    expect(latitudeSchema.safeParse(91).success).toBe(false);
    expect(latitudeSchema.safeParse(28.6).success).toBe(true);
    expect(longitudeSchema.safeParse(-180.1).success).toBe(false);
    expect(longitudeSchema.safeParse(77.2).success).toBe(true);
  });
});

describe("birthDetailsSchema", () => {
  const valid = {
    full_name: "Riaa",
    gender: null,
    birth_date: "1994-08-21",
    birth_time: "14:30",
    tz_offset_hours: 5.5,
    place: "New Delhi, India",
    latitude: 28.6139,
    longitude: 77.209,
  };
  it("passes canonical input", () => {
    expect(birthDetailsSchema.safeParse(valid).success).toBe(true);
  });
  it("fails when full name is blank", () => {
    const r = birthDetailsSchema.safeParse({ ...valid, full_name: "   " });
    expect(r.success).toBe(false);
  });
  it("firstError returns a friendly string", () => {
    const msg = firstError(birthDetailsSchema, { ...valid, birth_date: "nope" });
    expect(msg).toMatch(/valid date/i);
  });
  it("fieldErrors keys by path", () => {
    const errs = fieldErrors(birthDetailsSchema, { ...valid, latitude: 500 });
    expect(errs.latitude).toMatch(/-90/);
  });
});
