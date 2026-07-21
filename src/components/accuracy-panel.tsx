// Accuracy transparency panel. Shows which models the engine used, their
// validation status (verified / approximate / fallback), and a live run of
// the deterministic reference suite so users can see whether the currently
// deployed engine still matches the canonical benchmarks.

import { useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, ChevronDown } from "lucide-react";
import { ENGINE_MODELS, STATUS_LABEL, type ModelStatus } from "@/lib/engine-meta";
import { runValidationSuite, type ValidationReport } from "@/lib/engine-validation";
import { ENGINE_VERSION } from "@/lib/chart-config";

const STATUS_STYLE: Record<ModelStatus, string> = {
  verified: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
  approximate: "text-amber-300 border-amber-400/30 bg-amber-400/10",
  fallback: "text-orange-300 border-orange-400/30 bg-orange-400/10",
};

export function AccuracyPanel({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(!compact);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [running, setRunning] = useState(false);

  const initialReport = useMemo(() => (compact ? null : runValidationSuite()), [compact]);
  const shown = report ?? initialReport;

  const run = () => {
    setRunning(true);
    // Defer so React can paint the running state.
    setTimeout(() => {
      setReport(runValidationSuite());
      setRunning(false);
    }, 30);
  };

  return (
    <section className="glass-card overflow-hidden" aria-label="Accuracy transparency">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Accuracy & Transparency
          <span className="ml-2 rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            {ENGINE_VERSION}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-4 border-t border-white/10 px-4 py-4">
          <p className="text-xs text-muted-foreground">
            Every calculation is transparent. Below is exactly which model computed each element
            of your reading and whether it is verified against reference charts.
          </p>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Models used</h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {ENGINE_MODELS.map((m) => (
                <li key={m.key} className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground">{m.label}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${STATUS_STYLE[m.status]}`}>
                      {m.status === "verified" ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                      {STATUS_LABEL[m.status]}
                    </span>
                  </div>
                  <div className="mt-1 text-muted-foreground">{m.source}</div>
                  {m.notes && <div className="mt-1 text-[11px] text-muted-foreground/80">{m.notes}</div>}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Reference-case validation
              </h3>
              <button
                type="button"
                onClick={run}
                disabled={running}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs hover:bg-white/5 disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${running ? "animate-spin" : ""}`} />
                {running ? "Running…" : "Re-run suite"}
              </button>
            </div>
            {shown && (
              <>
                <div className="mb-2 flex items-center gap-4 text-xs">
                  <span className="text-emerald-300">✓ {shown.passed} passed</span>
                  <span className={shown.failed > 0 ? "text-red-300" : "text-muted-foreground"}>
                    ✗ {shown.failed} failed
                  </span>
                  <span className="text-muted-foreground">at {new Date(shown.runAt).toLocaleString()}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-muted-foreground">
                      <tr className="border-b border-white/10">
                        <th className="py-1 pr-3 text-left font-normal">Case</th>
                        <th className="py-1 pr-3 text-left font-normal">Expected</th>
                        <th className="py-1 pr-3 text-left font-normal">Actual</th>
                        <th className="py-1 pr-3 text-left font-normal">Drift</th>
                        <th className="py-1 text-left font-normal">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.cases.map((c) => (
                        <tr key={c.id} className="border-b border-white/5 last:border-0">
                          <td className="py-1 pr-3">{c.label}</td>
                          <td className="py-1 pr-3 font-mono">{c.expectedSign} · {c.expectedLongitude.toFixed(2)}°</td>
                          <td className="py-1 pr-3 font-mono">{c.actualSign} · {Number.isFinite(c.actualLongitude) ? c.actualLongitude.toFixed(2) + "°" : "—"}</td>
                          <td className="py-1 pr-3 font-mono">{Number.isFinite(c.driftDegrees) ? `${c.driftDegrees >= 0 ? "+" : ""}${c.driftDegrees.toFixed(3)}°` : "—"}</td>
                          <td className="py-1">
                            {c.passed
                              ? <span className="text-emerald-300">Pass</span>
                              : <span className="text-red-300">Fail{c.error ? ` — ${c.error}` : ""}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
