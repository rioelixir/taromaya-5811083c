import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/data-table";
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

  const rows = tab === "positions" ? positions : cusps;
  const posCols: Column<(typeof positions)[number]>[] = [
    { header: tab === "cusps" ? "Cusp" : "Planet", cell: (r) => <span className="font-display text-primary">{r.who}</span> },
    { header: "Sign", cell: (r) => KP_RASHIS[r.sign] },
    { header: "Nakshatra", cell: (r) => KP_NAKSHATRAS[r.nakshatra] },
    { header: "Star lord", className: "font-mono text-primary", cell: (r) => r.starLord },
    { header: "Sub lord", className: "font-mono text-primary", cell: (r) => r.subLord },
    { header: "Sub-sub lord", className: "font-mono text-muted-foreground", cell: (r) => r.subSubLord },
  ];

  const chips = (arr: string[]) =>
    arr.length ? (
      <span className="flex flex-wrap gap-1">
        {arr.map((n) => (
          <span key={n} className={chipCls}>{n}</span>
        ))}
      </span>
    ) : (
      <span className="text-muted-foreground">—</span>
    );

  const sigCols: Column<(typeof sig)[number]>[] = [
    { header: "House", cell: (r) => <span className="font-display text-primary">House {r.house}</span> },
    { header: "Sign", cell: (r) => KP_RASHIS[r.sign] },
    { header: "A · star of occupants", cell: (r) => chips(r.A) },
    { header: "B · occupants", cell: (r) => chips(r.B) },
    { header: "C · star of lord", cell: (r) => chips(r.C) },
    { header: "D · house lord", cell: (r) => chips(r.D) },
    {
      header: "Combined",
      cell: (r) => (
        <span className="flex flex-wrap gap-1">
          {r.combined.map((n) => (
            <span key={n} className={chipCls + " border-primary/40 text-primary"}>{n}</span>
          ))}
        </span>
      ),
    },
  ];

  const rulingRows = ruling
    ? [
        { label: "Weekday lord", value: ruling.weekdayLord },
        { label: "Moon sign lord", value: ruling.moonSignLord },
        { label: "Moon star lord", value: ruling.moonStarLord },
        { label: "Moon sub lord", value: ruling.moonSubLord },
        { label: "Lagna sign lord", value: ruling.ascSignLord },
        { label: "Lagna star lord", value: ruling.ascStarLord },
        { label: "Lagna sub lord", value: ruling.ascSubLord },
      ]
    : [];

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
        <DataTable columns={posCols} rows={rows} rowKey={(r) => r.who} />
      )}

      {tab === "significators" && (
        <DataTable
          columns={sigCols}
          rows={sig}
          rowKey={(r) => r.house}
          maxHeight="24rem"
          caption="4-fold significators per house: A) planets in star of occupants, B) occupants, C) planets in star of house-lord, D) house-lord."
        />
      )}

      {tab === "ruling" && (
        !ruling ? (
          <p className="text-xs text-muted-foreground">Moon position required.</p>
        ) : (
          <div className="space-y-3">
            <DataTable
              columns={[
                { header: "Ruling factor", cell: (r: { label: string }) => r.label },
                { header: "Planet", align: "right", className: "font-mono text-primary", cell: (r: { value: string }) => r.value },
              ]}
              rows={rulingRows}
              rowKey={(r) => r.label}
              caption="Ruling planets for the query moment. Live-transit variants are used across Horary and event-timing selections."
            />
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Combined RP set</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {ruling.combined.map((n) => (
                  <span key={n} className={chipCls}>{n}</span>
                ))}
              </div>
            </div>
          </div>
        )
      )}
    </Card>
  );
}
