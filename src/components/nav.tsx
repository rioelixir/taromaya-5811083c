import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, Sparkles, Stars, Moon, CalendarDays, Hash, Heart, Bot,
  BookOpen, FileText, History, Bookmark, User, Settings,
  Users, LineChart, Compass, LogOut, LogIn, X, Search,
  Flame, CalendarClock, Crown, Target, Globe2, Telescope, CloudSun, Feather, Baby, Leaf, Zap, Infinity as InfIcon, Home as HomeIcon, Waves, Snowflake, Triangle,
  Briefcase, Coins, Activity, LayoutGrid, Gauge, Lock, Sun, Shield, HelpCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-admin";
import { useAppLogo } from "@/hooks/use-app-logo";
import { useT } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

type Item = { to: string; label: string; icon: typeof Sparkles };
type Group = { label: string; items: Item[] };

const CATALOG: Group[] = [
  {
    label: "Start here",
    items: [
      { to: "/", label: "Home", icon: LayoutDashboard },
      { to: "/help", label: "Help — listen", icon: HelpCircle },
      { to: "/tarot", label: "Tarot cards", icon: Sparkles },
      { to: "/kundli", label: "Birth chart", icon: Moon },
      { to: "/ai", label: "Ask the guide", icon: Bot },
      { to: "/history", label: "Past readings", icon: History },
      { to: "/profile", label: "My profile", icon: User },
      { to: "/birth-details", label: "My birth details", icon: Lock },
    ],
  },
  {
    label: "Stars and charts",
    items: [
      { to: "/astrology", label: "Star reading", icon: Stars },
      { to: "/avakhada", label: "Birth facts", icon: Stars },
      { to: "/strength", label: "Planet strength", icon: Gauge },
      { to: "/panchang", label: "Today's sky", icon: CalendarDays },
      { to: "/muhurat", label: "Good times to act", icon: CalendarClock },
      { to: "/varshphal", label: "Your year ahead", icon: Sun },
      { to: "/prashna", label: "Ask one question", icon: CalendarClock },
      { to: "/deep-jyotish", label: "Deep star reading", icon: Stars },
      { to: "/nakshatra", label: "My birth star", icon: Stars },
      { to: "/nakshatra-location", label: "Star for a place", icon: Compass },
    ],
  },
  {
    label: "Fixes and blessings",
    items: [
      { to: "/remedies", label: "Simple fixes", icon: Flame },
      { to: "/sadesati", label: "Saturn's long phase", icon: Snowflake },
      { to: "/kaalsarp", label: "Kaal Sarp check", icon: Waves },
      { to: "/mangal-dosha", label: "Mangal check", icon: Flame },
      { to: "/yantra", label: "Lucky symbols", icon: Triangle },
      { to: "/dharma", label: "My life path", icon: Crown },
    ],
  },
  {
    label: "Everyday life",
    items: [
      { to: "/horoscope", label: "Daily horoscope", icon: Sun },
      { to: "/compatibility", label: "Kundli matching", icon: Heart },
      { to: "/numerology", label: "My numbers", icon: Hash },
      { to: "/baby-names", label: "Baby names", icon: Baby },
      { to: "/festivals", label: "Festival dates", icon: Flame },
      { to: "/career", label: "Work and study", icon: Briefcase },
      { to: "/finance", label: "Money", icon: Coins },
      { to: "/health", label: "Health", icon: Activity },
      { to: "/ayurveda", label: "Body type", icon: Leaf },
      { to: "/chakra", label: "Energy centres", icon: Zap },
      { to: "/karma", label: "Karma", icon: InfIcon },
      { to: "/vastu", label: "Home and rooms", icon: HomeIcon },
      { to: "/life-dashboard", label: "Life at a glance", icon: LayoutGrid },
    ],
  },
  {
    label: "Sky moves",
    items: [
      { to: "/transits", label: "Sky moves now", icon: LineChart },
      { to: "/vedic-transits", label: "Vedic sky moves", icon: Moon },
      { to: "/timeline", label: "What's coming", icon: CalendarClock },

      { to: "/dreams", label: "Dream meanings", icon: Feather },
      { to: "/moon-calendar", label: "Moon calendar", icon: Moon },
      { to: "/reports", label: "Full reports", icon: FileText },
    ],
  },
  {
    label: "My things",
    items: [
      { to: "/saved", label: "Saved charts", icon: Bookmark },
      { to: "/bookmarks", label: "Bookmarks", icon: BookOpen },
      { to: "/blog", label: "Stories", icon: BookOpen },
      { to: "/faq", label: "Questions and answers", icon: BookOpen },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/profile", label: "My profile", icon: User },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },

];


function BrandMark() {
  const logo = useAppLogo();
  if (logo) {
    return (
      <div className="relative h-9 w-9 rounded-full overflow-hidden gold-border shrink-0">
        <img src={logo} alt="Taromaya" className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div className="relative h-9 w-9 rounded-full gold-border grid place-items-center shrink-0">
      <Sparkles className="h-4 w-4 text-gold" />
    </div>
  );
}

/**
 * Sidebar — kept as export name for API compatibility with __root.tsx.
 * Now renders a floating hamburger trigger + a full drawer with search.
 * No permanent sidebar column.
 */
export function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Close whenever the route changes
  useEffect(() => { setOpen(false); }, [pathname]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return <>{open && <ModuleDrawer onClose={() => setOpen(false)} />}</>;
}

function ModuleDrawer({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const { t } = useT();
  const { isAdmin } = useIsAdmin();

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return CATALOG;
    return CATALOG.map((g) => ({
      ...g,
      items: g.items.filter((i) => i.label.toLowerCase().includes(needle)),
    })).filter((g) => g.items.length > 0);
  }, [q]);

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="fixed left-0 top-0 z-50 h-dvh w-[min(92vw,420px)] flex flex-col bg-background/98 backdrop-blur-2xl border-r border-border/40 shadow-2xl animate-in slide-in-from-left duration-200"
        role="dialog"
        aria-label="All modules"
      >
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <Link to="/" onClick={onClose} className="flex items-center gap-2.5 min-w-0">
            <BrandMark />
            <div className="min-w-0">
              <div className="font-display text-xl leading-none gold-text">TAROMAYA</div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-1 truncate">
                Everything in the app
              </div>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="ml-auto h-11 w-11 grid place-items-center rounded-full hover:bg-black/5"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Type what you are looking for…"
              className="min-h-12 w-full rounded-xl border border-border/40 bg-white/60 pl-10 pr-3 py-2.5 text-base"
            />
          </div>
        </div>



        <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-4">
          {filtered.map((group) => (
            <div key={group.label}>
              <div className="px-3 pb-1.5 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                {t(group.label)}
              </div>
              <div className="space-y-0.5">
                {group.items.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to + label}
                    to={to}
                    onClick={onClose}
                    className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-2.5 text-base text-foreground hover:bg-primary/8"
                  >
                    <Icon className="h-5 w-5 text-primary shrink-0" />
                    <span className="truncate">{t(label)}</span>
                  </Link>
                ))}

              </div>
            </div>
          ))}
          {isAdmin && (
            <div>
              <div className="px-3 pb-1.5 text-[10px] uppercase tracking-[0.3em] text-gold">
                {t("Admin")}
              </div>
              <Link
                to="/admin"
                onClick={onClose}
                className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-2.5 text-base text-foreground hover:bg-primary/8"
              >
                <Shield className="h-5 w-5 text-gold shrink-0" />
                <span>{t("Control Room")}</span>
              </Link>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new Event("taromaya:open-authors-note"));
              onClose();
            }}
            className="w-full flex min-h-12 items-center gap-3 rounded-xl px-3 py-2.5 text-base text-foreground hover:bg-primary/8"
          >
            <Feather className="h-5 w-5 text-primary shrink-0" />
            <span>{t("Author's Note")}</span>
          </button>

        </nav>

        <div className="px-4 pb-3 pt-2 border-t border-border/40">
          <LanguageSwitcher />
        </div>
        <AuthFooter onClose={onClose} />
      </aside>
    </>
  );
}

