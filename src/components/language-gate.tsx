import { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import { LANGUAGE_LIST, hasChosenLang, markLangChosen, setLang, type Lang } from "@/lib/i18n";

const DESCRIPTION: Record<Lang, string> = {
  en: "Professional international English",
  hi: "शुद्ध हिन्दी, देवनागरी लिपि में",
  hr: "Roman script mein natural Hindi",
};

/**
 * Session-start language chooser. Asked once per browser session; the choice
 * drives the whole interface and every AI answer until it is changed in
 * Settings or from the language picker.
 */
export function LanguageGate() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hasChosenLang()) setOpen(true);
  }, []);

  if (!open) return null;

  const pick = (code: Lang) => {
    markLangChosen();
    setLang(code);
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/50 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Choose your language"
      data-no-translate
    >
      <div className="w-full max-w-sm rounded-3xl border border-border/40 bg-background/98 p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
            <Languages className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-xl">Choose your language</div>
            <div className="text-xs text-muted-foreground">
              भाषा चुनें · Apni bhasha chuniye
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {LANGUAGE_LIST.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => pick(l.code as Lang)}
              className="flex w-full min-h-14 items-center justify-between gap-3 rounded-2xl border border-border/40 bg-white/70 px-4 py-3 text-left hover:bg-white/95 hover:border-primary/40 transition-all"
            >
              <span className="min-w-0">
                <span className="block text-base font-medium text-foreground">{l.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {DESCRIPTION[l.code as Lang]}
                </span>
              </span>
            </button>
          ))}
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          You can change this any time from Settings or the language button.
        </p>
      </div>
    </div>
  );
}
