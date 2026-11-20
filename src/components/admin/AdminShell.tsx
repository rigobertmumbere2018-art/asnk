import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Newspaper,
  CalendarDays,
  FileText,
  UserPlus,
  MessageSquare,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  ShieldCheck,
  Images,
  Bell,
  ScrollText,
  Mail,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { to: "/admin/posts", label: "Actualités", icon: Newspaper, exact: false },
  { to: "/admin/events", label: "Événements", icon: CalendarDays, exact: false },
  { to: "/admin/albums", label: "Galerie", icon: Images, exact: false },
  { to: "/admin/documents", label: "Documents", icon: FileText, exact: false },
  { to: "/admin/emails", label: "Adresses pro", icon: Mail, exact: false },
  { to: "/admin/districts", label: "Districts", icon: MapPin, exact: false },
  { to: "/admin/inscriptions", label: "Inscriptions", icon: UserPlus, exact: false },
  { to: "/admin/notifications", label: "Notifications", icon: Bell, exact: false },
  { to: "/admin/logs", label: "Journal d'activité", icon: ScrollText, exact: false },
  { to: "/chat", label: "Chat communautaire", icon: MessageSquare, exact: false },
] as const;

export function AdminShell({ children, email }: { children: React.ReactNode; email: string }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    async function refresh() {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("read", false);
      if (active) setUnread(count ?? 0);
    }
    refresh();
    const channel = supabase
      .channel("admin-notif-badge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => refresh(),
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Vous êtes déconnecté.");
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-dvh bg-scout-deep text-white">
      {/* Top bar mobile */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-scout-deep/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/admin" className="flex items-center gap-2">
          <img src="/favicon.svg" alt="ASNK" className="size-8 rounded-md" />
          <span className="text-sm font-semibold">Administration</span>
        </Link>
        <button
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((v) => !v)}
          className="grid size-9 place-items-center rounded-full border border-white/15"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 w-72 -translate-x-full border-r border-white/10 bg-scout-deep/95 backdrop-blur transition-transform duration-300 lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0",
            open && "translate-x-0",
          )}
        >
          <div className="flex h-full flex-col">
            <div className="hidden items-center gap-3 border-b border-white/10 px-6 py-5 lg:flex">
              <img src="/favicon.svg" alt="ASNK" className="size-10 rounded-md" />
              <div className="leading-tight">
                <div className="text-sm font-semibold">Administration</div>
                <div className="text-xs text-white/55">Scouts du Nord-Kivu</div>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
              {NAV.map((item) => {
                const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                const showBadge = item.to === "/admin/notifications" && unread > 0;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-scout-green/15 text-scout-green"
                        : "text-white/70 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <item.icon className="size-4" />
                    <span className="flex-1">{item.label}</span>
                    {showBadge && (
                      <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-scout-green px-1.5 text-[10px] font-semibold text-scout-deep">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </Link>
                );
              })}

              <div className="mt-6 border-t border-white/10 pt-4">
                <Link
                  to="/"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/65 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <ArrowLeft className="size-4" />
                  Retour au site
                </Link>
                <button
                  onClick={signOut}
                  className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/65 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <LogOut className="size-4" />
                  Déconnexion
                </button>
              </div>
            </nav>

            <div className="border-t border-white/10 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-full bg-scout-green/20 text-scout-green">
                  <ShieldCheck className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium">{email}</div>
                  <div className="text-[10px] uppercase tracking-wider text-scout-green">Super Admin</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {open && (
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* Main */}
        <main className="min-h-dvh flex-1 lg:ml-0">{children}</main>
      </div>
    </div>
  );
}