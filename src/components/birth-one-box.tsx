import { Mic, Loader2, Square, Check, CornerDownLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useVoice } from "@/hooks/use-voice";
import { searchPlaces } from "@/lib/geo.functions";
import { offsetForLocalTime } from "@/lib/timezone";
import { hasDetails, parseSpokenDetails } from "@/lib/voice-parse";
import { cn } from "@/lib/utils";

export type BirthOneBoxValue = {
  name?: string;
  date?: string; // yyyy-mm-dd
  time?: string; // HH:mm
  place?: string;
  lat?: string;
  lon?: string;
  tz?: string;
};

const EXAMPLE = "My name is Ria. I was born on 18 August 1995 at 4:35 in the evening in Delhi.";

/**
 * One box for the whole birth form.
 * Speak it or type it in one line: the app pulls out the name, the birth date,
 * the birth time and the place (with its map spot and clock) on its own.
 * While you talk, the words show up live inside the same box.
 */
export function BirthOneBox({
  value,
  onChange,
}: {
  value: BirthOneBoxValue;
  onChange: (patch: BirthOneBoxValue) => void;
}) {
  const search = useServerFn(searchPlaces);
  const [text, setText] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const apply = useCallback(
    (sentence: string) => {
      const line = sentence.trim();
      if (!line) {
        setNote("Say or type your birth details first.");
        return;
      }
      const d = parseSpokenDetails(line);
      if (!hasDetails(d)) {
        setNote("I could not find any details in that. Try it like the line above.");
        return;
      }
      const patch: BirthOneBoxValue = {};
      if (d.name) patch.name = d.name;
      if (d.date) patch.date = d.date;
      if (d.time) patch.time = d.time;
      onChange(patch);

      // Ask only for what is still missing, and never wipe what we already have.
      const missing: string[] = [];
      if (!(d.name || value.name)) missing.push("your name");
      if (!(d.date || value.date)) missing.push("your birth date");
      if (!(d.time || value.time)) missing.push("your birth time");
      if (!(d.place || value.place)) missing.push("your birth place");
      setNote(
        missing.length === 0
          ? "Got it. Check the details below."
          : `Got it. Now please also say ${missing.join(", ")}.`,
      );

      if (d.place) {
        setBusy(true);
        void (async () => {
          try {
            const res = await search({ data: { query: d.place!, country: "" } });
            const best = res.places[0];
            if (best) {
              const [y, mo, dd] = (d.date ?? value.date ?? "2000-01-01").split("-").map(Number);
              const [hh, mi] = (d.time ?? value.time ?? "12:00").split(":").map(Number);
              const off = offsetForLocalTime(
                best.timezone, y || 2000, mo || 1, dd || 1, hh || 12, mi || 0,
              );
              onChange({
                place: [best.city, best.country].filter(Boolean).join(", "),
                lat: best.latitude.toFixed(4),
                lon: best.longitude.toFixed(4),
                tz: String(off),
              });
            } else {
              setNote(`I could not find the place "${d.place}". Try the city name on its own.`);
            }
          } catch {
            setNote("I could not look up that place just now. Please try again.");
          } finally {
            setBusy(false);
          }
        })();
      }
    },
    [onChange, search, value.name, value.date, value.time, value.place],
  );

  const handleVoice = useCallback(
    (spoken: string) => {
      setText((prev) => (prev.trim() ? `${prev.trim()} ${spoken}` : spoken));
      apply(spoken);
    },
    [apply],
  );

  const voice = useVoice(handleVoice);
  const listening = voice.state === "listening";
  const working = voice.state === "working";

  // Live words go straight into the same box while the mic is on.
  useEffect(() => {
    if (listening && voice.heard) setText(voice.heard);
  }, [listening, voice.heard]);

  const chips = [
    value.name ? { label: "Name", value: value.name } : null,
    value.date ? { label: "Birth date", value: prettyDate(value.date) } : null,
    value.time ? { label: "Birth time", value: value.time } : null,
    value.place ? { label: "Place", value: value.place } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="space-y-3" data-no-voice>
      <div>
        <div className="text-xs uppercase tracking-widest text-gold/80">
          Your birth details — one box
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Tap the mic and say one word at a time.
        </p>
      </div>

      <div
        className={cn(
          "flex items-end gap-2 rounded-2xl border bg-black/30 p-2 transition",
          listening ? "border-red-400/60" : "border-white/10 focus-within:border-gold/50",
        )}
      >
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              apply(text);
            }
          }}
          aria-label="Birth details in one box"
          placeholder={listening ? "Say one word…" : "Tap the mic and say one word at a time"}
          className="min-h-[4.5rem] w-full resize-none bg-transparent px-2 py-1 text-base leading-relaxed text-pearl outline-none placeholder:text-muted-foreground"
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
            {working ? <Loader2 className="h-5 w-5 animate-spin" />
              : listening ? <Square className="h-5 w-5" />
              : <Mic className="h-6 w-6" />}
          </button>
        )}
      </div>

      {listening && (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/5 p-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-red-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" /> Listening
          </div>
          <p className="mt-1 text-base leading-relaxed text-pearl">
            {voice.heard || "Say one word…"}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => apply(text)}
          className="inline-flex items-center gap-2 rounded-full bg-gold/15 px-4 py-2 text-sm text-gold gold-border hover:bg-gold/25"
        >
          <CornerDownLeft className="h-4 w-4" /> Use these details
        </button>
        {text && (
          <button
            type="button"
            onClick={() => { setText(""); setNote(null); voice.clear(); }}
            className="rounded-full bg-white/5 px-4 py-2 text-sm text-pearl/90 hover:bg-white/10"
          >
            Clear
          </button>
        )}
        {busy && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Finding the place…
          </span>
        )}
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <span
              key={c.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200"
            >
              <Check className="h-3.5 w-3.5" /> {c.label}: {c.value}
            </span>
          ))}
        </div>
      )}

      {(note || voice.message) && (
        <p className="text-sm text-muted-foreground">{note ?? voice.message}</p>
      )}
    </div>
  );
}

function prettyDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  return `${d} ${months[m - 1]} ${y}`;
}
