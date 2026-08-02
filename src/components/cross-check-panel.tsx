import { useMemo, useState } from "react";
import { Check, X, ChevronDown, ScanSearch } from "lucide-react";
import { runCrossCheck, type CrossCheckInput } from "@/lib/cross-check";
import { GlassCard } from "@/components/page-shell";

/**
 * Live cross-check: recomputes the shared sky facts from the Kundli, Panchang,
 * Transit and Horoscope engines and shows whether they agree for the same
 * inputs. Collapsed to a single line unless something disagrees.
 */
export function CrossCheckPanel({ input, className }: { input: CrossCheckInput; className?: string }) {
  const report = useMemo(() => {
    try { return runCrossCheck(input); } catch { return null; }
  }, [JSON.stringify(input)]);
  const [open, setOpen] = useState(false);

  if (!report) return null;

  return (
    <GlassCard className={className}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 text-left"
        aria-expanded={open}
      >
        <ScanSearch className="h-4 w-4 text-gold" />
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Cross-check</span>
        <span className={`min-w-0 flex-1 text-xs ${report.ok ? "text-emerald-200" : "text-amber-200"}`}>
          {report.ok
            ? `Kundli, Panchang, Transits and Horoscope all agree (${report.checked} checks passed).`
            : `${report.failed} of ${report.checked} checks disagree — tap to see which.`}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <DataTable
            columns={[
              {
                header: "Check",
                cell: (it) => (
                  <span className="flex items-start gap-2">
                    {it.ok
                      ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
                      : <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />}
                    <span className="text-pearl">{it.label}</span>
                  </span>
                ),
              },
              { header: "Detail", className: "text-muted-foreground", cell: (it) => it.detail },
              {
                header: "Values",
                cell: (it) => (
                  <span className="flex flex-wrap gap-1.5">
                    {Object.entries(it.values).map(([k, v]) => (
                      <span key={k} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
                        {k}: <span className="text-pearl">{v}</span>
                      </span>
                    ))}
                  </span>
                ),
              },
              { header: "Result", cell: (it) => (it.ok ? <span className="text-emerald-300">Agrees</span> : <span className="text-amber-300">Differs</span>) },
            ]}
            rows={report.items}
            rowKey={(it) => it.key}
            rowClassName={(it) => (it.ok ? "" : "bg-amber-500/10")}
          />
          <div className="text-[10px] text-muted-foreground">
            Checked pages: Kundli, Panchang, Transits, Horoscope.
          </div>
        </div>

      )}
    </GlassCard>
  );
}
