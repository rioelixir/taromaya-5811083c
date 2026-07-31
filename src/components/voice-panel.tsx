import { Mic, Square, Loader2, Check } from "lucide-react";
import { useCallback, useState } from "react";
import { useVoice } from "@/hooks/use-voice";
import { insertSpokenText } from "@/lib/voice-fields";
import { announceDetails, hasDetails, parseSpokenDetails } from "@/lib/voice-parse";
import { cn } from "@/lib/utils";

/** Put a name into the first name box on the page. */
function fillName(name: string): boolean {
  const boxes = Array.from(
    document.querySelectorAll<HTMLInputElement>('input[type="text"], input:not([type])'),
  );
  const box = boxes.find((b) => {
    const hay = `${b.name} ${b.id} ${b.placeholder} ${b.getAttribute("aria-label") ?? ""}`.toLowerCase();
    return /name/.test(hay) && !/place|city|country|search/.test(hay);
  });
  if (!box) return false;
  box.focus();
  return insertSpokenText(box, name);
}

function fillTime(time: string): boolean {
  const box = document.querySelector<HTMLInputElement>('input[type="time"]');
  if (!box) return false;
  box.focus();
  return insertSpokenText(box, time);
}

/**
 * The talking helper that sits at the top of every module.
 * Tap it once, say your details in one breath, and the boxes below fill up.
 */
export function VoicePanel() {
  const [filled, setFilled] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);

  const handle = useCallback((text: string) => {
    const d = parseSpokenDetails(text);
    if (!hasDetails(d)) {
      setNote("I did not catch any details. Try: my name is Ria, born 18 August 1995 at 4:35 in the evening in Delhi.");
      setFilled([]);
      return;
    }
    announceDetails(d);
    const done: string[] = [];
    if (d.name && fillName(d.name)) done.push(d.name);
    if (d.date) done.push(d.date);
    if (d.time) { fillTime(d.time); done.push(d.time); }
    if (d.place) done.push(d.place);
    setFilled(done);
    setNote(done.length ? null : "I heard you, but this page has no box for that.");
  }, []);

  const voice = useVoice(handle);
  if (!voice.available) return null;

  const listening = voice.state === "listening";
  const working = voice.state === "working";

  return (
    <div className="mb-5 rounded-3xl glass gold-border p-4 sm:p-5" data-no-voice>
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => (listening ? voice.stop() : voice.start())}
          aria-label={listening ? "Stop listening" : "Tap and speak your details"}
          className={cn(
            "relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition",
            listening
              ? "bg-red-500 text-white shadow-[0_0_0_8px_rgba(239,68,68,0.18)]"
              : "bg-gold/20 text-gold hover:bg-gold/30 gold-border",
          )}
        >
          {working ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : listening ? (
            <Square className="h-5 w-5" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
          {listening && (
            <span className="absolute inset-0 animate-ping rounded-full bg-red-500/40" />
          )}
        </button>
        <div className="min-w-0">
          <div className="font-display text-lg text-pearl">
            {listening ? "Listening… speak now" : working ? "One moment…" : "Speak instead of typing"}
          </div>
          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
            {listening
              ? "Say your name, birth date, birth time and city. Tap again when you finish."
              : "Tap the microphone and say it all in one go. The boxes below fill by themselves."}
          </p>
        </div>
      </div>

      {(voice.heard || filled.length > 0 || note || voice.message) && (
        <div className="mt-3 space-y-2">
          {voice.heard && (
            <div className="rounded-xl bg-white/5 px-3 py-2 text-xs sm:text-sm text-pearl/90">
              {voice.heard}
            </div>
          )}
          {filled.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filled.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-200"
                >
                  <Check className="h-3 w-3" /> {f}
                </span>
              ))}
            </div>
          )}
          {(note || voice.message) && (
            <p className="text-xs text-muted-foreground">{note ?? voice.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
