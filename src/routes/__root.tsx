import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Sidebar } from "@/components/nav";
import { StarField } from "@/components/star-field";
import { useBackgroundImage } from "@/hooks/use-background-image";
import { AutoTranslator } from "@/components/auto-translator";
import { WorkSessionKeeper } from "@/components/work-session-keeper";

import { AuthorsNoteModal, consumeAuthorsNotePending } from "@/components/authors-note-modal";
import { useBranding } from "@/hooks/use-branding";
import { TourHighlighter } from "@/components/tour-highlighter";

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
      { title: "TAROMAYA — Your Cosmic Portal" },
      {
        name: "description",
        content:
          "Enter the cosmic portal — tarot, Vedic astrology, kundli, panchang, numerology and an AI oracle in one luxury platform.",
      },
      { name: "author", content: "TAROMAYA" },
      { property: "og:title", content: "TAROMAYA — Your Cosmic Portal" },
      {
        property: "og:description",
        content:
          "Enter the cosmic portal — tarot, Vedic astrology, kundli, panchang, numerology and an AI oracle in one luxury platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "TAROMAYA — Your Cosmic Portal" },
      { name: "twitter:description", content: "Enter the cosmic portal — tarot, Vedic astrology, kundli, panchang, numerology and an AI oracle in one luxury platform." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/49a8d0a9-dec0-4efa-a4a4-d5ad4537e6d9/id-preview-5df04fe0--6ceb9175-9072-438a-9f13-683eb0a04026.lovable.app-1784382658921.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/49a8d0a9-dec0-4efa-a4a4-d5ad4537e6d9/id-preview-5df04fe0--6ceb9175-9072-438a-9f13-683eb0a04026.lovable.app-1784382658921.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
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

const PUBLIC_PATHS = ["/auth", "/terms", "/accept-terms"];

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    let unsub: (() => void) | undefined;

    import("@/integrations/supabase/client").then(async ({ supabase }) => {
      if (!mounted) return;

      const enforce = async () => {
        const path = window.location.pathname;
        const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user;
        if (!user) {
          if (!isPublic) router.navigate({ to: "/auth" });
          return;
        }
        // Signed in — admins bypass terms acceptance.
        const { data: isAdmin } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin",
        });
        if (isAdmin) return;
        // Verify terms acceptance for non-admins.
        const { data: profile } = await supabase
          .from("profiles")
          .select("terms_accepted_at")
          .eq("id", user.id)
          .maybeSingle();
        if (!profile?.terms_accepted_at) {
          if (path !== "/accept-terms" && path !== "/terms") {
            router.navigate({ to: "/accept-terms" });
          }
          return;
        }
        // Subscription enforcement removed — app is free for everyone.

      };

      await enforce();

      const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
        enforce();
      });
      unsub = () => sub.subscription.unsubscribe();
    });
    return () => { mounted = false; unsub?.(); };
  }, [router, queryClient]);

  const bgUrl = useBackgroundImage();
  const branding = useBranding();
  const [showAuthorsNote, setShowAuthorsNote] = useState(false);

  useEffect(() => {
    if (consumeAuthorsNotePending()) setShowAuthorsNote(true);
    const open = () => setShowAuthorsNote(true);
    window.addEventListener("taromaya:open-authors-note", open);
    return () => window.removeEventListener("taromaya:open-authors-note", open);
  }, []);

  const pathname = useRouter().state.location.pathname;
  const chromeHidden = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  return (
    <QueryClientProvider client={queryClient}>
      <AutoTranslator />
      <WorkSessionKeeper />
      <AuthorsNoteModal open={showAuthorsNote} onClose={() => setShowAuthorsNote(false)} />



      {bgUrl && (
        <div
          aria-hidden
          className="fixed inset-0 -z-10 bg-cover bg-center opacity-50"
          style={{ backgroundImage: `url(${bgUrl})` }}
        >
          <div className="absolute inset-0 bg-cosmic/50" />
        </div>
      )}
      <div className="relative min-h-dvh">
        {!chromeHidden && <Sidebar />}
        {!chromeHidden && pathname !== "/" && <FloatingBackButton />}
        <main className={`relative min-h-dvh ${chromeHidden ? "" : "pb-24"}`}>
          <TourHighlighter />
          <Outlet />
        </main>

        {!chromeHidden && !pathname.startsWith("/tarot") && (
          <footer className="relative mt-12 overflow-hidden border-t border-gold/25 bg-gradient-to-b from-background/60 to-background/95 pb-24 pt-10">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent"
            />
            <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-6 text-center">
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold/50" />
                <span className="font-serif text-lg tracking-[0.35em] text-gold">
                  TAROMAYA
                </span>
                <span className="h-px w-10 bg-gradient-to-l from-transparent to-gold/50" />
              </div>

              <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
                Stars, cards and numbers explained in simple words.
              </p>

              <div className="flex flex-col items-center gap-1">
                <p className="text-xs text-muted-foreground">
                  {branding.footerLine1 || "2026 • Taromaya."}
                </p>
                <p className="text-xs text-muted-foreground">
                  {branding.footerLine2 || "App created by Riaa."}
                </p>
              </div>

              <p className="text-[11px] text-muted-foreground/80">
                Reference from{" "}
                <a
                  href="https://www.theplanetstoday.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold underline-offset-4 transition-colors hover:underline"
                >
                  Theplanetstoday.com
                </a>
              </p>
            </div>
          </footer>
        )}


        
      </div>

    </QueryClientProvider>
  );
}
