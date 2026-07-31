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
        setHelp(true);
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
      say('Tap a box first to fill it, or say a page name like "open kundli".', 4000);
      return;
    }
    const ok = insertSpokenText(el!, text);
    // Your words are always added to what is already there — nothing is erased.
    say(ok ? "Added your words ✓" : "That didn't fit this box. Say it again, or type it.", 2000);
  };

  return (
    <div className="fixed bottom-28 right-4 z-40 flex flex-col items-end gap-2 sm:bottom-8">
      {help && (
        <div className="max-w-[78vw] rounded-2xl glass gold-border p-3 text-[11px] text-pearl sm:max-w-xs">
          <div className="mb-1 text-xs text-gold">How to use the microphone</div>
          <ol className="list-decimal space-y-1 pl-4 text-pearl/90">
            <li>To go somewhere: say “open kundli”, “open tarot”, “go back”.</li>
            <li>To move the page: say “scroll down”, “scroll up”, “go to top”.</li>
            <li>To press a button: say “press calculate”.</li>
            <li>To fill a box: tap the box, then speak. Your words are added — nothing is erased.</li>
          </ol>
          <button
            type="button"
            onClick={() => setHelp(false)}
            className="mt-2 rounded-full border border-gold/40 px-3 py-1 text-[11px] text-gold"
          >
            Got it
          </button>
        </div>
      )}
      {note && (
        <div className="max-w-[70vw] rounded-xl glass gold-border px-3 py-2 text-xs text-pearl">
          {note}
        </div>
      )}
      {!help && (
        <button
          type="button"
          onClick={() => setHelp(true)}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-pearl/70 hover:bg-white/10"
        >
          {hasTarget ? "Speak to fill this box · help" : "How do I speak?"}
        </button>
      )}
      <MicButton onText={handleText} size="lg" label="Tap to speak, or hold and speak" />
    </div>
  );
}

