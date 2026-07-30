import { useCallback, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, Star, X, Maximize2 } from "lucide-react";
import { BirthFields, type BirthFieldsState } from "@/components/birth-fields";
import { PlainAIText } from "@/components/plain-ai-text";
import { computeKundli, NAKSHATRAS, NAKSHATRA_LORDS } from "@/lib/vedic";
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

/**
 * Left-side birth-star panel for the tarot board.
 * You type your birth day, time and place; the app works out your Moon star
 * and pulls the matching card from the admin's 27-card Nakshatra deck.
 */
export function NakshatraPanel({
  cards,
  question,
  onPlaceCard,
}: {
  cards: UploadedCard[];
  question?: string;
  onPlaceCard?: (card: UploadedCard) => void;
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
  const [reading, setReading] = useState<string | null>(null);
  const [readingBusy, setReadingBusy] = useState(false);

  const closeZoom = useCallback(() => setZoom(false), []);
  useOverlayBackGuard(zoom, closeZoom);
  const interpret = useServerFn(interpretTarot);

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
      const index = chart.moonNakshatra.index;
      const m = meta[String(index)];
      const profile = nakshatraProfile(index);
      setResult({
        index,
        pada: chart.moonNakshatra.pada,
        lord: NAKSHATRA_LORDS[index],
        card: cardForNakshatra(index, cards, m),
        title: nakshatraTitle(index, m),
        keywords: m?.keywords?.filter(Boolean).length
          ? m.keywords!.filter(Boolean)
          : profile.strengths.slice(0, 4),
        meaning: m?.meaning?.trim() || profile.deityShort,
      });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not work that out. Please check the details.",
      );
    } finally {
      setBusy(false);
    }
  };

  const askAi = async () => {
    if (!result) return;
    setReadingBusy(true);
    setError(null);
    try {
      const res = await interpret({
        data: {
          spreadLabel: `Birth star reading — ${NAKSHATRAS[result.index]} pada ${result.pada}`,
          question: question ?? "",
          cards: [
            {
              name: result.title,
              position: `Birth star ${result.index + 1} of 27, pada ${result.pada}, star lord ${result.lord}`,
              reversed: false,
              keywords: result.keywords,
            },
          ],
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

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gold/80">
        <Star className="h-3.5 w-3.5" /> Your birth star
      </div>
      <p className="text-xs text-muted-foreground">
        Add your birth day, time and place. We find your Moon star and pull its card.
      </p>

      <BirthFields form={form} setForm={setForm} />

      <button
        onClick={calculate}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-soft px-4 py-2 text-sm font-semibold text-cosmic disabled:opacity-40"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
        Calculate birth star
      </button>
      {!canCalculate && (
        <p className="text-[11px] text-muted-foreground">
          Pick a place from the list to switch this on.
        </p>
      )}

      {notice && (
        <div className="rounded-xl border border-gold/25 bg-gold/5 p-2 text-xs text-pearl/85">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-2 text-xs text-red-200">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-gold/25 bg-black/30 p-3">
            <div className="font-display text-lg text-pearl">{result.title}</div>
            <div className="text-xs text-muted-foreground">
              Star {result.index + 1} of 27 · Pada {result.pada} · Star lord {result.lord}
            </div>
          </div>

          {result.card ? (
            <div className="space-y-2">
              <button
                onClick={() => setZoom(true)}
                className="group relative mx-auto block w-full max-w-[210px] overflow-hidden rounded-2xl border border-gold/40 bg-black transition hover:scale-[1.02]"
                style={{ aspectRatio: "2 / 3" }}
                aria-label="Open the card big"
              >
                <img
                  src={result.card.image}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-contain"
                />
                <span className="absolute bottom-2 right-2 rounded-lg bg-black/70 p-1.5 text-pearl opacity-80">
                  <Maximize2 className="h-3.5 w-3.5" />
                </span>
              </button>
              {onPlaceCard && (
                <button
                  onClick={() => onPlaceCard(result.card!)}
                  className="w-full rounded-xl border border-white/15 px-3 py-2 text-sm text-pearl hover:bg-white/[0.06]"
                >
                  Slide this card onto the board
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-muted-foreground">
              This star's picture is not added yet. An admin can add it in Admin, then Nakshatra
              Deck.
            </div>
          )}

          {result.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.keywords.map((k) => (
                <span
                  key={k}
                  className="rounded-lg border border-gold/25 px-2 py-0.5 text-[11px] text-gold/90"
                >
                  {k}
                </span>
              ))}
            </div>
          )}
          {result.meaning && <p className="text-sm text-pearl/85">{result.meaning}</p>}

          <button
            onClick={askAi}
            disabled={readingBusy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 px-4 py-2 text-sm text-gold hover:bg-gold/10 disabled:opacity-40"
          >
            {readingBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Ask AI about my star
          </button>
          {reading && (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
              <PlainAIText text={reading} label="Birth star reading" />
            </div>
          )}
        </div>
      )}

      {zoom && result?.card && (
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
            src={result.card.image}
            alt=""
            className="max-h-[92dvh] max-w-[92vw] rounded-3xl border border-gold/50 object-contain"
          />
        </div>
      )}
    </div>
  );
}
