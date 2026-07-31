import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, Star, X, Maximize2 } from "lucide-react";
import { PlacePicker, type PlaceValue } from "@/components/place-picker";
import { PlainAIText } from "@/components/plain-ai-text";
import { NAKSHATRAS, NAKSHATRA_LORDS } from "@/lib/vedic";
import { computeNakshatraForLocation } from "@/lib/nakshatra-location";
import { nakshatraProfile } from "@/lib/nakshatra-deep";
import { cardForNakshatra, nakshatraTitle } from "@/lib/nakshatra-deck";
import { useNakshatraMeta } from "@/hooks/use-nakshatra-meta";
import { useOverlayBackGuard } from "@/hooks/use-overlay-back";
import { interpretTarot } from "@/lib/tarot.functions";
import type { UploadedCard } from "@/lib/tarot-decks";

export type NakshatraResult = {
  index: number;
  pada: number;
  lord: string;
  card: UploadedCard | null;
  title: string;
  keywords: string[];
  meaning: string;
};

export type StarContext = {
  placeNakshatra?: string;
  placeName?: string;
  nakshatraCard?: string;
};

/** "HH:MM" for right now, in the viewer's own clock. */
function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Left-side star panel for the tarot board.
 * The user only picks the time now and the place they are in.
 * The star of this moment, and its card from the admin's 27-card deck,
 * are worked out on their own.
 */
