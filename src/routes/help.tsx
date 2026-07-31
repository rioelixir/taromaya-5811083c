import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Loader2, Search, ArrowRight, HelpCircle, Home } from "lucide-react";
import { HELP_GUIDES, helpGroups, type HelpGuide } from "@/lib/help-guides";
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

type PlayState = { id: string; status: "loading" | "playing" } | null;

function HelpPage() {
  const [q, setQ] = useState("");
  const [now, setNow] = useState<PlayState>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  const stop = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    window.speechSynthesis?.cancel();
    setNow(null);
  };

  /** If the voice service is busy, the phone reads it out instead, so help always works. */
  const speakWithPhone = (guide: HelpGuide) => {
    const synth = window.speechSynthesis;
    if (!synth) {
      setProblem("Audio is not available on this device. You can read the words below instead.");
      setNow(null);
      return;
    }
    const u = new SpeechSynthesisUtterance(`${guide.title}. ${guide.script}`);
    u.rate = 0.95;
    u.onend = () => setNow(null);
    u.onerror = () => setNow(null);
    synth.cancel();
    synth.speak(u);
    setNow({ id: guide.id, status: "playing" });
  };

  const play = async (guide: HelpGuide) => {
    if (now?.id === guide.id) { stop(); return; }
    stop();
    setProblem(null);
    setNow({ id: guide.id, status: "loading" });
    try {
      const res = await fetch(`/api/public/help-audio?id=${encodeURIComponent(guide.id)}`);
      if (!res.ok) throw new Error("no audio");
      const url = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); setNow(null); };
      audio.onerror = () => { URL.revokeObjectURL(url); speakWithPhone(guide); };
      audioRef.current = audio;
      await audio.play();
      setNow({ id: guide.id, status: "playing" });
    } catch {
      speakWithPhone(guide);
    }
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return HELP_GUIDES;
    return HELP_GUIDES.filter((g) =>
      `${g.title} ${g.blurb} ${g.group} ${g.script}`.toLowerCase().includes(needle),
    );
  }, [q]);

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
        Every part of the app has its own short audio guide. Press play and someone will explain it
        to you in easy words. You can also read the same words on the card.
      </p>

      <div className="mt-6 flex items-center gap-2 rounded-2xl glass gold-border px-4 py-3">
        <Search className="h-4 w-4 text-gold shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search help, for example tarot or numbers"
          aria-label="Search help"
          className="w-full bg-transparent text-sm text-pearl outline-none placeholder:text-muted-foreground"
        />
      </div>

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

                    <p className="mt-3 text-sm leading-relaxed text-foreground/80">{g.script}</p>

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
