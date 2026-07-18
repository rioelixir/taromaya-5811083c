import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  computeCharaKarakas,
  computeArudhaPadas,
  computeCharaDasha,
  KARAKA_MEANING,
  RASHIS,
  type ChartLite,
  type CharaKaraka,
} from "@/lib/jaimini";

type Props = {
  chart: ChartLite;
  birthDate?: Date | null;
};

type Tab = "karakas" | "arudhas" | "dasha";

const TABS: { id: Tab; label: string }[] = [
  { id: "karakas", label: "Chara Karakas" },
  { id: "arudhas", label: "Arudha Padas" },
  { id: "dasha", label: "Chara Dasha" },
];

const fmtDate = (d: Date) =>
  d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });

export function JaiminiPanel({ chart, birthDate }: Props) {
  const [tab, setTab] = useState<Tab>("karakas");

  const karakas = useMemo(() => computeCharaKarakas(chart), [chart]);
  const arudhas = useMemo(() => computeArudhaPadas(chart), [chart]);
  const dasha = useMemo(
    () => (birthDate ? computeCharaDasha(chart, birthDate, 2) : []),
    [chart, birthDate],
  );

  const now = Date.now();

  return (
    <Card className="glass-card space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="font-serif text-lg">Jaimini</h3>
          <p className="text-xs text-muted-foreground">
            Chara Karakas · Arudha Padas · Chara Dasha
          </p>
        </div>
        <div className="inline-flex overflow-hidden rounded-full border border-border/50 bg-background/40 text-xs">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 ${
                tab === t.id ? "bg-primary/20 text-primary" : "text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "karakas" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Ranked by advancement within sign (Rahu reversed). The Atmakaraka (AK) is
            the soul-signifier of the chart.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {karakas.map((k) => (
              <div key={k.karaka} className="rounded-lg border border-border/40 bg-background/30 p-3 text-xs">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-primary text-sm">{k.karaka}</span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{k.planet}</span>
                </div>
                <div className="mt-1 font-mono">{RASHIS[k.rashi]} · {k.degree.toFixed(2)}°</div>
                <div className="mt-1 text-muted-foreground">{KARAKA_MEANING[k.karaka as CharaKaraka]}</div>
              </div>
            ))}
          </div>

        </div>
      )}

      {tab === "arudhas" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Arudha padas show the perceived image of each life area. A1 (Arudha Lagna)
            is public self; UL (Upapada, from A12) governs marriage.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {arudhas.map((a) => {
              const label = a.house === 12 ? "UL" : `A${a.house}`;
              return (
                <div
                  key={a.house}
                  className="rounded-lg border border-border/40 bg-background/30 p-2 text-xs"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-primary">{label}</span>
                    <span className="text-[10px] text-muted-foreground">
                      H{a.house} · {a.lord}
                    </span>
                  </div>
                  <div className="mt-1 font-mono">{RASHIS[a.arudha]}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "dasha" && (
        <div className="space-y-2">
          {!birthDate ? (
            <p className="text-xs text-muted-foreground">
              Birth timestamp required to compute Chara Dasha.
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Sign-based Mahadashas starting from Lagna; direction alternates by odd
                and even signs. Duration = count to sign lord.
              </p>
              <div className="max-h-96 space-y-1.5 overflow-y-auto pr-1">
                {dasha.map((d, i) => {
                  const active = now >= d.start.getTime() && now < d.end.getTime();
                  return (
                    <div key={i} className={`rounded-lg border p-2.5 text-xs ${active ? "border-primary/60 bg-primary/10" : "border-border/40 bg-background/30"}`}>
                      <div className="flex items-baseline justify-between">
                        <span className={`font-display text-sm ${active ? "text-primary" : ""}`}>{RASHIS[d.sign]}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{d.lord} · {d.years}y</span>
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                        {fmtDate(d.start)} → {fmtDate(d.end)} {active && <span className="ml-1 text-primary">● now</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

            </>
          )}
        </div>
      )}
    </Card>
  );
}
