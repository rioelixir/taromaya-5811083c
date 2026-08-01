import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { RTL_LANGS, useLang, type Lang } from "@/lib/i18n";

const CACHE_KEY = (lang: Lang) => `taromaya.translations.${lang}`;
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA", "SVG", "PATH", "CANVAS"]);
const ATTR_ORIG = "data-i18n-orig";
const MAX_LEN = 900;
const ATTRS = ["placeholder", "aria-label", "title", "alt", "label", "value"] as const;

/** What we last wrote into a text node, so re-renders get re-translated. */
const doneText = new WeakMap<Text, { src: string; out: string }>();
const doneAttr = new WeakMap<Element, Record<string, { src: string; out: string }>>();

function loadCache(lang: Lang): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CACHE_KEY(lang));
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function saveCache(lang: Lang, cache: Record<string, string>) {
  try {
    window.localStorage.setItem(CACHE_KEY(lang), JSON.stringify(cache));
  } catch {
    /* ignore quota */
  }
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
  const nodes = root.querySelectorAll("[placeholder], [aria-label], [title], [alt]");
  const all: Element[] = [root, ...Array.from(nodes)];
  for (const el of all) {
    if (isInSkipTree(el)) continue;
    const prev = doneAttr.get(el) ?? {};
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (!v) continue;
      if (prev[a] && prev[a].out === v) continue; // already translated, unchanged
      if (shouldTranslate(v)) out.push({ el, attr: a });
    }
  }
}

async function fetchTranslations(lang: Lang, strings: string[]): Promise<Record<string, string>> {
  if (strings.length === 0) return {};
  const map: Record<string, string> = {};
  const CHUNK = 30;
  const batches: string[][] = [];
  for (let i = 0; i < strings.length; i += CHUNK) batches.push(strings.slice(i, i + CHUNK));

  // Run batches in parallel (capped) so the page finishes translating fast.
  const LIMIT = 4;
  for (let i = 0; i < batches.length; i += LIMIT) {
    const slice = batches.slice(i, i + LIMIT);
    await Promise.all(
      slice.map(async (batch) => {
        try {
          const res = await fetch("/api/public/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lang, strings: batch }),
          });
          if (!res.ok) return;
          const { translations } = (await res.json()) as { translations: string[] };
          if (!Array.isArray(translations)) return;
          translations.forEach((t, idx) => {
            const src = batch[idx];
            if (src && t && typeof t === "string") map[src] = t;
          });
        } catch {
          /* skip batch */
        }
      }),
    );
  }
  return map;
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

    const uniq = new Set<string>();
    textNodes.forEach((n) => {
      const raw = (n.nodeValue ?? "").trim();
      if (raw && cache[raw] == null) uniq.add(raw);
    });
    attrTargets.forEach(({ el, attr }) => {
      const v = (el.getAttribute(attr) ?? "").trim();
      if (v && cache[v] == null) uniq.add(v);
    });

    if (uniq.size > 0) {
      const fetched = await fetchTranslations(lang, Array.from(uniq));
      Object.assign(cache, fetched);
      saveCache(lang, cache);
    }

    // Apply text nodes
    textNodes.forEach((n) => {
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
    });

    // Apply attributes
    attrTargets.forEach(({ el, attr }) => {
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
    });
  } finally {
    running = false;
    if (queued) {
      queued = false;
      setTimeout(() => translatePage(lang), 80);
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
    if (lang === "en") return;

    let raf = 0;
    const schedule = (delay = 0) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (delay) setTimeout(() => translatePage(lang), delay);
        else translatePage(lang);
      });
    };

    // A few passes after hydration so late-mounting panels are covered too.
    const timers = [250, 900, 2000, 4000].map((d) => setTimeout(() => schedule(), d));
    const unsub = router.subscribe("onResolved", () => {
      setTimeout(() => schedule(), 150);
      setTimeout(() => schedule(), 900);
    });

    // Watch DOM changes (new panels, re-renders, streamed AI text).
    const observer = new MutationObserver(() => schedule(120));
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
