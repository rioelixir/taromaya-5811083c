import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  kpPlanets,
  kpCusps,
  cuspalSignificators,
  rulingPlanets,
  KP_RASHIS,
  KP_NAKSHATRAS,
  type ChartLite,
} from "@/lib/kp";

type Props = { chart: ChartLite };
type Tab = "positions" | "cusps" | "significators" | "ruling";

const TABS: { id: Tab; label: string }[] = [
  { id: "positions", label: "Positions" },
  { id: "cusps", label: "Cusps" },
  { id: "significators", label: "Significators" },
  { id: "ruling", label: "Ruling Planets" },
];

const chipCls =
  "inline-flex items-center rounded-full border border-border/40 bg-background/40 px-2 py-0.5 font-mono text-[10px]";

export function KPPanel({ chart }: Props) {
  const [tab, setTab] = useState<Tab>("positions");

  const positions = useMemo(() => kpPlanets(chart), [chart]);
  const cusps = useMemo(() => kpCusps(chart), [chart]);
  const sig = useMemo(() => cuspalSignificators(chart), [chart]);

  const ruling = useMemo(() => {
    // Live ruling-planet snapshot uses the natal Moon and natal Lagna as
    // a fallback when no live sidereal engine is threaded in.
    const moon = chart.planets.find((p) => p.name === "Moon");
    if (!moon) return null;
    const asc = chart.ascendant.rashi * 30 + chart.ascendant.degreeInRashi;
    return rulingPlanets(new Date(), asc, moon.longitude);
  }, [chart]);

  return (
    <Card className="glass-card space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-serif text-lg">KP System</h3>
          <p className="text-xs text-muted-foreground">
            Krishnamurti Paddhati · sub-lords, cuspal significators, ruling planets
          </p>
        </div>
        <div className="inline-flex overflow-hidden rounded-full border border-border/50 bg-background/40 text-xs">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 ${tab === t.id ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {(tab === "positions" || tab === "cusps") && (
        <div className="grid gap-2 sm:grid-cols-2">
          {(tab === "positions" ? positions : cusps).map((r, i) => (
            <div key={i} className="rounded-lg border border-border/40 bg-background/30 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm text-primary">{r.who}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {KP_RASHIS[r.sign]} · {KP_NAKSHATRAS[r.nakshatra]}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[11px]">
                <span className={chipCls + " border-primary/40 bg-primary/10 text-primary"}>{r.starLord}</span>
                <span className="text-muted-foreground">→</span>
                <span className={chipCls + " border-primary/40 bg-primary/10 text-primary"}>{r.subLord}</span>
                <span className="text-muted-foreground">→</span>
                <span className={chipCls + " text-muted-foreground"}>{r.subSubLord}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "significators" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            4-fold significators per house: A) planets in star of occupants,
            B) occupants, C) planets in star of house-lord, D) house-lord.
          </p>
          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {sig.map((row) => (
              <div key={row.house} className="rounded-lg border border-border/40 bg-background/30 p-3 text-xs">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-sm text-primary">House {row.house}</span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{KP_RASHIS[row.sign]}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {([["A", row.A], ["B", row.B], ["C", row.C], ["D", row.D]] as const).map(([k, arr]) => (
                    <div key={k}>
                      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{k}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {arr.length ? arr.map((n) => <span key={n} className={chipCls}>{n}</span>) : <span className="text-muted-foreground">—</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 border-t border-border/30 pt-2">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Combined</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {row.combined.map((n) => <span key={n} className={chipCls + " border-primary/40 text-primary"}>{n}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {tab === "ruling" && (
        <div className="space-y-3 text-xs">
          {!ruling ? (
            <p className="text-muted-foreground">Moon position required.</p>
          ) : (
            <>
              <p className="text-muted-foreground">
                Ruling planets for the query moment. Live-transit variants are
                used across Horary and event-timing selections.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  ["Weekday lord", ruling.weekdayLord],
                  ["Moon sign lord", ruling.moonSignLord],
                  ["Moon star lord", ruling.moonStarLord],
                  ["Moon sub lord", ruling.moonSubLord],
                  ["Lagna sign lord", ruling.ascSignLord],
                  ["Lagna star lord", ruling.ascStarLord],
                  ["Lagna sub lord", ruling.ascSubLord],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between rounded-lg border border-border/40 bg-background/30 px-3 py-2">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-mono text-primary">{v}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Combined RP set</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {ruling.combined.map((n) => (
                    <span key={n} className={chipCls}>{n}</span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
