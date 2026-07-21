// Collapsible "Calculation Settings" info panel. Renders under any chart to
// show exactly which zodiac system, ayanamsa, house system, node type,
// coordinates, timezone, ascendant, engine version, and computation
// timestamp were used to produce the visible result.

import { useState } from "react";
import { ChevronDown, Settings2 } from "lucide-react";
import { AYANAMSA_LABELS, HOUSE_SYSTEM_LABELS, NODE_TYPE_LABELS, ENGINE_VERSION, type ChartConfig } from "@/lib/chart-config";

export type CalcSettings = {
  zodiac: "Sidereal" | "Tropical";
  config: ChartConfig;
  latitude: number;
  longitude: number;
  placeLabel?: string;
  localTimeIso: string;   // ISO with tz offset e.g. 1995-06-15T07:45:00+05:30
  utcTimeIso: string;
  tzOffsetHours: number;
  ascendantLongitude: number;
  ascendantSign: string;
  computedAt?: string;
};

function fmtDeg(x: number): string {
  const d = Math.floor(x);
  const mFloat = (x - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60);
  return `${d}°${String(m).padStart(2,"0")}′${String(s).padStart(2,"0")}″`;
}

export function CalcSettingsPanel({ settings }: { settings: CalcSettings }) {
  const [open, setOpen] = useState(false);
  const rows: [string, string][] = [
    ["Zodiac system", settings.zodiac],
    ["Ayanamsa", AYANAMSA_LABELS[settings.config.ayanamsa]],
    ["House system", HOUSE_SYSTEM_LABELS[settings.config.houseSystem]],
    ["Rahu/Ketu type", NODE_TYPE_LABELS[settings.config.nodeType]],
    ["Birthplace", settings.placeLabel ?? `${settings.latitude.toFixed(4)}°, ${settings.longitude.toFixed(4)}°`],
    ["Coordinates", `${settings.latitude.toFixed(4)}°, ${settings.longitude.toFixed(4)}°`],
    ["Local time", settings.localTimeIso.replace("T"," ").replace(/\.\d+Z?$/,"")],
    ["Timezone", `UTC${settings.tzOffsetHours >= 0 ? "+" : ""}${settings.tzOffsetHours}`],
    ["UTC time", settings.utcTimeIso.replace("T"," ").replace(/\.\d+Z?$/,"")],
    ["Ascendant", `${settings.ascendantSign} · ${fmtDeg(settings.ascendantLongitude % 30)} (${settings.ascendantLongitude.toFixed(4)}° absolute)`],
    ["Engine version", ENGINE_VERSION],
    ["Last calculation", settings.computedAt ?? new Date().toISOString().replace("T"," ").replace(/\..+/, " UTC")],
  ];
  return (
    <section className="glass-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        aria-expanded={open}
        aria-controls="calc-settings-body"
      >
        <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
          <Settings2 className="h-4 w-4 text-primary" />
          Calculation Settings
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <dl id="calc-settings-body" className="grid grid-cols-1 gap-x-6 gap-y-2 border-t border-white/10 px-4 py-3 text-xs sm:grid-cols-2">
          {rows.map(([k, v]) => (
            <div key={k} className="flex flex-col">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-mono text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
