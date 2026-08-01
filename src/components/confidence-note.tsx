import { useState } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";
import { accuracyNote, CONFIDENCE_LABEL, type Confidence } from "@/lib/accuracy-notes";

const TONE: Record<Confidence, string> = {
  high: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
  good: "border-gold/25 bg-gold/10 text-gold",
  sensitive: "border-amber-400/25 bg-amber-500/10 text-amber-200",
};

/**
 * Per-section "how sure are we" note. Collapsed by default so it never
 * distracts; opens into assumptions, edge cases and the inputs that matter.
 */
export function ConfidenceNote({ noteKey, className }: { noteKey: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const note = accuracyNote(noteKey);
  if (!note) return null;

  return (
    <div className={`rounded-2xl border ${TONE[note.confidence]} ${className ?? "mt-4"}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
        aria-expanded={open}
      >
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        <span className="text-[10px] uppercase tracking-widest">{CONFIDENCE_LABEL[note.confidence]}</span>
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{note.summary}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="space-y-3 border-t border-white/10 px-3 py-3 text-xs">
          <p className="text-pearl">{note.summary}</p>
          <Block title="What we assume" items={note.assumptions} />
          <Block title="When it can shift" items={note.edgeCases} />
          <Block title="What your answer depends on" items={note.inputs} />
        </div>
      )}
    </div>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{title}</div>
      <ul className="mt-1.5 space-y-1 text-muted-foreground">
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current opacity-60" />
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
