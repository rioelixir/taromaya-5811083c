// Central registry of every astronomical/astrological model the engine uses,
// with a human-readable validation status. This backs the accuracy
// transparency panel and the admin diagnostics view — nothing else in the
// app should hardcode these strings.

import { ENGINE_VERSION } from "./chart-config";

export type ModelStatus = "verified" | "approximate" | "fallback";

export type ModelInfo = {
  key: string;
  label: string;
  source: string;      // reference / provenance
  status: ModelStatus; // how confident we are
  notes?: string;
};

export const ENGINE_MODELS: ModelInfo[] = [
  {
    key: "planetary-positions",
    label: "Planetary positions",
    source: "astronomy-engine (JPL DE440-grade)",
    status: "verified",
    notes: "Pure-JS ephemeris, arcsecond-level for 1600–2100.",
  },
  {
    key: "obliquity",
    label: "Obliquity of the ecliptic",
    source: "IAU 2006 / Laskar mean + astronomy-engine nutation",
    status: "verified",
    notes: "True obliquity (mean + nutation) paired with apparent sidereal time.",
  },
  {
    key: "ayanamsa-lahiri",
    label: "Lahiri (Chitrapaksha) ayanamsa",
    source: "SE_SIDM_LAHIRI reference epoch",
    status: "verified",
    notes: "Sub-arcsecond match to Swiss Ephemeris across 1900–2100.",
  },
  {
    key: "ascendant",
    label: "Ascendant / Lagna",
    source: "Meeus, Astronomical Algorithms",
    status: "verified",
    notes: "atan2(cos H, −(sinε·tanφ + cosε·sinH)) branch — India-Independence regression Vrishabha Lagna.",
  },
  {
    key: "lunar-nodes",
    label: "Rahu / Ketu (True Node)",
    source: "astronomy-engine osculating node",
    status: "verified",
    notes: "180° opposition invariant enforced by test.",
  },
  {
    key: "fixed-stars",
    label: "Fixed-star longitudes",
    source: "J2000 catalog + IAU 1976 precession",
    status: "approximate",
    notes: "General precession only; proper motion not applied.",
  },
  {
    key: "houses-placidus",
    label: "Placidus houses",
    source: "Porphyry fallback (see notes)",
    status: "fallback",
    notes: "Classical Placidus iteration is disabled pending a validated multi-root solver at high latitudes. Requests for 'placidus' return Porphyry cusps (deterministic, no polar failure).",
  },
  {
    key: "houses-whole-sign",
    label: "Whole-sign houses",
    source: "Traditional Vedic",
    status: "verified",
  },
  {
    key: "houses-equal",
    label: "Equal houses",
    source: "30° from Ascendant",
    status: "verified",
  },
  {
    key: "divisional-charts",
    label: "Divisional charts (Vargas D1–D60)",
    source: "Parashara BPHS rules",
    status: "verified",
  },
  {
    key: "vimshottari-dasha",
    label: "Vimshottari Mahadasha",
    source: "Nakshatra-based 120-year cycle",
    status: "verified",
  },
];

export function modelByKey(key: string): ModelInfo | undefined {
  return ENGINE_MODELS.find((m) => m.key === key);
}

export const STATUS_LABEL: Record<ModelStatus, string> = {
  verified: "Verified",
  approximate: "Approximate",
  fallback: "Fallback",
};

export function engineMeta() {
  return {
    engineVersion: ENGINE_VERSION,
    generatedAt: new Date().toISOString(),
    models: ENGINE_MODELS,
  };
}
