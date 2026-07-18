import { Languages, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LANGUAGES, LANGUAGE_LABELS, setLang, useLang, type Lang } from "@/lib/i18n";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const pick = (l: Lang) => {
    setLang(l);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
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
        <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl glass gold-border overflow-hidden z-50">
          {LANGUAGES.map((l) => (
            <button
              key={l}
              onClick={() => pick(l)}
              className={[
                "w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors",
                l === lang ? "text-gold bg-gold/10" : "text-pearl hover:bg-white/5",
              ].join(" ")}
            >
              <span>{LANGUAGE_LABELS[l]}</span>
              {l === lang && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
