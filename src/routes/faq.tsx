import { createFileRoute } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import { PageShell, GlassCard } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, HelpCircle, Loader2 } from "lucide-react";

type Faq = { id: string; question: string; answer_md: string; category: string; sort_order: number };

export const Route = createFileRoute("/faq")({
  component: FaqPage,
  head: () => ({
    meta: [
      { title: "FAQ — TAROMAYA" },
      { name: "description", content: "Frequently asked questions about Taromaya." },
    ],
  }),
});

function FaqPage() {
  const [rows, setRows] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("cms_faqs")
      .select("id, question, answer_md, category, sort_order")
      .eq("published", true)
      .order("category").order("sort_order")
      .then(({ data }) => { setRows((data ?? []) as Faq[]); setLoading(false); });
  }, []);

  const grouped = useMemo(() => {
    const g: Record<string, Faq[]> = {};
    for (const r of rows) (g[r.category] ??= []).push(r);
    return g;
  }, [rows]);

  return (
    <PageShell hideAI hideVoice eyebrow="Support" title="Frequently asked questions" subtitle="Everything you need to know about Taromaya.">
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-white/60"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : !rows.length ? (
        <GlassCard><p className="text-pearl">No FAQs yet.</p></GlassCard>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h2 className="mb-3 text-sm uppercase tracking-widest text-gold/80">{cat}</h2>
              <div className="grid gap-2">
                {items.map(f => {
                  const isOpen = open === f.id;
                  return (
                    <GlassCard key={f.id} className="p-0">
                      <button onClick={() => setOpen(isOpen ? null : f.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
                        <span className="flex items-center gap-2 text-pearl"><HelpCircle className="h-4 w-4 text-gold" />{f.question}</span>
                        <ChevronDown className={`h-4 w-4 text-white/60 transition ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 pt-1">
                          <div className="prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown>{f.answer_md}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
