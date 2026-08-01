import { Mic, Loader2, Check, Square, CornerDownLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
 * One box for all birth details.
 * Speak it or type it in a single line — the app pulls out the name, the birth
 * date, the birth time and the place, and fills the boxes below on its own.
 */
export function VoicePanel() {
  const [text, setText] = useState("");
  const [got, setGot] = useState<Got[]>([]);
  const [note, setNote] = useState<string | null>(null);

  const apply = useCallback((sentence: string) => {
    const line = sentence.trim();
    if (!line) {
      setNote("Say or type your birth details first.");
      return;
    }
    const d = parseSpokenDetails(line);
    if (!hasDetails(d)) {
      setNote("I could not find any details in that. Try it like the line above.");
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

  const handleVoice = useCallback((spoken: string) => {
    setText((prev) => (prev.trim() ? `${prev.trim()} ${spoken}` : spoken));
    apply(spoken);
  }, [apply]);

  const voice = useVoice(handleVoice);

  const listening = voice.state === "listening";
  const working = voice.state === "working";

  // While listening, show the words in the same box so there is only ever one.
  useEffect(() => {
    if (listening && voice.heard) setText(voice.heard);
  }, [listening, voice.heard]);

  return (
    <div className="mb-5 rounded-3xl glass gold-border p-4 sm:p-5" data-no-voice>
      <div className="text-xs uppercase tracking-widest text-gold/80">
        Your birth details — one box
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Say it or type it all in one line. Example:{" "}
        <span className="text-gold">“{EXAMPLE}”</span>
      </p>

      <div
        className={cn(
          "mt-3 flex items-end gap-2 rounded-2xl border bg-black/30 p-2 transition",
          listening ? "border-red-400/60" : "border-white/10 focus-within:border-gold/50",
        )}
      >
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              apply(text);
            }
          }}
          aria-label="Birth details in one box"
          placeholder={listening ? "Listening… keep talking" : "Name, birth date, birth time and place"}
          className="min-h-[3.5rem] w-full resize-none bg-transparent px-2 py-1 text-base leading-relaxed text-pearl outline-none placeholder:text-muted-foreground"
        />
        {voice.available && (
          <button
            type="button"
            onClick={() => (listening ? voice.stop() : voice.start())}
            disabled={working}
            aria-label={listening ? "Stop listening" : "Speak your details"}
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition",
              listening
                ? "bg-red-500 text-white shadow-[0_0_0_6px_rgba(239,68,68,0.18)]"
                : "bg-gold/20 text-gold gold-border hover:bg-gold/30 active:scale-95",
            )}
          >
            {working ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : listening ? (
              <Square className="h-5 w-5" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => apply(text)}
          className="inline-flex items-center gap-2 rounded-full bg-gold/15 px-4 py-2 text-sm text-gold gold-border hover:bg-gold/25"
        >
          <CornerDownLeft className="h-4 w-4" /> Fill in the details
        </button>
        {(text || got.length > 0 || note) && (
          <button
            type="button"
            onClick={() => { setText(""); setGot([]); setNote(null); voice.clear(); }}
            className="rounded-full bg-white/5 px-4 py-2 text-sm text-pearl/90 hover:bg-white/10"
          >
            Clear
          </button>
        )}
        <span className="text-xs text-muted-foreground">
          {listening
            ? "I am listening. Tap the red button when you finish."
            : working
              ? "Writing it down…"
              : "Tap the microphone to talk instead of typing."}
        </span>
      </div>

      {got.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
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
    </div>
  );
}
