import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, CornerLeftUp } from "lucide-react";

/**
 * Goes back exactly one step. If there is no history to go back to
 * (fresh tab, shared link), it steps up one level in the URL instead of
 * jumping straight to the home page.
 */
export function useStepBack() {
  const router = useRouter();
  const pathname = router.state.location.pathname;

  const parentPath = (() => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length <= 1) return "/";
    return "/" + parts.slice(0, -1).join("/");
  })();

  const canGoBack =
    typeof window !== "undefined" ? window.history.length > 1 : false;

  const stepBack = () => {
    if (canGoBack) {
      router.history.back();
      return;
    }
    router.navigate({ to: parentPath, replace: true });
  };

  return { stepBack, canGoBack, parentPath, isTopLevel: parentPath === "/" };
}

/** Small inline "one step back" button. */
export function BackButton({ className }: { className?: string }) {
  const { stepBack, canGoBack } = useStepBack();
  return (
    <button
      type="button"
      onClick={stepBack}
      aria-label="Go back one step"
      title="Go back one step"
      className={[
        "inline-flex items-center gap-2 rounded-xl glass gold-border px-3 py-2 text-xs sm:text-sm text-pearl hover:bg-white/10 transition",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {canGoBack ? (
        <ArrowLeft className="h-4 w-4 text-gold" />
      ) : (
        <CornerLeftUp className="h-4 w-4 text-gold" />
      )}
      Back
    </button>
  );
}

/** Floating back button for pages that don't use PageShell. */
export function FloatingBackButton() {
  return (
    <div
      data-global-back
      className="fixed left-3 top-3 z-40 sm:left-4 sm:top-4"
      data-no-translate
    >
      <BackButton className="shadow-lg backdrop-blur" />
    </div>
  );
}

