import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Mic, Square, Loader2, Sparkles, Check, AlertTriangle, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useVoice } from "@/hooks/use-voice";
import { markBirthGiven, useBirthProfile } from "@/hooks/use-birth-profile";
import { searchPlaces } from "@/lib/geo.functions";
import { offsetForLocalTime } from "@/lib/timezone";
import { announceDetails, hasDetails, parseSpokenDetails } from "@/lib/voice-parse";
import { buildGuideContext, type SavedKundliRow } from "@/lib/ai-context";
import { PLAIN_ELI10_RULES } from "@/lib/ai-format";
import { READING_FRAMEWORK_RULES } from "@/lib/reading-frame";
import { PlainAIText } from "@/components/plain-ai-text";
import type { BirthProfile } from "@/lib/birth-profile.functions";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * One place where every module's input lives.
 * A module never draws its own mic or its own text box: it simply says
 * "these are the details I need" and this box fills them in.
 * ------------------------------------------------------------------ */

export type UniversalField = "name" | "date" | "time" | "place";

export type UniversalValue = {
  name?: string;
  date?: string; // yyyy-mm-dd
  time?: string; // HH:mm
  place?: string;
  lat?: string;
  lon?: string;
  tz?: string;
};

type Consumer = {
  need: UniversalField[];
  value: UniversalValue;
  onChange: (patch: UniversalValue) => void;
  onGenerate?: () => void;
};

type Ctx = {
  register: (id: string, c: Consumer) => void;
  unregister: (id: string) => void;
  /** Plain-language note about what is still missing. */
  note: string | null;
  /** True while the box is looking a place up. */
  busy: boolean;
};

const UniversalCtx = createContext<Ctx | null>(null);

/** Details remembered for the whole visit, so the next module autofills. */
const sessionMemory: UniversalValue = {};

function isComplete(c: Consumer): boolean {
  return c.need.every((f) => {
    const v = c.value[f];
    return typeof v === "string" && v.trim() !== "";
  });
}

/**
 * Modules call this instead of drawing their own mic and text box.
 * Whatever the person says or types in the one box at the top of the page
 * lands here as clean, structured details.
 */
