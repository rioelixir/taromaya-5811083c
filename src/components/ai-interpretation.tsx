import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, Loader2, RefreshCw, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBirthProfile } from "@/hooks/use-birth-profile";
import { buildGuideContext, type SavedKundliRow } from "@/lib/ai-context";
import type { BirthProfile } from "@/lib/birth-profile.functions";
import { useLang } from "@/lib/i18n";

function profileToRow(p: BirthProfile): SavedKundliRow {
  return {
    name: p.full_name,
    birth_date: p.birth_date,
    birth_time: p.birth_time.length === 5 ? `${p.birth_time}:00` : p.birth_time,
    tz_offset: Number(p.tz_offset_hours),
    latitude: Number(p.latitude),
    longitude: Number(p.longitude),
    place: p.place ?? null,
  };
}

export function AIInterpretation({
  module,
  snapshot,
  intent,
}: {
  module: string;
  snapshot?: string;
  intent?: string;
}) {
  const { data: profile } = useBirthProfile();
  const lang = useLang();
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cancel any in-flight stream if the component unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  function stop() {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
  }

  async function reveal() {
    setLoading(true);
    setError(null);
    setText("");
    try {
      const row = profile ? profileToRow(profile) : null;
      const context = buildGuideContext(row);
      const langInstr =
        lang === "hi"
          ? "Write the ENTIRE reading in Hindi (Devanagari script). Do not use English words except proper names."
          : lang === "hr"
          ? "Write the ENTIRE reading in Roman Hinglish — Hindi words written in Latin/English script, natural and conversational."
          : "Write the reading in simple English.";
      const system = [
        `You are Taromaya's master ${module} interpreter — an experienced Vedic astrologer + tarot reader speaking to a curious 10-year-old best friend.`,
        langInstr,
        "Voice: warm, precise, ELI10. Short sentences. Concrete images. Explain any jargon in 4-5 words.",
        "You MUST ground every claim in the CONTEXT + MODULE DATA blocks. Never invent numbers, degrees, dasha lords, dates, or placements.",
        "OUTPUT SCHEMA — use exactly these markdown headings in this order, and skip any section that CONTEXT does not support:",
        "## Summary  (2 short lines)",
        "## What the chart is saying  (3-4 bullets, each cites the placement e.g. **Moon in Cancer** or **Saturn Mahadasha**)",
        "## Why (planetary reasoning)  (1-2 bullets — houses, lords, aspects, dignity)",
        "## Right now (transits + dasha)  (1-2 bullets tying today's sky to natal chart)",
        "## What to do this week  (3 tiny, doable steps)",
        "## Things to gently avoid  (2 bullets)",
        "## Lucky today  Colors: … · Numbers: … · Best time-window: …",
        "## Simple remedy  (1 line — mantra / gesture / offering, no quantities you weren't given)",
        "## Confidence  A single line: `Confidence: HIGH` or `MEDIUM` or `LOW` — HIGH only when CONTEXT gives full birth chart + dasha + transits.",
        "Rules: total under 320 words. No emojis in headings. No death/medical/legal/exam predictions. No fabricated Sanskrit quotes.",
      ].join("\n");
      const prompt = [
        `MODULE: ${module}`,
        intent ? `USER INTENT: ${intent}` : "",
        "",
        "=== CONTEXT (birth chart + today's sky) ===",
        context,
        "",
        "=== MODULE DATA (this page's live values) ===",
        snapshot?.trim() || "(no page data — read the module from context)",
        "",
        "Write the reading now, following the exact heading order above.",
      ].filter(Boolean).join("\n");

      // Retry once on transient network / 5xx; surface 402/429 verbatim.
      const doFetch = async () => {
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        return fetch("/api/ai-reading", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system: system.slice(0, 3000),
            prompt: prompt.slice(0, 6000),
          }),
          signal: ctrl.signal,
        });
      };

      let res = await doFetch();
      if (!res.ok && res.status >= 500) {
        await new Promise((r) => setTimeout(r, 600));
        res = await doFetch();
      }
      if (!res.ok || !res.body) {
        const body = await res.text().catch(() => "");
        if (res.status === 402) {
          throw new Error("The AI service is out of credits. Please try again later.");
        }
        if (res.status === 429) {
          throw new Error("Too many readings right now — please wait a moment and try again.");
        }
        throw new Error(body || `Reading failed (${res.status}).`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setText(acc);
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Failed to generate reading");
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  }

  const confidence = useMemo(() => {
    const m = /Confidence:\s*(HIGH|MEDIUM|LOW)/i.exec(text);
    return m ? m[1].toUpperCase() : null;
  }, [text]);
  const confidenceColor =
    confidence === "HIGH"
      ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/40"
      : confidence === "MEDIUM"
      ? "bg-amber-500/15 text-amber-700 border-amber-500/40"
      : confidence === "LOW"
      ? "bg-rose-500/15 text-rose-700 border-rose-500/40"
      : "";

  return (
    <section className="mt-8 glass rounded-3xl p-6 sm:p-8 border border-primary/20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-[10px] uppercase tracking-[0.35em] text-primary/80">
              AI Interpretation
            </div>
            {confidence && (
              <span className={`text-[10px] uppercase tracking-widest border rounded-full px-2 py-0.5 ${confidenceColor}`}>
                {confidence} confidence
              </span>
            )}
          </div>
          <h2 className="mt-1 font-display text-2xl">
            <span className="gold-text">Your {module} reading</span>
          </h2>
          <p className="mt-1 text-sm text-foreground/80">
            {profile
              ? `Grounded in ${profile.full_name}'s real chart + today's sky.`
              : "Save your birth details for a personalized, chart-grounded reading."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <Button
              type="button"
              variant="outline"
              onClick={stop}
              aria-label="Stop reading"
              className="min-h-11"
            >
              <StopCircle className="mr-2 h-4 w-4" /> Stop
            </Button>
          )}
          <Button
            onClick={reveal}
            disabled={loading}
            aria-label={text ? "Regenerate reading" : "Reveal reading"}
            className="bg-primary text-primary-foreground hover:bg-primary/90 min-h-11"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Reading…</>
            ) : text ? (
              <><RefreshCw className="mr-2 h-4 w-4" aria-hidden /> Read again</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" aria-hidden /> Reveal reading</>
            )}
          </Button>
        </div>
      </div>


      {error && (
        <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {text && (
        <article data-no-translate className="mt-6 space-y-3 text-foreground leading-relaxed
          [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:font-display [&_h1]:text-2xl
          [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-primary
          [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:font-display [&_h3]:text-lg
          [&_p]:text-foreground/90
          [&_strong]:text-primary [&_strong]:font-semibold
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1
          [&_li]:text-foreground/90
          [&_a]:text-primary [&_a]:underline
          [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:italic">
          <ReactMarkdown>{text}</ReactMarkdown>
        </article>
      )}
    </section>
  );
}
