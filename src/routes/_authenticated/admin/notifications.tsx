import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { formatDate } from "@/lib/cms";

type Notif = {
  id: string;
  title: string;
  body: string | null;
  kind: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Administration" }] }),
  component: Page,
});

function Page() {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    setItems((data ?? []) as Notif[]);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const ch = supabase
      .channel("admin-notif-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  async function markOne(n: Notif) {
    if (n.read) return;
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", n.id);
    if (error) return toast.error(error.message);
  }

  async function markAll() {
    const { error } = await supabase.from("notifications").update({ read: true }).eq("read", false);
    if (error) return toast.error(error.message);
    toast.success("Toutes les notifications marquées comme lues");
  }

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="px-5 py-10 lg:px-10 lg:py-12">
      <AdminPageHeader
        eyebrow="Alertes"
        title="Notifications"
        description={`${unread} non lue${unread > 1 ? "s" : ""} sur ${items.length}.`}
        actions={
          unread > 0 && (
            <button
              onClick={markAll}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 px-5 text-sm text-white/85 hover:bg-white/5"
            >
              <CheckCheck className="size-4" /> Tout marquer comme lu
            </button>
          )
        }
      />
      {loading ? (
        <div className="mt-10 flex justify-center"><Loader2 className="size-6 animate-spin text-white/60" /></div>
      ) : items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/55">
          <Bell className="mx-auto mb-3 size-6 text-white/40" />
          Aucune notification pour le moment.
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-card">
          {items.map((n) => (
            <li key={n.id} className={`flex items-start gap-4 p-4 ${n.read ? "opacity-70" : "bg-scout-green/5"}`}>
              <span className={`mt-1 size-2 shrink-0 rounded-full ${n.read ? "bg-white/20" : "bg-scout-green"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-sm font-medium">{n.title}</div>
                  <div className="shrink-0 text-[11px] text-white/45">{formatDate(n.created_at)}</div>
                </div>
                {n.body && <div className="mt-1 text-xs text-white/65">{n.body}</div>}
                <div className="mt-2 flex items-center gap-3 text-[11px]">
                  {n.kind && <span className="rounded-full bg-white/5 px-2 py-0.5 uppercase tracking-wider text-white/55">{n.kind}</span>}
                  {n.link && (
                    <a href={n.link} className="text-scout-green hover:underline">Ouvrir</a>
                  )}
                  {!n.read && (
                    <button onClick={() => markOne(n)} className="inline-flex items-center gap-1 text-white/55 hover:text-white">
                      <Check className="size-3" /> Marquer lu
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}