import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { StarField } from "@/components/star-field";
import { SPREADS, type SpreadKey, type TarotCard } from "@/lib/tarot-deck";
import { DECKS, DECK_LIST, type DeckKey } from "@/lib/tarot-decks";
import { interpretTarot } from "@/lib/tarot.functions";
import { Sparkles, RotateCcw, Loader2, Lock, X, Shuffle } from "lucide-react";

export const Route = createFileRoute("/tarot")({
  component: () => (<PremiumGate featureName="Tarot"><TarotPage /></PremiumGate>),
  head: () => ({
    meta: [
      { title: "Tarot — TAROMAYA" },
      { name: "description", content: "Pick a deck, pull a card, get a clear reading. Five decks to choose from." },
    ],
  }),
});

type PlacedCard = {
  uid: string;
  card: TarotCard;
  deckKey: DeckKey;
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
const MINI_W = 62;
const MINI_H = 96;

function randomReversed() {
  return Math.random() < 0.3;
}

// Fisher-Yates shuffle helper (returns new array).
function shuffle<T>(arr: T[]): T[] {
  const d = [...arr];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// Build the initial per-deck stacks, each independently shuffled.
function makeDeckStacks(): Record<DeckKey, TarotCard[]> {
  return {
    "rider-waite": shuffle(DECKS["rider-waite"]),
    "nakshatra":   shuffle(DECKS["nakshatra"]),
    "health":      shuffle(DECKS["health"]),
    "lost-found":  shuffle(DECKS["lost-found"]),
    "soulmates":   shuffle(DECKS["soulmates"]),
  };
}


function TarotPage() {
  const [spreadKey, setSpreadKey] = useState<SpreadKey>("ppf");
  const [question, setQuestion] = useState("");
  const [placed, setPlaced] = useState<PlacedCard[]>([]);
  const [decks, setDecks] = useState<TarotCard[][]>(() => makeDecks());
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
    setDecks(makeDecks());
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

  const beginDragFromDeck = (e: React.PointerEvent, deckIdx: number) => {
    const source = decks[deckIdx];
    if (!source || source.length === 0) return;
    const canvasRect = canvasRef.current!.getBoundingClientRect();
    const card = source[0];
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
    setDecks((prev) => prev.map((d, i) => (i === deckIdx ? d.slice(1) : d)));
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

      // Snap to a subtle grid so the board stays clean.
      const GRID = 20;
      const sx = Math.round(card.x / GRID) * GRID;
      const sy = Math.round(card.y / GRID) * GRID;

      // Keep card fully inside the canvas.
      const maxX = Math.max(0, canvasSize.w - CARD_W - 4);
      const maxY = Math.max(0, canvasSize.h - CARD_H - 4);
      const clampedX = Math.min(Math.max(0, sx), maxX);
      const clampedY = Math.min(Math.max(0, sy), maxY);

      const next = [...prev];
      next[idx] = {
        ...card,
        x: clampedX,
        y: clampedY,
        flipped: true,
        locked: true,
        slotIndex: null,
      };
      return next;
    });
  };

  const removeCard = (uid: string) => {
    setPlaced((prev) => {
      const removed = prev.find((p) => p.uid === uid);
      if (removed) {
        setDecks((prev) => {
          // Return to the currently smallest stack.
          let target = 0;
          for (let i = 1; i < prev.length; i++) if (prev[i].length < prev[target].length) target = i;
          return prev.map((d, i) => (i === target ? [...d, removed.card] : d));
        });
      }
      return prev.filter((p) => p.uid !== uid);
    });
  };

  const shuffleAll = useCallback(() => {
    setDecks((prev) => {
      // Pool all remaining deck cards, reshuffle, redistribute across visible stacks.
      const pool = prev.flat();
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      const out: TarotCard[][] = Array.from({ length: prev.length }, () => []);
      pool.forEach((c, i) => out[i % prev.length].push(c));
      return out;
    });
  }, []);

  // Ready to interpret?
  const lockedCards = placed.filter((p) => p.locked);
  const requiredCount = isFreestyle ? 1 : spread.positions.length;
  const readyToInterpret = lockedCards.length >= requiredCount;

  const requestReading = async () => {
    if (!readyToInterpret) return;
    setLoadingReading(true);
    setError(null);
    try {
      // Order cards left-to-right by placement position on the canvas.
      const sorted = [...lockedCards].sort((a, b) => a.x - b.x || a.y - b.y);
      const orderedForAI = isFreestyle
        ? sorted.map((c, i) => ({ ...c, position: `Card ${i + 1}` }))
        : sorted.slice(0, spread.positions.length).map((c, i) => ({
            ...c,
            position: spread.positions[i],
          }));

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
            onClick={shuffleAll}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/[0.05]"
            title="Shuffle every visible deck"
          >
            <Shuffle className="h-4 w-4" /> Shuffle All
          </button>
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
            ? `${spread.blurb} Drop as many cards as you want — they snap to a clean grid.`
            : `${spread.blurb} Drag ${spread.positions.length} card${spread.positions.length > 1 ? "s" : ""} anywhere on the board; they snap into place.`}
        </div>
      </div>

      {/* Canvas */}
      <div className="relative z-10 flex w-full flex-1 flex-col px-4 sm:px-6 pt-6 pb-40">
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
            />
          ))}

          {/* Five deck stacks — bottom right */}
          <div className="absolute bottom-4 right-3 sm:right-4 flex flex-col items-end gap-2 pointer-events-none">
            <div className="text-[10px] uppercase tracking-widest text-gold/70">
              Decks · {decks.reduce((n, d) => n + d.length, 0)} cards
            </div>
            <div className="pointer-events-auto flex items-end gap-2 sm:gap-2.5">
              {decks.map((subDeck, di) => {
                const empty = subDeck.length === 0;
                const meta = DECK_META[di % DECK_META.length];
                return (
                  <div
                    key={di}
                    className="relative flex flex-col items-center"
                    style={{ width: MINI_W }}
                  >
                    <div className="relative" style={{ width: MINI_W, height: MINI_H }}>
                      {[0, 1, 2].map((i) => {
                        const isTop = i === 0 && !empty;
                        const rot = (i - 1) * 1.2 + (di - 2) * 0.6;
                        return (
                          <div
                            key={i}
                            onPointerDown={isTop ? (e) => beginDragFromDeck(e, di) : undefined}
                            className={`absolute inset-0 rounded-xl border ${
                              empty
                                ? "border-white/10 bg-black/30"
                                : "bg-gradient-to-br from-midnight to-cosmic"
                            } ${isTop ? "cursor-grab active:cursor-grabbing hover:-translate-y-1 transition-transform" : ""}`}
                            style={{
                              transform: `translate(${i * 1.5}px, ${i * -2}px) rotate(${rot}deg)`,
                              zIndex: 10 - i,
                              borderColor: empty ? undefined : `${meta.accent}66`,
                              boxShadow: empty || !isTop ? undefined : `0 8px 32px -12px ${meta.accent}80, inset 0 0 24px -12px ${meta.accent}`,
                            }}
                          >
                            {!empty && (
                              <div
                                className="absolute inset-1.5 rounded-lg border flex items-center justify-center"
                                style={{ borderColor: `${meta.accent}40` }}
                              >
                                <div
                                  className="font-display text-lg"
                                  style={{ color: `${meta.accent}` }}
                                >
                                  {meta.glyph}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div
                      className="mt-2 text-[9px] uppercase tracking-[0.2em] font-medium"
                      style={{ color: meta.accent }}
                    >
                      {meta.name}
                    </div>
                    <div className="text-[9px] text-muted-foreground leading-none">
                      {subDeck.length}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-[10px] text-muted-foreground pointer-events-auto text-center pt-1">
              Drag from any deck onto the canvas
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
}: {
  card: PlacedCard;
  onPointerDown: (e: React.PointerEvent) => void;
  onFlip: () => void;
  onRemove: () => void;
  onZoom: () => void;
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
