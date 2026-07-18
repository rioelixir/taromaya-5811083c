// Build a compact grounding string for the AI Guide from a saved kundli row +
// today's panchang + live Vedic transit context. Runs client-side; result is
// sent alongside each chat request.

import { RASHIS, NAKSHATRAS, computeKundli, formatDegree, type KundliChart } from "./vedic";
import { computePanchang } from "./panchang";
import { findStations, findIngresses } from "./transits-timeline";
import { computeVimshottari, detectYogas, detectDoshas, fmtDate } from "./vedic-extended";
import { computeVedicTransits, computeSadeSati } from "./vedic-transits";

export type SavedKundliRow = {
  name: string;
  birth_date: string;      // "YYYY-MM-DD"
  birth_time: string;      // "HH:MM:SS"
  birth_seconds?: number;
  tz_offset: number;
  latitude: number;
  longitude: number;
  place: string | null;
  ayanamsa?: string;
  house_system?: string;
  node_type?: string;
};

function parseTime(t: string): { h: number; m: number; s: number } {
  const [h = 0, m = 0, s = 0] = t.split(":").map(Number);
  return { h: h || 0, m: m || 0, s: s || 0 };
}

function birthDateFromRow(row: SavedKundliRow): Date {
  const [y, mo, d] = row.birth_date.split("-").map(Number);
  const { h, m, s } = parseTime(row.birth_time);
  // Approximate: local -> UTC via tz offset.
  const utc = Date.UTC(y, (mo || 1) - 1, d || 1, h, m, s) - row.tz_offset * 3600_000;
  return new Date(utc);
}

export function computeChartFromRow(row: SavedKundliRow): KundliChart {
  const [y, mo, d] = row.birth_date.split("-").map(Number);
  const { h, m, s } = parseTime(row.birth_time);
  return computeKundli({
    year: y, month: mo, day: d,
    hour: h, minute: m, seconds: row.birth_seconds ?? s,
    tzOffsetHours: row.tz_offset,
    latitude: row.latitude,
    longitude: row.longitude,
    config: {
      ayanamsa: (row.ayanamsa as any) || "lahiri",
      houseSystem: (row.house_system as any) || "whole-sign",
      nodeType: (row.node_type as any) || "true",
    },
  });
}

