import { useEffect, useRef, useState } from "react";
import { MicButton } from "@/components/mic-button";
import { insertSpokenText, isTypableField } from "@/lib/voice-fields";

/**
 * One microphone for the whole app.
 * Tap a box you want to fill, then press and hold the microphone and speak.
 * The words go straight into that box and you can still edit them by hand.
 */
export function VoiceInputLayer() {
  const targetRef = useRef<HTMLElement | null>(null);
  const [hasTarget, setHasTarget] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const onFocus = (e: FocusEvent) => {
      const el = e.target as Element | null;
      if (isTypableField(el)) {
        targetRef.current = el as HTMLElement;
        setHasTarget(true);
        setNote(null);
      }
    };
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, []);

  const handleText = (text: string) => {
    const active = document.activeElement;
    const el = isTypableField(active) ? (active as HTMLElement) : targetRef.current;
    if (!el || !el.isConnected) {
      setNote("Tap the box you want to fill, then hold the microphone again.");
      return;
    }
    const ok = insertSpokenText(el, text);
    setNote(ok ? null : "Sorry, that didn't fit this box. Please try again or type it.");
    if (ok) window.setTimeout(() => setNote(null), 1200);
  };

  return (
    <div className="fixed bottom-28 right-4 z-40 flex flex-col items-end gap-2 sm:bottom-8">
      {note && (
        <div className="max-w-[70vw] rounded-xl glass gold-border px-3 py-2 text-xs text-pearl">
          {note}
        </div>
      )}
      {!hasTarget && (
        <div className="hidden max-w-[60vw] rounded-xl glass px-3 py-2 text-[11px] text-muted-foreground sm:block">
          Tap a box, then hold the microphone and speak.
        </div>
      )}
      <MicButton onText={handleText} size="lg" label="Press and hold to speak" />
    </div>
  );
}