export function useUniversalFields(opts: {
  need?: UniversalField[];
  value: UniversalValue;
  onChange: (patch: UniversalValue) => void;
  onGenerate?: () => void;
}) {
  const ctx = useContext(UniversalCtx);
  const id = useRef<string>(`u${Math.random().toString(36).slice(2)}`);
  const need = useMemo(
    () => opts.need ?? (["name", "date", "time", "place"] as UniversalField[]),
    [opts.need],
  );

  // Keep the registration fresh on every render (cheap: it is a ref map).
  useEffect(() => {
    if (!ctx) return;
    ctx.register(id.current, {
      need,
      value: opts.value,
      onChange: opts.onChange,
      onGenerate: opts.onGenerate,
    });
  });

  useEffect(() => {
    const key = id.current;
    const c = ctx;
    return () => c?.unregister(key);
  }, [ctx]);

  // Reuse details already given earlier in this visit.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const patch: UniversalValue = {};
    for (const k of ["name", "date", "time", "place", "lat", "lon", "tz"] as const) {
      const mem = sessionMemory[k];
      if (mem && !opts.value[k]) patch[k] = mem;
    }
    if (Object.keys(patch).length > 0) opts.onChange(patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { note: ctx?.note ?? null, busy: ctx?.busy ?? false, inside: !!ctx };
}

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

const LABEL: Record<UniversalField, string> = {
  name: "the name",
  date: "the birth date",
  time: "the birth time",
  place: "the birth place",
};

/**
 * The one mic, the one text box and the one Generate button for a page.
 * Speak or type anything at all — a question, a worry, or your birth
 * details — and the app pulls out whatever this page needs.
 */
export function UniversalInput({ module, children }: { module: string; children: ReactNode }) {
  const search = useServerFn(searchPlaces);
  const { data: profile } = useBirthProfile();
  const lang = useLang();

  const consumers = useRef(new Map<string, Consumer>());
  const [text, setText] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [lookup, setLookup] = useState(false);
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caught, setCaught] = useState<string[]>([]);

  const areaRef = useRef<HTMLTextAreaElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const baseRef = useRef<{ before: string; after: string }>({ before: "", after: "" });

  const register = useCallback((id: string, c: Consumer) => {
    consumers.current.set(id, c);
  }, []);
  const unregister = useCallback((id: string) => {
    consumers.current.delete(id);
  }, []);

  const voice = useVoice(useCallback(() => { /* live text is mirrored below */ }, []));
  const listening = voice.state === "listening";
  const working = voice.state === "working";

  // Live words appear where the cursor was when the mic started.
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

  /** Send the sentence through the same pipeline whether spoken or typed. */
  const fill = useCallback(
    async (sentence: string): Promise<boolean> => {
      const line = sentence.trim();
      if (!line) return false;
      const list = [...consumers.current.values()];
      if (list.length === 0) return false;

      const d = parseSpokenDetails(line);
      if (!hasDetails(d)) return false;

      // Fill the first part of the page that still needs details.
      const target = list.find((c) => !isComplete(c)) ?? list[0]!;

      const patch: UniversalValue = {};
      if (d.name) patch.name = d.name;
      if (d.date) patch.date = d.date;
      if (d.time) patch.time = d.time;
      if (Object.keys(patch).length > 0) {
        markBirthGiven(Object.keys(patch));
        target.onChange(patch);
        Object.assign(sessionMemory, patch);
      }
      announceDetails(d);
      setCaught(
        [
          d.name ? `Name: ${d.name}` : "",
          d.date ? `Birth date: ${d.date}` : "",
          d.time ? `Birth time: ${d.time}` : "",
          d.place ? `Place: ${d.place}` : "",
        ].filter(Boolean),
      );

      if (d.place) {
        setLookup(true);
        try {
          const res = await search({ data: { query: d.place, country: "" } });
          const best = res.places[0];
          if (best) {
            const [y, mo, dd] = (d.date ?? target.value.date ?? "2000-01-01").split("-").map(Number);
            const [hh, mi] = (d.time ?? target.value.time ?? "12:00").split(":").map(Number);
            const off = offsetForLocalTime(
              best.timezone, y || 2000, mo || 1, dd || 1, hh || 12, mi || 0,
            );
            const placePatch: UniversalValue = {
              place: [best.city, best.country].filter(Boolean).join(", "),
              lat: best.latitude.toFixed(4),
              lon: best.longitude.toFixed(4),
              tz: String(off),
            };
            markBirthGiven(Object.keys(placePatch));
            target.onChange(placePatch);
            Object.assign(sessionMemory, placePatch);
          } else {
            setNote(`I could not find the place "${d.place}". Try just the city name.`);
          }
        } catch {
          setNote("I could not look up that place just now. Please try again.");
        } finally {
          setLookup(false);
        }
      }

      // Ask kindly for only what is still missing.
      const have = (f: UniversalField) =>
        f === "place"
          ? !!(d.place || target.value.place)
          : !!(d[f as "name" | "date" | "time"] || target.value[f]);
      const missing = target.need.filter((f) => !have(f)).map((f) => LABEL[f]);
      setNote(
        missing.length === 0
          ? "Got it — everything I need is here."
          : `Got it. I still need ${missing.join(", ")}. Just say that bit.`,
      );
      return true;
    },
    [search],
  );

  const askAI = useCallback(
    async (question: string) => {
      setAsking(true);
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
          "The person may ask ANYTHING: a life question, a worry, a name idea, a remedy, a forecast, or simply give their birth details. Answer whatever they actually asked.",
          "If details are missing, answer with what you have and ask for at most one missing thing at the end.",
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
        for (;;) {
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
        setAsking(false);
      }
    },
    [profile, lang, module],
  );

  const generate = useCallback(async () => {
    const line = text.trim();
    if (!line) {
      setError("Tap the mic and speak, or type here first.");
      return;
    }
    setError(null);
    if (listening) await voice.stop();

    const usedForFields = await fill(line);

    if (usedForFields) {
      // Let the page redraw with the new details first, so the module runs
      // itself with the freshly filled date, time and place.
      await new Promise((r) => setTimeout(r, 120));
      const fresh = [...consumers.current.values()];
      for (const c of fresh) c.onGenerate?.();
      if (fresh.every(isComplete)) return;
      // Something is still missing, so also answer what they said.
    }
    await askAI(line);
  }, [text, listening, voice, fill, askAI]);

  // Instant reading: as soon as the mic stops, the reading starts on its own.
  const generateRef = useRef(generate);
  generateRef.current = generate;
  const prevVoiceState = useRef(voice.state);
  const autoRef = useRef(false);
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    const was = prevVoiceState.current;
    prevVoiceState.current = voice.state;
    const wasBusy = was === "listening" || was === "working";
    const nowBusy = voice.state === "listening" || voice.state === "working";
    if (!wasBusy || nowBusy) return;
    autoRef.current = true;
    // Words sometimes land a moment after the mic closes, so allow a short grace.
    const t = setTimeout(() => {
      if (!autoRef.current) return;
      autoRef.current = false;
      if (textRef.current.trim()) void generateRef.current();
    }, 500);
    return () => clearTimeout(t);
  }, [voice.state]);

  useEffect(() => {
    if (!autoRef.current || !text.trim()) return;
    autoRef.current = false;
    void generateRef.current();
  }, [text]);




  const ctxValue = useMemo<Ctx>(
    () => ({ register, unregister, note, busy: lookup }),
    [register, unregister, note, lookup],
  );

  const status = listening
    ? { key: "listening", label: "Listening", hint: "Keep talking — your words fill the box below.", tone: "text-red-200 border-red-400/40 bg-red-500/10" }
    : working || lookup
      ? { key: "working", label: "Processing", hint: "Writing down what you said…", tone: "text-amber-200 border-amber-400/40 bg-amber-500/10" }
      : voice.state === "error"
        ? { key: "error", label: "Try again", hint: voice.message ?? "We could not hear that.", tone: "text-rose-200 border-rose-400/40 bg-rose-500/10" }
        : text.trim()
          ? { key: "ready", label: "Ready", hint: "Tap Generate when you are done.", tone: "text-emerald-200 border-emerald-400/40 bg-emerald-500/10" }
          : { key: "idle", label: "Ready", hint: "Tap the big mic and say anything.", tone: "text-gold border-gold/40 bg-gold/10" };

  return (
    <UniversalCtx.Provider value={ctxValue}>
      <section
        aria-labelledby="universal-input-heading"
        className="mb-6 rounded-3xl glass gold-border p-4 sm:p-5"
        data-no-voice
      >
        <div className="text-[10px] uppercase tracking-[0.3em] text-gold/80">Talk to Taromaya</div>
        <h2 id="universal-input-heading" className="mt-1 font-display text-xl text-pearl">
          Say anything — a question, a worry, or your birth details
        </h2>

        {voice.available && (
          <div className="mt-3 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => (listening ? void voice.stop() : startListening())}
              disabled={working}
              aria-pressed={listening}
              aria-label={listening ? "Stop listening" : "Tap to speak"}
              className={cn(
                "relative flex h-20 w-20 items-center justify-center rounded-full transition active:scale-95 disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold",
                listening
                  ? "bg-red-500 text-white shadow-[0_0_0_10px_rgba(239,68,68,0.18)]"
                  : "bg-gold/20 text-gold gold-border hover:bg-gold/30",
              )}
            >
              {listening && <span className="absolute inset-0 animate-ping rounded-full bg-red-400/30" />}
              {working ? <Loader2 className="h-8 w-8 animate-spin" />
                : listening ? <Square className="h-8 w-8" />
                : <Mic className="h-9 w-9" />}
            </button>
            <span
              aria-live="polite"
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs uppercase tracking-widest",
                status.tone,
              )}
            >
              {status.key === "listening" && <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />}
              {status.key === "working" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {status.key === "ready" && <Check className="h-3.5 w-3.5" />}
              {status.label}
            </span>
            <p className="text-center text-sm text-muted-foreground">{status.hint}</p>
          </div>
        )}

        <div
          className={cn(
            "mt-3 rounded-2xl border bg-black/30 p-2 transition",
            listening ? "border-red-400/60" : "border-white/10 focus-within:border-gold/50",
          )}
        >
          <textarea
            ref={areaRef}
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Say or type anything"
            placeholder={
              listening
                ? "Listening… your words appear here"
                : 'For example: "Born 15 August 1995 at 7:45 in the morning in Delhi" or "How is my work going this year?"'
            }
            className="min-h-[5.5rem] w-full resize-y bg-transparent px-2 py-1 text-base leading-relaxed text-pearl outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void generate()}
            disabled={asking}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-gold/20 px-6 text-base text-gold gold-border hover:bg-gold/30 disabled:opacity-60"
          >
            {asking ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />} Generate
          </button>
          {asking && (
            <button
              type="button"
              onClick={() => { abortRef.current?.abort(); abortRef.current = null; setAsking(false); }}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white/5 px-5 text-base text-pearl/90 hover:bg-white/10"
            >
              <X className="h-4 w-4" /> Stop
            </button>
          )}
          {(text || answer || error) && (
            <button
              type="button"
              onClick={() => { setText(""); setAnswer(""); setError(null); setNote(null); setCaught([]); voice.clear(); }}
              className="inline-flex min-h-12 items-center rounded-full bg-white/5 px-5 text-base text-pearl/90 hover:bg-white/10"
            >
              Start again
            </button>
          )}
        </div>

        {caught.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {caught.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200"
              >
                <Check className="h-3.5 w-3.5" /> {c}
              </span>
            ))}
          </div>
        )}

        {note && <p className="mt-3 text-sm text-muted-foreground">{note}</p>}

        {error && (
          <p className="mt-3 flex items-center gap-2 text-sm text-rose-200">
            <AlertTriangle className="h-4 w-4" /> {error}
          </p>
        )}

        {(answer || asking) && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <PlainAIText text={answer} label="Answer" busy={asking} />
          </div>
        )}
      </section>

      {children}
    </UniversalCtx.Provider>
  );
}