function AuthFooter({ onClose }: { onClose: () => void }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const onSignOut = async () => {
    await supabase.auth.signOut();
    onClose();
    navigate({ to: "/auth", replace: true });
  };
  return (
    <div className="px-4 pb-4 pt-2 border-t border-border/40">
      {loading ? (
        <div className="h-10 rounded-xl bg-black/5 animate-pulse" />
      ) : user ? (
        <div className="glass rounded-2xl p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/15 grid place-items-center shrink-0">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs truncate">
              {user.user_metadata?.full_name ?? user.email?.split("@")[0]}
            </div>
            <div className="text-[10px] text-muted-foreground truncate">{user.email}</div>
          </div>
          <button
            onClick={onSignOut}
            className="p-2 rounded-lg hover:bg-black/5"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <Link
          to="/auth"
          onClick={onClose}
          className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-gold to-gold-soft text-white font-medium py-2.5 text-sm"
        >
          <LogIn className="h-4 w-4" /> Sign in
        </Link>
      )}
    </div>
  );
}

/**
 * Bottom navigation — 4 tabs only. Visible on all screen sizes.
 */
const bottomNav = [
  { to: "/", label: "Home", icon: HomeIcon },
  { to: "/tarot", label: "Tarot", icon: Sparkles },
  { to: "/history", label: "History", icon: History },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useT();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-border/40 bg-background/90 backdrop-blur-2xl pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {bottomNav.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to !== "/" && pathname.startsWith(to));
          return (
            <li key={to}>
              <Link
                to={to}
                className="flex flex-col items-center gap-1 py-2.5 text-[11px]"
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={[
                    "grid place-items-center h-9 w-9 rounded-full transition-all",
                    active ? "bg-primary/12 text-primary" : "text-muted-foreground",
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className={active ? "text-primary font-medium" : "text-muted-foreground"}>
                  {t(label)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// keep imports referenced
void Users;
