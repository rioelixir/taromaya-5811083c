// Live transit-based dosha windows.
// Currently: Sade Sati — 7.5-year Saturn transit through 12th, 1st, 2nd houses from natal Moon sign.
import * as A from "astronomy-engine";
import { lahiriAyanamsa } from "./vedic";

const norm360 = (x: number) => ((x % 360) + 360) % 360;
const norm12 = (n: number) => ((n % 12) + 12) % 12;

function saturnSign(date: Date): number {
  const gvec = A.GeoVector(A.Body.Saturn, date, true);
  const rot = A.Rotation_EQJ_ECT(date);
  const e = A.RotateVector(rot, gvec);
  const trop = norm360((Math.atan2(e.y, e.x) * 180) / Math.PI);
  const sidereal = norm360(trop - lahiriAyanamsa(date));
  return Math.floor(sidereal / 30);
}

// Scan for the boundary date where saturnSign() changes, starting from `from`
// moving in `dir` (+1 forward, -1 backward). Returns the first crossing date.
function findSaturnIngress(from: Date, dir: 1 | -1, targetSign: number | "leave", currentSign: number): Date | null {
  const stepDays = 15;
  const maxSteps = 400; // ~16 years window
  let cursor = new Date(from.getTime());
  let prev = currentSign;
  for (let i = 0; i < maxSteps; i++) {
    cursor = new Date(cursor.getTime() + dir * stepDays * 86400000);
    const s = saturnSign(cursor);
    if (s !== prev) {
      // If we care about a specific sign, wait until we match; else return first change
      if (targetSign === "leave" && s !== currentSign) {
        return refineBoundary(cursor, dir, currentSign);
      }
      if (typeof targetSign === "number" && s === targetSign) {
        return refineBoundary(cursor, dir, prev);
      }
      prev = s;
    }
  }
  return null;
}

function refineBoundary(around: Date, dir: 1 | -1, beforeSign: number): Date {
  // Binary search within [around - dir*15d, around]
  let lo = new Date(around.getTime() - dir * 15 * 86400000);
  let hi = new Date(around.getTime());
  for (let i = 0; i < 30; i++) {
    const mid = new Date((lo.getTime() + hi.getTime()) / 2);
    const s = saturnSign(mid);
    if (s === beforeSign) lo = mid; else hi = mid;
  }
  return dir === 1 ? hi : lo;
}

export type SadeSatiWindow = {
  phase: "Rising" | "Peak" | "Setting";
  sign: number;
  start: Date;
  end: Date;
  active: boolean;
};

export type SadeSatiReport = {
  natalMoonSign: number;
  currentSaturnSign: number;
  currentPhase: "Rising" | "Peak" | "Setting" | null;
  active: boolean;
  windows: SadeSatiWindow[];
};

/** Analyse Sade Sati around `now` for a natal Moon sign. */
export function analyseSadeSati(natalMoonSign: number, now: Date = new Date()): SadeSatiReport {
  const currentSaturnSign = saturnSign(now);
  const phaseSigns: Array<{ phase: "Rising" | "Peak" | "Setting"; sign: number }> = [
    { phase: "Rising", sign: norm12(natalMoonSign - 1) },
    { phase: "Peak", sign: natalMoonSign },
    { phase: "Setting", sign: norm12(natalMoonSign + 1) },
  ];

  // Determine current phase (if any)
  const currentEntry = phaseSigns.find((p) => p.sign === currentSaturnSign);
  const currentPhase = currentEntry?.phase ?? null;
  const active = currentPhase !== null;

  // Locate windows by scanning outward. Strategy: find each phase's future start (or current start if active).
  const windows: SadeSatiWindow[] = [];

  // Anchor: walk backward until Saturn is in sign (Rising - 1) = natalMoonSign - 2 (before Sade Sati begins).
  // Then step forward, capturing each ingress into the three phase signs.
  const twoSignsBefore = norm12(natalMoonSign - 2);

  // Find the most recent moment Saturn was in `twoSignsBefore` (i.e. end-boundary going backward).
  // Simpler: scan forward from `now - 12y` catching phase entries until we've captured all three phases nearest to `now`.
  let cursor = new Date(now.getTime() - 12 * 365.25 * 86400000);
  let prevSign = saturnSign(cursor);
  const ingresses: Array<{ date: Date; sign: number }> = [{ date: cursor, sign: prevSign }];
  const stepDays = 15;
  const scanEnd = new Date(now.getTime() + 20 * 365.25 * 86400000);
  while (cursor < scanEnd) {
    cursor = new Date(cursor.getTime() + stepDays * 86400000);
    const s = saturnSign(cursor);
    if (s !== prevSign) {
      const boundary = refineBoundary(cursor, 1, prevSign);
      ingresses.push({ date: boundary, sign: s });
      prevSign = s;
    }
  }

  // For each phase, find the pair of consecutive ingresses [enter phase-sign, leave phase-sign] that brackets `now` or is nearest to it.
  for (const { phase, sign } of phaseSigns) {
    // All entries where Saturn enters `sign`
    const enters = ingresses
      .map((e, i) => ({ ...e, next: ingresses[i + 1] }))
      .filter((e) => e.sign === sign && e.next);
    if (enters.length === 0) continue;
    // Pick the one whose interval contains `now`, else the nearest upcoming.
    const nowMs = now.getTime();
    let pick = enters.find((e) => e.date.getTime() <= nowMs && e.next!.date.getTime() >= nowMs);
    if (!pick) pick = enters.find((e) => e.date.getTime() > nowMs) ?? enters[enters.length - 1];
    windows.push({
      phase,
      sign,
      start: pick.date,
      end: pick.next!.date,
      active: pick.date.getTime() <= nowMs && pick.next!.date.getTime() >= nowMs,
    });
  }

  // Sort chronologically
  windows.sort((a, b) => a.start.getTime() - b.start.getTime());

  return { natalMoonSign, currentSaturnSign, currentPhase, active, windows };
}
