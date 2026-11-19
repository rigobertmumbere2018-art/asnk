import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ScrollText } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

type Log = {
  id: string;
  actor_email: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/admin/logs")({
  head: () => ({ meta: [{ title: "Journal d'activité — Administration" }] }),
  component: Page,
});

function Page() {
  const [items, setItems] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) toast.error(error.message);
      setItems((data ?? []) as unknown as Log[]);
      setLoading(false);
    })();
  }, []);

  const filtered = items.filter((l) => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      (l.entity ?? "").toLowerCase().includes(q) ||
      (l.actor_email ?? "").toLowerCase().includes(q)
    );
  });

  function fmt(iso: string) {
    return new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
  }

  return (
    <div className="px-5 py-10 lg:px-10 lg:py-12">
      <AdminPageHeader
        eyebrow="Audit"
        title="Journal d'activité"
        description="Historique de toutes les actions effectuées dans l'administration."
        actions={
          <input
            placeholder="Filtrer…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-10 w-56 rounded-full border border-white/10 bg-white/5 px-4 text-sm outline-none focus:border-scout-green"
          />
        }
      />
      {loading ? (
        <div className="mt-10 flex justify-center"><Loader2 className="size-6 animate-spin text-white/60" /></div>
      ) : filtered.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/55">
          <ScrollText className="mx-auto mb-3 size-6 text-white/40" />
          Aucune entrée pour le moment.
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-[11px] uppercase tracking-wider text-white/55">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Acteur</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Entité</th>
                <th className="px-4 py-3 text-left">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-white/[0.02]">
                  <td className="whitespace-nowrap px-4 py-3 text-white/65">{fmt(l.created_at)}</td>
                  <td className="px-4 py-3 text-white/85">{l.actor_email ?? "—"}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-scout-green/15 px-2 py-0.5 text-[11px] uppercase tracking-wider text-scout-green">{l.action}</span></td>
                  <td className="px-4 py-3 text-white/65">{l.entity ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-white/55">
                    {l.meta && Object.keys(l.meta).length > 0 ? (
                      <code className="rounded bg-black/30 px-1.5 py-0.5">{JSON.stringify(l.meta)}</code>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}