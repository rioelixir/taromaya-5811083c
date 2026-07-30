import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, Star, X, Maximize2, MapPin } from "lucide-react";
import { BirthFields, type BirthFieldsState } from "@/components/birth-fields";
import { PlacePicker, type PlaceValue } from "@/components/place-picker";
import { PlainAIText } from "@/components/plain-ai-text";
import { computeKundli, NAKSHATRAS, NAKSHATRA_LORDS } from "@/lib/vedic";
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
  birthNakshatra?: string;
  placeNakshatra?: string;
  placeName?: string;
  nakshatraCard?: string;
};

/**
 * Left-side star panel for the tarot board.
 * Top: your birth star from your birth day, time and place.
 * Bottom: the star of the place you are in right now.
 * Both pull their matching card from the admin's 27-card Nakshatra deck.
 */
export function NakshatraPanel({
  cards,
  question,
  onPlaceCard,
  onContext,
}: {
  cards: UploadedCard[];
  question?: string;
  onPlaceCard?: (card: UploadedCard) => void;
  onContext?: (ctx: StarContext) => void;
}) {
  const { meta } = useNakshatraMeta();
  const [form, setForm] = useState<BirthFieldsState>({
    date: "",
    time: "",
    tz: "",
    lat: "",
    lon: "",
    place: "",
  });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NakshatraResult | null>(null);
  const [zoom, setZoom] = useState(false);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [reading, setReading] = useState<string | null>(null);
  const [readingBusy, setReadingBusy] = useState(false);

  // Place star (where you are right now)
  const [place, setPlace] = useState<PlaceValue>({ place: "", lat: "", lon: "", tz: "" });
  const [placeResult, setPlaceResult] = useState<NakshatraResult | null>(null);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [placeBusy, setPlaceBusy] = useState(false);

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

  // Work out the star of the chosen place as soon as a place is picked.
  useEffect(() => {
    if (place.lat === "" || place.lon === "") {
      setPlaceResult(null);
      setPlaceError(null);
      return;
    }
    let cancelled = false;
    setPlaceBusy(true);
    setPlaceError(null);
    // Async so picking a place never blocks the board.
    const id = window.setTimeout(() => {
      try {
        const snap = computeNakshatraForLocation({
          date: new Date(),
          latitude: Number(place.lat),
          longitude: Number(place.lon),
          timelineCount: 1,
        });
        if (cancelled) return;
        setPlaceResult(buildResult(snap.moon.index, snap.moon.pada));
      } catch {
        if (!cancelled) {
          setPlaceResult(null);
          setPlaceError(
            "We couldn't find the star for this place. Please choose another place.",
          );
        }
      } finally {
        if (!cancelled) setPlaceBusy(false);
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [place.lat, place.lon, buildResult]);

  // Keep the board's Ask AI in step with both stars.
  useEffect(() => {
    onContext?.({
      birthNakshatra: result
        ? `${NAKSHATRAS[result.index]} (pada ${result.pada}, star lord ${result.lord})`
        : undefined,
      placeNakshatra: placeResult ? NAKSHATRAS[placeResult.index] : undefined,
      placeName: placeResult ? place.place || undefined : undefined,
      nakshatraCard: placeResult?.card
        ? placeResult.title
        : result?.card
          ? result.title
          : undefined,
    });
  }, [result, placeResult, place.place, onContext]);


  const canCalculate = useMemo(
    () => !!form.date && form.lat !== "" && form.lon !== "" && form.tz !== "",
    [form],
  );

  const calculate = () => {
    setError(null);
    setNotice(null);
    setReading(null);
    if (!form.date) {
      setError("Please add your birth date.");
      return;
    }
    if (form.lat === "" || form.lon === "" || form.tz === "") {
      setError("Please select a place from the search list.");
      return;
    }
    if (!form.time) {
      setNotice(
        "Birth time helps improve accuracy. You can continue without it, but the result may be less precise.",
      );
    }
    setBusy(true);
    try {
      const [y, mo, d] = form.date.split("-").map(Number);
      const [hh, mi] = (form.time || "12:00").split(":").map(Number);
      const chart = computeKundli({
        year: y,
        month: mo,
        day: d,
        hour: hh || 0,
        minute: mi || 0,
        tzOffsetHours: Number(form.tz),
        latitude: Number(form.lat),
        longitude: Number(form.lon),
      });
      setResult(buildResult(chart.moonNakshatra.index, chart.moonNakshatra.pada));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not work that out. Please check the details.",
      );
    } finally {
      setBusy(false);
    }
  };

  const askAi = async () => {
    if (!result && !placeResult) return;
    setReadingBusy(true);
    setError(null);
    try {
      const star = placeResult ?? result!;
      const res = await interpret({
        data: {
          spreadLabel: "Star reading",
          question: question ?? "",
          cards: [{ name: star.title, position: "", reversed: false, keywords: star.keywords }],
          birthNakshatra: result
            ? `${NAKSHATRAS[result.index]} (pada ${result.pada}, star lord ${result.lord})`
            : undefined,
          placeNakshatra: placeResult ? NAKSHATRAS[placeResult.index] : undefined,
          placeName: placeResult ? place.place || undefined : undefined,
          nakshatraCard: star.title,
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

  const openZoom = (src: string) => {
    setZoomSrc(src);
    setZoom(true);
  };

  const StarCard = ({ star }: { star: NakshatraResult }) =>
    star.card ? (
      <div className="space-y-2">
        <button
          onClick={() => openZoom(star.card!.image)}
          className="group relative mx-auto block w-full max-w-[200px] overflow-hidden rounded-2xl border border-gold/40 bg-black transition hover:scale-[1.02]"
          style={{ aspectRatio: "2 / 3" }}
          aria-label="See this card bigger"
        >
          <img src={star.card.image} alt="" loading="lazy" className="h-full w-full object-contain" />
          <span className="absolute bottom-2 right-2 rounded-lg bg-black/70 p-1.5 text-pearl opacity-80">
            <Maximize2 className="h-3.5 w-3.5" />
          </span>
        </button>
        {onPlaceCard && (
          <button
            onClick={() => onPlaceCard(star.card!)}
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
    );

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-3">
      {/* ---------- Birth star ---------- */}
      <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-gold">
        <Star className="h-4 w-4 shrink-0" /> Your birth star
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Add your birth day, time and place. We find your Moon star and its card.
      </p>

      <BirthFields form={form} setForm={setForm} />

      <button
        onClick={calculate}
        disabled={busy}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft px-4 py-2 text-sm font-semibold text-cosmic disabled:opacity-40"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
        Find my birth star
      </button>
      {!canCalculate && (
        <p className="text-sm text-muted-foreground">Pick a place from the list to switch this on.</p>
      )}

      {notice && (
        <div className="rounded-xl border border-gold/25 bg-gold/5 p-2 text-sm text-pearl/85">
          {notice}
        </div>
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
              Your birth star
            </div>
            <div className="font-display text-lg text-pearl">{NAKSHATRAS[result.index]}</div>
          </div>
          <StarCard star={result} />
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
        </div>
      )}

      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      {/* ---------- Place star ---------- */}
      <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-gold">
        <MapPin className="h-4 w-4 shrink-0" /> Place star
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Choose the place you are in right now. We find its star and card straight away.
      </p>

      <PlacePicker
        value={place}
        onChange={setPlace}
        label="Where are you right now?"
        compact
      />

      {placeBusy && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Working out the star…
        </p>
      )}
      {placeError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-2 text-sm text-red-200">
          {placeError}
        </div>
      )}

      {placeResult && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-gold/25 bg-black/30 p-3">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Star of this place
            </div>
            <div className="font-display text-lg text-pearl">
              {NAKSHATRAS[placeResult.index]}
            </div>
          </div>
          <StarCard star={placeResult} />
          {placeResult.meaning && (
            <p className="text-sm text-pearl/85">{placeResult.meaning}</p>
          )}
        </div>
      )}

      {(result || placeResult) && (
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
