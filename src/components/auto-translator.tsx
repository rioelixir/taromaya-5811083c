import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { RTL_LANGS, reviewedTerms, useLang, type Lang } from "@/lib/i18n";

const CACHE_KEY = (lang: Lang) => `taromaya.translations.v3.${lang}`;
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA", "SVG", "PATH", "CANVAS"]);
const ATTR_ORIG = "data-i18n-orig";
const MAX_LEN = 2000;
const ATTRS = ["placeholder", "aria-label", "title", "alt", "label", "value"] as const;


/** What we last wrote into a text node, so re-renders get re-translated. */
const doneText = new WeakMap<Text, { src: string; out: string }>();
const doneAttr = new WeakMap<Element, Record<string, { src: string; out: string }>>();

/** Every node/attribute we touched, so switching language can restore English. */
const touchedText = new Set<Text>();
const touchedAttr = new Set<Element>();

const memCache: Partial<Record<Lang, Record<string, string>>> = {};

function loadCache(lang: Lang): Record<string, string> {
  if (memCache[lang]) return memCache[lang]!;
  let stored: Record<string, string> = {};
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(CACHE_KEY(lang));
      stored = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      stored = {};
    }
  }
  // Hand-reviewed wording always wins over machine output.
  memCache[lang] = { ...stored, ...reviewedTerms(lang) };
  return memCache[lang]!;
}


let saveTimer = 0;
function saveCache(lang: Lang, cache: Record<string, string>) {
  memCache[lang] = cache;
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      window.localStorage.setItem(CACHE_KEY(lang), JSON.stringify(cache));
    } catch {
      /* ignore quota */
    }
  }, 400);
}

function shouldTranslate(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (t.length > MAX_LEN) return false;
  if (!/[a-zA-Z]/.test(t)) return false; // needs at least one latin letter
  if (/^\d+([.,:/-]\d+)*$/.test(t)) return false; // pure numbers
  if (!/[a-zA-Z]{2}/.test(t)) return false; // single stray letters / symbols
  return true;
}

function isInSkipTree(node: Node | null): boolean {
  let n: Node | null = node;
  while (n) {
    if (n.nodeType === 1) {
      const el = n as Element;
      if (SKIP_TAGS.has(el.tagName)) return true;
      if (el.hasAttribute("data-no-translate")) return true;
      if (el.getAttribute("contenteditable") === "true") return true;
    }
    n = n.parentNode;
  }
  return false;
}

/** A text node still needs work unless we already wrote this exact output for this exact source. */
function textNeedsWork(node: Text): boolean {
  const raw = node.nodeValue ?? "";
  const prev = doneText.get(node);
  if (prev && prev.out === raw) return false; // untouched since we translated it
  return shouldTranslate(raw);
}

function collectTextNodes(root: Node, out: Text[]) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (isInSkipTree(node.parentNode)) return NodeFilter.FILTER_REJECT;
      if (!textNeedsWork(node as Text)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n = walker.nextNode();
  while (n) {
    out.push(n as Text);
    n = walker.nextNode();
  }
}

function collectAttrs(root: Element, out: Array<{ el: Element; attr: string }>) {
  const nodes = root.querySelectorAll(
    "[placeholder], [aria-label], [title], [alt], option[label], optgroup[label], input[type=submit], input[type=button], input[type=reset]",
  );
  const all: Element[] = [root, ...Array.from(nodes)];
  for (const el of all) {
    if (isInSkipTree(el)) continue;
    const prev = doneAttr.get(el) ?? {};
    for (const a of ATTRS) {
      // `value` is only a visible label on button-like inputs; never touch typed values.
      if (a === "value") {
        const tag = el.tagName;
        const type = (el.getAttribute("type") ?? "").toLowerCase();
        if (tag !== "INPUT" || !["submit", "button", "reset"].includes(type)) continue;
      }
      if (a === "label" && el.tagName !== "OPTION" && el.tagName !== "OPTGROUP") continue;
      const v = el.getAttribute(a);
      if (!v) continue;
      if (prev[a] && prev[a].out === v) continue; // already translated, unchanged
      if (shouldTranslate(v)) out.push({ el, attr: a });
    }
  }
}

/** Put every touched node/attribute back to its English source text. */
function restoreEnglish() {
  touchedText.forEach((n) => {
    const prev = doneText.get(n);
    if (prev && n.nodeValue === prev.out) n.nodeValue = prev.src;
    doneText.delete(n);
  });
  touchedText.clear();
  touchedAttr.forEach((el) => {
    let store: Record<string, string> = {};
    try {
      store = JSON.parse(el.getAttribute(ATTR_ORIG) || "{}");
    } catch {
      /* noop */
    }
    Object.entries(store).forEach(([attr, orig]) => el.setAttribute(attr, orig));
    el.removeAttribute(ATTR_ORIG);
    doneAttr.delete(el);
  });
  touchedAttr.clear();
}

