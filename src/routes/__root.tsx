import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Sidebar, BottomNav } from "@/components/nav";
import { StarField } from "@/components/star-field";

function NotFoundComponent() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 overflow-hidden">
      <StarField />
      <div className="relative z-10 max-w-md text-center glass rounded-3xl p-10">
        <div className="font-display text-8xl gold-text">404</div>
        <h2 className="mt-2 text-xl font-display text-pearl">Lost in the cosmos</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The stars couldn't align to find this page.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-full gold-border bg-gold/10 px-6 py-2.5 text-sm text-pearl transition-all hover:bg-gold/20"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 overflow-hidden">
      <StarField />
      <div className="relative z-10 max-w-md text-center glass rounded-3xl p-10">
        <h1 className="font-display text-2xl gold-text">A cosmic disturbance</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. The energies will realign shortly.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-full gold-border bg-gold/10 px-5 py-2 text-sm text-pearl hover:bg-gold/20"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-full border border-white/10 px-5 py-2 text-sm text-muted-foreground hover:text-pearl"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0a0716" },
      { title: "TAROMAYA — AI Tarot & Vedic Astrology" },
      {
        name: "description",
        content:
          "TAROMAYA is a premium AI-powered platform for tarot, Vedic astrology, kundli, panchang and numerology. Discover your cosmic path.",
      },
      { name: "author", content: "TAROMAYA" },
      { property: "og:title", content: "TAROMAYA — AI Tarot & Vedic Astrology" },
      {
        property: "og:description",
        content:
          "Luxury AI-powered tarot and Vedic astrology. Kundli, panchang, transits, numerology and a personal AI astrologer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    // Auth state → invalidate router matches (redirects & data refresh).
    import("@/integrations/supabase/client").then(({ supabase }) => {
      if (!mounted) return;
      const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      });
      return () => sub.subscription.unsubscribe();
    });
    return () => { mounted = false; };
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative min-h-dvh">
        <Sidebar />
        <div className="lg:pl-64">
          <main className="relative min-h-dvh pb-24 lg:pb-8">
            <Outlet />
          </main>
        </div>
        <BottomNav />
      </div>
    </QueryClientProvider>
  );
}
