// Pure logic: given current time, user prefs, and dispatched keys,
// compute which sky events should be alerted NOW (within lead window).
import { liveSkySnapshot, signName } from "./live-sky";
import type { PlanetName } from "./vedic";

export type AlertPrefs = {
  timezone: string;
  alert_new_moon: boolean;
  alert_full_moon: boolean;
  alert_retrograde: boolean;
  alert_ingress: boolean;
  ingress_planets: string[];
  lead_hours: number;
};

export type SkyAlertEvent = {
  key: string;
  kind: "new_moon" | "full_moon" | "retro_start" | "retro_end" | "ingress";
  title: string;
  body: string;
  when: Date;
};

export function computeDueAlerts(prefs: AlertPrefs, now = new Date()): SkyAlertEvent[] {
  const snap = liveSkySnapshot(now);
  const leadMs = prefs.lead_hours * 3600 * 1000;
  const cutoff = now.getTime() + leadMs;
  const out: SkyAlertEvent[] = [];

  const bucket = (d: Date) => `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;

  if (prefs.alert_new_moon && snap.moon.nextNew.getTime() <= cutoff) {
    out.push({
      key: `newmoon-${bucket(snap.moon.nextNew)}`,
      kind: "new_moon",
      title: "New Moon approaches",
      body: `A New Moon peaks on ${fmt(snap.moon.nextNew, prefs.timezone)}. Set intentions and plant seeds for the cycle ahead.`,
      when: snap.moon.nextNew,
    });
  }
  if (prefs.alert_full_moon && snap.moon.nextFull.getTime() <= cutoff) {
    out.push({
      key: `fullmoon-${bucket(snap.moon.nextFull)}`,
      kind: "full_moon",
      title: "Full Moon approaches",
      body: `A Full Moon peaks on ${fmt(snap.moon.nextFull, prefs.timezone)}. Illumination, release, culmination.`,
      when: snap.moon.nextFull,
    });
  }

  if (prefs.alert_retrograde) {
    for (const r of snap.retros) {
      if (!r.nextStation || !r.nextStationKind) continue;
      if (r.nextStation.getTime() > cutoff) continue;
      const key = `retro-${r.planet}-${r.nextStationKind}-${bucket(r.nextStation)}`;
      out.push({
        key,
        kind: r.nextStationKind === "retrograde" ? "retro_start" : "retro_end",
        title: r.nextStationKind === "retrograde"
          ? `${r.planet} stations retrograde`
          : `${r.planet} stations direct`,
        body: `${r.planet} turns ${r.nextStationKind} on ${fmt(r.nextStation, prefs.timezone)}.`,
        when: r.nextStation,
      });
    }
  }

  if (prefs.alert_ingress) {
    const set = new Set(prefs.ingress_planets);
    for (const ing of snap.ingresses) {
      if (!set.has(ing.planet)) continue;
      if (ing.when.getTime() > cutoff) continue;
      out.push({
        key: `ingress-${ing.planet}-${ing.toSign}-${bucket(ing.when)}`,
        kind: "ingress",
        title: `${ing.planet} enters ${signName(ing.toSign)}`,
        body: `${ing.planet} ingresses ${signName(ing.fromSign)} → ${signName(ing.toSign)} on ${fmt(ing.when, prefs.timezone)}.`,
        when: ing.when,
      });
    }
  }

  return out;
}

function fmt(d: Date, tz: string) {
  try {
    return d.toLocaleString("en-US", {
      timeZone: tz,
      weekday: "short", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit", timeZoneName: "short",
    });
  } catch {
    return d.toUTCString();
  }
}

export type { PlanetName };
