import { useEffect, useRef } from "react";

/**
 * Keeps full-screen overlays (card zoom, lightboxes, modals) from ever
 * navigating the app away from the current screen.
 *
 * When the overlay opens we push a throwaway history entry. The phone's Back
 * button / swipe then pops that entry instead of leaving the page, and we
 * simply close the overlay. Closing the overlay from a button pops the same
 * entry back off so history stays clean.
 *
 * This is what fixes "close the zoom → app jumps to Home".
 */
export function useOverlayBackGuard(open: boolean, close: () => void) {
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;

    let selfPopped = false;
    const marker = { __overlay: true, at: Date.now() };
    window.history.pushState(marker, "");

    const onPop = () => {
      selfPopped = true;
      closeRef.current();
    };
    window.addEventListener("popstate", onPop);

    return () => {
      window.removeEventListener("popstate", onPop);
      // Overlay closed by the UI (not by Back): remove the entry we pushed so
      // the next Back press goes where the user expects.
      if (!selfPopped && window.history.state?.__overlay) {
        window.history.back();
      }
    };
  }, [open]);
}
