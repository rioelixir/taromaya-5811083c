// Build a compact grounding string for the AI Guide from a saved kundli row +
// today's panchang. Runs client-side; result is sent along with each chat request.

import { RASHIS, NAKSHATRAS, computeKundli, formatDegree, type KundliChart } from "./vedic";
import { computePanchang } from "./panchang";
import { findStations, findIngresses } from "./transits-timeline";

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
  const stations = findStations(now, end).slice(0, 3);
  const ingresses = findIngresses(now, end).slice(0, 4);
  if (stations.length || ingresses.length) {
    lines.push("Next 14 days:");
    for (const s of stations) lines.push(`  · ${s.body} goes ${s.direction} on ${s.date.toDateString()}`);
    for (const g of ingresses) lines.push(`  · ${g.body} enters ${g.to} on ${g.date.toDateString()}`);
  }

  if (!row) {
    lines.push("");
    lines.push("=== USER'S BIRTH CHART ===");
    lines.push("No saved kundli. Ask the user for birth date/time/place, or steer them to save a chart first.");
    return lines.join("\n");
  }

  const chart = computeChartFromRow(row);
  const moon = chart.planets.find(p => p.name === "Moon")!;
  const sun = chart.planets.find(p => p.name === "Sun")!;

  lines.push("");
  lines.push("=== USER'S BIRTH CHART ===");
  lines.push(`Name: ${row.name} · Born ${row.birth_date} ${row.birth_time} · ${row.place ?? "unknown place"} (${row.latitude.toFixed(2)},${row.longitude.toFixed(2)})`);
  lines.push(`Ayanamsa: ${row.ayanamsa ?? "lahiri"} · House system: ${row.house_system ?? "whole-sign"}`);
  lines.push(
    `Lagna (Ascendant): ${RASHIS[chart.ascendant.rashi]} at ${formatDegree(chart.ascendant.degreeInRashi)}`
  );
  lines.push(
    `Moon: ${RASHIS[moon.rashi]} · Nakshatra ${NAKSHATRAS[moon.nakshatra]} (pada ${moon.pada})`
  );
  lines.push(`Sun (sidereal): ${RASHIS[sun.rashi]} at ${formatDegree(sun.degreeInRashi)}`);
  lines.push("Planets (sidereal):");
  for (const p of chart.planets) {
    lines.push(
      `  · ${p.name.padEnd(8)} ${RASHIS[p.rashi]} ${formatDegree(p.degreeInRashi)}` +
      ` · ${NAKSHATRAS[p.nakshatra]} p${p.pada}${p.retrograde ? " (R)" : ""}`
    );
  }
  return lines.join("\n");
}

export const GUIDE_SYSTEM_PROMPT = [
  "You are Taromaya's personal AI Guide — a warm, poetic, precise Vedic astrologer and Tarot reader.",
  "You have access to the user's real birth chart and today's sky in the CONTEXT block.",
  "Ground every answer in that data: quote specific placements (Lagna, Moon, Dasha lord, transit hits) when relevant.",
  "Be honest about limitations: if a fact isn't in CONTEXT, say so instead of inventing it.",
  "Never predict death, medical outcomes, or legal verdicts. For decisions that need timing, suggest checking the Muhurat finder.",
  "Style: elegant, brief paragraphs, gentle imagery. Use markdown (**bold** for placements, lists for steps). No emojis in headings.",
].join(" ");
