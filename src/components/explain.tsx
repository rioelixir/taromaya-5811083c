import { useState, type ReactNode } from "react";
import { Info } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { explainTerm } from "@/lib/explain-terms";

/**
 * Tap-to-understand wrapper for any number or aspect in an advanced table.
 *
 * <Explain term="tithi">Shukla · Dwitiya (2)</Explain>
 *
 * Opens the shared drilldown: beginner → everyday use → deeper detail →
 * the exact formula the engine runs, plus which inputs change it.
 */
export function Explain({
  term,
  children,
  className,
  showIcon = true,
}: {
  term: string;
  children: ReactNode;
  className?: string;
  showIcon?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const entry = explainTerm(term);
  if (!entry) return <>{children}</>;

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        title={`Tap to learn: ${entry.term}`}
        aria-label={`What does ${entry.term} mean?`}
        className={`inline-flex items-center gap-1 text-left underline decoration-dotted decoration-gold/50 underline-offset-4 hover:decoration-gold focus:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded-sm ${className ?? ""}`}
      >
        <span>{children}</span>
        {showIcon && <Info className="h-3 w-3 shrink-0 text-gold/70" />}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl gold-text">{entry.term}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <Layer badge="1" label="Simple" tone="emerald" text={entry.beginner} />
            <Layer badge="2" label="How it is used" tone="gold" text={entry.intermediate} />
            <Layer badge="3" label="Deeper detail" tone="violet" text={entry.advanced} />

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Exact formula we run
              </div>
              <div className="mt-1.5 font-mono text-xs leading-relaxed text-pearl break-words">
                {entry.formula}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                What changes this number
              </div>
              <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                {entry.inputs.map((i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold/70" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Layer({
  badge, label, text, tone,
}: { badge: string; label: string; text: string; tone: "emerald" | "gold" | "violet" }) {
  const ring =
    tone === "emerald" ? "border-emerald-400/25 bg-emerald-500/10"
    : tone === "gold" ? "border-gold/25 bg-gold/10"
    : "border-violet-400/25 bg-violet-500/10";
  return (
    <div className={`rounded-xl border p-3 ${ring}`}>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="grid h-4 w-4 place-items-center rounded-full bg-white/10 text-[9px] text-pearl">{badge}</span>
        {label}
      </div>
      <p className="mt-1.5 leading-relaxed text-pearl">{text}</p>
    </div>
  );
}
