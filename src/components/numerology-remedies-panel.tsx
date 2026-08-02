import { useMemo } from "react";
import { GlassCard } from "@/components/page-shell";
import { DataTable, type Column } from "@/components/data-table";
import { computeNumerology, reduce } from "@/lib/numerology";
import { mobileRemedyPlan, nameRemedyPlan } from "@/lib/numerology-remedies";

type StepRow = { step: string };

function stepColumns(tone: "pearl" | "warn"): Column<StepRow>[] {
  return [
    { header: "#", cell: (_r: StepRow, i: number) => i + 1, className: "text-gold w-8" },
    {
      header: "Point",
      cell: (r: StepRow) => r.step,
      className: tone === "warn" ? "text-amber-200" : "text-pearl",
    },
  ];
}

function List({ title, items, tone = "pearl" }: { title: string; items: string[]; tone?: "pearl" | "warn" }) {
  const rows: StepRow[] = items.map((s) => ({ step: s }));
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{title}</div>
      <div className="mt-2">
        <DataTable columns={stepColumns(tone)} rows={rows} rowKey={(r: StepRow, i: number) => i} />
      </div>
    </div>
  );
}

function maskedDiff(number: string, changedAt: number[]) {
  return number.split("").map((d, i) => (
    <span key={i} className={changedAt.includes(i) ? "gold-text font-semibold" : "text-pearl"}>{d}</span>
  ));
}

type MobileCandidate = ReturnType<typeof mobileRemedyPlan> extends infer P
  ? P extends { candidates: Array<infer C> } ? C : never
  : never;

type NameOption = ReturnType<typeof nameRemedyPlan> extends infer P
  ? P extends { better: Array<infer C> } ? C : never
  : never;

/** Suggested mobile-number changes and how to use them. */
export function MobileRemedyPanel({ mobile, birthDate }: { mobile: string; birthDate: string }) {
  const plan = useMemo(() => mobileRemedyPlan(mobile, birthDate), [mobile, birthDate]);
  if (!plan) return null;

  const candidateColumns: Column<MobileCandidate>[] = [
    { header: "Number", cell: (c: MobileCandidate) => <span className="font-mono tracking-widest">{maskedDiff(c.number, c.changedAt)}</span> },
    { header: "Reduces to", cell: (c: MobileCandidate) => c.reduced, align: "right" },
    { header: "Digits changed", cell: (c: MobileCandidate) => c.changes, align: "right" },
    { header: "Fit", cell: (c: MobileCandidate) => `${c.score} / 100`, align: "right" },
    { header: "Why", cell: (c: MobileCandidate) => c.why, className: "text-pearl" },
  ];

  return (
    <div className="mt-6">
      <GlassCard title="Suggested changes and remedies">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white/5 p-4">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Present number</div>
            <div className="mt-1 font-display text-2xl gold-text">{plan.current.reduced}</div>
            <div className="text-sm text-muted-foreground">{plan.current.planet} · fit {plan.current.score} out of 100</div>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Vibrations that suit you</div>
            <div className="mt-1 font-display text-2xl gold-text">{plan.targets.slice(0, 5).join(" · ")}</div>
            <div className="text-sm text-muted-foreground">Life path {plan.lifePath} · birth day {plan.driver}</div>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Verdict</div>
            <div className={`mt-1 text-base ${plan.needsChange ? "text-amber-200" : "text-emerald-300"}`}>
              {plan.needsChange ? "A change is worth considering" : "No change needed"}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{plan.current.verdict}</div>
          </div>
        </div>

        {plan.candidates.length > 0 && (
          <div className="mt-5">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Closest numbers that fit (changed digits in gold)
            </div>
            <div className="mt-2">
              <DataTable columns={candidateColumns} rows={plan.candidates} rowKey={(c: MobileCandidate) => c.number} />
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <List title="Do this" items={plan.steps} />
          <List title="Keep in mind" items={plan.cautions} tone="warn" />
        </div>
      </GlassCard>
    </div>
  );
}

/** Suggested name spelling changes and how to put them into daily use. */
export function NameRemedyPanel({ fullName, birthDate }: { fullName: string; birthDate: string }) {
  const plan = useMemo(() => {
    if (!fullName || !birthDate) return null;
    const day = Number(birthDate.split("-")[2] ?? 0);
    if (!day) return null;
    const mulank = reduce(day, false);
    const bhagyank = reduce(
      birthDate.replace(/\D/g, "").split("").reduce((s, c) => s + Number(c), 0),
      false,
    );
    void computeNumerology; // keeps the shared engine as the single source of truth
    return nameRemedyPlan(fullName, mulank, bhagyank, "Chaldean");
  }, [fullName, birthDate]);
  if (!plan) return null;

  const betterColumns: Column<NameOption>[] = [
    { header: "Spelling", cell: (o: NameOption) => o.spelling, className: "text-pearl" },
    { header: "Change", cell: (o: NameOption) => o.change, className: "text-muted-foreground" },
    { header: "Total → Root", cell: (o: NameOption) => `${o.compound} → ${o.root}`, align: "right" },
    { header: "Harmony", cell: (o: NameOption) => `${o.score} / 100`, align: "right" },
    { header: "Note", cell: (o: NameOption) => o.note, className: "text-pearl" },
  ];

  const avoidColumns: Column<typeof plan.avoid[number]>[] = [
    { header: "Spelling", cell: (o: NameOption) => o.spelling, className: "text-amber-200" },
    { header: "Root", cell: (o: NameOption) => o.root, align: "right" },
    { header: "Harmony", cell: (o: NameOption) => `${o.score} / 100`, align: "right" },
  ];

  return (
    <div className="mt-6">
      <GlassCard title="Name remedies and suggested spellings">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white/5 p-4">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Present name value</div>
            <div className="mt-1 font-display text-2xl gold-text">{plan.compound} → {plan.root}</div>
            <div className="text-sm text-muted-foreground">Harmony {plan.harmonyScore} out of 100</div>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Values that suit you</div>
            <div className="mt-1 font-display text-2xl gold-text">{plan.targets.slice(0, 5).join(" · ")}</div>
            <div className="text-sm text-muted-foreground">Lean on letters {plan.addLetters.slice(0, 6).join(", ")}</div>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Verdict</div>
            <div className={`mt-1 text-base ${plan.needsChange ? "text-amber-200" : "text-emerald-300"}`}>
              {plan.needsChange ? "A spelling correction is worth studying" : "No change needed"}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{plan.harmonyVerdict}</div>
          </div>
        </div>

        {plan.better.length > 0 && (
          <div className="mt-5">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Better spellings</div>
            <div className="mt-2">
              <DataTable columns={betterColumns} rows={plan.better} rowKey={(o: NameOption) => o.spelling} />
            </div>
          </div>
        )}

        {plan.avoid.length > 0 && (
          <div className="mt-4">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Spellings to avoid</div>
            <div className="mt-2">
              <DataTable columns={avoidColumns} rows={plan.avoid} rowKey={(o: NameOption) => o.spelling} />
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <List title="Do this" items={plan.steps} />
          <List title="Keep in mind" items={plan.cautions} tone="warn" />
        </div>
      </GlassCard>
    </div>
  );
}
