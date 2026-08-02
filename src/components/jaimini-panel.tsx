import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/data-table";
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

  const karakaCols: Column<(typeof karakas)[number]>[] = [
    { header: "Karaka", cell: (k) => <span className="font-mono text-primary">{k.karaka}</span> },
    { header: "Planet", cell: (k) => k.planet },
    { header: "Sign", cell: (k) => RASHIS[k.rashi] },
    { header: "Degree", align: "right", className: "font-mono", cell: (k) => `${k.degree.toFixed(2)}°` },
    {
      header: "Signifies",
      className: "text-muted-foreground",
      cell: (k) => KARAKA_MEANING[k.karaka as CharaKaraka],
    },
  ];

  const arudhaCols: Column<(typeof arudhas)[number]>[] = [
    {
      header: "Pada",
      cell: (a) => (
        <span className="font-mono text-primary">{a.house === 12 ? "UL" : `A${a.house}`}</span>
      ),
    },
    { header: "House", cell: (a) => `House ${a.house}` },
    { header: "House lord", cell: (a) => a.lord },
    { header: "Arudha sign", cell: (a) => RASHIS[a.arudha] },
  ];

  const dashaCols: Column<(typeof dasha)[number]>[] = [
    { header: "Sign", cell: (d) => <span className="font-display">{RASHIS[d.sign]}</span> },
    { header: "Lord", cell: (d) => d.lord },
    { header: "Years", align: "right", className: "font-mono", cell: (d) => d.years },
    { header: "From", className: "font-mono", cell: (d) => fmtDate(d.start) },
    { header: "To", className: "font-mono", cell: (d) => fmtDate(d.end) },
    {
      header: "Status",
      cell: (d) =>
        now >= d.start.getTime() && now < d.end.getTime() ? (
          <span className="text-primary">Running now</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

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
        <DataTable
          columns={karakaCols}
          rows={karakas}
          rowKey={(k) => k.karaka}
          caption="Ranked by advancement within sign (Rahu reversed). The Atmakaraka (AK) is the soul-signifier of the chart."
        />
      )}

      {tab === "arudhas" && (
        <DataTable
          columns={arudhaCols}
          rows={arudhas}
          rowKey={(a) => a.house}
          caption="Arudha padas show the perceived image of each life area. A1 (Arudha Lagna) is public self; UL (Upapada, from A12) governs marriage."
        />
      )}

      {tab === "dasha" && (
        !birthDate ? (
          <p className="text-xs text-muted-foreground">
            Birth timestamp required to compute Chara Dasha.
          </p>
        ) : (
          <DataTable
            columns={dashaCols}
            rows={dasha}
            maxHeight="24rem"
            rowClassName={(d) =>
              now >= d.start.getTime() && now < d.end.getTime() ? "bg-primary/10" : ""
            }
            caption="Sign-based Mahadashas starting from Lagna; direction alternates by odd and even signs. Duration = count to sign lord."
          />
        )
      )}
    </Card>
  );
}
