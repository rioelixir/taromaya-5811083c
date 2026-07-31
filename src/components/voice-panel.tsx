import { Mic, Loader2, Check, RotateCcw } from "lucide-react";
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

const EXAMPLE = "My name is Ria. I was born on 18 August 1995 at 4:35 in the evening in Delhi.";

type Got = { label: string; value: string };

/**
 * The talking helper at the top of every module.
 * One tap, say everything in one breath, and it stops on its own when you finish.
 */
export function VoicePanel() {
  const [got, setGot] = useState<Got[]>([]);
  const [note, setNote] = useState<string | null>(null);

  const handle = useCallback((text: string) => {
    const d = parseSpokenDetails(text);
    if (!hasDetails(d)) {
      setNote("I did not catch that. Tap the big circle and say it like the line above.");
      setGot([]);
      return;
    }
    announceDetails(d);
    const done: Got[] = [];
    if (d.name && fillName(d.name)) done.push({ label: "Name", value: d.name });
    if (d.date) done.push({ label: "Birth date", value: d.date });
    if (d.time) { fillTime(d.time); done.push({ label: "Birth time", value: d.time }); }
    if (d.place) done.push({ label: "Place", value: d.place });
    setGot(done);
    setNote(done.length ? "Filled in for you. Check the boxes below." : "I heard you, but this page has no box for that.");
  }, []);

  const voice = useVoice(handle);
  if (!voice.available) return null;

  const listening = voice.state === "listening";
  const working = voice.state === "working";
  const busy = listening || working;

  const title = listening
    ? "I am listening…"
    : working
      ? "Writing it down…"
      : "Talk instead of typing";
  const help = listening
    ? "Say it all in one go. I stop by myself when you go quiet."
    : working
      ? "Give me a second."
      : "Tap the big circle once, then just talk.";

  return (
    <div className="mb-5 rounded-3xl glass gold-border p-5 text-center sm:p-6" data-no-voice>
      <button
        type="button"
        onClick={() => (listening ? voice.stop() : voice.start())}
        disabled={working}
        aria-label={listening ? "Stop listening" : "Tap and talk"}
        className={cn(
          "relative mx-auto flex h-24 w-24 items-center justify-center rounded-full transition",
          listening
            ? "bg-red-500 text-white shadow-[0_0_0_10px_rgba(239,68,68,0.18)]"
            : "bg-gold/20 text-gold gold-border hover:bg-gold/30 active:scale-95",
        )}
      >
        {working ? (
          <Loader2 className="h-9 w-9 animate-spin" />
        ) : (
          <Mic className={cn("h-10 w-10", listening && "animate-pulse")} />
        )}
        {listening && <span className="absolute inset-0 animate-ping rounded-full bg-red-500/40" />}
      </button>

      <div className="mt-3 font-display text-xl text-pearl">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{help}</p>

      {!busy && (
        <p className="mx-auto mt-3 max-w-md rounded-2xl bg-white/5 px-3 py-2 text-sm leading-relaxed text-pearl/85">
          Say something like:<br />
          <span className="text-gold">“{EXAMPLE}”</span>
        </p>
      )}

      {voice.heard && (
        <div className="mt-3 rounded-2xl bg-white/5 px-3 py-2 text-left text-sm text-pearl/90">
          {voice.heard}
        </div>
      )}

      {got.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {got.map((g) => (
            <span
              key={g.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200"
            >
              <Check className="h-3.5 w-3.5" /> {g.label}: {g.value}
            </span>
          ))}
        </div>
      )}

      {(note || voice.message) && (
        <p className="mt-3 text-sm text-muted-foreground">{note ?? voice.message}</p>
      )}

      {!busy && (voice.heard || got.length > 0 || note || voice.message) && (
        <button
          type="button"
          onClick={() => { setGot([]); setNote(null); voice.clearMessage(); void voice.start(); }}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-pearl/90 hover:bg-white/10"
        >
          <RotateCcw className="h-4 w-4" /> Say it again
        </button>
      )}
    </div>
  );
}
