import { Mic, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useVoice } from "@/hooks/use-voice";
import { isTypableField } from "@/lib/voice-fields";
import { cn } from "@/lib/utils";

type Spot = { el: HTMLElement; top: number; left: number; size: number };

const SIZE = 30;
const GAP = 6;

function visible(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  if (r.width < 60 || r.height < 20) return false;
  if (r.bottom < -40 || r.top > window.innerHeight + 40) return false;
  const cs = window.getComputedStyle(el);
  return cs.visibility !== "hidden" && cs.display !== "none" && Number(cs.opacity) > 0.1;
}

/**
 * A small microphone sits inside every box you can type in, on every page.
 * Tap the one next to a box and speak — your words go straight into that box.
 */
export function VoiceFieldMics({ onText }: { onText: (el: HTMLElement, text: string) => void }) {
  const [spots, setSpots] = useState<Spot[]>([]);
  const activeRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState<HTMLElement | null>(null);

  const voice = useVoice(
    useCallback(
      (text: string) => {
        const el = activeRef.current;
        if (el && el.isConnected) onText(el, text);
      },
      [onText],
    ),
  );

  const measure = useCallback(() => {
    const found: Spot[] = [];
    document.querySelectorAll<HTMLElement>("input, textarea, [contenteditable='true']").forEach((el) => {
      if (el.closest("[data-no-voice]")) return;
      if (!isTypableField(el) || !visible(el)) return;
      const r = el.getBoundingClientRect();
      const size = Math.min(SIZE, Math.max(22, r.height - 8));
      found.push({
        el,
        top: r.top + (r.height - size) / 2,
        left: r.right - size - GAP,
        size,
      });
      // Keep typed text clear of the microphone.
      const pad = `${Math.round(size + GAP * 2)}px`;
      if (el.style.paddingRight !== pad) el.style.paddingRight = pad;
    });
    setSpots(found);
  }, []);

  // Wait until the page has settled so we never disturb the first paint.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 900);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    let frame = 0;
    // A short wait keeps us out of the way while a page is still drawing itself.
    const soon = () => {
      if (frame) window.clearTimeout(frame);
      frame = window.setTimeout(() => { frame = 0; measure(); }, 250);
    };
    soon();
    const mo = new MutationObserver(soon);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "hidden", "type", "disabled"] });
    window.addEventListener("scroll", soon, true);
    window.addEventListener("resize", soon);
    const tick = window.setInterval(soon, 700);
    return () => {
      mo.disconnect();
      window.removeEventListener("scroll", soon, true);
      window.removeEventListener("resize", soon);
      window.clearInterval(tick);
      if (frame) window.clearTimeout(frame);
    };
  }, [measure, ready]);

  useEffect(() => {
    if (!voice.message) return;
    const t = window.setTimeout(() => voice.clearMessage(), 4000);
    return () => window.clearTimeout(t);
  }, [voice.message, voice]);

  if (!voice.available) return null;

  const live = voice.state === "listening" || voice.state === "paused";
  const working = voice.state === "working";

  const tap = (el: HTMLElement) => {
    try { (navigator as unknown as { vibrate?: (n: number) => void }).vibrate?.(15); } catch { /* not supported */ }
    if (live && activeRef.current === el) {
      void voice.stop();
      return;
    }
    if (live) void voice.stop();
    activeRef.current = el;
    setActive(el);
    try { el.focus({ preventScroll: true }); } catch { /* ignore */ }
    void voice.start();
  };

  const hint = active
    ? spots.find((s) => s.el === active)
    : null;

  return (
    <div aria-hidden={false} className="pointer-events-none fixed inset-0 z-30">
      {spots.map((s, i) => {
        const on = live && active === s.el;
        return (
          <button
            key={i}
            type="button"
            aria-label={on ? "Stop and use my words" : "Speak into this box"}
            title={on ? "Tap to finish" : "Tap and speak"}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => tap(s.el)}
            style={{ top: s.top, left: s.left, width: s.size, height: s.size }}
            className={cn(
              "pointer-events-auto absolute flex items-center justify-center rounded-full border transition-colors",
              on
                ? "border-gold bg-gold/30 text-gold shadow-[0_0_16px_rgba(212,175,55,0.6)]"
                : "border-gold/40 bg-black/40 text-gold/80 hover:bg-gold/20 active:scale-95",
            )}
          >
            {on && <span aria-hidden className="absolute inset-0 rounded-full border border-gold/60 animate-ping" />}
            {on ? <Square className="h-3 w-3" /> : <Mic className={cn("h-3.5 w-3.5", working && active === s.el && "animate-pulse")} />}
          </button>
        );
      })}

      {(live || working || voice.message) && (
        <div
          role="status"
          aria-live="polite"
          style={hint ? { top: Math.max(8, hint.top - 44), left: 12 } : { bottom: 96, left: 12 }}
          className="pointer-events-none absolute max-w-[76vw] rounded-xl glass gold-border px-3 py-2 text-xs leading-relaxed text-pearl"
        >
          {voice.message ? (
            voice.message
          ) : working ? (
            <span className="text-gold">Writing your words…</span>
          ) : (
            <>
              <span className="text-gold">{voice.state === "paused" ? "⏸ Paused" : "🎤 Listening…"}</span>
              <span className="ml-1 text-pearl/70">tap the square when done</span>
              {voice.heard && <span className="mt-1 block text-pearl/90">{voice.heard}</span>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
