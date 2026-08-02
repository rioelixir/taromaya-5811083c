import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/data-table";
import {
  lalKitabTable,
  lalKitabRins,
  lalKitabVarshphal,
  type ChartLite,
} from "@/lib/lal-kitab";

type Props = { chart: ChartLite; birthDate?: Date | null };
type Tab = "houses" | "rins" | "varshphal";

const TABS: { id: Tab; label: string }[] = [
  { id: "houses", label: "House Readings" },
  { id: "rins", label: "Karmic Debts" },
  { id: "varshphal", label: "Varshphal" },
];

const statusColor = (s: string) =>
  s === "Strong" ? "text-emerald-400" : s === "Weak" ? "text-rose-400" : "text-amber-300";

function ageFromBirth(birth: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return Math.max(1, age + 1); // running year of life
}

export function LalKitabPanel({ chart, birthDate }: Props) {
  const [tab, setTab] = useState<Tab>("houses");
  const [age, setAge] = useState<number>(() => (birthDate ? ageFromBirth(birthDate) : 30));

  const houses = useMemo(() => lalKitabTable(chart), [chart]);
  const rins = useMemo(() => lalKitabRins(chart), [chart]);
  const varsh = useMemo(() => lalKitabVarshphal(chart, age), [chart, age]);

  const houseCols: Column<(typeof houses)[number]>[] = [
    { header: "Planet", cell: (r) => <span className="font-display text-primary">{r.planet}</span> },
    { header: "House", cell: (r) => `House ${r.house}` },
    { header: "Condition", cell: (r) => <span className={statusColor(r.status)}>{r.status}</span> },
    { header: "Reading", className: "text-muted-foreground", cell: (r) => r.reading },
    { header: "Remedy", className: "text-primary/80", cell: (r) => r.remedy },
  ];

  const rinCols: Column<(typeof rins)[number]>[] = [
    { header: "Debt", cell: (r) => <span className="font-mono text-primary">{r.name}</span> },
    {
      header: "Status",
      cell: (r) => (
        <span className={r.present ? "text-rose-400" : "text-emerald-400"}>
          {r.present ? "Present" : "Clear"}
        </span>
      ),
    },
    { header: "Why", className: "text-muted-foreground", cell: (r) => r.reason },
    { header: "Remedy", className: "text-primary/80", cell: (r) => r.remedy },
  ];

  const varshCols: Column<(typeof varsh)[number]>[] = [
    { header: "Planet", cell: (v) => <span className="font-display text-primary">{v.planet}</span> },
    { header: "Natal house", className: "font-mono", cell: (v) => `House ${v.natalHouse}` },
    { header: "Annual house", className: "font-mono text-primary", cell: (v) => `House ${v.annualHouse}` },
    { header: "Condition", cell: (v) => <span className={statusColor(v.status)}>{v.status}</span> },
  ];

  return (
    <Card className="glass-card space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-serif text-lg">Lal Kitab</h3>
          <p className="text-xs text-muted-foreground">
            House-based conditions · Karmic debts · Age-rotating Varshphal
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

      {tab === "houses" && (
        <DataTable columns={houseCols} rows={houses} rowKey={(r) => r.planet} />
      )}

      {tab === "rins" && (
        <DataTable
          columns={rinCols}
          rows={rins}
          rowKey={(r) => r.key}
          rowClassName={(r) => (r.present ? "bg-rose-500/5" : "")}
        />
      )}

      {tab === "varshphal" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs text-muted-foreground" htmlFor="lk-age">Running age of life</label>
            <input
              id="lk-age"
              type="number"
              min={1}
              max={120}
              value={age}
              onChange={(e) => setAge(Math.max(1, Math.min(120, Number(e.target.value) || 1)))}
              className="w-20 rounded-md border border-border/40 bg-background/40 px-2 py-1 font-mono text-xs"
            />
            <span className="text-[11px] text-muted-foreground">
              Chart rotates {(age - 1) % 12} house{(age - 1) % 12 === 1 ? "" : "s"} forward.
            </span>
          </div>

          <DataTable columns={varshCols} rows={varsh} rowKey={(v) => v.planet} />
        </div>
      )}
    </Card>
  );
}
