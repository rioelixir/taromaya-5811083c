import { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { GraduationCap, ChevronDown, ChevronUp } from "lucide-react";
import { getModuleLevels } from "@/lib/module-levels";

const STEPS = [
  { key: "beginner", label: "New to this" },
  { key: "growing", label: "Getting the hang of it" },
  { key: "deeper", label: "Go deeper" },
] as const;

/**
 * A small, calm learning card: the same module explained from beginner
 * to advanced in plain words. Closed by default so it never distracts.
 */
export function LevelGuide({ title }: { title: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<(typeof STEPS)[number]["key"]>("beginner");
  const levels = getModuleLevels(pathname, title);
  const lines = levels[step];

  return (
    <div className="mb-5 glass rounded-3xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/[0.04] transition"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2.5">
          <GraduationCap className="h-4 w-4 text-gold" />
          <span className="text-sm text-pearl">
            Learn this, step by step
          </span>
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gold" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gold" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5">
          <div className="flex flex-wrap gap-2">
            {STEPS.map((s) => (
              <button
                key={s.key}
                onClick={() => setStep(s.key)}
                className={`rounded-full px-3 py-1.5 text-xs transition border ${
                  step === s.key
                    ? "border-gold/60 bg-gold/15 text-gold"
                    : "border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.07]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <ul className="mt-4 space-y-2.5">
            {lines.map((line) => (
              <li key={line} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold/70" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
