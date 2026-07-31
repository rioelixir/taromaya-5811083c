import { useEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { VoiceMic } from "@/components/voice-mic";
import { insertSpokenText, isTypableField } from "@/lib/voice-fields";
import { findClickable, matchVoiceCommand } from "@/lib/voice-commands";
import { announceDetails, hasDetails, parseSpokenDetails } from "@/lib/voice-parse";

const COMMAND_STARTERS =
  /^\s*(open|go to|goto|go|show|show me|take me to|take me|visit|launch|switch to|switch|move to|jump to|bring up|press|tap|click|hit|choose|select|scroll|go back|back|search|find|menu)\b/i;

/**
 * The one voice helper for the whole app.
 * Tap the microphone and just talk: it fills the boxes on the page,
 * moves between pages, or presses buttons for you.
 * It never appears on the Tarot board.
 */
export function VoiceAssistant() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const targetRef = useRef<HTMLElement | null>(null);
  const [hasTarget, setHasTarget] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const say = (msg: string | null, hold = 2400) => {
    setNote(msg);
    if (timer.current) window.clearTimeout(timer.current);
    if (msg) timer.current = window.setTimeout(() => setNote(null), hold);
  };

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

  const runCommand = (text: string): boolean => {
    const cmd = matchVoiceCommand(text);
    if (!cmd) return false;
    switch (cmd.kind) {
      case "navigate":
        say(`Opening ${cmd.label}`);
        void navigate({ to: cmd.to });
        return true;
      case "back":
        say("Going back");
        window.history.back();
        return true;
      case "menu": {
        const btn = findClickable("menu") ?? findClickable("open menu");
        if (btn) { btn.click(); say("Menu"); return true; }
        say("I could not find the menu here.");
        return true;
      }
      case "scroll": {
        const h = window.innerHeight * 0.8;
        if (cmd.dir === "down") window.scrollBy({ top: h, behavior: "smooth" });
        else if (cmd.dir === "up") window.scrollBy({ top: -h, behavior: "smooth" });
        else if (cmd.dir === "top") window.scrollTo({ top: 0, behavior: "smooth" });
        else window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
        return true;
      }
      case "click": {
        const el = findClickable(cmd.label);
        if (el) {
          el.scrollIntoView({ block: "center", behavior: "smooth" });
          el.click();
          say(`Done — I tapped ${cmd.label} 👍`);
        } else {
          say(`I can't see "${cmd.label}" on this page. Try another word.`, 3500);
        }
        return true;
      }
      case "search": {
        const box = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="Search" i]',
        );
        if (box) {
          box.focus();
          insertSpokenText(box, cmd.text);
          say(`Looking for ${cmd.text}…`);
        } else {
          say("There is nothing to search on this page.");
        }
        return true;
      }
      case "help":
        say('Say a page name like "kundli" or "numerology", or just tell me your birth details.', 4000);
        return true;
      default:
        return false;
    }
  };

  /** Fill a name / person box if the page has one. */
  const fillName = (name: string): boolean => {
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
  };

  const fillTime = (time: string): boolean => {
    const box = document.querySelector<HTMLInputElement>('input[type="time"]');
    if (!box) return false;
    box.focus();
    return insertSpokenText(box, time);
  };

  const handleText = (text: string) => {
    const active = document.activeElement;
    const el = isTypableField(active) ? (active as HTMLElement) : targetRef.current;
    const fieldReady = !!el && el.isConnected && isTypableField(el);

    // A page or button name always wins.
    if (!fieldReady || COMMAND_STARTERS.test(text)) {
      if (runCommand(text)) return;
    }

    // Birth details spoken in one breath: fill everything we understood.
    const details = parseSpokenDetails(text);
    if (hasDetails(details) && (details.date || details.time || details.place)) {
      announceDetails(details); // date pickers and place boxes listen for this
      const done: string[] = [];
      if (details.name && fillName(details.name)) done.push(`name ${details.name}`);
      if (details.date) done.push("date");
      if (details.time) { fillTime(details.time); done.push("time"); }
      if (details.place) done.push(details.place);
      say(
        done.length
          ? `Filled in ${done.join(", ")} ✓ Check it, then tap the button.`
          : "I heard you, but I could not find the right boxes here.",
        4200,
      );
      return;
    }

    if (!fieldReady) {
      say('Tap a box and speak, or say a page name like "kundli".', 4000);
      return;
    }
    const ok = insertSpokenText(el!, text);
    say(ok ? "Added your words ✓" : "That didn't fit this box. Try again, or type it.", 2200);
  };

  // The Tarot board stays completely free of the microphone.
  if (path.startsWith("/tarot")) return null;

  return (
    <div className="fixed bottom-28 right-4 z-40 flex flex-col items-end gap-2 sm:bottom-8">
      {note && (
        <div className="max-w-[76vw] rounded-xl glass gold-border px-3 py-2 text-xs leading-relaxed text-pearl">
          {note}
        </div>
      )}
      {hasTarget && (
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-pearl/70">
          Speak to fill this box
        </div>
      )}
      <VoiceMic onText={handleText} size="lg" label="Tap and speak" />
    </div>
  );
}
