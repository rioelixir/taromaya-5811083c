import { LayoutGrid } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";

/**
 * Always-available app chrome: a left-edge rail button that opens the full
 * module list, and a language picker in the top-right corner of every page.
 */
export function GlobalChrome({
  showRail = true,
  showLanguage = true,
}: {
  showRail?: boolean;
  showLanguage?: boolean;
}) {
  return (
    <>
      {showRail && (
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("taromaya:open-menu"))}
          className="fixed left-0 top-1/2 z-40 -translate-y-1/2 flex flex-col items-center gap-2 rounded-r-2xl border border-l-0 border-gold/40 bg-background/85 px-2 py-4 text-gold shadow-lg backdrop-blur-xl transition hover:bg-gold/10"
          aria-label="All modules"
        >
          <LayoutGrid className="h-5 w-5" />
          <span className="text-[10px] uppercase tracking-[0.25em] [writing-mode:vertical-rl]">
            Modules
          </span>
        </button>
      )}

      {showLanguage && (
        <div className="fixed right-3 top-3 z-40">
          <LanguageSwitcher compact />
        </div>
      )}
    </>
  );
}
