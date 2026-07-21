import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { PremiumGate } from "@/components/premium-gate";
import { listTutorials, type Tutorial } from "@/lib/tutorials.functions";
import { TutorialPlayer } from "@/components/tutorial-player";
import { GuidedTour } from "@/components/guided-tour";
import { Compass, Loader2, Languages } from "lucide-react";

export const Route = createFileRoute("/how-to-use")({
  component: () => <PremiumGate featureName="How to use TAROMAYA"><HowToUse /></PremiumGate>,
  head: () => ({
    meta: [
      { title: "How to Use TAROMAYA — Guided Tour & Video Tutorials" },
      { name: "description", content: "Guided tour and step-by-step video tutorials (English + Hindi) walking through every TAROMAYA module." },
    ],
  }),
});

const LANG_LABEL: Record<Tutorial["language"], string> = {
  en: "English",
  hi: "हिन्दी",
  "hi-roman": "Roman Hindi",
};

function HowToUse() {
  const list = useServerFn(listTutorials);
  const q = useQuery({ queryKey: ["tutorials"], queryFn: () => list() });
  const [lang, setLang] = useState<Tutorial["language"]>("en");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tourOpen, setTourOpen] = useState(false);

  const filtered = useMemo(
    () => (q.data ?? []).filter((t) => t.language === lang && t.published),
    [q.data, lang],
  );

  const selected = filtered.find((t) => t.id === selectedId) ?? filtered[0];
  const idx = selected ? filtered.findIndex((t) => t.id === selected.id) : -1;
  const next = idx >= 0 && idx < filtered.length - 1 ? filtered[idx + 1] : null;

  return (
    <PageShell
      eyebrow="Learn"
      title="How to Use TAROMAYA"
      subtitle="A guided tour plus step-by-step video tutorials in English and Hindi."
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setTourOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary/20 border border-primary/40 px-4 py-2 text-sm text-foreground hover:bg-primary/30"
        >
          <Compass className="h-4 w-4" /> Start guided tour
        </button>
        <div className="ml-auto inline-flex items-center gap-1 rounded-full border border-white/10 px-1 py-1 text-xs">
          <Languages className="ml-2 mr-1 h-3 w-3 text-primary" />
          {(["en","hi","hi-roman"] as const).map((L) => (
            <button
              key={L}
              onClick={() => { setLang(L); setSelectedId(null); }}
              className={`rounded-full px-3 py-1 transition ${lang === L ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              aria-pressed={lang === L}
            >
              {LANG_LABEL[L]}
            </button>
          ))}
        </div>
      </div>

      {q.isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading tutorials…
        </div>
      )}

      {!q.isLoading && filtered.length === 0 && (
        <GlassCard>
          <p className="text-sm text-muted-foreground">
            No tutorials published in {LANG_LABEL[lang]} yet. Admins can upload from Admin → Tutorials.
          </p>
        </GlassCard>
      )}

      {selected && (
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
          <TutorialPlayer tutorial={selected} onNext={next ? () => setSelectedId(next.id) : undefined} />
          <aside className="glass-card p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">All tutorials</h3>
            <ol className="space-y-1 text-sm">
              {filtered.map((t, i) => (
                <li key={t.id}>
                  <button
                    onClick={() => setSelectedId(t.id)}
                    className={`w-full text-left rounded-md px-3 py-2 transition ${t.id === selected.id ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
                  >
                    <span className="mr-2 text-xs text-primary">{i + 1}.</span>{t.title}
                  </button>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      )}

      <GuidedTour open={tourOpen} onClose={() => setTourOpen(false)} />
    </PageShell>
  );
}
