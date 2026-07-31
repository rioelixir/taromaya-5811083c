import { cleanSpeech, parseSpokenDate, parseSpokenTime } from "@/lib/speech";

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLElement;

const TEXT_TYPES = new Set([
  "text", "search", "email", "url", "tel", "number", "password", "", "date", "time", "month",
]);

/** Is this element something a person can type into? */
export function isTypableField(el: Element | null): el is Field {
  if (!el) return false;
  const node = el as HTMLElement;
  if (node.isContentEditable) return true;
  if (node instanceof HTMLTextAreaElement) return !node.disabled && !node.readOnly;
  if (node instanceof HTMLInputElement) {
    return !node.disabled && !node.readOnly && TEXT_TYPES.has(node.type);
  }
  return false;
}

function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * Put spoken words into a field the way a person typing would expect:
 * existing text is kept, new words are added at the end.
 */
export function insertSpokenText(el: Field, spoken: string): boolean {
  const text = spoken.trim();
  if (!text) return false;

  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    if (el.type === "date" || el.type === "month") {
      const iso = parseSpokenDate(text);
      if (!iso) return false;
      setNativeValue(el, el.type === "month" ? iso.slice(0, 7) : iso);
      return true;
    }
    if (el.type === "time") {
      const hhmm = parseSpokenTime(text);
      if (!hhmm) return false;
      setNativeValue(el, hhmm);
      return true;
    }
    if (el.type === "number") {
      const num = cleanSpeech(text, { punctuate: false }).match(/-?\d+(\.\d+)?/)?.[0];
      if (!num) return false;
      setNativeValue(el, num);
      return true;
    }

    const existing = el.value;
    const joiner = !existing ? "" : /[\s(]$/.test(existing) ? "" : " ";
    const next = existing + joiner + text;
    setNativeValue(el, next);
    try {
      el.focus();
      el.setSelectionRange(next.length, next.length);
    } catch { /* selection not supported on this field */ }
    return true;
  }

  // Rich / contenteditable areas.
  el.focus();
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
    document.execCommand("insertText", false, (el.textContent ? " " : "") + text);
  } else {
    el.textContent = (el.textContent ? el.textContent + " " : "") + text;
  }
  el.dispatchEvent(new InputEvent("input", { bubbles: true }));
  return true;
}
