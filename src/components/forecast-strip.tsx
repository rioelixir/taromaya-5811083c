import { useMemo } from "react";
import { GlassCard } from "@/components/page-shell";
import { buildDailyStrip, pickPeaks, type DailyCell } from "@/lib/forecast-strip";
import type { EclipseEvent, Ingress, Station, TimelineHit } from "@/lib/transits-timeline";
import { fmtDay } from "@/lib/transits-timeline";
import { Flame, Sparkles, Zap } from "lucide-react";

type Props = {
  start: Date;
  end: Date;
  hits: TimelineHit[];
  stations: Station[];
  ingresses: Ingress[];
  eclipses: EclipseEvent[];
};

function toneColor(tone: number, score: number) {
  const a = Math.min(1, score / 100);
  if (tone > 15) return `rgba(110, 231, 183, ${0.15 + a * 0.75})`;   // emerald
  if (tone < -15) return `rgba(248, 113, 113, ${0.15 + a * 0.75})`;  // red
  return `rgba(232, 197, 122, ${0.15 + a * 0.75})`;                  // gold
}

export function ForecastStrip({ start, end, hits, stations, ingresses, eclipses }: Props) {
  const strip = useMemo(
    () => buildDailyStrip(start, end, hits, stations, ingresses, eclipses),
    [start, end, hits, stations, ingresses, eclipses],
  );
  const peaks = useMemo(() => pickPeaks(strip, 8), [strip]);

  // Chunk into months for readable header labels.
  const months: { key: string; label: string; cells: DailyCell[] }[] = [];
  for (const c of strip) {
    const key = `${c.date.getFullYear()}-${c.date.getMonth()}`;
    const last = months[months.length - 1];
    if (!last || last.key !== key) {
      months.push({
        key,
        label: c.date.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
        cells: [c],
      });
    } else last.cells.push(c);
  }

  return (
    <div className="space-y-4">
      <GlassCard title="Forecast strip — daily intensity">
        <div className="mb-3 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: "rgba(110,231,183,0.85)" }} /> Flowing</span>
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: "rgba(232,197,122,0.85)" }} /> Charged</span>
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: "rgba(248,113,113,0.85)" }} /> Testing</span>
          <span className="ml-auto"><Flame className="inline w-3 h-3 mr-1 text-gold" /> Height = intensity</span>
        </div>
        <div className="space-y-3 overflow-x-auto">
          {months.map((m) => (
            <div key={m.key} className="min-w-[600px]">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{m.label}</div>
              <div className="flex items-end gap-[2px] h-24">
                {m.cells.map((c, i) => {
                  const h = Math.max(4, c.score);
                  const tt = c.label ? `${fmtDay(c.date)} — ${c.label} (i${c.score})` : fmtDay(c.date);
                  return (
                    <div
                      key={i}
                      title={tt}
                      className="flex-1 rounded-sm transition-transform hover:scale-y-110 origin-bottom"
                      style={{
                        height: `${h}%`,
                        background: toneColor(c.tone, c.score),
                        boxShadow: c.score > 65 ? "0 0 8px rgba(232,197,122,0.55)" : undefined,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard title="Peak days">
        {peaks.length === 0 ? (
          <div className="text-sm text-muted-foreground">Quiet stretch — no standout peaks.</div>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {peaks.map((p, i) => (
              <li key={i} className="rounded-xl bg-white/5 p-3 flex items-start gap-3">
                <div className="mt-0.5">
                  {p.tone > 15 ? <Sparkles className="w-4 h-4 text-emerald-300" />
                    : p.tone < -15 ? <Zap className="w-4 h-4 text-red-400" />
                    : <Flame className="w-4 h-4 text-gold" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-pearl font-medium">{fmtDay(p.date)}</span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">intensity {p.score}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{p.label || "Multiple crossings"}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
