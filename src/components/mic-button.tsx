import { Mic, Square, Languages, Check } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useVoiceDictation } from "@/hooks/use-voice-dictation";
import { VOICE_LANGUAGES, getVoiceLang, setVoiceLang } from "@/lib/speech";
import { cn } from "@/lib/utils";

const TAP_MS = 350;
const SILENCE_MS = 2500;

function buzz(ms: number) {
  try {
    (navigator as unknown as { vibrate?: (p: number) => void }).vibrate?.(ms);
  } catch {
    /* not supported */
  }
}

/**
 * Two easy ways to speak:
 *  - Quick tap: it keeps listening and stops on its own when you go quiet.
 *  - Press and hold: it listens while you hold, and stops when you let go.
 */
export function MicButton({
  onText,
  size = "md",
  className,
  showLanguage = true,
  label = "Tap to speak, or hold and speak",
}: {
  onText: (text: string) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  showLanguage?: boolean;
  label?: string;
}) {
  const voice = useVoiceDictation(onText);
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState("auto");
  const [hands, setHands] = useState(false); // tap mode: listening without holding
  const holdRef = useRef(false);
  const downAtRef = useRef(0);
  const handsRef = useRef(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  handsRef.current = hands;

  useEffect(() => {
    setLang(getVoiceLang());
    const onLang = (e: Event) => setLang((e as CustomEvent<string>).detail);
    window.addEventListener("taromaya:voice-lang", onLang);
    return () => window.removeEventListener("taromaya:voice-lang", onLang);
  }, []);

  useEffect(() => {
    if (!langOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [langOpen]);

  const finish = useCallback(() => {
    setHands(false);
    buzz(15);
    void voice.stop();
  }, [voice]);

  // Releasing anywhere stops listening — unless it was a quick tap.
  useEffect(() => {
    const release = () => {
      if (!holdRef.current) return;
      holdRef.current = false;
      if (Date.now() - downAtRef.current < TAP_MS) {
        setHands(true); // quick tap: keep listening, no need to hold
        return;
      }
      finish();
    };
    const cancel = () => {
      holdRef.current = false;
      if (!handsRef.current) finish();
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("blur", cancel);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("blur", cancel);
    };
  }, [finish]);

  // In tap mode, stop on its own after a short quiet moment.
  const listening = voice.status === "listening";
  useEffect(() => {
    if (!hands || !listening) return;
    const t = window.setTimeout(finish, SILENCE_MS);
    return () => window.clearTimeout(t);
  }, [hands, listening, voice.partial, finish]);

  const px = size === "lg" ? "h-14 w-14" : size === "sm" ? "h-11 w-11" : "h-12 w-12";
  const icon = size === "lg" ? "h-6 w-6" : "h-5 w-5";

  if (!voice.available) return null;

  const working = voice.status === "working";

  return (
    <div ref={wrapRef} className={cn("relative inline-flex items-center gap-1", className)}>
      <button
        type="button"
        aria-label={hands ? "Stop listening" : label}
        aria-pressed={listening}
        title={hands ? "Tap to stop" : label}
        onPointerDown={(e) => {
          e.preventDefault();
          if (handsRef.current || listening) {
            // already listening from a tap — this tap stops it
            finish();
            return;
          }
          holdRef.current = true;
          downAtRef.current = Date.now();
          buzz(20);
          void voice.start();
        }}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          if (listening) finish();
          else { setHands(true); void voice.start(); }
        }}
        onContextMenu={(e) => e.preventDefault()}
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-full border transition-all touch-none select-none",
          px,
          listening
            ? "border-gold bg-gold/25 text-gold shadow-[0_0_28px_rgba(212,175,55,0.55)] scale-105"
            : "gold-border bg-gold/10 text-gold hover:bg-gold/20 active:scale-95",
        )}
      >
        {listening && (
          <span aria-hidden className="absolute inset-0 rounded-full border border-gold/60 animate-ping" />
        )}
        {hands && listening ? <Square className={icon} /> : <Mic className={cn(icon, working && "animate-pulse")} />}
      </button>

      {showLanguage && (
        <>
          <button
            type="button"
            aria-label="Choose voice language"
            onClick={() => setLangOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-pearl/70 hover:bg-white/10"
          >
            <Languages className="h-4 w-4" />
          </button>
          {langOpen && (
            <div className="absolute bottom-full right-0 z-50 mb-2 max-h-[50vh] min-w-[190px] overflow-y-auto rounded-xl glass gold-border">
              {VOICE_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => { setVoiceLang(l.code); setLangOpen(false); }}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2.5 text-left text-xs",
                    l.code === lang ? "bg-gold/10 text-gold" : "text-pearl hover:bg-white/5",
                  )}
                >
                  <span>{l.label}</span>
                  {l.code === lang && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {(listening || working || voice.partial || voice.message) && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute bottom-full right-0 z-40 mb-2 max-w-[70vw] rounded-xl glass gold-border px-3 py-2 text-xs text-pearl"
        >
          {voice.message ? (
            voice.message
          ) : working ? (
            <span className="text-gold">Turning your words into text…</span>
          ) : (
            <>
              <span className="text-gold">🎤 Listening…</span>
              <span className="ml-1 text-pearl/70">{hands ? "tap again to stop" : "let go when done"}</span>
              {voice.partial && <span className="ml-1 block text-pearl/90">{voice.partial}</span>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