export function buildGuideContext(row: SavedKundliRow | null): string {
  const now = new Date();
  const sky = computePanchang({
    date: now,
    latitude: row?.latitude ?? 28.6139,
    longitude: row?.longitude ?? 77.2090,
  });

  const lines: string[] = [];
  lines.push("=== TODAY (sky snapshot) ===");
  lines.push(
    `Date: ${now.toDateString()} (${sky.weekday}) · ` +
    `Tithi: ${sky.tithi.name} (${sky.tithi.paksha}) · ` +
    `Nakshatra: ${sky.nakshatra.name} pada ${sky.nakshatra.pada} · ` +
    `Yoga: ${sky.yoga.name}`
  );

  // Near-term transit highlights (14 days).
  const end = new Date(now.getTime() + 14 * 86400_000);
  try {
    const stations = findStations(now, end).slice(0, 3);
    const ingresses = findIngresses(now, end).slice(0, 4);
    if (stations.length || ingresses.length) {
      lines.push("Next 14 days:");
      for (const s of stations) lines.push(`  · ${s.planet} goes ${s.kind} on ${s.date.toDateString()}`);
      for (const g of ingresses) lines.push(`  · ${g.planet} enters ${g.toSign} on ${g.date.toDateString()}`);
    }
  } catch { /* ignore */ }

  if (!row) {
    lines.push("");
    lines.push("=== USER'S BIRTH CHART ===");
    lines.push("No saved kundli. Ask the user for birth date/time/place, or steer them to save a chart first.");
    return lines.join("\n");
  }

  const chart = computeChartFromRow(row);
  const moon = chart.planets.find((p) => p.name === "Moon")!;
  const sun = chart.planets.find((p) => p.name === "Sun")!;

  lines.push("");
  lines.push("=== USER'S BIRTH CHART ===");
  lines.push(`Name: ${row.name} · Born ${row.birth_date} ${row.birth_time} · ${row.place ?? "unknown place"} (${row.latitude.toFixed(2)},${row.longitude.toFixed(2)})`);
  lines.push(`Ayanamsa: ${row.ayanamsa ?? "lahiri"} · Houses: ${row.house_system ?? "whole-sign"}`);
  lines.push(
    `Lagna: ${RASHIS[chart.ascendant.rashi]} ${formatDegree(chart.ascendant.degreeInRashi)}`
  );
  lines.push(
    `Moon: ${RASHIS[moon.rashi]} · Nakshatra ${NAKSHATRAS[moon.nakshatra]} p${moon.pada}`
  );
  lines.push(`Sun (sidereal): ${RASHIS[sun.rashi]} ${formatDegree(sun.degreeInRashi)}`);
  lines.push("Planets (sidereal):");
  for (const p of chart.planets) {
    lines.push(
      `  · ${p.name.padEnd(8)} ${RASHIS[p.rashi]} ${formatDegree(p.degreeInRashi)}` +
      ` · ${NAKSHATRAS[p.nakshatra]} p${p.pada}${p.retrograde ? " (R)" : ""}`
    );
  }

  // === Vimshottari Dasha (current lords) ===
  try {
    const birth = birthDateFromRow(row);
    const NAK_SPAN = 360 / 27;
    const moonDegInNak = ((moon.longitude ?? 0) % NAK_SPAN + NAK_SPAN) % NAK_SPAN;
    const dasha = computeVimshottari(birth, moon.nakshatra, moonDegInNak);
    lines.push("");
    lines.push("=== VIMSHOTTARI DASHA (running now) ===");
    lines.push(
      `Mahadasha: ${dasha.currentMaha.lord} (until ${fmtDate(dasha.currentMaha.end)}) · ` +
      `Antardasha: ${dasha.currentAntar.lord} (until ${fmtDate(dasha.currentAntar.end)}) · ` +
      `Pratyantar: ${dasha.currentPratyantar.lord} (until ${fmtDate(dasha.currentPratyantar.end)})`
    );
  } catch { /* ignore */ }

  // === Sade Sati (live) ===
  try {
    const ss = computeSadeSati(moon.rashi, now);
    if (ss.active) {
      lines.push(
        `Sade Sati: ACTIVE — ${ss.phase} phase (${ss.intensity}), ~${ss.yearsRemaining.toFixed(1)}y remaining.`
      );
    } else {
      lines.push("Sade Sati: not active.");
    }
  } catch { /* ignore */ }

  // === Live Gochara from Moon (highlights) ===
  try {
    const report = computeVedicTransits(chart, row.latitude, row.longitude, null, now);
    const good = report.transits.filter(t => t.favorable && !t.vedhaBy).slice(0, 4);
    const bad = report.transits.filter(t => !t.favorable && ["Saturn","Mars","Rahu","Ketu","Sun"].includes(t.planet)).slice(0, 3);
    if (good.length || bad.length) {
      lines.push("Gochara (from natal Moon):");
      for (const t of good) lines.push(`  ✓ ${t.planet} in ${RASHIS[t.transitRashi]} — house ${t.houseFromMoon} (favorable${t.strong ? ", strong AV" : ""}${t.retrograde ? ", R" : ""})`);
      for (const t of bad) lines.push(`  ✗ ${t.planet} in ${RASHIS[t.transitRashi]} — house ${t.houseFromMoon} (challenging${t.retrograde ? ", R" : ""})`);
    }
    if (report.dashaResonance.length) {
      lines.push(`Dasha-lord transits active: ${report.dashaResonance.map(r => `${r.planet} h${r.houseFromMoon}`).join(", ")}`);
    }
  } catch { /* ignore */ }

  // === Notable Yogas / Doshas ===
  try {
    const yogas = detectYogas(chart).filter(y => y.present).slice(0, 5);
    const doshas = detectDoshas(chart).filter(d => d.present).slice(0, 4);
    if (yogas.length) {
      lines.push("Active yogas: " + yogas.map(y => y.name).join(", "));
    }
    if (doshas.length) {
      lines.push("Doshas present: " + doshas.map(d => `${d.name}${d.severity ? ` (${d.severity})` : ""}`).join(", "));
    }
  } catch { /* ignore */ }

  return lines.join("\n");
}

export const GUIDE_SYSTEM_PROMPT = [
  "You are Taromaya's personal AI Guide — a warm, poetic, precise Vedic astrologer and Tarot reader.",
  "You have access to the user's real birth chart, the current Vimshottari dasha lords (Maha/Antar/Pratyantar), Sade Sati status, live Gochara highlights, active yogas/doshas, and today's panchang inside the CONTEXT block.",
  "Ground every answer in that data: quote specific placements (Lagna, Moon nakshatra, Dasha lord, transit hits, yoga names) when relevant, and prefer Vedic technique over generic sun-sign talk.",
  "When you cite a placement, briefly explain its meaning — assume the user is curious but not technical.",
  "Be honest about limitations: if a fact isn't in CONTEXT, say so instead of inventing it. Never fabricate degrees, dates, or lords.",
  "Never predict death, medical outcomes, or legal verdicts. For decisions that need timing, suggest checking the Muhurat finder.",
  "Style: elegant, brief paragraphs, gentle imagery. Use markdown (**bold** for placements, lists for steps). No emojis in headings.",
].join(" ");