export function NakshatraPanel({
  cards,
  question,
  onPlaceCard,
  onDragCardStart,
  onContext,
}: {
  cards: UploadedCard[];
  question?: string;
  onPlaceCard?: (card: UploadedCard) => void;
  onDragCardStart?: (e: React.PointerEvent, card: UploadedCard) => void;
  onContext?: (ctx: StarContext) => void;
}) {
  const { meta } = useNakshatraMeta();
  const [time, setTime] = useState<string>(() => nowTime());
  const [place, setPlace] = useState<PlaceValue>({ place: "", lat: "", lon: "", tz: "" });
  const [result, setResult] = useState<NakshatraResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [reading, setReading] = useState<string | null>(null);
  const [readingBusy, setReadingBusy] = useState(false);

  const closeZoom = useCallback(() => {
    setZoom(false);
    setZoomSrc(null);
  }, []);
  useOverlayBackGuard(zoom, closeZoom);
  const interpret = useServerFn(interpretTarot);

  const buildResult = useCallback(
    (index: number, pada: number): NakshatraResult => {
      const m = meta[String(index)];
      const profile = nakshatraProfile(index);
      return {
        index,
        pada,
        lord: NAKSHATRA_LORDS[index],
        card: cardForNakshatra(index, cards, m),
        title: nakshatraTitle(index, m),
        keywords: m?.keywords?.filter(Boolean).length
          ? m.keywords!.filter(Boolean)
          : profile.strengths.slice(0, 4),
        meaning: m?.meaning?.trim() || profile.deityShort,
      };
    },
    [cards, meta],
  );

  const ready = place.lat !== "" && place.lon !== "" && place.tz !== "" && !!time;

  // As soon as a place and a time are set, work out the star of this moment.
  useEffect(() => {
    if (!ready) {
      setResult(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setBusy(true);
    setError(null);
    const id = window.setTimeout(() => {
      try {
        const tz = Number(place.tz);
        // Today's date at that place, at the chosen clock time.
        const localNow = new Date(Date.now() + tz * 3600 * 1000);
        const [hh, mm] = time.split(":").map(Number);
        const utcMs =
          Date.UTC(
            localNow.getUTCFullYear(),
            localNow.getUTCMonth(),
            localNow.getUTCDate(),
            hh || 0,
            mm || 0,
          ) - tz * 3600 * 1000;

        const snap = computeNakshatraForLocation({
          date: new Date(utcMs),
          latitude: Number(place.lat),
          longitude: Number(place.lon),
          timelineCount: 1,
        });
        if (cancelled) return;
        setResult(buildResult(snap.moon.index, snap.moon.pada));
        setReading(null);
      } catch {
        if (!cancelled) {
          setResult(null);
          setError("We couldn't find the star for this place. Please pick another place.");
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [ready, place.lat, place.lon, place.tz, time, buildResult]);

  // Keep the board's Ask AI in step with the star of this moment.
  useEffect(() => {
    onContext?.({
      placeNakshatra: result ? NAKSHATRAS[result.index] : undefined,
      placeName: result ? place.place || undefined : undefined,
      nakshatraCard: result?.card ? result.title : undefined,
    });
  }, [result, place.place, onContext]);

  const askAi = async () => {
    if (!result) return;
    setReadingBusy(true);
    setError(null);
    try {
      const res = await interpret({
        data: {
          spreadLabel: "Star reading",
          question: question ?? "",
          cards: [{ name: result.title, position: "", reversed: false, keywords: result.keywords }],
          placeNakshatra: NAKSHATRAS[result.index],
          placeName: place.place || undefined,
          nakshatraCard: result.title,
        },
      });
      setReading(res.text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      if (msg.includes("429")) setError("The sky is busy right now — try again in a moment.");
      else if (msg.includes("402")) setError("AI credits are used up for now.");
      else setError(msg);
    } finally {
      setReadingBusy(false);
    }
  };

  const dragged = useRef(false);
  const startPt = useRef({ x: 0, y: 0 });

  const openZoom = (src: string) => {
    setZoomSrc(src);
    setZoom(true);
  };

  const starLine = useMemo(
    () => (result ? `${NAKSHATRAS[result.index]} · part ${result.pada} · star lord ${result.lord}` : ""),
    [result],
  );

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-3">
      <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-gold">
        <Star className="h-4 w-4 shrink-0" /> Current star
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Tell us the time now and where you are. We find the Moon's star for this
        moment and pull its card on its own.
      </p>

      <label className="block text-xs uppercase tracking-widest text-muted-foreground">
        Current time
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-pearl outline-none focus:border-gold/50"
        />
      </label>

      <PlacePicker value={place} onChange={setPlace} label="Current place" />

      {!ready && (
        <p className="text-sm text-muted-foreground">Pick a place from the list to begin.</p>
      )}

      {busy && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Working out the star…
        </p>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-gold/25 bg-black/30 p-3">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Star right now
            </div>
            <div className="font-display text-lg text-pearl">{NAKSHATRAS[result.index]}</div>
            <div className="text-xs text-muted-foreground">{starLine}</div>
          </div>

          {result.card ? (
            <div className="space-y-2">
              <button
                onPointerDown={(e) => {
                  if (!onDragCardStart || e.button !== 0) return;
                  dragged.current = false;
                  startPt.current = { x: e.clientX, y: e.clientY };
                  const move = (ev: PointerEvent) => {
                    if (
                      Math.abs(ev.clientX - startPt.current.x) > 6 ||
                      Math.abs(ev.clientY - startPt.current.y) > 6
                    ) {
                      cleanup();
                      dragged.current = true;
                      onDragCardStart(
                        { ...e, clientX: ev.clientX, clientY: ev.clientY } as unknown as React.PointerEvent,
                        result.card!,
                      );
                    }
                  };
                  const cleanup = () => {
                    window.removeEventListener("pointermove", move);
                    window.removeEventListener("pointerup", cleanup);
                  };
                  window.addEventListener("pointermove", move);
                  window.addEventListener("pointerup", cleanup);
                }}
                onClick={() => {
                  if (dragged.current) {
                    dragged.current = false;
                    return;
                  }
                  openZoom(result.card!.image);
                }}
                className="group relative mx-auto block w-full max-w-[200px] cursor-grab touch-none overflow-hidden rounded-2xl border border-gold/40 bg-black transition hover:scale-[1.02] active:cursor-grabbing"
                style={{ aspectRatio: "2 / 3" }}
                aria-label="Drag this card to the board, or tap to see it bigger"
              >
                <img src={result.card.image} alt="" loading="lazy" className="h-full w-full object-contain" />
                <span className="absolute bottom-2 right-2 rounded-lg bg-black/70 p-1.5 text-pearl opacity-80">
                  <Maximize2 className="h-3.5 w-3.5" />
                </span>
              </button>
              {onPlaceCard && (
                <button
                  onClick={() => onPlaceCard(result.card!)}
                  className="w-full rounded-xl border border-white/15 px-3 py-2 text-sm text-pearl hover:bg-white/[0.06]"
                >
                  Put this card on the board
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-muted-foreground">
              This star's picture is not added yet.
            </div>
          )}

          {result.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.keywords.map((k) => (
                <span
                  key={k}
                  className="rounded-lg border border-gold/25 px-2 py-0.5 text-xs text-gold/90"
                >
                  {k}
                </span>
              ))}
            </div>
          )}
          {result.meaning && <p className="text-sm text-pearl/85">{result.meaning}</p>}

          <div className="space-y-3 pb-4">
            <button
              onClick={askAi}
              disabled={readingBusy}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-gold/40 px-4 py-2 text-sm text-gold hover:bg-gold/10 disabled:opacity-40"
            >
              {readingBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Ask AI
            </button>
            {reading && (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                <PlainAIText text={reading} label="Star reading" />
              </div>
            )}
          </div>
        </div>
      )}

      {zoom && zoomSrc && (
        <div
          onClick={closeZoom}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md animate-in fade-in duration-300"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeZoom();
            }}
            className="fixed right-4 top-4 rounded-full border border-white/20 bg-black/70 p-2"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-pearl" />
          </button>
          <img
            onClick={(e) => e.stopPropagation()}
            src={zoomSrc}
            alt=""
            className="max-h-[92dvh] max-w-[92vw] rounded-3xl border border-gold/50 object-contain"
          />
        </div>
      )}
    </div>
  );
}
