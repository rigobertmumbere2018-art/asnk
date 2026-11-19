import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

type Inscription = {
  id: string;
  type: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  status: string;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/admin/inscriptions")({
  head: () => ({ meta: [{ title: "Inscriptions — Administration" }] }),
  component: Page,
});

function Page() {
  const [items, setItems] = useState<Inscription[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const { data, error } = await supabase
      .from("inscriptions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as Inscription[]);
    setLoading(false);
  }
  useEffect(() => {
    refresh();
  }, []);

  async function setStatus(id: string, status: "validee" | "refusee" | "en_attente") {
    const { error } = await supabase.from("inscriptions").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    setItems((list) => list.map((i) => (i.id === id ? { ...i, status } : i)));
    toast.success("Statut mis à jour");
  }

  const filtered = items.filter((i) => filter === "all" || i.type === filter);

  return (
    <div className="px-5 py-10 lg:px-10 lg:py-12">
      <AdminPageHeader
        eyebrow="Membres"
        title="Demandes d'inscription"
        description="Validez ou refusez les demandes reçues via le formulaire public."
      />

      <div className="mt-6 flex flex-wrap gap-2">
        {["all", "membre", "groupe", "donateur", "partenaire"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-wider transition ${filter === t ? "bg-scout-green text-scout-deep" : "border border-white/10 text-white/65 hover:bg-white/5"}`}
          >
            {t === "all" ? "Tous" : t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-10 flex justify-center"><Loader2 className="size-6 animate-spin text-white/60" /></div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-white/45">
                <tr>
                  <th className="p-4">Type</th>
                  <th className="p-4">Nom</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Ville</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-white/55">
                      <Users className="mx-auto mb-2 size-5 text-white/30" />
                      Aucune demande pour ce filtre.
                    </td>
                  </tr>
                )}
                {filtered.map((i) => (
                  <tr key={i.id} className="text-white/85">
                    <td className="p-4"><span className="rounded-full bg-white/5 px-2 py-1 text-xs uppercase tracking-wider text-scout-green">{i.type}</span></td>
                    <td className="p-4 font-medium text-white">{i.full_name}</td>
                    <td className="p-4">{i.email}</td>
                    <td className="p-4">{i.city ?? "—"}</td>
                    <td className="p-4">
                      <span className={`rounded-full px-2 py-1 text-xs ${i.status === "validee" ? "bg-scout-green/15 text-scout-green" : i.status === "refusee" ? "bg-destructive/15 text-destructive-foreground" : "bg-white/5 text-white/65"}`}>{i.status}</span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex gap-2">
                        <button onClick={() => setStatus(i.id, "validee")} className="rounded-full bg-scout-green/15 px-3 py-1 text-xs text-scout-green hover:bg-scout-green/25">Valider</button>
                        <button onClick={() => setStatus(i.id, "refusee")} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/65 hover:bg-white/5">Refuser</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}