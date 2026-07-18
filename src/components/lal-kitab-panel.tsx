import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
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
        <div className="grid gap-2 sm:grid-cols-2">
          {houses.map((r) => (
            <div key={r.planet} className="rounded-lg border border-border/40 bg-background/30 p-3 text-xs">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-sm text-primary">{r.planet}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">House {r.house}</span>
              </div>
              <div className={`mt-1 text-[11px] uppercase tracking-wider ${statusColor(r.status)}`}>{r.status}</div>
              <div className="mt-1 text-muted-foreground">{r.reading}</div>
              <div className="mt-1 text-primary/80">Remedy: {r.remedy}</div>
            </div>
          ))}
        </div>
      )}


      {tab === "rins" && (
        <div className="space-y-2">
          {rins.map((r) => (
            <div
              key={r.key}
              className={`rounded-lg border p-3 text-xs ${
                r.present ? "border-rose-500/40 bg-rose-500/5" : "border-border/40 bg-background/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-primary">{r.name}</span>
                <span className={`text-[10px] uppercase tracking-wider ${r.present ? "text-rose-400" : "text-emerald-400"}`}>
                  {r.present ? "Present" : "Clear"}
                </span>
              </div>
              <div className="mt-1 text-muted-foreground">{r.reason}</div>
              <div className="mt-1 text-primary/80">Remedy: {r.remedy}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "varshphal" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs text-muted-foreground">Running age of life</label>
            <input
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

          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {varsh.map((v) => (
              <div key={v.planet} className="rounded-lg border border-border/40 bg-background/30 p-3 text-xs">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-sm text-primary">{v.planet}</span>
                  <span className={`text-[10px] uppercase tracking-widest ${statusColor(v.status)}`}>{v.status}</span>
                </div>
                <div className="mt-2 flex items-center gap-2 font-mono text-[11px]">
                  <span className="rounded-full border border-border/40 bg-background/40 px-2 py-0.5 text-muted-foreground">Natal H{v.natalHouse}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-primary">Annual H{v.annualHouse}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </Card>
  );
}
