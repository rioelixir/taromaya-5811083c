import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, Sparkles, Stars, Moon, CalendarDays, Hash, Heart, Bot,
  BookOpen, FileText, History, Bookmark, User, Settings,
  Users, LineChart, Compass, LogOut, LogIn, Menu, X, Search,
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
    label: "Essentials",
    items: [
      { to: "/", label: "Home", icon: LayoutDashboard },
      { to: "/help", label: "Help — Listen", icon: HelpCircle },
      { to: "/tarot", label: "Tarot", icon: Sparkles },
      { to: "/kundli", label: "Kundli", icon: Moon },
      { to: "/ai", label: "AI Guide", icon: Bot },
      { to: "/history", label: "History", icon: History },
      { to: "/profile", label: "Profile", icon: User },
      { to: "/birth-details", label: "Birth Details", icon: Lock },
    ],
  },
  {
    label: "Vedic",
    items: [
      { to: "/astrology", label: "Astrology", icon: Stars },
      { to: "/avakhada", label: "Avakhada", icon: Stars },
      { to: "/strength", label: "Shadbala & Ashtakavarga", icon: Gauge },
      { to: "/panchang", label: "Panchang", icon: CalendarDays },
      { to: "/muhurat", label: "Muhurat", icon: CalendarClock },
      { to: "/varshphal", label: "Varshphal", icon: Sun },
      { to: "/prashna", label: "Prashna", icon: CalendarClock },
      { to: "/deep-jyotish", label: "Deep Jyotish", icon: Stars },
      { to: "/nakshatra", label: "Nakshatra", icon: Stars },
      { to: "/nakshatra-location", label: "Nakshatra for Location", icon: Compass },
    ],
  },
  {
    label: "Doshas & Remedies",
    items: [
      { to: "/remedies", label: "Remedies", icon: Flame },
      { to: "/sadesati", label: "Sade Sati", icon: Snowflake },
      { to: "/kaalsarp", label: "Kaal Sarp", icon: Waves },
      { to: "/mangal-dosha", label: "Mangal Dosha", icon: Flame },
      { to: "/yantra", label: "Yantra", icon: Triangle },
      { to: "/dharma", label: "Dharma", icon: Crown },
    ],
  },
  {
    label: "Life",
    items: [
      { to: "/horoscope", label: "Horoscope", icon: Sun },
      { to: "/compatibility", label: "Match Making", icon: Heart },
      { to: "/numerology", label: "Numerology", icon: Hash },
      { to: "/baby-names", label: "Baby Names", icon: Baby },
      { to: "/festivals", label: "Festivals", icon: Flame },
      { to: "/career", label: "Career", icon: Briefcase },
      { to: "/finance", label: "Finance", icon: Coins },
      { to: "/health", label: "Health", icon: Activity },
      { to: "/ayurveda", label: "Ayurveda", icon: Leaf },
      { to: "/chakra", label: "Chakra", icon: Zap },
      { to: "/karma", label: "Karma", icon: InfIcon },
      { to: "/vastu", label: "Vastu", icon: HomeIcon },
      { to: "/life-dashboard", label: "Life Dashboard", icon: LayoutGrid },
    ],
  },
  {
    label: "Sky & Transits",
    items: [
      { to: "/transits", label: "Transits", icon: LineChart },
      { to: "/vedic-transits", label: "Vedic Transits", icon: Moon },
      { to: "/timeline", label: "Timeline", icon: CalendarClock },

      { to: "/dreams", label: "Dream Oracle", icon: Feather },
      { to: "/moon-calendar", label: "Moon Calendar", icon: Moon },
      { to: "/reports", label: "Reports", icon: FileText },
    ],
  },
  {
    label: "Library",
    items: [
      { to: "/saved", label: "Saved Charts", icon: Bookmark },
      { to: "/bookmarks", label: "Bookmarks", icon: BookOpen },
      { to: "/blog", label: "Blog", icon: BookOpen },
      { to: "/faq", label: "FAQ", icon: BookOpen },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/profile", label: "Profile", icon: User },
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

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        data-tour="menu-button"
        className="fixed top-3 left-3 z-40 h-11 w-11 grid place-items-center rounded-full glass gold-border hover:bg-white/40 transition"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-gold" />
      </button>
      {open && <ModuleDrawer onClose={() => setOpen(false)} />}
    </>
  );
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
                All Modules
              </div>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="ml-auto h-9 w-9 grid place-items-center rounded-full hover:bg-black/5"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search modules…"
              className="w-full rounded-xl border border-border/40 bg-white/60 pl-9 pr-3 py-2.5 text-sm"
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
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-primary/8"
                  >
                    <Icon className="h-4 w-4 text-primary shrink-0" />
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
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-primary/8"
              >
                <Shield className="h-4 w-4 text-gold shrink-0" />
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
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-primary/8"
          >
            <Feather className="h-4 w-4 text-primary shrink-0" />
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
