// Today's sky (gochara) for the place the chart was cast for.
// Everything comes from the same sidereal engine the birth chart uses.

import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { GlassCard } from "@/components/page-shell";
import {
  computeKundli, formatDegree, PLANET_GLYPHS, type KundliChart,
} from "@/lib/vedic";

/** Refresh the sky every 10 minutes so the panel is never stale or blank. */
const TICK_MS = 10 * 60 * 1000;

export function CurrentTransit({
  chart,
  latitude,
  longitude,
  tzOffsetHours,
  place,
}: {
  chart: KundliChart;
  latitude: number;
  longitude: number;
  tzOffsetHours: number;
  place?: string;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const { sky, error } = useMemo(() => {
    try {
      // Local wall-clock at the chart's place for the current instant.
      const localMs = now.getTime() + tzOffsetHours * 3600 * 1000;
      const l = new Date(localMs);
      return {
        sky: computeKundli({
          year: l.getUTCFullYear(),
          month: l.getUTCMonth() + 1,
          day: l.getUTCDate(),
          hour: l.getUTCHours(),
          minute: l.getUTCMinutes(),
          seconds: l.getUTCSeconds(),
          tzOffsetHours,
          latitude,
          longitude,
        }),
        error: null as string | null,
      };
    } catch (e) {
      return { sky: null, error: e instanceof Error ? e.message : "Could not read the sky." };
    }
  }, [now, latitude, longitude, tzOffsetHours]);

  const localLabel = new Date(now.getTime() + tzOffsetHours * 3600 * 1000)
    .toISOString().slice(0, 16).replace("T", " ");

  return (
    <GlassCard
      title="Current transit"
      desc={`Where every planet is right now, and which house it is walking through in your chart.`}
    >
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span>
          {place ? `${place} · ` : ""}local time {localLabel}
        </span>
        <button
          onClick={() => setNow(new Date())}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-pearl hover:bg-white/10"
        >
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-200">
          {error}
        </div>
      )}

      {sky && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {sky.planets.map((p) => {
            const house = ((p.rashi - chart.ascendant.rashi + 12) % 12) + 1;
            return (
              <div
                key={p.name}
                className="rounded-xl border border-white/10 bg-black/25 p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg text-gold">{PLANET_GLYPHS[p.name]}</span>
                  <span className="text-sm text-pearl">{p.name}</span>
                  {p.retrograde && <span className="text-[10px] text-cyan-300">going back</span>}
                  <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">
                    house {house}
                  </span>
                </div>
                <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                  sign {p.rashi + 1} · {formatDegree(p.degreeInRashi)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {sky && (
        <div className="mt-3 text-[11px] text-muted-foreground">
          Signs are shown as numbers 1 to 12. Houses are counted from your rising sign.
          This panel updates on its own.
        </div>
      )}
    </GlassCard>
  );
}
