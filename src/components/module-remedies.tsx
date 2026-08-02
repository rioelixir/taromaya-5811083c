import { useMemo, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, Flame, Gem, Coins, Sparkles, ShieldAlert } from "lucide-react";
import { useBirthProfile, birthProfileToKundliInput } from "@/hooks/use-birth-profile";
import { computeKundli, type KundliChart } from "@/lib/vedic";
import { DataTable } from "@/components/data-table";
import { moduleRemedyPlan, type PlanetRemedyBlock } from "@/lib/module-remedies";

const TONE: Record<PlanetRemedyBlock["priority"], { label: string; cls: string }> = {
  attention: { label: "Needs attention", cls: "border-amber-400/40 bg-amber-500/10 text-amber-200" },
  support: { label: "Light support", cls: "border-gold/40 bg-gold/10 text-gold" },
  steady: { label: "Steady", cls: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200" },
};

type RemedyRow = { label: string; value: React.ReactNode };

function PlanetBlock({ b }: { b: PlanetRemedyBlock }) {
  const tone = TONE[b.priority];
  const rows: RemedyRow[] = [
    {
      label: "Daily practice",
      value: (
        <span className="flex items-start gap-2">
          <Flame className="mt-1 h-4 w-4 shrink-0 text-gold" />
          <span>
            {b.mantra} — {b.japa.dailyMalas} mala ({b.japa.dailyJapa} repetitions), about {b.japa.minutesPerDay} minutes,
            at {b.japa.bestTime.toLowerCase()}. Full count {b.japa.totalJapa} over {b.japa.daysToComplete} days.
          </span>
        </span>
      ),
    },
    {
      label: "Weekly anchor",
      value: `${b.day} · wear ${b.colour.toLowerCase()} · ${b.fast.toLowerCase()} · ${b.temple.toLowerCase()}`,
    },
    {
      label: "Charity and giving",
      value: (
        <span className="flex items-start gap-2">
          <Coins className="mt-1 h-4 w-4 shrink-0 text-gold" />
          <span>{[...b.charity, ...b.donation].join(", ")}</span>
        </span>
      ),
    },
    { label: "Conduct changes", value: `${b.conduct.join(". ")}.` },
    { label: "Diet support", value: `${b.food.join(". ")}.` },
    { label: "Instrument", value: `${b.yantra} · Rudraksha: ${b.rudraksha}` },
    {
      label: "Gemstone (only under guidance)",
      value: (
        <span className="flex items-start gap-2">
          <Gem className="mt-1 h-4 w-4 shrink-0 text-gold" />
          <span>
            {b.gem.gem} in {b.gem.metal.toLowerCase()}, {b.gem.ratti} ratti ({b.gem.grams.toFixed(2)} g), {b.gem.finger.toLowerCase()} finger,
            worn on {b.gem.day} at {b.gem.time.toLowerCase()}. Accepted range {b.gem.minRatti} to {b.gem.maxRatti} ratti.
          </span>
        </span>
      ),
    },
    { label: "How long", value: b.duration },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-display text-xl text-pearl">{b.planet}</h4>
        <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-widest ${tone.cls}`}>
          {tone.label}
        </span>
      </div>
      <p className="mt-2 text-base leading-relaxed text-pearl">{b.role}</p>
      <p className="mt-1 text-sm text-muted-foreground">{b.condition}</p>
      {b.reasons.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {b.reasons.map((r) => (
            <span key={r} className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-muted-foreground">
              {r}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3">
        <DataTable
          columns={[
            { header: "Remedy area", className: "whitespace-nowrap text-muted-foreground", cell: (r: RemedyRow) => r.label },
            { header: "What to do", className: "text-pearl", cell: (r: RemedyRow) => r.value },
          ]}
          rows={rows}
          rowKey={(r) => r.label}
        />
      </div>
    </div>
  );
}


/**
 * Planet-linked remedies and suggested changes for the current module.
 * Rendered on every reading page so guidance always ends with something to do.
 */
export function ModuleRemedies() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: profile } = useBirthProfile();
  const [open, setOpen] = useState(true);

  const chart: KundliChart | null = useMemo(() => {
    if (!profile) return null;
    try {
      return computeKundli(birthProfileToKundliInput(profile));
    } catch {
      return null;
    }
  }, [profile]);

  const plan = useMemo(() => moduleRemedyPlan(pathname, chart), [pathname, chart]);

  return (
    <section aria-labelledby="module-remedies-heading" className="mt-8 rounded-3xl glass gold-border p-4 sm:p-6" data-no-voice>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-gold/80">Remedies and suggested changes</div>
          <h3 id="module-remedies-heading" className="mt-1 font-display text-2xl text-pearl">
            {plan.focus}: the planets behind it, and what to do
          </h3>
          <p className="mt-2 max-w-3xl text-base leading-relaxed text-muted-foreground">
            This module reads {plan.purpose}. The grahas below govern it directly.{" "}
            {plan.chartUsed
              ? "Each one is graded against your saved birth details, so the order below is yours, not generic."
              : "Save your birth details and each planet will be graded against your own chart."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/5 px-4 text-sm text-pearl hover:bg-white/10"
          aria-expanded={open}
        >
          {open ? <ChevronUp className="h-5 w-5 text-gold" /> : <ChevronDown className="h-5 w-5 text-gold" />}
          {open ? "Hide" : "Show"}
        </button>
      </div>

      {open && (
        <>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {plan.blocks.map((b) => (
              <PlanetBlock key={b.planet} b={b} />
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-gold">
                <Sparkles className="h-4 w-4" /> Your forty-day sequence
              </div>
              <div className="mt-2">
                <DataTable
                  columns={[
                    { header: "Step", align: "right", className: "w-12 text-gold", cell: (_s: string, i: number) => i + 1 },
                    { header: "What to do", className: "text-pearl", cell: (s: string) => s },
                  ]}
                  rows={plan.sequence}
                />
              </div>
            </div>
            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.06] p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-amber-200">
                <ShieldAlert className="h-4 w-4" /> Before you act
              </div>
              <div className="mt-2">
                <DataTable
                  columns={[{ header: "Caution", className: "text-amber-100/90", cell: (c: string) => c }]}
                  rows={plan.cautions}
                  rowKey={(c) => c}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
