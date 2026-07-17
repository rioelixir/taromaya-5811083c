import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PageShell, GlassCard } from "@/components/page-shell";
import { SPREADS, shuffleAndDraw, type DrawnCard } from "@/lib/tarot-deck";
import { interpretTarot } from "@/lib/tarot.functions";
import { Sparkles, Shuffle, RotateCcw, Loader2 } from "lucide-react";

export const Route = createFileRoute("/tarot")({
  component: TarotPage,
  head: () => ({
    meta: [
      { title: "Tarot — TAROMAYA" },
      { name: "description", content: "Premium AI tarot with 78-card Rider-Waite deck, luxury spreads, and grounded AI interpretation." },
    ],
  }),
});

type Phase = "select" | "shuffling" | "reveal";

function TarotPage() {
  const [spreadKey, setSpreadKey] = useState<keyof typeof SPREADS>("three");
  const [question, setQuestion] = useState("");
  const [phase, setPhase] = useState<Phase>("select");
  const [drawn, setDrawn] = useState<DrawnCard[]>([]);
  const [reading, setReading] = useState<string | null>(null);
  const [loadingReading, setLoadingReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const interpret = useServerFn(interpretTarot);

  const spread = SPREADS[spreadKey];

  const startDraw = () => {
    setError(null);
    setReading(null);
    setPhase("shuffling");
    // Shuffle animation duration
    setTimeout(() => {
      const cards = shuffleAndDraw(spread.positions.length, spread.positions);
      setDrawn(cards);
      setPhase("reveal");
      // Auto-request interpretation
      void requestInterpretation(cards);
    }, 1600);
  };

  const requestInterpretation = async (cards: DrawnCard[]) => {
    setLoadingReading(true);
    try {
      const res = await interpret({
        data: {
          spreadLabel: spread.label,
          question,
          cards: cards.map((c) => ({
            name: c.card.name,
            position: c.position,
            reversed: c.reversed,
            keywords: c.reversed ? c.card.keywordsReversed : c.card.keywords,
          })),
        },
      });
      setReading(res.text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong reading the cards.";
      if (msg.includes("429")) setError("The cosmos is busy — please try again in a moment.");
      else if (msg.includes("402")) setError("AI credits exhausted. Please add credits to continue readings.");
      else setError(msg);
    } finally {
      setLoadingReading(false);
    }
  };

  const reset = () => {
    setPhase("select");
    setDrawn([]);
    setReading(null);
    setError(null);
  };

  return (
    <PageShell
      eyebrow="Tarot"
      title="Draw your cards"
      subtitle="Choose a spread, hold your question in mind, and let the deck speak."
    >
      {phase === "select" && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <GlassCard title="Choose a spread">
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(SPREADS).map(([key, s]) => {
                const active = key === spreadKey;
                return (
                  <button
                    key={key}
                    onClick={() => setSpreadKey(key as keyof typeof SPREADS)}
                    className={`text-left rounded-2xl p-4 border transition-all ${
                      active
                        ? "border-gold/60 bg-gold/[0.06] shadow-[0_0_30px_-10px_var(--gold)]"
                        : "border-white/10 hover:border-white/25 bg-white/[0.02]"
                    }`}
                  >
                    <div className="font-display text-lg text-pearl">{s.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{s.blurb}</div>
                    <div className="mt-2 text-[10px] uppercase tracking-widest text-gold/70">
                      {s.positions.length} cards
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard title="Your question" desc="Optional — but focused questions get sharper readings.">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What should I know about…"
              maxLength={500}
              rows={4}
              className="w-full resize-none rounded-2xl bg-black/30 border border-white/10 p-4 text-pearl placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold/50"
            />
            <button
              onClick={startDraw}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold to-gold-soft text-cosmic font-medium py-3 hover:brightness-110 transition"
            >
              <Sparkles className="h-4 w-4" />
              Shuffle & Draw
            </button>
          </GlassCard>
        </div>
      )}

      {phase === "shuffling" && (
        <div className="flex flex-col items-center justify-center py-24">
          <ShuffleDeck />
          <p className="mt-8 text-sm text-muted-foreground animate-pulse">
            Attuning the deck to your question…
          </p>
        </div>
      )}

      {phase === "reveal" && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {spread.label}
              </div>
              {question && (
                <div className="mt-1 font-display text-xl text-pearl italic">"{question}"</div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={startDraw}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/[0.05]"
              >
                <Shuffle className="h-4 w-4" /> Redraw
              </button>
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/[0.05]"
              >
                <RotateCcw className="h-4 w-4" /> New spread
              </button>
            </div>
          </div>

          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${Math.min(drawn.length, 5)}, minmax(0, 1fr))`,
            }}
          >
            {drawn.map((d, i) => (
              <CardReveal key={i} drawn={d} index={i} />
            ))}
          </div>

          <GlassCard>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gold/80">
              <Sparkles className="h-3.5 w-3.5" /> AI Reading
            </div>
            {loadingReading && !reading && (
              <div className="mt-6 flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Weaving your reading…
              </div>
            )}
            {error && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-200">
                {error}
              </div>
            )}
            {reading && (
              <div className="mt-4 prose-tarot">
                <ReadingMarkdown text={reading} />
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </PageShell>
  );
}

function ShuffleDeck() {
  return (
    <div className="relative h-56 w-40">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="absolute inset-0 rounded-2xl border border-gold/40 bg-gradient-to-br from-midnight to-cosmic shadow-luxe"
          style={{
            animation: `shuffleCard 1.6s ease-in-out ${i * 0.12}s infinite`,
            transformOrigin: "center bottom",
          }}
        >
          <div className="absolute inset-2 rounded-xl border border-gold/20 flex items-center justify-center">
            <div className="text-gold/70 font-display text-2xl">✦</div>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes shuffleCard {
          0%, 100% { transform: translate(0,0) rotate(0); }
          25% { transform: translate(-30px, -8px) rotate(-8deg); }
          50% { transform: translate(0, -14px) rotate(0deg); }
          75% { transform: translate(30px, -8px) rotate(8deg); }
        }
      `}</style>
    </div>
  );
}

function CardReveal({ drawn, index }: { drawn: DrawnCard; index: number }) {
  const [flipped, setFlipped] = useState(false);
  // Auto-flip in sequence
  useState(() => {
    setTimeout(() => setFlipped(true), 300 + index * 220);
  });
  return (
    <div className="flex flex-col items-center">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
        {drawn.position}
      </div>
      <div
        className="relative w-full aspect-[2/3] max-w-[180px] cursor-pointer"
        style={{ perspective: "1000px" }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className="absolute inset-0 transition-transform duration-700"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0)",
          }}
        >
          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl border border-gold/40 bg-gradient-to-br from-midnight to-cosmic shadow-luxe"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="absolute inset-2 rounded-xl border border-gold/20 flex items-center justify-center">
              <div className="text-gold/70 font-display text-3xl">✦</div>
            </div>
          </div>
          {/* Front */}
          <div
            className="absolute inset-0 rounded-2xl border border-gold/50 bg-gradient-to-b from-midnight via-cosmic to-black shadow-[0_0_40px_-10px_var(--gold)] p-3 flex flex-col"
            style={{
              backfaceVisibility: "hidden",
              transform: `rotateY(180deg) ${drawn.reversed ? "rotate(180deg)" : ""}`,
            }}
          >
            <div className="text-[9px] uppercase tracking-widest text-gold/70 text-center">
              {drawn.card.arcana === "major" ? "Major Arcana" : drawn.card.suit}
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-4xl">{glyphFor(drawn.card)}</div>
            </div>
            <div className="font-display text-sm text-pearl text-center leading-tight">
              {drawn.card.name}
            </div>
          </div>
        </div>
      </div>
      {flipped && (
        <div className="mt-2 text-[10px] uppercase tracking-widest text-gold/70">
          {drawn.reversed ? "Reversed" : "Upright"}
        </div>
      )}
    </div>
  );
}

function glyphFor(card: { arcana: string; suit?: string }) {
  if (card.arcana === "major") return "✦";
  switch (card.suit) {
    case "wands": return "🜂";
    case "cups": return "🜄";
    case "swords": return "🜁";
    case "pentacles": return "🜃";
    default: return "✦";
  }
}

function ReadingMarkdown({ text }: { text: string }) {
  // Lightweight markdown: headings (###), paragraphs, bold.
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let para: string[] = [];
  const flush = (key: number) => {
    if (para.length) {
      out.push(
        <p key={`p${key}`} className="text-pearl/90 leading-relaxed">
          {renderInline(para.join(" "))}
        </p>,
      );
      para = [];
    }
  };
  lines.forEach((ln, i) => {
    if (ln.startsWith("### ")) {
      flush(i);
      out.push(
        <h3 key={`h${i}`} className="mt-6 font-display text-lg text-gold">
          {ln.slice(4)}
        </h3>,
      );
    } else if (ln.trim() === "") {
      flush(i);
    } else {
      para.push(ln);
    }
  });
  flush(9999);
  return <div className="space-y-3">{out}</div>;
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="text-pearl">{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}
