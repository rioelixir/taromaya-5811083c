import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { StarField } from "@/components/star-field";
import { SPREADS, TAROT_DECK, type SpreadKey, type TarotCard } from "@/lib/tarot-deck";
import { interpretTarot } from "@/lib/tarot.functions";
import { Sparkles, RotateCcw, Loader2, Lock, X } from "lucide-react";

export const Route = createFileRoute("/tarot")({
  component: TarotPage,
  head: () => ({
    meta: [
      { title: "Tarot Canvas — TAROMAYA" },
      { name: "description", content: "Full-screen tarot canvas — drag cards from the deck and lock them into spreads." },
    ],
  }),
});

type PlacedCard = {
  uid: string;
  card: TarotCard;
  reversed: boolean;
  x: number; // canvas px
  y: number;
  slotIndex: number | null; // -1 / null when freestyle
  locked: boolean;
  flipped: boolean;
};

type Slot = { index: number; label: string; x: number; y: number };

const CARD_W = 130;
const CARD_H = 200;

function randomReversed() {
  return Math.random() < 0.3;
}

// Fisher-Yates that keeps original deck immutable
function shuffledDeck() {
  const d = [...TAROT_DECK];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function TarotPage() {
  const [spreadKey, setSpreadKey] = useState<SpreadKey>("ppf");
  const [question, setQuestion] = useState("");
  const [placed, setPlaced] = useState<PlacedCard[]>([]);
  const [deck, setDeck] = useState<TarotCard[]>(() => shuffledDeck());
  const [reading, setReading] = useState<string | null>(null);
  const [loadingReading, setLoadingReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomedUid, setZoomedUid] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 1200, h: 800 });
  const interpret = useServerFn(interpretTarot);

  const spread = SPREADS[spreadKey];
  const isFreestyle = !!spread.freestyle;

  // Track canvas size for slot layout
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setCanvasSize({ w: r.width, h: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compute slots based on spread + canvas size
  const slots: Slot[] = (() => {
    if (isFreestyle) return [];
    const n = spread.positions.length;
    const cy = canvasSize.h / 2 - CARD_H / 2 - 20;
    if (n === 1) {
      return [{ index: 0, label: spread.positions[0], x: canvasSize.w / 2 - CARD_W / 2, y: cy }];
    }
    // Spread horizontally centered
    const gap = 40;
    const totalW = n * CARD_W + (n - 1) * gap;
    const startX = canvasSize.w / 2 - totalW / 2;
    return spread.positions.map((label, i) => ({
      index: i,
      label,
      x: startX + i * (CARD_W + gap),
      y: cy,
    }));
  })();

  const resetSpread = useCallback(() => {
    setPlaced([]);
    setReading(null);
    setError(null);
    setDeck(shuffledDeck());
  }, []);

  // Switch spread — clear the board
  useEffect(() => {
    setPlaced([]);
    setReading(null);
    setError(null);
  }, [spreadKey]);

  // -------- Drag from deck --------
  const dragState = useRef<{
    uid: string | null;
    offsetX: number;
    offsetY: number;
    fromDeck: boolean;
  }>({ uid: null, offsetX: 0, offsetY: 0, fromDeck: false });

  const beginDragFromDeck = (e: React.PointerEvent) => {
    if (deck.length === 0) return;
    const canvasRect = canvasRef.current!.getBoundingClientRect();
    const card = deck[0];
    const newDeck = deck.slice(1);
    const uid = `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const x = e.clientX - canvasRect.left - CARD_W / 2;
    const y = e.clientY - canvasRect.top - CARD_H / 2;
    const newPlaced: PlacedCard = {
      uid,
      card,
      reversed: randomReversed(),
      x,
      y,
      slotIndex: null,
      locked: false,
      flipped: false,
    };
    setDeck(newDeck);
    setPlaced((p) => [...p, newPlaced]);
    dragState.current = { uid, offsetX: CARD_W / 2, offsetY: CARD_H / 2, fromDeck: true };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const beginDragPlaced = (e: React.PointerEvent, uid: string) => {
    const target = placed.find((p) => p.uid === uid);
    if (!target || target.locked) return;
    const canvasRect = canvasRef.current!.getBoundingClientRect();
    dragState.current = {
      uid,
      offsetX: e.clientX - canvasRect.left - target.x,
      offsetY: e.clientY - canvasRect.top - target.y,
      fromDeck: false,
    };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const st = dragState.current;
    if (!st.uid) return;
    const canvasRect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - canvasRect.left - st.offsetX;
    const y = e.clientY - canvasRect.top - st.offsetY;
    setPlaced((prev) =>
      prev.map((p) => (p.uid === st.uid ? { ...p, x, y } : p)),
    );
  };

  const onPointerUp = () => {
    const st = dragState.current;
    if (!st.uid) return;
    const uid = st.uid;
    dragState.current = { uid: null, offsetX: 0, offsetY: 0, fromDeck: false };

    setPlaced((prev) => {
      const idx = prev.findIndex((p) => p.uid === uid);
      if (idx < 0) return prev;
      const card = prev[idx];

      if (isFreestyle) {
        // Just place & auto-flip; no lock needed
        const next = [...prev];
        next[idx] = { ...card, flipped: true, locked: true, slotIndex: null };
        return next;
      }

      // Find nearest empty slot within snap radius
      const centerX = card.x + CARD_W / 2;
      const centerY = card.y + CARD_H / 2;
      const takenSlots = new Set(
        prev.filter((p) => p.uid !== uid && p.slotIndex !== null).map((p) => p.slotIndex),
      );
      let best: { slot: Slot; d: number } | null = null;
      for (const slot of slots) {
        if (takenSlots.has(slot.index)) continue;
        const sx = slot.x + CARD_W / 2;
        const sy = slot.y + CARD_H / 2;
        const d = Math.hypot(centerX - sx, centerY - sy);
        if (!best || d < best.d) best = { slot, d };
      }
      if (best && best.d < 140) {
        const next = [...prev];
        next[idx] = {
          ...card,
          x: best.slot.x,
          y: best.slot.y,
          slotIndex: best.slot.index,
          locked: true,
          flipped: true,
        };
        return next;
      }

      // Not near any slot: leave as unlocked freestyle-position
      const next = [...prev];
      next[idx] = { ...card, slotIndex: null, locked: false };
      return next;
    });
  };

  const removeCard = (uid: string) => {
    setPlaced((prev) => {
      const removed = prev.find((p) => p.uid === uid);
      if (removed) setDeck((d) => [...d, removed.card]);
      return prev.filter((p) => p.uid !== uid);
    });
  };

  // Ready to interpret?
  const lockedCards = placed.filter((p) => p.locked);
  const readyToInterpret = isFreestyle
    ? lockedCards.length >= 1
    : lockedCards.length === spread.positions.length;

  const requestReading = async () => {
    if (!readyToInterpret) return;
    setLoadingReading(true);
    setError(null);
    try {
      const orderedForAI = isFreestyle
        ? lockedCards.map((c, i) => ({ ...c, position: `Card ${i + 1}` }))
        : [...lockedCards]
            .sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0))
            .map((c) => ({ ...c, position: spread.positions[c.slotIndex!] }));

      const res = await interpret({
        data: {
          spreadLabel: spread.label,
          question,
          cards: orderedForAI.map((c) => ({
            name: c.card.name,
            position: c.position,
            reversed: c.reversed,
            keywords: c.reversed ? c.card.keywordsReversed : c.card.keywords,
          })),
        },
      });
      setReading(res.text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      if (msg.includes("429")) setError("The cosmos is busy — try again shortly.");
      else if (msg.includes("402")) setError("AI credits exhausted. Add credits to continue.");
      else setError(msg);
    } finally {
      setLoadingReading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh w-full flex-col">
      <StarField />

      {/* Top control bar */}
      <div className="relative z-20 w-full px-4 sm:px-6 pt-6">
        <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Tarot</div>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl gold-text">Your Sacred Canvas</h1>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {(Object.keys(SPREADS) as SpreadKey[]).map((k) => {
            const active = k === spreadKey;
            return (
              <button
                key={k}
                onClick={() => setSpreadKey(k)}
                className={`text-xs sm:text-sm rounded-xl px-3 py-2 border transition-all ${
                  active
                    ? "border-gold/60 bg-gold/10 text-pearl shadow-[0_0_20px_-8px_var(--gold)]"
                    : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/25 hover:text-pearl"
                }`}
              >
                {SPREADS[k].label}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={200}
            placeholder="Hold your question in mind…"
            className="flex-1 min-w-[220px] rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-pearl placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold/50"
          />
          <button
            onClick={resetSpread}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/[0.05]"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
          <button
            onClick={requestReading}
            disabled={!readyToInterpret || loadingReading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft text-cosmic font-medium px-4 py-2 text-sm hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loadingReading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Interpret
          </button>
        </div>

        <div className="mt-2 text-xs text-muted-foreground">
          {isFreestyle
            ? `${spread.blurb} Drop as many cards as you want.`
            : `${spread.blurb} Drag ${spread.positions.length} card${spread.positions.length > 1 ? "s" : ""} into the glowing slot${spread.positions.length > 1 ? "s" : ""}.`}
        </div>
      </div>

      {/* Canvas */}
      <div className="relative z-10 w-full px-4 sm:px-6 pt-6 pb-40">
        <div
          ref={canvasRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-cosmic/60 via-midnight/40 to-black/60 overflow-hidden touch-none select-none"
          style={{ height: "min(72vh, 720px)" }}
        >
          {/* subtle grid glow */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_35%,rgba(212,175,55,0.10),transparent_60%)]" />

          {/* Slots */}
          {slots.map((s) => {
            const taken = placed.some((p) => p.slotIndex === s.index && p.locked);
            return (
              <div
                key={s.index}
                className={`absolute rounded-2xl border-2 border-dashed flex items-end justify-center pb-2 transition-all ${
                  taken
                    ? "border-gold/0"
                    : "border-gold/40 bg-gold/[0.03] shadow-[0_0_40px_-16px_var(--gold)]"
                }`}
                style={{ left: s.x, top: s.y, width: CARD_W, height: CARD_H }}
              >
                {!taken && (
                  <div className="text-[10px] uppercase tracking-widest text-gold/70">
                    {s.label}
                  </div>
                )}
              </div>
            );
          })}

          {/* Placed cards */}
          {placed.map((p) => (
            <PlacedCardView
              key={p.uid}
              card={p}
              onPointerDown={(e) => beginDragPlaced(e, p.uid)}
              onFlip={() =>
                setPlaced((prev) =>
                  prev.map((x) => (x.uid === p.uid ? { ...x, flipped: !x.flipped } : x)),
                )
              }
              onRemove={() => removeCard(p.uid)}
              onZoom={() => p.flipped && setZoomedUid(p.uid)}
              slotLabel={
                p.slotIndex !== null && !isFreestyle ? spread.positions[p.slotIndex] : undefined
              }
            />
          ))}

          {/* Deck stack — bottom right */}
          <div className="absolute bottom-4 right-4 flex flex-col items-center gap-2 pointer-events-none">
            <div className="text-[10px] uppercase tracking-widest text-gold/70">
              Deck · {deck.length}
            </div>
            <div className="relative pointer-events-auto" style={{ width: CARD_W, height: CARD_H }}>
              {[0, 1, 2, 3, 4].map((i) => {
                const isTop = i === 0;
                const rot = (i - 2) * 1.5;
                return (
                  <div
                    key={i}
                    onPointerDown={isTop ? beginDragFromDeck : undefined}
                    className={`absolute inset-0 rounded-2xl border border-gold/40 bg-gradient-to-br from-midnight to-cosmic shadow-luxe ${
                      isTop ? "cursor-grab active:cursor-grabbing hover:-translate-y-1 transition-transform" : ""
                    }`}
                    style={{
                      transform: `translate(${i * 2}px, ${i * -3}px) rotate(${rot}deg)`,
                      zIndex: 10 - i,
                    }}
                  >
                    <div className="absolute inset-2 rounded-xl border border-gold/20 flex items-center justify-center">
                      <div className="text-gold/70 font-display text-3xl">✦</div>
                    </div>
                  </div>
                );
              })}
              {deck.length === 0 && (
                <div className="absolute inset-0 rounded-2xl border border-white/10 flex items-center justify-center text-xs text-muted-foreground">
                  Empty
                </div>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground pointer-events-auto text-center max-w-[160px]">
              Drag the top card onto the canvas
            </div>
          </div>
        </div>

        {/* Reading */}
        {(reading || error || loadingReading) && (
          <div className="mt-6 glass rounded-3xl p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gold/80">
              <Sparkles className="h-3.5 w-3.5" /> AI Reading
            </div>
            {loadingReading && !reading && (
              <div className="mt-4 flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Weaving your reading…
              </div>
            )}
            {error && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-200">
                {error}
              </div>
            )}
            {reading && (
              <div className="mt-4">
                <ReadingMarkdown text={reading} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen zoom overlay */}
      {zoomedUid && (() => {
        const zc = placed.find((p) => p.uid === zoomedUid);
        if (!zc) return null;
        return (
          <div
            onClick={() => setZoomedUid(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-6 animate-in fade-in duration-300"
          >
            <button
              onClick={(e) => { e.stopPropagation(); setZoomedUid(null); }}
              className="absolute top-6 right-6 rounded-full bg-black/60 border border-white/20 p-2 hover:bg-white/10"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-pearl" />
            </button>
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative rounded-3xl border border-gold/50 bg-gradient-to-b from-midnight via-cosmic to-black shadow-[0_0_120px_-20px_var(--gold)] p-6 flex flex-col items-center"
              style={{
                width: "min(90vw, 480px)",
                height: "min(90vh, 740px)",
                transform: zc.reversed ? "rotate(180deg)" : undefined,
              }}
            >
              <div className="text-xs uppercase tracking-[0.4em] text-gold/70">
                {zc.card.arcana === "major" ? "Major Arcana" : zc.card.suit}
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="text-[10rem] leading-none">{glyphFor(zc.card)}</div>
              </div>
              <div className="font-display text-3xl gold-text text-center">
                {zc.card.name}
              </div>
              {zc.reversed && (
                <div className="mt-2 text-[10px] uppercase tracking-[0.4em] text-gold/60">
                  Reversed
                </div>
              )}
              <div className="mt-4 text-xs text-pearl/70 text-center max-w-md leading-relaxed">
                {(zc.reversed ? zc.card.keywordsReversed : zc.card.keywords).join(" · ")}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function PlacedCardView({
  card,
  onPointerDown,
  onFlip,
  onRemove,
  onZoom,
  slotLabel,
}: {
  card: PlacedCard;
  onPointerDown: (e: React.PointerEvent) => void;
  onFlip: () => void;
  onRemove: () => void;
  onZoom: () => void;
  slotLabel?: string;
}) {
  return (
    <div
      className="absolute"
      style={{ left: card.x, top: card.y, width: CARD_W, height: CARD_H, zIndex: card.locked ? 20 : 30 }}
    >
      <div
        onPointerDown={onPointerDown}
        onClick={() => {
          if (card.flipped && card.locked) onZoom();
        }}
        className={`relative w-full h-full ${card.locked ? "cursor-zoom-in" : "cursor-grab active:cursor-grabbing"}`}
        style={{ perspective: "1000px" }}
      >
        <div
          className="absolute inset-0 transition-transform duration-700"
          style={{
            transformStyle: "preserve-3d",
            transform: card.flipped ? "rotateY(180deg)" : "rotateY(0)",
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
            className="absolute inset-0 rounded-2xl border border-gold/50 bg-gradient-to-b from-midnight via-cosmic to-black shadow-[0_0_40px_-10px_var(--gold)] p-2 flex flex-col"
            style={{
              backfaceVisibility: "hidden",
              transform: `rotateY(180deg) ${card.reversed ? "rotate(180deg)" : ""}`,
            }}
          >
            <div className="text-[9px] uppercase tracking-widest text-gold/70 text-center">
              {card.card.arcana === "major" ? "Major" : card.card.suit}
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-4xl">{glyphFor(card.card)}</div>
            </div>
            <div className="font-display text-xs text-pearl text-center leading-tight">
              {card.card.name}
            </div>
            {card.reversed && (
              <div className="text-[8px] uppercase tracking-widest text-gold/60 text-center mt-0.5">
                Reversed
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay controls */}
      <div className="absolute -top-2 -right-2 flex gap-1 z-10">
        {card.locked && (
          <div className="rounded-full bg-gold/20 border border-gold/40 p-1" title="Locked">
            <Lock className="h-3 w-3 text-gold" />
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="rounded-full bg-black/70 border border-white/20 p-1 hover:bg-red-500/40"
          title="Remove"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {card.flipped ? null : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFlip();
          }}
          className="absolute inset-x-0 -bottom-6 mx-auto text-[10px] uppercase tracking-widest text-gold/70 hover:text-gold"
        >
          Reveal
        </button>
      )}

      {slotLabel && (
        <div className="absolute inset-x-0 -bottom-5 text-[10px] uppercase tracking-widest text-center text-gold/70">
          {slotLabel}
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
  const lines = text.split("\n");
  const out: ReactNode[] = [];
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
