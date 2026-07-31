import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MicButton } from "@/components/mic-button";
import { insertSpokenText, isTypableField } from "@/lib/voice-fields";
import { findClickable, matchVoiceCommand } from "@/lib/voice-commands";

const COMMAND_STARTERS =
  /^\s*(open|go to|goto|show|take me to|visit|launch|press|tap|click|hit|choose|select|scroll|go back|back|search|find|menu|help me|what can i say)\b/i;

/**
 * One microphone for the whole app.
 * Speak a page name to move around ("open kundli", "go back", "scroll down"),
 * or tap a box first and speak to fill it in.
 */
export function VoiceInputLayer() {
  const navigate = useNavigate();
  const targetRef = useRef<HTMLElement | null>(null);
  const [hasTarget, setHasTarget] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const noteTimer = useRef<number | null>(null);

  const say = (msg: string | null, hold = 2200) => {
    setNote(msg);
    if (noteTimer.current) window.clearTimeout(noteTimer.current);
    if (msg) noteTimer.current = window.setTimeout(() => setNote(null), hold);
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
          say(`Tapped ${cmd.label}`);
        } else {
          say(`I could not find "${cmd.label}" on this page.`);
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
          say(`Searching ${cmd.text}`);
        } else {
          say("There is nothing to search on this page.");
        }
        return true;
      }
      case "help":
        say(
          'Say things like "open kundli", "open tarot", "go back", "scroll down", or "press calculate". To fill a box, tap it first and then speak.',
          8000,
        );
        return true;
    }
  };

  const handleText = (text: string) => {
    const active = document.activeElement;
    const el = isTypableField(active) ? (active as HTMLElement) : targetRef.current;
    const fieldReady = !!el && el.isConnected && isTypableField(el);

    // A clear command always wins, even while a box is selected.
    if (!fieldReady || COMMAND_STARTERS.test(text)) {
      if (runCommand(text)) return;
    }

    if (!fieldReady) {
      say('Say a page name like "open kundli", or tap a box first to fill it in.', 4000);
      return;
    }
    const ok = insertSpokenText(el!, text);
    say(ok ? null : "Sorry, that didn't fit this box. Please try again or type it.", 2500);
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
          Speak a page name, or tap a box and speak to fill it.
        </div>
      )}
      <MicButton onText={handleText} size="lg" label="Tap to speak, or hold and speak" />
    </div>
  );
}
