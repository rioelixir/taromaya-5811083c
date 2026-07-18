// Astrology chart configuration. Stored with every saved chart so results
// are always reproducible across engine upgrades.

export const AYANAMSAS = ["lahiri", "raman", "kp-old", "kp-new", "tropical"] as const;
export type Ayanamsa = (typeof AYANAMSAS)[number];

export const HOUSE_SYSTEMS = ["whole-sign", "placidus", "koch", "equal", "sripati", "bhava-chalit"] as const;
export type HouseSystem = (typeof HOUSE_SYSTEMS)[number];

export const NODE_TYPES = ["mean", "true"] as const;
export type NodeType = (typeof NODE_TYPES)[number];

export type ChartConfig = {
  ayanamsa: Ayanamsa;
  houseSystem: HouseSystem;
  nodeType: NodeType;
  elevationMeters: number;
  topocentric: boolean;
};

export const ENGINE_VERSION = "taromaya-ephem@1.0.0";

export const DEFAULT_CHART_CONFIG: ChartConfig = {
  ayanamsa: "lahiri",
  houseSystem: "whole-sign",
  nodeType: "true",
  elevationMeters: 0,
  topocentric: false,
};

export const AYANAMSA_LABELS: Record<Ayanamsa, string> = {
  "lahiri": "Lahiri (Chitrapaksha)",
  "raman": "B.V. Raman",
  "kp-old": "KP Old (Krishnamurti)",
  "kp-new": "KP New",
  "tropical": "Tropical (Western)",
};

export const HOUSE_SYSTEM_LABELS: Record<HouseSystem, string> = {
  "whole-sign": "Whole Sign (Vedic default)",
  "placidus": "Placidus",
  "koch": "Koch",
  "equal": "Equal House",
  "sripati": "Sripati",
  "bhava-chalit": "Bhava Chalit",
};

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  mean: "Mean Node",
  true: "True Node",
};

// Offsets in degrees applied on top of Lahiri to derive other siderealsystems.
// These are established rough offsets — good to arc-minute precision, which is
// far below the resolution most Vedic charts consume.
export const AYANAMSA_OFFSET_FROM_LAHIRI: Record<Ayanamsa, number> = {
  "lahiri": 0,
  "raman": -0.883,
  "kp-old": -0.06666,
  "kp-new": -0.02,
  "tropical": 0, // handled specially: ayanamsa = 0
};

/** Deterministic fingerprint of a config — used as cache key. */
export function hashChartConfig(cfg: ChartConfig): string {
  return [
    cfg.ayanamsa,
    cfg.houseSystem,
    cfg.nodeType,
    cfg.elevationMeters.toFixed(1),
    cfg.topocentric ? "topo" : "geo",
  ].join("|");
}
