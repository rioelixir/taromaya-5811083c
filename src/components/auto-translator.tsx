import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { RTL_LANGS, useLang, type Lang } from "@/lib/i18n";

const CACHE_KEY = (lang: Lang) => `taromaya.translations.${lang}`;
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA", "SVG", "PATH", "CANVAS"]);
const ATTR_ORIG = "data-i18n-orig";
const MAX_LEN = 240;

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

function collectTextNodes(root: Node, out: Text[]) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (isInSkipTree(node.parentNode)) return NodeFilter.FILTER_REJECT;
      if ((node as Text & { __i18nDone?: boolean }).__i18nDone) return NodeFilter.FILTER_REJECT;
      if (!shouldTranslate((node as Text).nodeValue ?? "")) return NodeFilter.FILTER_REJECT;
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
  const attrs = ["placeholder", "aria-label", "title", "alt"];
  const nodes = root.querySelectorAll("[placeholder], [aria-label], [title], [alt]");
  const all: Element[] = [root, ...Array.from(nodes)];
  for (const el of all) {
    if (isInSkipTree(el)) continue;
    for (const a of attrs) {
      const v = el.getAttribute(a);
      if (v && shouldTranslate(v)) out.push({ el, attr: a });
    }
  }
}

async function fetchTranslations(lang: Lang, strings: string[]): Promise<Record<string, string>> {
  if (strings.length === 0) return {};
  const map: Record<string, string> = {};
  // chunk to keep requests small
  const CHUNK = 40;
  for (let i = 0; i < strings.length; i += CHUNK) {
    const batch = strings.slice(i, i + CHUNK);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) return {};
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lang, strings: batch }),
      });
      if (!res.ok) continue;
      const { translations } = (await res.json()) as { translations: string[] };
      if (Array.isArray(translations)) {
        translations.forEach((t, idx) => {
          if (t && typeof t === "string") map[batch[idx]] = t;
        });
      }
    } catch {
      /* skip batch */
    }
  }
  return map;
}

let running = false;
async function translatePage(lang: Lang) {
  if (typeof window === "undefined") return;
  if (running) return;
  running = true;
  try {
    if (lang === "en") return;


    const cache = loadCache(lang);
    const root = document.querySelector("main") || document.body;

    const textNodes: Text[] = [];
    collectTextNodes(root, textNodes);
    const attrTargets: Array<{ el: Element; attr: string }> = [];
    collectAttrs(root, attrTargets);

    const uniq = new Set<string>();
    textNodes.forEach((n) => {
      const raw = (n.nodeValue ?? "").trim();
      if (raw && !cache[raw]) uniq.add(raw);
    });
    attrTargets.forEach(({ el, attr }) => {
      const v = (el.getAttribute(attr) ?? "").trim();
      if (v && !cache[v]) uniq.add(v);
    });

    if (uniq.size > 0) {
      const fetched = await fetchTranslations(lang, Array.from(uniq));
      Object.assign(cache, fetched);
      saveCache(lang, cache);
    }

    // Apply text nodes
    textNodes.forEach((n) => {
      const raw = (n.nodeValue ?? "");
      const key = raw.trim();
      const translated = cache[key];
      if (!translated) return;
      const leading = raw.match(/^\s*/)?.[0] ?? "";
      const trailing = raw.match(/\s*$/)?.[0] ?? "";
      // Mark translated so we don't retranslate on mutation
      const tn = n as Text & { __i18nDone?: boolean };
      if (tn.__i18nDone) return;
      tn.__i18nDone = true;

      n.nodeValue = leading + translated + trailing;
    });

    // Apply attributes
    attrTargets.forEach(({ el, attr }) => {
      const v = el.getAttribute(attr) ?? "";
      const translated = cache[v.trim()];
      if (!translated) return;
      let store: Record<string, string> = {};
      try {
        store = JSON.parse(el.getAttribute(ATTR_ORIG) || "{}");
      } catch { /* noop */ }
      if (store[attr] == null) store[attr] = v;
      el.setAttribute(ATTR_ORIG, JSON.stringify(store));
      el.setAttribute(attr, translated);
    });
  } finally {
    running = false;
  }
}

export function AutoTranslator() {
  const lang = useLang();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.lang = lang === "hr" ? "en-IN" : lang;
    document.documentElement.dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";

    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        translatePage(lang);
      });
    };

    // Initial + on route change
    schedule();
    const unsub = router.subscribe("onResolved", () => {
      // Wait for DOM to paint
      setTimeout(schedule, 60);
    });

    // Watch DOM mutations for dynamic content
    const observer = new MutationObserver(() => {
      if (lang === "en") return;
      // debounce
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setTimeout(() => translatePage(lang), 120);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: false });

    return () => {
      cancelAnimationFrame(raf);
      unsub();
      observer.disconnect();
    };
  }, [lang, router]);

  return null;
}
