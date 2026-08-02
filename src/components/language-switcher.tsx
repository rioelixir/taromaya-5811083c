import { Languages, Check, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { LANGUAGE_LIST, LANGUAGE_LABELS, setLang, useLang, type Lang } from "@/lib/i18n";

const RECENT_KEY = "taromaya.lang.recent";

function readRecent(): Lang[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(raw) ? (raw as Lang[]) : [];
  } catch {
    return [];
  }
}

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<Lang[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setRecent(readRecent()), []);

  useEffect(() => {
    if (!open) return;
    setQ("");
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (l: Lang) => {
    const next = [l, ...recent.filter((r) => r !== l)].slice(0, 4);
    setRecent(next);
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setLang(l);
    setOpen(false);
  };

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const ordered = [
      ...recent.filter((r) => LANGUAGE_LIST.some((l) => l.code === r)),
      ...LANGUAGE_LIST.map((l) => l.code as Lang).filter((c) => !recent.includes(c)),
    ];
    if (!needle) return ordered;
    return ordered.filter((code) => {
      const meta = LANGUAGE_LIST.find((l) => l.code === code)!;
      return (
        meta.label.toLowerCase().includes(needle) ||
        meta.ai.toLowerCase().includes(needle) ||
        meta.code.toLowerCase().startsWith(needle)
      );
    });
  }, [q, recent]);

  return (
    <div ref={ref} className="relative" data-no-translate>
      <button
        onClick={() => setOpen((o) => !o)}
        className={[
          "flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-pearl hover:bg-white/10 transition-colors",
          compact ? "w-auto" : "w-full justify-between",
        ].join(" ")}
        aria-label="Change language"
      >
        <span className="flex items-center gap-2">
          <Languages className="h-3.5 w-3.5 text-gold" />
          <span className="tracking-wide">{LANGUAGE_LABELS[lang]}</span>
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className={[
            "absolute rounded-xl glass gold-border overflow-hidden z-50 min-w-[200px]",
            compact ? "top-full right-0 mt-2" : "bottom-full left-0 right-0 mb-2",
          ].join(" ")}
        >
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
            <Search className="h-3.5 w-3.5 text-gold" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && results[0]) pick(results[0]);
              }}
              placeholder="Search language"
              className="w-full bg-transparent text-xs text-pearl outline-none placeholder:text-pearl/40"
            />
          </div>
          <div className="max-h-[55vh] overflow-y-auto overflow-x-hidden">
            {results.length === 0 && (
              <div className="px-3 py-3 text-xs text-pearl/60">No match</div>
            )}
            {results.map((l) => (
              <button
                key={l}
                role="menuitem"
                onClick={() => pick(l)}
                className={[
                  "w-full flex items-center justify-between px-3 py-2.5 text-xs text-left transition-colors",
                  l === lang ? "text-gold bg-gold/10" : "text-pearl hover:bg-white/5",
                ].join(" ")}
              >
                <span>{LANGUAGE_LABELS[l]}</span>
                {l === lang && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
