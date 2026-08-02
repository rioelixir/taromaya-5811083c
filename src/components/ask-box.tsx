import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2, Check, Sparkles, RotateCcw, X, AlertTriangle } from "lucide-react";
import { useVoice } from "@/hooks/use-voice";
import { useBirthProfile } from "@/hooks/use-birth-profile";
import { buildGuideContext, type SavedKundliRow } from "@/lib/ai-context";
import { PLAIN_ELI10_RULES } from "@/lib/ai-format";
import { READING_FRAMEWORK_RULES } from "@/lib/reading-frame";
import { PlainAIText } from "@/components/plain-ai-text";
import { announceDetails, hasDetails, parseSpokenDetails } from "@/lib/voice-parse";
import type { BirthProfile } from "@/lib/birth-profile.functions";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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

/**
 * One big box you can talk into, on every page.
 *
 * You can say anything at all — a question, a worry, your birth details, or a
 * request like "suggest a business name". The words show up live in the box,
 * you can keep editing or speak again, and the answer comes back in plain
 * ELI10 language for whatever page you are on.
 */
export function AskBox({ module }: { module: string }) {
  const { data: profile } = useBirthProfile();
  const lang = useLang();
  const [text, setText] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filled, setFilled] = useState<string[]>([]);

  const areaRef = useRef<HTMLTextAreaElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  /** Text before this listening turn, plus where the cursor was. */
  const baseRef = useRef<{ before: string; after: string }>({ before: "", after: "" });

  const handleVoice = useCallback((_spoken: string) => {
    // Live text is already mirrored into the box while listening.
  }, []);
  const voice = useVoice(handleVoice);

  const listening = voice.state === "listening";
  const working = voice.state === "working";

  // Show the words live, inserted where the cursor was when the mic started.
  useEffect(() => {
    if (!listening && !working) return;
    if (!voice.heard) return;
    const { before, after } = baseRef.current;
    const joiner = before && !/\s$/.test(before) ? " " : "";
    setText(`${before}${joiner}${voice.heard}${after ? ` ${after.trimStart()}` : ""}`);
  }, [listening, working, voice.heard]);

  const startListening = useCallback(() => {
    const el = areaRef.current;
    const at = el ? (el.selectionStart ?? text.length) : text.length;
    baseRef.current = { before: text.slice(0, at), after: text.slice(at) };
    setError(null);
    void voice.start();
  }, [text, voice]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function stopAnswer() {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
  }

  const ask = useCallback(async () => {
    const question = text.trim();
    if (!question) {
      setError("Tap the mic and speak, or type your question first.");
      return;
    }
    if (listening) await voice.stop();

    // If the words happen to hold birth details, quietly fill the page too.
    const details = parseSpokenDetails(question);
    if (hasDetails(details)) {
      announceDetails(details);
      setFilled(
        [
          details.name ? `Name: ${details.name}` : "",
          details.date ? `Birth date: ${details.date}` : "",
          details.time ? `Birth time: ${details.time}` : "",
          details.place ? `Place: ${details.place}` : "",
        ].filter(Boolean),
      );
    } else {
      setFilled([]);
    }

    setBusy(true);
    setError(null);
    setAnswer("");
    try {
      const row = profile ? profileToRow(profile) : null;
      const context = buildGuideContext(row);
      const langInstr =
        lang === "hi"
          ? "Write the ENTIRE answer in Hindi (Devanagari script)."
          : lang === "hr"
            ? "Write the ENTIRE answer in Roman Hinglish — Hindi words in English letters, natural and warm."
            : "Write the answer in simple English.";
      const system = [
        `You are Taromaya's warm master guide for the ${module} page — a Vedic astrologer, numerologist and tarot reader speaking to a curious 10-year-old best friend.`,
        langInstr,
        PLAIN_ELI10_RULES,
        READING_FRAMEWORK_RULES,
        "The person may ask ANYTHING: a life question, a worry, a name idea, a remedy, a forecast, or simply give their birth details. Answer whatever they actually asked. Never force them into a birth-details form and never scold them for what they said.",
        "If they gave birth details, use them. If details are missing, answer with what you have and ask for at most one missing thing at the end.",
        "Ground every claim in the CONTEXT block. Never invent numbers, degrees, dates or placements.",
        "Rules: under 240 words. No death, medical, legal or exam predictions.",
      ].join("\n");
      const prompt = [
        `MODULE: ${module}`,
        "",
        "=== WHAT THE PERSON SAID (their own words) ===",
        question,
        "",
        "=== CONTEXT (their chart + today's sky, may be empty) ===",
        context,
        "",
        "Answer them now, kindly and simply.",
      ].join("\n");

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const res = await fetch("/api/ai-reading", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ system: system.slice(0, 3000), prompt: prompt.slice(0, 6000) }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        if (res.status === 429) throw new Error("Too many questions right now — please wait a moment.");
        const body = await res.text().catch(() => "");
        throw new Error(body || `Something went wrong (${res.status}).`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setAnswer(acc);
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  }, [text, listening, voice, profile, lang, module]);

  const status = listening
    ? { label: "Listening — keep talking", tone: "bg-red-500/15 text-red-200 border-red-400/40" }
    : working
      ? { label: "Writing it down…", tone: "bg-amber-500/15 text-amber-200 border-amber-400/40" }
      : voice.state === "error"
        ? { label: voice.message ?? "We couldn't understand that. Please try again.", tone: "bg-rose-500/15 text-rose-200 border-rose-400/40" }
        : text.trim()
          ? { label: "Ready — tap Ask", tone: "bg-emerald-500/15 text-emerald-200 border-emerald-400/40" }
          : { label: "Tap the mic and say anything", tone: "bg-white/5 text-pearl/80 border-white/15" };

  return (
    <section aria-labelledby="ask-box-heading" className="mb-6 rounded-3xl glass gold-border p-4 sm:p-5" data-no-voice>
      <div className="text-[10px] uppercase tracking-[0.3em] text-gold/80">Talk to Taromaya</div>
      <h2 id="ask-box-heading" className="mt-1 font-display text-xl text-pearl">
        Say anything — a question, a worry, or your birth details
      </h2>

      <div className="mt-3 flex flex-col items-center gap-2">
        {voice.available && (
          <button
            type="button"
            onClick={() => (listening ? void voice.stop() : startListening())}
            disabled={working}
            aria-pressed={listening}
            aria-label={listening ? "Stop listening" : "Speak your question"}
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold",
              listening
                ? "bg-red-500 text-white shadow-[0_0_0_10px_rgba(239,68,68,0.16)] animate-pulse"
                : "bg-gold/20 text-gold gold-border hover:bg-gold/30 active:scale-95",
            )}
          >
            {working ? <Loader2 className="h-7 w-7 animate-spin" /> : listening ? <Square className="h-6 w-6" /> : <Mic className="h-8 w-8" />}
          </button>
        )}
        <span
          aria-live="polite"
          className={cn("rounded-full border px-3 py-1 text-xs", status.tone)}
        >
          {status.label}
        </span>
      </div>

      <textarea
        ref={areaRef}
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Say or type anything"
        placeholder={'For example: "I want to know about my career" or "Born 15 August 1995 at 7:45 in the morning in Delhi"'}
        className="mt-3 w-full resize-y rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-base leading-relaxed text-pearl outline-none placeholder:text-muted-foreground focus:border-gold/50"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void ask()}
          disabled={busy}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold/20 px-5 text-sm text-gold gold-border hover:bg-gold/30 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Ask
        </button>
        {busy && (
          <button
            type="button"
            onClick={stopAnswer}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/5 px-4 text-sm text-pearl/90 hover:bg-white/10"
          >
            <X className="h-4 w-4" /> Stop
          </button>
        )}
        {voice.available && !listening && (
          <button
            type="button"
            onClick={() => void voice.retry()}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/5 px-4 text-sm text-pearl/90 hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
        )}
        {(text || answer || error) && (
          <button
            type="button"
            onClick={() => { setText(""); setAnswer(""); setError(null); setFilled([]); voice.clear(); }}
            className="inline-flex min-h-11 items-center rounded-full bg-white/5 px-4 text-sm text-pearl/90 hover:bg-white/10"
          >
            Clear
          </button>
        )}
      </div>

      {filled.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filled.map((f) => (
            <span key={f} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200">
              <Check className="h-3.5 w-3.5" /> {f}
            </span>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-3 flex items-center gap-2 text-sm text-rose-200">
          <AlertTriangle className="h-4 w-4" /> {error}
        </p>
      )}

      {(answer || busy) && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <PlainAIText text={answer} label="Answer" busy={busy} />
        </div>
      )}
    </section>
  );
}
