import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Loader2, RefreshCw, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBirthProfile } from "@/hooks/use-birth-profile";
import { buildGuideContext, type SavedKundliRow } from "@/lib/ai-context";
import { PLAIN_ELI10_RULES } from "@/lib/ai-format";
import { PlainAIText } from "@/components/plain-ai-text";
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
        PLAIN_ELI10_RULES,
        "You MUST ground every claim in the CONTEXT + MODULE DATA blocks. Never invent numbers, degrees, dasha lords, dates, or placements.",
        "OUTPUT — use exactly these picture-emoji section titles, each on its own line, in this order. Skip any section CONTEXT does not support:",
        "⭐ Summary  (2 short lines)",
        "🪐 What the chart says  (3 short bullets, each naming the placement, e.g. Moon in Cancer)",
        "🔎 Why  (1 bullet — house, lord or aspect)",
        "🕰️ Right now  (1 bullet — today's sky meeting your chart)",
        "✅ Do this week  (3 tiny steps)",
        "⚠️ Gently avoid  (2 short bullets)",
        "🍀 Lucky today  (colors, numbers, best time window)",
        "🙏 Simple remedy  (1 line)",
        "📊 Confidence  (one line: Confidence: HIGH or MEDIUM or LOW — HIGH only with full chart + dasha + transits)",
        "Rules: total under 220 words. No death, medical, legal or exam predictions. No made-up Sanskrit quotes.",
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
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token;
        return fetch("/api/ai-reading", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
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
    <section
      aria-labelledby="ai-reading-heading"
      className="mt-8 glass rounded-3xl p-6 sm:p-8 border border-primary/20"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-[10px] uppercase tracking-[0.35em] text-primary">
              AI Interpretation
            </div>
            {confidence && (
              <span
                aria-label={`Reading confidence: ${confidence}`}
                className={`text-[10px] uppercase tracking-widest border rounded-full px-2 py-0.5 ${confidenceColor}`}
              >
                {confidence} confidence
              </span>
            )}
          </div>
          <h2 id="ai-reading-heading" className="mt-1 font-display text-2xl">
            <span className="gold-text">Your {module} reading</span>
          </h2>
          <p className="mt-1 text-sm text-foreground">
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
              <StopCircle className="mr-2 h-4 w-4" aria-hidden="true" /> Stop
            </Button>
          )}
          <Button
            onClick={reveal}
            disabled={loading}
            aria-label={text ? "Regenerate reading" : "Reveal reading"}
            className="bg-primary text-primary-foreground hover:bg-primary/90 min-h-11"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Reading…</>
            ) : text ? (
              <><RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" /> Read again</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" aria-hidden="true" /> Reveal reading</>
            )}
          </Button>
        </div>
      </div>


      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mt-4 rounded-xl border border-destructive/60 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {text && (
        <div className="mt-6">
          <PlainAIText
            text={text}
            busy={loading}
            label={`${module} reading content`}
          />
        </div>
      )}
    </section>
  );
}