async function fetchTranslations(lang: Lang, strings: string[]): Promise<Record<string, string>> {
  if (strings.length === 0) return {};
  const map: Record<string, string> = {};
  // Long paragraphs (AI readings) go in smaller batches so nothing is dropped.
  const short = strings.filter((s) => s.length <= 200);
  const long = strings.filter((s) => s.length > 200);
  const batches: string[][] = [];
  for (let i = 0; i < short.length; i += 40) batches.push(short.slice(i, i + 40));
  for (let i = 0; i < long.length; i += 8) batches.push(long.slice(i, i + 8));

  const send = async (batch: string[], attempt = 0): Promise<void> => {
    try {
      const res = await fetch("/api/public/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, strings: batch }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { translations } = (await res.json()) as { translations: string[] };
      if (!Array.isArray(translations)) return;
      translations.forEach((t, idx) => {
        const src = batch[idx];
        if (src && t && typeof t === "string") map[src] = t;
      });
    } catch {
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
        await send(batch, attempt + 1);
      }
    }
  };

  // Fire every batch at once so the page finishes translating in one round trip window.
  await Promise.all(batches.map((b) => send(b)));
  return map;
}


function applyText(nodes: Text[], cache: Record<string, string>) {
  nodes.forEach((n) => {
    const raw = n.nodeValue ?? "";
    const key = raw.trim();
    const translated = cache[key];
    if (!translated || translated === key) return;
    const leading = raw.match(/^\s*/)?.[0] ?? "";
    const trailing = raw.match(/\s*$/)?.[0] ?? "";
    const out = leading + translated + trailing;
    if (out === raw) return;
    n.nodeValue = out;
    doneText.set(n, { src: raw, out });
    touchedText.add(n);
  });
}

function applyAttrs(targets: Array<{ el: Element; attr: string }>, cache: Record<string, string>) {
  targets.forEach(({ el, attr }) => {
    const v = el.getAttribute(attr) ?? "";
    const translated = cache[v.trim()];
    if (!translated || translated === v.trim()) return;
    let store: Record<string, string> = {};
    try {
      store = JSON.parse(el.getAttribute(ATTR_ORIG) || "{}");
    } catch {
      /* noop */
    }
    if (store[attr] == null) store[attr] = v;
    el.setAttribute(ATTR_ORIG, JSON.stringify(store));
    el.setAttribute(attr, translated);
    const prev = doneAttr.get(el) ?? {};
    prev[attr] = { src: v, out: translated };
    doneAttr.set(el, prev);
    touchedAttr.add(el);
  });
}

let running = false;
let queued = false;

async function translatePage(lang: Lang) {
  if (typeof window === "undefined") return;
  if (lang === "en") return;
  if (running) {
    queued = true;
    return;
  }
  running = true;
  try {
    const cache = loadCache(lang);
    const root = document.body;

    const textNodes: Text[] = [];
    collectTextNodes(root, textNodes);
    const attrTargets: Array<{ el: Element; attr: string }> = [];
    collectAttrs(root, attrTargets);
    if (textNodes.length === 0 && attrTargets.length === 0) return;

    // 1) Instant pass — everything already cached shows up with zero delay.
    applyText(textNodes, cache);
    applyAttrs(attrTargets, cache);

    const uniq = new Set<string>();
    textNodes.forEach((n) => {
      const raw = (n.nodeValue ?? "").trim();
      if (raw && cache[raw] == null) uniq.add(raw);
    });
    attrTargets.forEach(({ el, attr }) => {
      const v = (el.getAttribute(attr) ?? "").trim();
      if (v && cache[v] == null) uniq.add(v);
    });
    if (uniq.size === 0) return;

    // 2) Fetch only what is missing, then apply the rest.
    const fetched = await fetchTranslations(lang, Array.from(uniq));
    Object.assign(cache, fetched);
    saveCache(lang, cache);

    const pendingText = textNodes.filter((n) => fetched[(n.nodeValue ?? "").trim()]);
    const pendingAttrs = attrTargets.filter(({ el, attr }) => fetched[(el.getAttribute(attr) ?? "").trim()]);
    applyText(pendingText, cache);
    applyAttrs(pendingAttrs, cache);
  } finally {
    running = false;
    if (queued) {
      queued = false;
      setTimeout(() => translatePage(lang), 60);
    }
  }
}

export function AutoTranslator() {
  const lang = useLang();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.lang = lang === "hr" ? "en-IN" : lang;
    document.documentElement.dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";

    // Switching language: put English back first, then translate afresh.
    restoreEnglish();
    if (lang === "en") return;

    let raf = 0;
    const schedule = (delay = 0) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (delay) setTimeout(() => translatePage(lang), delay);
        else translatePage(lang);
      });
    };

    schedule();
    const timers = [150, 600, 1600, 3500].map((d) => setTimeout(() => schedule(), d));
    const unsub = router.subscribe("onResolved", () => {
      schedule();
      setTimeout(() => schedule(), 500);
    });

    // Watch DOM changes (new panels, re-renders, streamed AI text).
    const observer = new MutationObserver(() => schedule(60));
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      unsub();
      observer.disconnect();
    };
  }, [lang, router]);

  return null;
}
