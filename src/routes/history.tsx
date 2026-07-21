import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageShell, GlassCard } from "@/components/page-shell";
import { PremiumGate } from "@/components/premium-gate";
import { getHistory, type HistoryItem } from "@/lib/history.functions";
import { BookOpen, FileText, Sparkles, Loader2 } from "lucide-react";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
  head: () => ({ meta: [{ title: "History — TAROMAYA" }] }),
});

function iconFor(kind: HistoryItem["kind"]) {
  if (kind === "kundli") return <Sparkles className="h-4 w-4 text-primary" />;
  if (kind === "pdf") return <FileText className="h-4 w-4 text-primary" />;
  return <BookOpen className="h-4 w-4 text-primary" />;
}

function fmt(d: string) {
  try {
    return new Date(d).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return d;
  }
}

function HistoryList() {
  const fetchHistory = useServerFn(getHistory);
  const { data, isLoading, error } = useQuery({
    queryKey: ["history"],
    queryFn: () => fetchHistory(),
  });

  if (isLoading) {
    return (
      <GlassCard title="Loading…" desc="Fetching your cosmic timeline.">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </GlassCard>
    );
  }
  if (error) {
    return <GlassCard title="Couldn't load history" desc={(error as Error).message} />;
  }
  if (!data || data.length === 0) {
    return (
      <GlassCard title="Nothing here yet" desc="Save a kundli, download a report, or write a journal note to build your timeline.">
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/kundli" className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary hover:bg-primary/20">Create kundli</Link>
          <Link to="/tarot" className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary hover:bg-primary/20">Draw a card</Link>
        </div>
      </GlassCard>
    );
  }

  return (
    <ul className="space-y-2">
      {data.map((item) => (
        <li key={item.id} className="glass flex items-center gap-3 rounded-2xl border border-primary/20 p-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10">
            {iconFor(item.kind)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-foreground">{item.label}</div>
            {item.sublabel && (
              <div className="truncate text-xs text-foreground/70">{item.sublabel}</div>
            )}
          </div>
          <div className="whitespace-nowrap text-[10px] uppercase tracking-widest text-foreground/60">
            {fmt(item.createdAt)}
          </div>
        </li>
      ))}
    </ul>
  );
}

function HistoryPage() {
  return (
    <PremiumGate featureName="History">
      <PageShell
        hideAI
        eyebrow="History"
        title="Your cosmic timeline"
        subtitle="Every kundli, report, and journal entry in one place."
      >
        <HistoryList />
      </PageShell>
    </PremiumGate>
  );
}
