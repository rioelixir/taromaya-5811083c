import { useEffect } from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";

/**
 * Reads `?tour=<data-tour id>` from the URL, finds `[data-tour="<id>"]`,
 * scrolls to it and adds `.tour-highlight`. Removes the query param and
 * the class after ~6s or on the next click / route change.
 */
export function TourHighlighter() {
  const search = useRouterState({ select: (s) => s.location.search }) as unknown as Record<string, unknown>;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const tourId = typeof search?.tour === "string" ? (search.tour as string) : "";

  useEffect(() => {
    if (!tourId) return;
    let el: HTMLElement | null = null;
    let raf1 = 0;
    let raf2 = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const clear = () => {
      if (el) el.classList.remove("tour-highlight");
      if (timer) clearTimeout(timer);
      document.removeEventListener("click", clear, true);
    };

    // Wait two frames so destination content is mounted.
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        el = document.querySelector<HTMLElement>(`[data-tour="${CSS.escape(tourId)}"]`);
        if (!el) {
          // Retry once after 400ms for lazy-mounted panels
          timer = setTimeout(() => {
            el = document.querySelector<HTMLElement>(`[data-tour="${CSS.escape(tourId)}"]`);
            if (!el) return;
            el.classList.add("tour-highlight");
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 400);
          return;
        }
        el.classList.add("tour-highlight");
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });

    // Auto-clear after 6s and strip the query param so it doesn't stick.
    const auto = setTimeout(() => {
      clear();
      navigate({ to: pathname, search: (prev: Record<string, unknown>) => {
        const { tour: _t, ...rest } = prev ?? {};
        return rest;
      }, replace: true });
    }, 6000);

    document.addEventListener("click", clear, true);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(auto);
      clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId, pathname]);

  return null;
}
