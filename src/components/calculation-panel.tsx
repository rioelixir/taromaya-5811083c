import { useState } from "react";
import { ChevronDown, ChevronUp, Calculator } from "lucide-react";
import { calculationSpec } from "@/lib/calculation-steps";

/**
 * Shows the working behind a module: inputs consumed, ordered steps, formulas
 * and the reference the method is taken from. Rendered by PageShell on every
 * module page (the Tarot board does not use PageShell, so it is excluded).
 */
export function CalculationPanel({ module }: { module: string }) {
  const [open, setOpen] = useState(false);
  const spec = calculationSpec(module);

  return (
    <section className="mt-8 glass rounded-3xl p-5 sm:p-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-gold" />
          <span className="text-base sm:text-lg text-pearl">How this is calculated</span>
        </span>
        {open ? <ChevronUp className="h-5 w-5 text-gold" /> : <ChevronDown className="h-5 w-5 text-gold" />}
      </button>

      <p className="mt-3 text-base text-muted-foreground">{spec.method}</p>

      {open && (
        <div className="mt-5 space-y-5">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-gold/80">Inputs used</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {spec.inputs.map((i) => (
                <li key={i} className="rounded-full border border-white/10 px-3 py-1 text-sm text-pearl">{i}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-gold/80">Calculation steps</p>
            <ol className="mt-2 space-y-2">
              {spec.steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-base text-pearl">
                  <span className="shrink-0 text-gold">{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>

          {spec.formulas && spec.formulas.length > 0 && (
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-gold/80">Formulas</p>
              <ul className="mt-2 space-y-1">
                {spec.formulas.map((f) => (
                  <li key={f} className="rounded-xl border border-white/10 px-3 py-2 text-base text-pearl">{f}</li>
                ))}
              </ul>
            </div>
          )}

          {spec.reference && (
            <p className="text-sm text-muted-foreground">Reference: {spec.reference}</p>
          )}
        </div>
      )}
    </section>
  );
}
