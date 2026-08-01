import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Loader2, Search, ArrowRight, HelpCircle, Home, Languages, Sparkles, Square } from "lucide-react";
import { HELP_GUIDES, helpGroups, searchGuides, type HelpGuide } from "@/lib/help-guides";
import { LANGUAGE_LIST, useLang, type Lang } from "@/lib/i18n";
import { loadVoices, pickVoice, speakText, type Speaker } from "@/lib/help-speech";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/help")({
  component: HelpPage,
  head: () => ({
    meta: [
      { title: "Help — Listen and learn every Taromaya module" },
      {
        name: "description",
        content:
          "Audio help for every part of Taromaya. Press play and hear, in simple words, how to use tarot, kundli, panchang, numerology and more.",
      },
      { property: "og:title", content: "Help — Listen and learn every Taromaya module" },
      {
        property: "og:description",
        content: "Press play and hear how to use each Taromaya module, explained simply.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type PlayState = { id: string; status: "loading" | "playing" | "paused" } | null;

function HelpPage() {
  const appLang = useLang();
  const [q, setQ] = useState("");
  const [lang, setLang] = useState<Lang>("en");
  const [now, setNow] = useState<PlayState>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [group, setGroup] = useState<string>("All");
  // The phone's own voice is free and instant, so it is the normal way to listen.
  // The studio voice sounds nicer and is there when someone wants it.
  const [studio, setStudio] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const scriptCache = useRef<Map<string, string>>(new Map());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakerRef = useRef<Speaker | null>(null);

  // Start in whatever language the person already picked for the app.
  useEffect(() => { setLang(appLang); }, [appLang]);

  // Ask the device which voices it has, so we know what it can really read.
  useEffect(() => { void loadVoices().then(setVoices); }, []);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      speakerRef.current?.cancel();
      speakerRef.current = null;
    };
  }, []);

  const stop = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    speakerRef.current?.cancel();
    speakerRef.current = null;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setNow(null);
  };

  const choice = useMemo(() => pickVoice(voices, lang), [voices, lang]);
  /** No voice on the device for this language, so the studio voice is the only way. */
  const needsStudio = voices.length > 0 && !choice.exact && lang !== "en";

  /** The device reads the guide out loud, piece by piece. */
  const speakWithPhone = (guide: HelpGuide, words?: string) => {
    speakerRef.current?.cancel();
    speakerRef.current = speakText(words ?? `${guide.title}. ${guide.script}`, {
      lang: choice.tag,
      voice: choice.voice,
      onStart: () => setNow({ id: guide.id, status: "playing" }),
      onDone: () => { speakerRef.current = null; setNow(null); },
      onFail: (why) => {
        speakerRef.current = null;
        setNow(null);
        setProblem(why);
      },
    });
  };

  /** Gets the guide words in the chosen language, and remembers them. */
  const wordsFor = async (guide: HelpGuide): Promise<string> => {
    if (lang === "en") return `${guide.title}. ${guide.script}`;
    const key = `${guide.id}:${lang}`;
    const kept = scriptCache.current.get(key);
    if (kept) return kept;
    const res = await fetch(
      `/api/public/help-audio?text=1&id=${encodeURIComponent(guide.id)}&lang=${encodeURIComponent(lang)}`,
    );
    if (!res.ok) throw new Error("no words");
    const data = (await res.json()) as { text?: string };
    const text = data.text?.trim();
    if (!text) throw new Error("no words");
    scriptCache.current.set(key, text);
    return text;
  };

  /** Play, pause and carry on again from the same button. */
  const play = async (guide: HelpGuide) => {
    if (now?.id === guide.id) {
      if (now.status === "playing") {
        audioRef.current?.pause();
        speakerRef.current?.pause();
        setNow({ id: guide.id, status: "paused" });
        return;
      }
      if (now.status === "paused") {
        void audioRef.current?.play();
        speakerRef.current?.resume();
        setNow({ id: guide.id, status: "playing" });
        return;
      }
      stop();
      return;
    }
    stop();
    setProblem(null);
    setNow({ id: guide.id, status: "loading" });

    const useStudio = studio || needsStudio;

    if (!useStudio) {
      let words: string | undefined;
      try { words = await wordsFor(guide); } catch { words = undefined; }
      speakWithPhone(guide, words);
      return;
    }

    try {
      const res = await fetch(
        `/api/public/help-audio?id=${encodeURIComponent(guide.id)}&lang=${encodeURIComponent(lang)}`,
      );
      if (!res.ok) throw new Error("no audio");
      const blob = await res.blob();
      if (blob.size < 1024) throw new Error("empty audio");
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); audioRef.current = null; setNow(null); };
      audio.onerror = () => { URL.revokeObjectURL(url); audioRef.current = null; speakWithPhone(guide); };
      audioRef.current = audio;
      await audio.play();
      setNow({ id: guide.id, status: "playing" });
    } catch {
      // The nicer voice is not available right now, so the device reads it.
      let words: string | undefined;
      try { words = await wordsFor(guide); } catch { words = undefined; }
      speakWithPhone(guide, words);
    }
  };


  const filtered = useMemo(() => {
    const found = searchGuides(q);
    return group === "All" ? found : found.filter((g) => g.group === group);
  }, [q, group]);

  return (
    <div className="container-page pt-20 sm:pt-24 pb-16">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">Help</div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl glass gold-border px-3 py-2 text-xs text-pearl hover:bg-white/10 transition"
        >
          <Home className="h-4 w-4 text-gold" /> Home
        </Link>
      </div>

      <h1 className="mt-3 font-display text-3xl sm:text-4xl leading-tight">
        <span className="gold-text">Listen and learn</span>
      </h1>
      <p className="mt-3 max-w-xl text-base text-muted-foreground">
        Every part of the app has its own short voice guide. Pick your language, press play, and
        someone will explain it to you in easy words.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-2xl glass gold-border px-4 py-3">
          <Search className="h-4 w-4 text-gold shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search help, for example tarot or numbers"
            aria-label="Search help"
            className="w-full bg-transparent text-sm text-pearl outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-2 rounded-2xl glass gold-border px-4 py-3">
          <Languages className="h-4 w-4 text-gold shrink-0" />
          <select
            value={lang}
            onChange={(e) => { stop(); setLang(e.target.value as Lang); }}
            aria-label="Choose the voice language"
            className="w-full bg-transparent text-sm text-pearl outline-none"
          >
            {LANGUAGE_LIST.map((l) => (
              <option key={l.code} value={l.code} className="text-foreground">
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {["All", ...helpGroups()].map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => { stop(); setGroup(name); }}
            aria-pressed={group === name}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition",
              group === name
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/50 bg-white/60 text-muted-foreground hover:bg-white",
            )}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => { stop(); setStudio((v) => !v); }}
          aria-pressed={studio}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-xs transition",
            studio
              ? "border-primary bg-primary/10 text-primary"
              : "border-border/50 bg-white/60 text-muted-foreground hover:bg-white",
          )}
        >
          <Sparkles className="h-4 w-4" />
          {studio ? "Nicer voice is on" : "Use a nicer voice"}
        </button>
        {now && (
          <button
            type="button"
            onClick={stop}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border/50 bg-white/60 px-3 py-2 text-xs text-muted-foreground transition hover:bg-white"
          >
            <Square className="h-4 w-4" /> Stop
          </button>
        )}
      </div>

      {needsStudio && !studio && (
        <p className="mt-3 text-sm text-muted-foreground">
          This device has no voice for this language, so the nicer voice will read it for you.
        </p>
      )}

      {problem && <p className="mt-3 text-sm text-muted-foreground">{problem}</p>}


      {helpGroups().map((group) => {
        const items = filtered.filter((g) => g.group === group);
        if (items.length === 0) return null;
        return (
          <section key={group} className="mt-8">
            <h2 className="mb-3 font-display text-xl">{group}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {items.map((g) => {
                const active = now?.id === g.id;
                const loading = active && now?.status === "loading";
                return (
                  <div
                    key={g.id}
                    className="rounded-2xl border border-border/40 bg-white/70 p-4 sm:p-5"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => void play(g)}
                        aria-label={active ? `Stop the guide for ${g.title}` : `Listen to the guide for ${g.title}`}
                        className={cn(
                          "grid h-12 w-12 shrink-0 place-items-center rounded-full transition active:scale-95",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary/10 text-primary hover:bg-primary/20",
                        )}
                      >
                        {loading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : active ? (
                          <Pause className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <div className="font-medium text-foreground">{g.title}</div>
                        <div className="text-xs text-muted-foreground">{g.blurb}</div>
                      </div>
                    </div>

                    <Link
                      to={g.to}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      Open it <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {filtered.length === 0 && (
        <div className="mt-10 flex items-center gap-3 rounded-2xl border border-border/40 bg-white/70 p-5">
          <HelpCircle className="h-5 w-5 text-primary" />
          <p className="text-sm text-muted-foreground">
            Nothing matched that word. Try a simpler one, like tarot, chart or numbers.
          </p>
        </div>
      )}
    </div>
  );
}
