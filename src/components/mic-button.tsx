import { Mic, Languages, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useVoiceDictation } from "@/hooks/use-voice-dictation";
import { VOICE_LANGUAGES, getVoiceLang, setVoiceLang } from "@/lib/speech";
import { cn } from "@/lib/utils";

/**
 * Press and hold to speak. Release to turn the words into text.
 * Reusable: give it what to do with the words and it handles the rest.
 */
export function MicButton({
  onText,
  size = "md",
  className,
  showLanguage = true,
  label = "Press and hold to speak",
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
  const holdRef = useRef(false);
  const wrapRef = useRef<HTMLDivElement>(null);

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

  // Releasing anywhere (even off the button) must stop listening.
  useEffect(() => {
    const release = () => {
      if (!holdRef.current) return;
      holdRef.current = false;
      void voice.stop();
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
    };
  }, [voice]);

  const px = size === "lg" ? "h-14 w-14" : size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const icon = size === "lg" ? "h-6 w-6" : size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const listening = voice.status === "listening";

  if (!voice.available) return null;

  return (
    <div ref={wrapRef} className={cn("relative inline-flex items-center gap-1", className)}>
      <button
        type="button"
        aria-label={label}
        title={label}
        onPointerDown={(e) => {
          e.preventDefault();
          holdRef.current = true;
          void voice.start();
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
        <Mic className={icon} />
      </button>

      {showLanguage && (
        <>
          <button
            type="button"
            aria-label="Choose voice language"
            onClick={() => setLangOpen((o) => !o)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-pearl/70 hover:bg-white/10"
          >
            <Languages className="h-3.5 w-3.5" />
          </button>
          {langOpen && (
            <div className="absolute bottom-full right-0 z-50 mb-2 max-h-[50vh] min-w-[190px] overflow-y-auto rounded-xl glass gold-border">
              {VOICE_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => { setVoiceLang(l.code); setLangOpen(false); }}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-left text-xs",
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

      {(listening || voice.partial || voice.message) && (
        <div
          role="status"
          className="pointer-events-none absolute bottom-full right-0 z-40 mb-2 max-w-[70vw] rounded-xl glass gold-border px-3 py-2 text-xs text-pearl"
        >
          {voice.message ? (
            voice.message
          ) : (
            <>
              <span className="text-gold">🎤 Listening…</span>
              {voice.partial && <span className="ml-1 text-pearl/80">{voice.partial}</span>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
