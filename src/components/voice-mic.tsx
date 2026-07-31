import { Mic, Square, Pause, Play, RotateCcw, X } from "lucide-react";
import { useEffect } from "react";
import { useVoice } from "@/hooks/use-voice";
import { cn } from "@/lib/utils";

/**
 * One microphone for the whole app.
 * Tap once to start, speak, tap again when done — nothing to hold.
 */
export function VoiceMic({
  onText,
  size = "md",
  className,
  label = "Tap and speak",
  showControls = true,
}: {
  onText: (text: string) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
  showControls?: boolean;
}) {
  const voice = useVoice(onText);

  useEffect(() => {
    if (!voice.message) return;
    const t = window.setTimeout(() => voice.clearMessage(), 4000);
    return () => window.clearTimeout(t);
  }, [voice.message, voice]);

  if (!voice.available) return null;

  const px = size === "lg" ? "h-16 w-16" : size === "sm" ? "h-11 w-11" : "h-12 w-12";
  const icon = size === "lg" ? "h-7 w-7" : "h-5 w-5";
  const live = voice.state === "listening";
  const paused = voice.state === "paused";
  const working = voice.state === "working";
  const busy = live || paused;

  return (
    <div className={cn("relative inline-flex items-center gap-2", className)}>
      <button
        type="button"
        aria-label={busy ? "Stop and use my words" : label}
        aria-pressed={busy}
        title={busy ? "Tap to finish" : label}
        onClick={() => {
          try { (navigator as unknown as { vibrate?: (n: number) => void }).vibrate?.(15); } catch { /* not supported */ }
          if (busy) void voice.stop();
          else void voice.start();
        }}
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-full border transition-all select-none",
          px,
          live
            ? "border-gold bg-gold/25 text-gold shadow-[0_0_30px_rgba(212,175,55,0.6)] scale-105"
            : "gold-border bg-gold/10 text-gold hover:bg-gold/20 active:scale-95",
        )}
      >
        {live && <span aria-hidden className="absolute inset-0 rounded-full border border-gold/60 animate-ping" />}
        {busy ? <Square className={icon} /> : <Mic className={cn(icon, working && "animate-pulse")} />}
      </button>

      {showControls && busy && (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label={paused ? "Continue" : "Pause"}
            onClick={() => (paused ? voice.resume() : voice.pause())}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-pearl hover:bg-white/10"
          >
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
          <button
            type="button"
            aria-label="Start over"
            onClick={() => void voice.retry()}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-pearl hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => voice.clear()}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-pearl hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {(busy || working || voice.message) && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute bottom-full right-0 z-40 mb-2 max-w-[76vw] rounded-xl glass gold-border px-3 py-2 text-xs leading-relaxed text-pearl"
        >
          {voice.message ? (
            voice.message
          ) : working ? (
            <span className="text-gold">Writing your words…</span>
          ) : (
            <>
              <span className="text-gold">{paused ? "⏸ Paused" : "🎤 Listening…"}</span>
              <span className="ml-1 text-pearl/70">{paused ? "tap play to continue" : "tap the square when done"}</span>
              {voice.heard && <span className="mt-1 block text-pearl/90">{voice.heard}</span>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
