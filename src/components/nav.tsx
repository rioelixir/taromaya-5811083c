import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Sparkles, Stars, Moon, CalendarDays, Hash, Heart, Bot,
  BookOpen, GraduationCap, FileText, History, Bookmark, User, Settings,
  Sun, Users, LineChart, Compass, ChevronDown, LogOut, LogIn, Menu, X,
  Flame, CalendarClock, Crown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-admin";
import { Shield } from "lucide-react";

type Item = { to: string; label: string; icon: typeof Sparkles };
type Group = { label: string; items: Item[]; defaultOpen?: boolean };

const groups: Group[] = [
  {
    label: "Home",
    defaultOpen: true,
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/ai", label: "AI Guide", icon: Bot },
    ],
  },
  {
    label: "Horoscopes",
    defaultOpen: true,
    items: [
      { to: "/horoscope", label: "Horoscope", icon: Sun },
    ],
  },
  {
    label: "Vedic",
    defaultOpen: true,
    items: [
      { to: "/kundli", label: "Kundli", icon: Moon },
      { to: "/astrology", label: "Astrology", icon: Stars },
      { to: "/panchang", label: "Panchang", icon: CalendarDays },
      { to: "/muhurat", label: "Muhurat", icon: CalendarClock },
      { to: "/remedies", label: "Remedies", icon: Flame },
      { to: "/compatibility", label: "Matching", icon: Heart },
    ],
  },
  {
    label: "Divination",
    defaultOpen: true,
    items: [
      { to: "/tarot", label: "Tarot", icon: Sparkles },
      { to: "/numerology", label: "Numerology", icon: Hash },
    ],
  },
  {
    label: "Advanced",
    items: [
      { to: "/transits", label: "Transits", icon: LineChart },
      { to: "/progressions", label: "Progressions", icon: LineChart },
      { to: "/synastry", label: "Synastry", icon: Compass },
      { to: "/astrology", label: "Natal Chart", icon: Stars },
      { to: "/reports", label: "Reports", icon: FileText },

    ],
  },
  {
    label: "Library",
    items: [
      { to: "/saved", label: "Saved Charts", icon: Bookmark },
      { to: "/history", label: "History", icon: History },
      { to: "/bookmarks", label: "Bookmarks", icon: BookOpen },
      { to: "/journal", label: "Journal", icon: BookOpen },
      { to: "/learn", label: "Learn", icon: GraduationCap },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/pricing", label: "Premium", icon: Crown },
      { to: "/profile", label: "Profile", icon: User },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Close on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 h-10 w-10 grid place-items-center rounded-full glass gold-border"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4 text-gold" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={[
          "fixed left-0 top-0 h-dvh w-72 flex-col z-50 border-r border-white/5 bg-cosmic/80 backdrop-blur-2xl",
          "transition-transform duration-300 ease-out",
          "lg:flex lg:translate-x-0 lg:w-64",
          mobileOpen ? "flex translate-x-0" : "flex -translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 rounded-full gold-border grid place-items-center">
              <Sparkles className="h-4 w-4 text-gold" />
              <div className="absolute inset-0 rounded-full animate-twinkle bg-gold/10" />
            </div>
            <div>
              <div className="font-display text-xl tracking-widest gold-text leading-none">
                TAROMAYA
              </div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-1">
                Cosmic Intelligence
              </div>
            </div>
          </Link>
          <button
            className="lg:hidden text-muted-foreground"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {groups.map((g) => (
            <NavGroup key={g.label} group={g} pathname={pathname} />
          ))}
          <AdminNavGroup pathname={pathname} />
        </nav>

        <AuthFooter />
      </aside>
    </>
  );
}

function NavGroup({ group, pathname }: { group: Group; pathname: string }) {
  const containsActive = group.items.some(
    (i) => pathname === i.to || (i.to !== "/" && pathname.startsWith(i.to)),
  );
  const [open, setOpen] = useState(group.defaultOpen ?? containsActive);
  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive]);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/80 hover:text-pearl"
      >
        <span>{group.label}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && (
        <div className="space-y-0.5 mt-0.5">
          {group.items.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || (to !== "/" && pathname === to);
            return (
              <Link
                key={to + label}
                to={to}
                className={[
                  "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all",
                  active
                    ? "bg-gradient-to-r from-gold/15 to-galaxy/10 text-pearl gold-border"
                    : "text-muted-foreground hover:text-pearl hover:bg-white/5",
                ].join(" ")}
              >
                <Icon
                  className={[
                    "h-4 w-4 shrink-0 transition-colors",
                    active ? "text-gold" : "text-muted-foreground group-hover:text-gold-soft",
                  ].join(" ")}
                />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AuthFooter() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const onSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="px-4 py-4 border-t border-white/5">
      {loading ? (
        <div className="h-10 rounded-xl bg-white/5 animate-pulse" />
      ) : user ? (
        <div className="glass rounded-2xl p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gold/30 to-galaxy/30 grid place-items-center gold-border shrink-0">
            <User className="h-4 w-4 text-gold" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs text-pearl truncate">
              {user.user_metadata?.full_name ?? user.email?.split("@")[0]}
            </div>
            <div className="text-[10px] text-muted-foreground truncate">{user.email}</div>
          </div>
          <button
            onClick={onSignOut}
            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-pearl"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <Link
          to="/auth"
          className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-gold to-gold-soft text-cosmic font-medium py-2.5 text-sm"
        >
          <LogIn className="h-4 w-4" /> Sign in
        </Link>
      )}
    </div>
  );
}

const bottomNav = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/tarot", label: "Tarot", icon: Sparkles },
  { to: "/kundli", label: "Kundli", icon: Moon },
  { to: "/ai", label: "AI", icon: Bot },
  { to: "/profile", label: "Me", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/5 bg-cosmic/85 backdrop-blur-2xl pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <ul className="grid grid-cols-5">
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
                    active
                      ? "bg-gradient-to-br from-gold/25 to-galaxy/20 gold-border"
                      : "text-muted-foreground",
                  ].join(" ")}
                >
                  <Icon className={active ? "h-4 w-4 text-gold" : "h-4 w-4"} />
                </span>
                <span className={active ? "text-pearl" : "text-muted-foreground"}>
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// keep imports referenced (Users used in future groups)
void Users;

function AdminNavGroup({ pathname }: { pathname: string }) {
  const { isAdmin } = useIsAdmin();
  if (!isAdmin) return null;
  const active = pathname === "/admin" || pathname.startsWith("/admin");
  return (
    <div className="pt-2 mt-2 border-t border-white/5">
      <div className="px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-gold/80">Admin</div>
      <Link
        to="/admin"
        className={[
          "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all",
          active
            ? "bg-gradient-to-r from-gold/20 to-galaxy/15 text-pearl gold-border"
            : "text-muted-foreground hover:text-pearl hover:bg-white/5",
        ].join(" ")}
      >
        <Shield className={active ? "h-4 w-4 text-gold" : "h-4 w-4"} />
        <span>Control Room</span>
      </Link>
    </div>
  );
}
