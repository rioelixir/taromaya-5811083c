import { PremiumGate } from "@/components/premium-gate";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { StarField } from "@/components/star-field";
import { SPREADS, secureRandInt, type SpreadKey } from "@/lib/tarot-deck";
import {
  DECK_LIST,
  BOARD_DECK_LIST,
  CARD_GROUPS,
  filterCardsByGroup,
  type CardGroup,
  type DeckKey,
  type UploadedCard,
} from "@/lib/tarot-decks";
import { useUploadedDecks } from "@/hooks/use-uploaded-decks";
import { interpretTarot } from "@/lib/tarot.functions";
import { PlainAIText } from "@/components/plain-ai-text";
import { useOverlayBackGuard } from "@/hooks/use-overlay-back";
import { NakshatraPanel, type StarContext } from "@/components/nakshatra-panel";
import {
  Sparkles,
  RotateCcw,
  Loader2,
  Lock,
  X,
  Shuffle,
  ChevronUp,
  ChevronDown,
  Star,
  Maximize,
  Minimize,
} from "lucide-react";

const DESIGNER_NOTE_KEY = "tarot-designer-note-shown";

export const Route = createFileRoute("/tarot")({
  validateSearch: (search: Record<string, unknown>): { deck?: string; card?: string } => ({
    deck: typeof search.deck === "string" ? search.deck : undefined,
    card: typeof search.card === "string" ? search.card : undefined,
  }),
  component: () => (
    <PremiumGate featureName="Tarot">
      <TarotPage />
    </PremiumGate>
  ),
  head: () => ({
    meta: [
      { title: "Tarot — TAROMAYA" },
      {
        name: "description",
        content: "Pick a deck, pull a card, get a clear reading. Four tarot decks to choose from.",
      },
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
const MINI_W = 58;
const MINI_H = 88;

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

// Shuffle each admin-uploaded deck into a draw stack, keeping only the chosen
// group of cards (all / major only / minor only / court only).
function makeDeckStacks(source: DeckStacks, group: CardGroup = "all"): DeckStacks {
  return Object.fromEntries(
    DECK_LIST.map((m) => [m.key, shuffle(filterCardsByGroup(source[m.key] ?? [], group))]),
  ) as unknown as DeckStacks;
}

function TarotPage() {
  const search = Route.useSearch();
  const [spreadKey, setSpreadKey] = useState<SpreadKey>("ppf");
  const [cardGroup, setCardGroup] = useState<CardGroup>("all");
  const [question, setQuestion] = useState("");
  const [placed, setPlaced] = useState<PlacedCard[]>([]);
  const { decks: uploaded, loading: loadingDecks, shortages: deckShortages } = useUploadedDecks();
  const [decks, setDecks] = useState<DeckStacks>(() => makeDeckStacks({} as DeckStacks));
  const [reading, setReading] = useState<string | null>(null);
  const [loadingReading, setLoadingReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomedUid, setZoomedUid] = useState<string | null>(null);
  // Hidden by default: the board itself is the whole screen until the user
  // taps "Show" to reveal the deck/spread controls.
  const [headerCollapsed, setHeaderCollapsed] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullScreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    onChange();
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullScreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* some browsers block full screen; the board is already full-page */
    }
  };
  const [designerNote, setDesignerNote] = useState(false);
  const designerNoteFired = useRef(false);
  const [starCtx, setStarCtx] = useState<StarContext>({});
  const handleStarContext = useCallback((ctx: StarContext) => {
    setStarCtx((prev) =>
      prev.placeNakshatra === ctx.placeNakshatra &&
      prev.placeName === ctx.placeName &&
      prev.nakshatraCard === ctx.nakshatraCard
        ? prev
        : ctx,
    );
  }, []);


  // Closing the zoom must never navigate away from the board.
  const closeZoom = useCallback(() => setZoomedUid(null), []);
  useOverlayBackGuard(!!zoomedUid, closeZoom);

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
    setDecks(makeDeckStacks(uploaded, cardGroup));
  }, [uploaded, cardGroup]);

  // Rebuild the draw stacks whenever the admin-uploaded decks load or change,
  // or the user picks a different group of cards.
  useEffect(() => {
    setPlaced([]);
    setDecks(makeDeckStacks(uploaded, cardGroup));
  }, [uploaded, cardGroup]);

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
  }>({
    uid: null,
    pointerId: null,
    offsetX: 0,
    offsetY: 0,
    startX: 0,
    startY: 0,
    moved: false,
    fromDeck: false,
  });

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

    let frame = 0;
    let pending: { x: number; y: number } | null = null;

    const flush = () => {
      frame = 0;
      const st = dragState.current;
      if (!st.uid || !pending) return;
      const { x, y } = pending;
      pending = null;
      setPlaced((prev) => prev.map((p) => (p.uid === st.uid ? { ...p, x, y } : p)));
    };

    const move = (e: PointerEvent) => {
      const st = dragState.current;
      if (!st.uid) return;
      const canvasEl = canvasRef.current;
      if (!canvasEl) return;
      if (Math.abs(e.clientX - st.startX) > 4 || Math.abs(e.clientY - st.startY) > 4) {
        st.moved = true;
      }
      const r = canvasEl.getBoundingClientRect();
      pending = { x: e.clientX - r.left - st.offsetX, y: e.clientY - r.top - st.offsetY };
      if (!frame) frame = requestAnimationFrame(flush);
    };

    const up = () => {
      const st = dragState.current;
      const uid = st.uid;
      const wasTap = !st.moved;
      const fromDeck = st.fromDeck;
      const last = pending;
      pending = null;
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      dragState.current = {
        uid: null,
        pointerId: null,
        offsetX: 0,
        offsetY: 0,
        startX: 0,
        startY: 0,
        moved: false,
        fromDeck: false,
      };
      setDraggingUid(null);
      if (!uid) return;

      setPlaced((prev) => {
        const idx = prev.findIndex((p) => p.uid === uid);
        if (idx < 0) return prev;
        const card = last ? { ...prev[idx], ...last } : prev[idx];
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
          if (d < bestDist) {
            bestDist = d;
            bestSlot = s;
          }
        }
        if (bestSlot && bestDist < CARD_W * 1.1) {
          next[idx] = {
            ...card,
            x: bestSlot.x,
            y: bestSlot.y,
            slotIndex: bestSlot.index,
            flipped: true,
            locked: true,
          };
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
      (Object.keys(out) as DeckKey[]).forEach((k) => {
        out[k] = shuffle(out[k]);
      });
      return out;
    });
  }, []);

  const totalCards = useMemo(
    () => BOARD_DECK_LIST.reduce((n, m) => n + (decks[m.key]?.length ?? 0), 0),
    [decks],
  );

  // Auto-pull: another module (e.g. today's Nakshatra) can send us straight to
  // the board with one exact card, which then slides up on its own.
  const autoPulled = useRef<string | null>(null);
  useEffect(() => {
    const deckKey = search.deck as DeckKey | undefined;
    const wanted = search.card;
    if (!deckKey || !wanted) return;
    const key = `${deckKey}|${wanted}`;
    if (autoPulled.current === key) return;
    const stack = decks[deckKey];
    if (!stack || stack.length === 0) return;
    const want = wanted.trim().toLowerCase();
    const found =
      stack.find((c) => c.name.trim().toLowerCase() === want) ??
      stack.find((c) => c.name.trim().toLowerCase().includes(want));
    if (!found) return;
    autoPulled.current = key;

    const uid = `auto_${Date.now()}`;
    const startX = canvasSize.w / 2 - CARD_W / 2;
    const startY = Math.max(0, canvasSize.h - CARD_H - 20);
    setDecks((prev) => ({ ...prev, [deckKey]: prev[deckKey].filter((c) => c !== found) }));
    setPlaced((prev) => [
      ...prev,
      {
        uid,
        card: found,
        deckKey,
        reversed: false,
        x: startX,
        y: startY,
        slotIndex: null,
        locked: true,
        flipped: false,
      },
    ]);
    const timer = window.setTimeout(() => {
      setPlaced((prev) => {
        const idx = prev.findIndex((p) => p.uid === uid);
        if (idx < 0) return prev;
        const spot = restingSpot(prev.filter((p) => p.uid !== uid));
        const next = [...prev];
        next[idx] = { ...next[idx], ...spot, flipped: true };
        return next;
      });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [search.deck, search.card, decks, canvasSize.w, canvasSize.h, restingSpot]);

  // Nakshatra panel (left side on desktop, slide-out drawer on phones).
  const [nakshatraPanelOpen, setNakshatraPanelOpen] = useState(false);

  // Slide one exact card onto the board without touching what is already there.
  const placeExactCard = useCallback(
    (card: UploadedCard) => {
      const uid = `nak_${Date.now()}`;
      const startX = canvasSize.w / 2 - CARD_W / 2;
      const startY = Math.max(0, canvasSize.h - CARD_H - 20);
      setDecks((prev) => ({
        ...prev,
        nakshatra: (prev.nakshatra ?? []).filter((c) => c.id !== card.id),
      }));
      setPlaced((prev) => [
        ...prev,
        {
          uid,
          card,
          deckKey: "nakshatra" as DeckKey,
          reversed: false,
          x: startX,
          y: startY,
          slotIndex: null,
          locked: true,
          flipped: false,
        },
      ]);
      setNakshatraPanelOpen(false);
      window.setTimeout(() => {
        setPlaced((prev) => {
          const idx = prev.findIndex((x) => x.uid === uid);
          if (idx < 0) return prev;
          const spot = restingSpot(prev.filter((x) => x.uid !== uid));
          const next = [...prev];
          next[idx] = { ...next[idx], ...spot, flipped: true };
          return next;
        });
      }, 60);
    },
    [canvasSize.w, canvasSize.h, restingSpot],
  );

  // Pick a Nakshatra card up with the finger/mouse and drag it straight onto the board.
  const beginDragExactCard = useCallback(
    (e: React.PointerEvent, card: UploadedCard) => {
      const canvasEl = canvasRef.current;
      if (!canvasEl) return;
      e.preventDefault();
      const r = canvasEl.getBoundingClientRect();
      const uid = `nak_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setDecks((prev) => ({
        ...prev,
        nakshatra: (prev.nakshatra ?? []).filter((c) => c.id !== card.id),
      }));
      setPlaced((prev) => [
        ...prev,
        {
          uid,
          card,
          deckKey: "nakshatra" as DeckKey,
          reversed: false,
          x: e.clientX - r.left - CARD_W / 2,
          y: e.clientY - r.top - CARD_H / 2,
          slotIndex: null,
          locked: false,
          flipped: true,
        },
      ]);
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
      setNakshatraPanelOpen(false);
      setDraggingUid(uid);
    },
    [],
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
            image: c.card.image,
          })),
          placeNakshatra: starCtx.placeNakshatra,
          placeName: starCtx.placeName,
          nakshatraCard: starCtx.nakshatraCard,
        },

      });
      setReading(res.text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("429")) setError("The cards need a short rest. Please try again in a minute.");
      else if (msg.includes("402")) setError("The reading service is paused right now. Please try again later.");
      else setError("The reading could not be made just now. Please try again.");
    } finally {
      setLoadingReading(false);
    }
  };

  return (
    <div
      onClick={triggerDesignerNote}
      className="fixed inset-0 flex h-dvh w-full flex-col overflow-hidden"
    >
      <StarField />

      {/* Top control bar - white sheet so every word is easy to read */}
      {!headerCollapsed && (
        <div className="absolute left-0 right-0 top-0 z-30 max-h-[85dvh] overflow-y-auto border-b border-black/10 bg-white px-3 pb-3 pt-2 text-neutral-900 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.55)] sm:px-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-baseline gap-3">
              <h1 className="truncate font-display text-xl font-bold text-neutral-900 sm:text-2xl">
                Tarot Board
              </h1>
              <span className="hidden whitespace-nowrap text-xs font-semibold text-neutral-600 sm:inline">
                Pick a deck · pull a card
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={toggleFullScreen}
                className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-xl border border-neutral-300 bg-neutral-100 px-3 text-sm font-bold text-neutral-900 hover:bg-neutral-200"
                aria-label={isFullScreen ? "Exit full screen" : "Enter full screen"}
              >
                {isFullScreen ? (
                  <Minimize className="h-4 w-4 shrink-0" />
                ) : (
                  <Maximize className="h-4 w-4 shrink-0" />
                )}
                <span className="hidden sm:inline">{isFullScreen ? "Exit" : "Full screen"}</span>
              </button>
              <button
                onClick={() => setHeaderCollapsed(true)}
                className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-xl border border-neutral-300 bg-neutral-100 px-3 text-sm font-bold text-neutral-900 hover:bg-neutral-200"
                aria-label="Collapse controls"
              >
                <ChevronUp className="h-4 w-4 shrink-0" />
                Hide
              </button>
            </div>
          </div>

          <div
            className="-mx-3 mt-2 flex items-center gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
            data-tour="spread-picker"
          >
            {(Object.keys(SPREADS) as SpreadKey[]).map((k) => {
              const active = k === spreadKey;
              return (
                <button
                  key={k}
                  onClick={() => setSpreadKey(k)}
                  className={`inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-xl border px-4 text-base font-semibold transition-all ${
                    active
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 bg-white text-neutral-800 hover:border-neutral-500"
                  }`}
                >
                  {SPREADS[k].label}
                </button>
              );
            })}
          </div>

          {/* Which kinds of cards to use — works for every deck, including
              Lost & Found and Health */}
          <div className="mt-2">
            <div className="text-sm font-bold text-neutral-700">Which cards to use</div>
            <div className="-mx-3 mt-1 flex items-center gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
              {CARD_GROUPS.map((g) => {
                const active = g.key === cardGroup;
                return (
                  <button
                    key={g.key}
                    onClick={() => setCardGroup(g.key)}
                    className={`inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-xl border px-4 text-base font-semibold transition-all ${
                      active
                        ? "border-amber-600 bg-amber-100 text-amber-900"
                        : "border-neutral-300 bg-white text-neutral-800 hover:border-neutral-500"
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-2 space-y-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={200}
              placeholder="What's on your mind? (optional)"
              className="min-h-12 w-full rounded-xl border border-neutral-300 bg-white px-3 text-base text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-900 focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <button
                onClick={shuffleAll}
                className="inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-neutral-300 bg-white px-4 text-base font-semibold text-neutral-900 hover:bg-neutral-100"
                title="Shuffle every deck"
              >
                <Shuffle className="h-5 w-5 shrink-0" /> Shuffle
              </button>
              <button
                onClick={resetSpread}
                className="inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-neutral-300 bg-white px-4 text-base font-semibold text-neutral-900 hover:bg-neutral-100"
              >
                <RotateCcw className="h-5 w-5 shrink-0" /> Start over
              </button>
              <button
                onClick={requestReading}
                disabled={!readyToInterpret || loadingReading}
                className="col-span-2 inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-neutral-900 px-5 text-base font-bold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loadingReading ? (
                  <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                ) : (
                  <Sparkles className="h-5 w-5 shrink-0" />
                )}
                Ask AI
              </button>
            </div>
          </div>

        </div>
      )}


      {/* Show controls button - vertical pill on the right edge */}
      {headerCollapsed && (
        <button
          onClick={() => setHeaderCollapsed(false)}
          className="absolute right-0 top-1/2 z-30 -translate-y-1/2 rounded-l-2xl border border-r-0 border-gold/50 bg-black/80 min-w-11 px-3 py-6 text-gold shadow-[-4px_0_20px_rgba(0,0,0,0.4)]"
          aria-label="Show controls"
        >
          <div className="flex flex-col items-center gap-2">
            <ChevronDown className="h-4 w-4" />
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.25em]"
              style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
            >
              Show
            </span>
          </div>
        </button>
      )}

      {/* Full-screen toggle - tiny, always reachable, no distraction */}
      <button
        onClick={toggleFullScreen}
        className="absolute right-3 top-3 z-30 rounded-full border border-gold/40 bg-black/70 p-2 text-gold-soft hover:bg-black/90"
        aria-label={isFullScreen ? "Exit full screen" : "Enter full screen"}
        title={isFullScreen ? "Exit full screen" : "Full screen"}
      >
        {isFullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
      </button>


      {/* Board row: full-page canvas with collapsible Nakshatra drawer */}
      <div className="relative z-10 flex h-full w-full">
        {/* Nakshatra toggle - always visible on every screen */}
        <button
          onClick={() => setNakshatraPanelOpen(true)}
          className="absolute left-0 top-1/2 z-30 -translate-y-1/2 rounded-r-2xl border border-l-0 border-gold/50 bg-black/80 min-w-11 px-3 py-6 text-gold shadow-[4px_0_20px_rgba(0,0,0,0.4)]"
          aria-label="Open Nakshatra panel"
        >
          <div className="flex flex-col items-center gap-2">
            <Star className="h-4 w-4 fill-gold/20" />
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.25em]"
              style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
            >
              Nakshatra
            </span>
          </div>
        </button>

        {/* Nakshatra drawer - slides over the full-page board */}
        {nakshatraPanelOpen && (
          <div className="fixed inset-0 z-40 flex">
            <div className="w-[86vw] max-w-[340px] animate-in slide-in-from-left border-r border-gold/25 bg-cosmic/95 backdrop-blur-md duration-300">
              <div className="flex items-center justify-between px-3 pt-3">
                <span className="text-xs uppercase tracking-[0.3em] text-gold/80">Nakshatra</span>
                <button
                  onClick={() => setNakshatraPanelOpen(false)}
                  aria-label="Close Nakshatra panel"
                  className="text-board-dim hover:text-board-fg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="h-[calc(100dvh-3rem)]">
                <NakshatraPanel
                  cards={uploaded.nakshatra ?? []}
                  question={question}
                  onPlaceCard={placeExactCard}
                  onDragCardStart={beginDragExactCard}
                  onContext={handleStarContext}
                />
              </div>
            </div>
            <div className="flex-1 bg-black/60" onClick={() => setNakshatraPanelOpen(false)} />
          </div>
        )}

        {/* Canvas — fills the whole page */}
        <div className="relative flex h-full w-full flex-col">
          <div
            ref={canvasRef}
            className="relative h-full w-full flex-1 bg-gradient-to-b from-cosmic/60 via-midnight/40 to-black/60 overflow-hidden touch-none select-none"
          >
            {/* subtle grid glow */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_35%,rgba(212,175,55,0.10),transparent_60%)]" />

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

            {/* Always-there Ask AI button, so it works even with the top bar hidden */}
            <button
              onClick={requestReading}
              disabled={!readyToInterpret || loadingReading}
              className="absolute top-3 left-3 z-30 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft px-4 py-2 text-sm font-semibold text-cosmic shadow-[0_10px_30px_-12px_var(--gold)] transition hover:brightness-110 disabled:opacity-40"
            >
              {loadingReading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Ask AI
            </button>

            {/* Tarot deck stacks — bottom right */}
            <div
              className="absolute bottom-4 left-3 right-3 sm:left-auto sm:right-4 flex flex-col items-center sm:items-end gap-2 pointer-events-none"
              data-tour="deck-picker"
            >
              <div className="text-xs font-semibold tracking-wide text-gold">
                {loadingDecks ? "Decks are loading…" : `Pick a deck · ${totalCards} cards left`}
              </div>
              {deckShortages.length > 0 && (
                <div className="max-w-[18rem] text-[11px] leading-snug text-amber-300/90 text-center sm:text-right">
                  {deckShortages
                    .map((s) => `${s.name} has only ${s.have} of ${s.expected} pictures`)
                    .join(". ")}
                  . Ask the admin to add the rest.
                </div>
              )}
              <div className="pointer-events-auto flex items-end gap-1.5 sm:gap-2.5 overflow-x-auto max-w-full pb-1">
                {BOARD_DECK_LIST.map((meta, di) => {
                  const subDeck = decks[meta.key] ?? [];
                  const empty = subDeck.length === 0;
                  return (
                    <div
                      key={meta.key}
                      className="relative flex flex-col items-center flex-shrink-0"
                      style={{ width: 78 }}
                      title={`${meta.name} — ${meta.tagline}`}
                    >
                      <div className="relative" style={{ width: MINI_W, height: MINI_H }}>
                        {[0, 1, 2].map((i) => {
                          const isTop = i === 0 && !empty;
                          const rot = (i - 1) * 1.2 + (di - 2) * 0.6;
                          return (
                            <div
                              key={i}
                              onPointerDown={
                                isTop ? (e) => beginDragFromDeck(e, meta.key) : undefined
                              }
                              className={`absolute inset-0 rounded-xl border ${
                                empty
                                  ? "border-white/10 bg-black/30"
                                  : "bg-gradient-to-br from-midnight to-cosmic"
                              } ${isTop ? "cursor-grab active:cursor-grabbing hover:-translate-y-1 transition-transform" : ""}`}
                              style={{
                                transform: `translate(${i * 1.5}px, ${i * -2}px) rotate(${rot}deg)`,
                                zIndex: 10 - i,
                                borderColor: empty ? undefined : `${meta.accent}66`,
                                boxShadow:
                                  empty || !isTop
                                    ? undefined
                                    : `0 8px 32px -12px ${meta.accent}80, inset 0 0 24px -12px ${meta.accent}`,
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
                        className="mt-2 w-[76px] rounded-md bg-black/60 px-1 py-0.5 text-[13px] font-bold text-center leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
                        style={{ color: meta.accent }}
                      >
                        {meta.shortName}
                      </div>
                      <div className="text-[11px] font-semibold text-board-fg/90 leading-tight">
                        {cardGroup === "all"
                          ? `${subDeck.length}/${meta.expected}`
                          : `${subDeck.length} cards`}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-sm text-board-fg/85 pointer-events-auto text-center pt-1">
                {!loadingDecks && totalCards === 0
                  ? cardGroup === "all"
                    ? "No card pictures yet. An admin can add them in Admin, then Assets."
                    : "No cards of this kind yet. Pick All cards to use the full decks."
                  : "Tap a deck, or hold and drag a card onto the board"}
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
                    onClick={() => {
                      setReading(null);
                      setError(null);
                    }}
                    className="text-board-dim hover:text-board-fg"
                    aria-label="Close reading"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {loadingReading && !reading && (
                  <div className="mt-3 flex items-center gap-3 text-board-dim text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" /> Your reading is coming…
                  </div>
                )}
                {error && (
                  <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-200">
                    {error}
                  </div>
                )}
                {reading && (
                  <div className="mt-3">
                    <PlainAIText text={reading} label="Tarot reading" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen zoom overlay — image only, no text */}
      {zoomedUid &&
        (() => {
          const zc = placed.find((p) => p.uid === zoomedUid);
          if (!zc) return null;
          return (
            <div
              onClick={closeZoom}
              className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeZoom();
                }}
                className="fixed top-4 right-4 z-10 rounded-full bg-white border border-white/80 p-2 shadow-lg hover:bg-gray-100 cursor-default"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-black" />
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
                  alt=""
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
            <div className="font-display text-lg sm:text-xl text-pearl">
              designed by Giaa Sharmaa
            </div>
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
        transition: dragging
          ? "none"
          : "left 420ms cubic-bezier(.22,1,.36,1), top 420ms cubic-bezier(.22,1,.36,1)",
      }}
    >
      <div
        onPointerDown={(e) => {
          down.current = { x: e.clientX, y: e.clientY };
          onPointerDown(e);
        }}
        onClick={(e) => {
          // Ignore the click that ends a drag.
          if (Math.abs(e.clientX - down.current.x) > 4 || Math.abs(e.clientY - down.current.y) > 4)
            return;
          if (!card.flipped) onFlip();
          else onZoom();
        }}
        className={`relative w-full h-full transition-transform duration-300 ease-out ${
          dragging ? "scale-[1.08]" : "group-hover:-translate-y-1.5 group-hover:scale-[1.04]"
        } cursor-grab active:cursor-grabbing`}
        style={{ perspective: "1000px" }}
      >
        {/* Hover glow */}
        <div
          className="pointer-events-none absolute -inset-2 rounded-3xl opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-70"
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
              <div className="text-gold/70 font-display text-2xl transition-transform duration-300 group-hover:scale-110">
                ✦
              </div>
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
              alt=""
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
    </div>
  );
}
