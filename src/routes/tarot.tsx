import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { StarField } from "@/components/star-field";
import { SPREADS, secureRandInt, type SpreadKey } from "@/lib/tarot-deck";
import { DECK_LIST, type DeckKey, type UploadedCard } from "@/lib/tarot-decks";
import { useUploadedDecks } from "@/hooks/use-uploaded-decks";
import { interpretTarot } from "@/lib/tarot.functions";
import { PlainAIText } from "@/components/plain-ai-text";
import { Sparkles, RotateCcw, Loader2, Lock, X, Shuffle, ChevronUp, ChevronDown } from "lucide-react";

const DESIGNER_NOTE_KEY = "tarot-designer-note-shown";

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
  card: UploadedCard;
  deckKey: DeckKey;
  reversed: boolean;
  x: number; // canvas px
  y: number;
  slotIndex: number | null; // -1 / null when freestyle
  locked: boolean;
  flipped: boolean;
};

type Slot = { index: number; label: string; x: number; y: number };

const CARD_W = 86;
const CARD_H = 132;
const MINI_W = 46;
const MINI_H = 70;

type DeckStacks = Record<DeckKey, UploadedCard[]>;

function randomReversed() {
  return false;
}

// Fisher-Yates shuffle helper (CSPRNG-backed, unbiased, non-repeatable).
function shuffle<T>(arr: T[]): T[] {
  const d = [...arr];
  for (let i = d.length - 1; i > 0; i--) {
    const j = secureRandInt(i + 1);
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// Shuffle each admin-uploaded deck into a draw stack.
function makeDeckStacks(source: DeckStacks): DeckStacks {
  return Object.fromEntries(
    DECK_LIST.map((m) => [m.key, shuffle(source[m.key] ?? [])]),
  ) as unknown as DeckStacks;
}

function TarotPage() {
  const [spreadKey, setSpreadKey] = useState<SpreadKey>("ppf");
  const [question, setQuestion] = useState("");
  const [placed, setPlaced] = useState<PlacedCard[]>([]);
  const { decks: uploaded, loading: loadingDecks } = useUploadedDecks();
  const [decks, setDecks] = useState<DeckStacks>(() => makeDeckStacks({} as DeckStacks));
  const [reading, setReading] = useState<string | null>(null);
  const [loadingReading, setLoadingReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomedUid, setZoomedUid] = useState<string | null>(null);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [designerNote, setDesignerNote] = useState(false);
  const designerNoteFired = useRef(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 1200, h: 800 });
  const interpret = useServerFn(interpretTarot);

  // Show the one-time designer note on the first click in the Tarot module, then fade it out.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(DESIGNER_NOTE_KEY)) {
      designerNoteFired.current = true;
    }
  }, []);

  const triggerDesignerNote = useCallback(() => {
    if (designerNoteFired.current) return;
    designerNoteFired.current = true;
    if (typeof window !== "undefined") {
      sessionStorage.setItem(DESIGNER_NOTE_KEY, "1");
    }
    setDesignerNote(true);
    window.setTimeout(() => setDesignerNote(false), 2600);
  }, []);

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
    const gap = 26;
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
    setDecks(makeDeckStacks(uploaded));
  }, [uploaded]);

  // Rebuild the draw stacks whenever the admin-uploaded decks load or change.
  useEffect(() => {
    setPlaced([]);
    setDecks(makeDeckStacks(uploaded));
  }, [uploaded]);

  useEffect(() => {
    setPlaced([]);
    setReading(null);
    setError(null);
  }, [spreadKey]);

  // -------- Drag engine (window-level pointer tracking) --------
  const dragState = useRef<{
    uid: string | null;
    pointerId: number | null;
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
    moved: boolean;
    fromDeck: boolean;
  }>({ uid: null, pointerId: null, offsetX: 0, offsetY: 0, startX: 0, startY: 0, moved: false, fromDeck: false });

  const [draggingUid, setDraggingUid] = useState<string | null>(null);

  const clampToCanvas = useCallback(
    (x: number, y: number) => {
      const maxX = Math.max(0, canvasSize.w - CARD_W - 4);
      const maxY = Math.max(0, canvasSize.h - CARD_H - 26);
      return {
        x: Math.min(Math.max(0, x), maxX),
        y: Math.min(Math.max(0, y), maxY),
      };
    },
    [canvasSize.w, canvasSize.h],
  );

  // Where a card should rest when it is tapped (not dragged) out of a deck:
  // the next free spread slot, or a tidy grid that fits ~15 cards for freestyle.
  const restingSpot = useCallback(
    (existing: PlacedCard[]) => {
      if (!isFreestyle) {
        const used = new Set(existing.map((p) => p.slotIndex).filter((i) => i !== null));
        const free = slots.find((s) => !used.has(s.index));
        if (free) return { x: free.x, y: free.y, slotIndex: free.index };
      }
      const perRow = Math.max(1, Math.floor((canvasSize.w - 40) / (CARD_W + 16)));
      const i = existing.length;
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const rowCount = Math.min(perRow, Math.max(1, existing.length + 1 - row * perRow));
      const rowW = rowCount * CARD_W + (rowCount - 1) * 16;
      const x = canvasSize.w / 2 - rowW / 2 + col * (CARD_W + 16);
      const y = 24 + row * (CARD_H + 40);
      const c = clampToCanvas(x, y);
      return { x: c.x, y: c.y, slotIndex: null as number | null };
    },
    [isFreestyle, slots, canvasSize.w, clampToCanvas],
  );

  const beginDragFromDeck = (e: React.PointerEvent, deckKey: DeckKey) => {
    e.preventDefault();
    const source = decks[deckKey];
    if (!source || source.length === 0) return;
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const canvasRect = canvasEl.getBoundingClientRect();
    const card = source[0];
    const uid = `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const x = e.clientX - canvasRect.left - CARD_W / 2;
    const y = e.clientY - canvasRect.top - CARD_H / 2;
    const newPlaced: PlacedCard = {
      uid,
      card,
      deckKey,
      reversed: randomReversed(),
      x,
      y,
      slotIndex: null,
      locked: false,
      flipped: false,
    };
    setDecks((prev) => ({ ...prev, [deckKey]: prev[deckKey].slice(1) }));
    setPlaced((p) => [...p, newPlaced]);
    dragState.current = {
      uid,
      pointerId: e.pointerId,
      offsetX: CARD_W / 2,
      offsetY: CARD_H / 2,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      fromDeck: true,
    };
    setDraggingUid(uid);
  };

  const beginDragPlaced = (e: React.PointerEvent, uid: string) => {
    const target = placed.find((p) => p.uid === uid);
    if (!target) return;
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    e.preventDefault();
    const canvasRect = canvasEl.getBoundingClientRect();
    dragState.current = {
      uid,
      pointerId: e.pointerId,
      offsetX: e.clientX - canvasRect.left - target.x,
      offsetY: e.clientY - canvasRect.top - target.y,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      fromDeck: false,
    };
    setDraggingUid(uid);
  };

  // Global listeners: dragging keeps working even if the pointer leaves the
  // original element or the deck stack re-renders under the finger.
  useEffect(() => {
    if (!draggingUid) return;

    const move = (e: PointerEvent) => {
      const st = dragState.current;
      if (!st.uid) return;
      const canvasEl = canvasRef.current;
      if (!canvasEl) return;
      if (Math.abs(e.clientX - st.startX) > 4 || Math.abs(e.clientY - st.startY) > 4) {
        st.moved = true;
      }
      const r = canvasEl.getBoundingClientRect();
      const x = e.clientX - r.left - st.offsetX;
      const y = e.clientY - r.top - st.offsetY;
      setPlaced((prev) => prev.map((p) => (p.uid === st.uid ? { ...p, x, y } : p)));
    };

    const up = () => {
      const st = dragState.current;
      const uid = st.uid;
      const wasTap = !st.moved;
      const fromDeck = st.fromDeck;
      dragState.current = { uid: null, pointerId: null, offsetX: 0, offsetY: 0, startX: 0, startY: 0, moved: false, fromDeck: false };
      setDraggingUid(null);
      if (!uid) return;

      setPlaced((prev) => {
        const idx = prev.findIndex((p) => p.uid === uid);
        if (idx < 0) return prev;
        const card = prev[idx];
        const next = [...prev];

        // Tap on a deck (no drag) → the card slides up to its spot on the board.
        if (wasTap && fromDeck) {
          const spot = restingSpot(prev.filter((p) => p.uid !== uid));
          next[idx] = { ...card, ...spot, flipped: true, locked: true };
          return next;
        }

        // Dragged → snap to the nearest empty spread slot if close, else free place.
        const { x: cx, y: cy } = clampToCanvas(card.x, card.y);
        const used = new Set(prev.filter((p) => p.uid !== uid).map((p) => p.slotIndex));
        let bestSlot: Slot | null = null;
        let bestDist = Infinity;
        for (const s of slots) {
          if (used.has(s.index)) continue;
          const d = Math.hypot(s.x - cx, s.y - cy);
          if (d < bestDist) { bestDist = d; bestSlot = s; }
        }
        if (bestSlot && bestDist < CARD_W * 1.1) {
          next[idx] = { ...card, x: bestSlot.x, y: bestSlot.y, slotIndex: bestSlot.index, flipped: true, locked: true };
          return next;
        }

        const GRID = 10;
        next[idx] = {
          ...card,
          x: Math.round(cx / GRID) * GRID,
          y: Math.round(cy / GRID) * GRID,
          flipped: true,
          locked: true,
          slotIndex: null,
        };
        return next;
      });
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [draggingUid, slots, clampToCanvas, restingSpot]);

  const removeCard = (uid: string) => {
    setPlaced((prev) => {
      const removed = prev.find((p) => p.uid === uid);
      if (removed) {
        setDecks((d) => ({ ...d, [removed.deckKey]: [...d[removed.deckKey], removed.card] }));
      }
      return prev.filter((p) => p.uid !== uid);
    });
  };

  const shuffleAll = useCallback(() => {
    setDecks((prev) => {
      const out = { ...prev };
      (Object.keys(out) as DeckKey[]).forEach((k) => { out[k] = shuffle(out[k]); });
      return out;
    });
  }, []);

  const totalCards = useMemo(
    () => DECK_LIST.reduce((n, m) => n + (decks[m.key]?.length ?? 0), 0),
    [decks],
  );

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
            keywords: [],
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
    <div onClick={triggerDesignerNote} className="fixed inset-0 flex h-dvh w-full flex-col overflow-hidden">
      <StarField />

      {/* Top control bar */}
      <div className="relative z-20 w-full px-4 sm:px-6 pt-3 pb-2 backdrop-blur-sm bg-black/20 border-b border-white/5 shrink-0">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="font-display text-xl sm:text-2xl gold-text">Tarot Board</h1>
            {!headerCollapsed && (
              <span className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">Pick a deck · pull a card</span>
            )}
          </div>
          <button
            onClick={() => setHeaderCollapsed((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-pearl hover:bg-white/5"
            aria-label={headerCollapsed ? "Expand controls" : "Collapse controls"}
          >
            {headerCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            {headerCollapsed ? "Show" : "Hide"}
          </button>
        </div>

        {!headerCollapsed && (
          <>
            <div className="mt-2 flex flex-wrap items-center gap-2" data-tour="spread-picker">
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
              <div className="mx-1 h-6 w-px bg-white/10" aria-hidden />
              <span className="text-[10px] uppercase tracking-widest text-gold/70">
                5 decks · any spread
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-2 items-center">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={200}
                placeholder="What's on your mind? (optional)"
                className="flex-1 min-w-[220px] rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-pearl placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold/50"
              />
              <button
                onClick={shuffleAll}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/[0.05]"
                title="Shuffle every deck"
              >
                <Shuffle className="h-4 w-4" /> Shuffle
              </button>
              <button
                onClick={resetSpread}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/[0.05]"
              >
                <RotateCcw className="h-4 w-4" /> Start over
              </button>
              <button
                onClick={requestReading}
                disabled={!readyToInterpret || loadingReading}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft text-cosmic font-medium px-4 py-2 text-sm hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loadingReading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Read the cards
              </button>
            </div>
          </>
        )}

      </div>

      {/* Canvas — fills remaining viewport */}
      <div className="relative z-10 flex w-full flex-1 min-h-0 flex-col">
        <div
          ref={canvasRef}
          className="relative flex-1 min-h-0 border-t border-white/5 bg-gradient-to-b from-cosmic/60 via-midnight/40 to-black/60 overflow-hidden touch-none select-none"
        >
          {/* subtle grid glow */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_35%,rgba(212,175,55,0.10),transparent_60%)]" />

          {/* Empty spread slots */}
          {slots.map((s) => {
            const taken = placed.some((p) => p.slotIndex === s.index);
            if (taken) return null;
            return (
              <div
                key={s.index}
                className="absolute rounded-2xl border border-dashed border-gold/25 bg-white/[0.02] flex items-end justify-center pb-1"
                style={{ left: s.x, top: s.y, width: CARD_W, height: CARD_H }}
              >
                <span className="text-[10px] uppercase tracking-widest text-gold/50 text-center px-1 leading-tight">
                  {s.label}
                </span>
              </div>
            );
          })}

          {/* Placed cards */}
          {placed.map((p) => (
            <PlacedCardView
              key={p.uid}
              card={p}
              dragging={draggingUid === p.uid}
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
          <div className="absolute bottom-4 left-3 right-3 sm:left-auto sm:right-4 flex flex-col items-center sm:items-end gap-2 pointer-events-none" data-tour="deck-picker">
            <div className="text-[10px] uppercase tracking-widest text-gold/70">
              {loadingDecks ? "Loading decks…" : `Pick a deck · ${totalCards} cards`}
            </div>
            <div className="pointer-events-auto flex items-end gap-1.5 sm:gap-2.5 overflow-x-auto max-w-full pb-1">
              {DECK_LIST.map((meta, di) => {
                const subDeck = decks[meta.key] ?? [];
                const empty = subDeck.length === 0;
                return (
                  <div
                    key={meta.key}
                    className="relative flex flex-col items-center flex-shrink-0"
                    style={{ width: MINI_W }}
                    title={`${meta.name} — ${meta.tagline}`}
                  >
                    <div className="relative" style={{ width: MINI_W, height: MINI_H }}>
                      {[0, 1, 2].map((i) => {
                        const isTop = i === 0 && !empty;
                        const rot = (i - 1) * 1.2 + (di - 2) * 0.6;
                        return (
                          <div
                            key={i}
                            onPointerDown={isTop ? (e) => beginDragFromDeck(e, meta.key) : undefined}
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
                      className="mt-2 text-[9px] uppercase tracking-[0.2em] font-medium text-center leading-tight"
                      style={{ color: meta.accent }}
                    >
                      {meta.shortName}
                    </div>
                    <div className="text-[9px] text-muted-foreground leading-none">
                      {subDeck.length}/{meta.expected}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-[10px] text-muted-foreground pointer-events-auto text-center pt-1">
              {!loadingDecks && totalCards === 0
                ? "No card images uploaded yet — add them in Admin → Assets."
                : "Drag any deck onto the board"}
            </div>
          </div>
        </div>

        {/* Reading — floating overlay */}
        {(reading || error || loadingReading) && (
          <div className="pointer-events-none absolute left-3 right-3 sm:left-6 sm:right-auto sm:max-w-md top-[7.5rem] z-30">
            <div className="pointer-events-auto glass rounded-2xl p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gold/80">
                  <Sparkles className="h-3.5 w-3.5" /> AI Reading
                </div>
                <button
                  onClick={() => { setReading(null); setError(null); }}
                  className="text-muted-foreground hover:text-pearl"
                  aria-label="Close reading"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {loadingReading && !reading && (
                <div className="mt-3 flex items-center gap-3 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> Weaving your reading…
                </div>
              )}
              {error && (
                <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-200">
                  {error}
                </div>
              )}
              {reading && <div className="mt-3"><PlainAIText text={reading} label="Tarot reading" /></div>}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen zoom overlay — image only, no text */}
      {zoomedUid && (() => {
        const zc = placed.find((p) => p.uid === zoomedUid);
        if (!zc) return null;
        return (
          <div
            onClick={() => setZoomedUid(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300"
          >
            <button
              onClick={(e) => { e.stopPropagation(); setZoomedUid(null); }}
              className="fixed top-4 right-4 z-10 rounded-full bg-black/70 border border-white/20 p-2 hover:bg-white/10"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-pearl" />
            </button>
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative rounded-3xl border border-gold/50 overflow-hidden bg-gradient-to-b from-midnight via-cosmic to-black shadow-[0_0_180px_-20px_var(--gold)] flex items-center justify-center"
              style={{
                width: "min(92vw, calc(92dvh * 0.66))",
                height: "min(92dvh, calc(92vw * 1.5))",
                transform: zc.reversed ? "rotate(180deg)" : undefined,
              }}
            >
              <img
                src={zc.card.image}
                alt={zc.card.name}
                className="absolute inset-0 w-full h-full object-contain bg-black"
              />
            </div>
          </div>
        );
      })()}

      {/* One-time designer note — pops up on first click, then fades away */}
      {designerNote && (
        <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center animate-in fade-in zoom-in-95 duration-300">
          <div className="glass rounded-2xl border border-gold/40 bg-cosmic/90 px-6 py-4 shadow-[0_0_80px_-20px_var(--gold)] text-center max-w-xs">
            <div className="text-xs uppercase tracking-[0.3em] text-gold/80 mb-2">Tarot Decks</div>
            <div className="font-display text-lg sm:text-xl text-pearl">designed by Giaa Sharmaa</div>
          </div>
        </div>
      )}
    </div>

  );
}

function PlacedCardView({
  card,
  dragging,
  onPointerDown,
  onFlip,
  onZoom,
}: {
  card: PlacedCard;
  dragging: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onFlip: () => void;
  onRemove: () => void;
  onZoom: () => void;
}) {
  const down = useRef({ x: 0, y: 0 });
  return (
    <div
      className="absolute group"
      style={{
        left: card.x,
        top: card.y,
        width: CARD_W,
        height: CARD_H,
        zIndex: dragging ? 40 : card.locked ? 20 : 30,
        transition: dragging ? "none" : "left 420ms cubic-bezier(.22,1,.36,1), top 420ms cubic-bezier(.22,1,.36,1)",
      }}
    >
      <div
        onPointerDown={(e) => {
          down.current = { x: e.clientX, y: e.clientY };
          onPointerDown(e);
        }}
        onClick={(e) => {
          // Ignore the click that ends a drag.
          if (Math.abs(e.clientX - down.current.x) > 4 || Math.abs(e.clientY - down.current.y) > 4) return;
          if (!card.flipped) onFlip();
          else onZoom();
        }}
        className={`relative w-full h-full transition-transform duration-300 ease-out ${
          dragging ? "scale-[1.08]" : "group-hover:-translate-y-1.5 group-hover:scale-[1.04]"
        } cursor-grab active:cursor-grabbing`}
        style={{ perspective: "1000px" }}
      >
        {/* Hover glow */}
        <div className="pointer-events-none absolute -inset-2 rounded-3xl opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-70"
          style={{ background: "radial-gradient(closest-side, var(--gold), transparent 70%)" }}
        />
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
              <div className="text-gold/70 font-display text-2xl transition-transform duration-300 group-hover:scale-110">✦</div>
            </div>
          </div>
          {/* Front */}
          <div
            className="absolute inset-0 rounded-2xl border border-gold/50 bg-gradient-to-b from-midnight via-cosmic to-black shadow-[0_0_40px_-10px_var(--gold)] overflow-hidden flex flex-col"
            style={{
              backfaceVisibility: "hidden",
              transform: `rotateY(180deg) ${card.reversed ? "rotate(180deg)" : ""}`,
            }}
          >
            <img
              src={card.card.image}
              alt={card.card.name}
              draggable={false}
              className="absolute inset-0 w-full h-full object-contain bg-black pointer-events-none select-none"
            />
          </div>
        </div>
      </div>

      {/* Overlay controls */}
      <div className="absolute -top-2 -right-2 flex gap-1 z-10">
        {card.locked && (
          <div className="rounded-full bg-gold/20 border border-gold/40 p-1" title="Placed">
            <Lock className="h-3 w-3 text-gold" />
          </div>
        )}
      </div>

      {/* Always-visible, easy-to-read card name */}
      <div
        className="pointer-events-none absolute inset-x-[-14px] -bottom-[22px] text-center text-[13px] sm:text-sm font-medium leading-tight text-pearl"
        style={{ textShadow: "0 2px 8px rgba(0,0,0,0.95)" }}
      >
        {card.flipped ? card.card.name : "Tap to reveal"}
      </div>
    </div>
  );
}
