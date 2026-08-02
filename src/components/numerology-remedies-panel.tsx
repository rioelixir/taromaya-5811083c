import { useMemo } from "react";
import { GlassCard } from "@/components/page-shell";
import { computeNumerology, reduce } from "@/lib/numerology";
import { mobileRemedyPlan, nameRemedyPlan } from "@/lib/numerology-remedies";

function List({ title, items, tone = "pearl" }: { title: string; items: string[]; tone?: "pearl" | "warn" }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{title}</div>
      <ul className="mt-2 space-y-2">
        {items.map((s, i) => (
          <li key={i} className={`flex gap-2 text-base leading-relaxed ${tone === "warn" ? "text-amber-200" : "text-pearl"}`}>
            <span className="mt-0.5 text-gold">{i + 1}.</span>
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function maskedDiff(number: string, changedAt: number[]) {
  return number.split("").map((d, i) => (
    <span key={i} className={changedAt.includes(i) ? "gold-text font-semibold" : "text-pearl"}>{d}</span>
  ));
}

/** Suggested mobile-number changes and how to use them. */
export function MobileRemedyPanel({ mobile, birthDate }: { mobile: string; birthDate: string }) {
  const plan = useMemo(() => mobileRemedyPlan(mobile, birthDate), [mobile, birthDate]);
  if (!plan) return null;
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
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {plan.candidates.map((c) => (
                <div key={c.number} className="rounded-xl bg-white/5 p-3">
                  <div className="font-mono text-lg tracking-widest">{maskedDiff(c.number, c.changedAt)}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Adds up to {c.reduced} · {c.changes === 1 ? "one digit changed" : `${c.changes} digits changed`} · fit {c.score} out of 100
                  </div>
                  <div className="mt-1 text-sm text-pearl">{c.why}</div>
                </div>
              ))}
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
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {plan.better.map((o) => (
                <div key={o.spelling} className="rounded-xl bg-white/5 p-3">
                  <div className="text-lg text-pearl">{o.spelling}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {o.compound} → {o.root} · {o.change} · harmony {o.score} out of 100
                  </div>
                  <div className="mt-1 text-sm text-pearl">{o.note}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {plan.avoid.length > 0 && (
          <div className="mt-4">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Spellings to avoid</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {plan.avoid.map((o) => (
                <span key={o.spelling} className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-200">
                  {o.spelling} · {o.root} · harmony {o.score}
                </span>
              ))}
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
