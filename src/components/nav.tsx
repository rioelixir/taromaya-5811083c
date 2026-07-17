import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Sparkles,
  Stars,
  Moon,
  CalendarDays,
  Hash,
  Heart,
  Bot,
  BookOpen,
  GraduationCap,
  FileText,
  History,
  Bookmark,
  User,
  Settings,
} from "lucide-react";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tarot", label: "Tarot", icon: Sparkles },
  { to: "/astrology", label: "Astrology", icon: Stars },
  { to: "/kundli", label: "Kundli", icon: Moon },
  { to: "/panchang", label: "Panchang", icon: CalendarDays },
  { to: "/numerology", label: "Numerology", icon: Hash },
  { to: "/compatibility", label: "Compatibility", icon: Heart },
  { to: "/ai", label: "AI Guide", icon: Bot },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/learn", label: "Learning", icon: GraduationCap },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/history", label: "History", icon: History },
  { to: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-dvh w-64 flex-col z-40 border-r border-white/5 bg-cosmic/60 backdrop-blur-2xl">
      <div className="px-6 pt-8 pb-6">
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
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6 space-y-0.5">
        {nav.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to !== "/" && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={[
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
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
      </nav>

      <div className="px-4 py-4 border-t border-white/5">
        <div className="glass rounded-2xl p-4">
          <div className="text-xs text-muted-foreground">Current Moon</div>
          <div className="font-display text-lg gold-text mt-1">Waxing Gibbous</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Nakshatra · Rohini</div>
        </div>
      </div>
    </aside>
  );
}

const bottomNav = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/tarot", label: "Tarot", icon: Sparkles },
  { to: "/ai", label: "AI", icon: Bot },
  { to: "/astrology", label: "Astro", icon: Stars },
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
