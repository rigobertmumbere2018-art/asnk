import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Power, PowerOff, Mail, Pencil, Copy } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { logActivity } from "@/lib/cms";

type FnEmail = {
  id: string;
  function_name: string;
  department: string | null;
  local_part: string;
  domain: string;
  forward_to: string;
  holder_name: string | null;
  active: boolean;
  sort_order: number;
  notes: string | null;
};

const DEFAULT_DOMAIN = "asnk.org";

export const Route = createFileRoute("/_authenticated/admin/emails")({
  head: () => ({ meta: [{ title: "Adresses professionnelles — Administration" }] }),
  component: Page,
});

function Page() {
  const [items, setItems] = useState<FnEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<FnEmail> | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    const { data, error } = await supabase
      .from("function_emails")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("function_name", { ascending: true });
    if (error) toast.error(error.message);
    setItems((data ?? []) as FnEmail[]);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  function slug(s: string) {
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/(^\.|\.$)+/g, "");
  }

  async function save() {
    if (!editing) return;
    const fn = (editing.function_name ?? "").trim();
    const local = (editing.local_part ?? "").trim().toLowerCase();
    const fwd = (editing.forward_to ?? "").trim();
    if (!fn) return toast.error("Nom de la fonction requis");
    if (!/^[a-z0-9._-]+$/.test(local)) return toast.error("Partie locale invalide (lettres, chiffres, . _ -)");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fwd)) return toast.error("Email de redirection invalide");
    setSaving(true);
    const payload = {
      function_name: fn,
      department: editing.department?.trim() || null,
      local_part: local,
      domain: (editing.domain ?? DEFAULT_DOMAIN).trim().toLowerCase(),
      forward_to: fwd,
      holder_name: editing.holder_name?.trim() || null,
      active: editing.active ?? true,
      sort_order: Number(editing.sort_order ?? 0),
      notes: editing.notes?.trim() || null,
    };
    const { error } = editing.id
      ? await supabase.from("function_emails").update(payload).eq("id", editing.id)
      : await supabase.from("function_emails").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    await logActivity(editing.id ? "email.updated" : "email.created", "function_email", editing.id ?? null, { local: payload.local_part });
    toast.success("Enregistré");
    setEditing(null);
    refresh();
  }

  async function remove(it: FnEmail) {
    if (!confirm(`Supprimer ${it.local_part}@${it.domain} ?`)) return;
    const { error } = await supabase.from("function_emails").delete().eq("id", it.id);
    if (error) return toast.error(error.message);
    await logActivity("email.deleted", "function_email", it.id, { local: it.local_part });
    refresh();
  }

  async function toggleActive(it: FnEmail) {
    const { error } = await supabase.from("function_emails").update({ active: !it.active }).eq("id", it.id);
    if (error) return toast.error(error.message);
    await logActivity(it.active ? "email.deactivated" : "email.activated", "function_email", it.id);
    refresh();
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => toast.success("Copié"));
  }

  return (
    <div className="px-5 py-10 lg:px-10 lg:py-12">
      <AdminPageHeader
        eyebrow="Annuaire institutionnel"
        title="Adresses professionnelles"
        description="Créez et gérez les adresses par fonction (Commissariat, Départements…). Chaque adresse redirige vers l'email personnel du titulaire."
        actions={
          <button
            onClick={() => setEditing({ active: true, domain: DEFAULT_DOMAIN, sort_order: items.length })}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-scout-green px-5 text-sm font-medium text-scout-deep hover:opacity-90"
          >
            <Plus className="size-4" /> Nouvelle adresse
          </button>
        }
      />

      <div className="mt-6 rounded-2xl border border-scout-purple/30 bg-scout-purple/10 p-4 text-xs text-white/75">
        <strong className="text-scout-purple">Note importante :</strong> cette interface gère l'<em>annuaire</em> des adresses
        professionnelles et leurs redirections. Pour activer la réception réelle des mails, le domaine doit être configuré chez un
        fournisseur de routage (Cloudflare Email Routing, gratuit ; ou Google Workspace). Les redirections enregistrées ici servent
        de référence pour la configuration DNS.
      </div>

      {loading ? (
        <div className="mt-10 flex justify-center"><Loader2 className="size-6 animate-spin text-white/60" /></div>
      ) : items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/55">
          Aucune adresse. Créez la première (ex : commissaire@asnk.org).
        </div>
      ) : (
        <div className="mt-8 grid gap-3">
          {items.map((it) => {
            const full = `${it.local_part}@${it.domain}`;
            return (
              <div key={it.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-card p-4">
                <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${it.active ? "bg-scout-green/15 text-scout-green" : "bg-white/5 text-white/40"}`}>
                  <Mail className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-white/45">{it.department ?? "—"}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${it.active ? "bg-scout-green/15 text-scout-green" : "bg-white/10 text-white/55"}`}>
                      {it.active ? "Active" : "Désactivée"}
                    </span>
                  </div>
                  <div className="mt-1 text-base font-medium">{it.function_name}{it.holder_name && <span className="ml-2 text-sm text-white/55">· {it.holder_name}</span>}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/65">
                    <button onClick={() => copy(full)} className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 hover:bg-white/10">
                      {full} <Copy className="size-3" />
                    </button>
                    <span className="text-white/30">→</span>
                    <span className="text-white/70">{it.forward_to}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => toggleActive(it)} className="grid size-9 place-items-center rounded-lg border border-white/10 text-white/75 hover:bg-white/5" title={it.active ? "Désactiver" : "Activer"}>
                    {it.active ? <PowerOff className="size-4" /> : <Power className="size-4" />}
                  </button>
                  <button onClick={() => setEditing(it)} className="grid size-9 place-items-center rounded-lg border border-white/10 text-white/75 hover:bg-white/5">
                    <Pencil className="size-4" />
                  </button>
                  <button onClick={() => remove(it)} className="grid size-9 place-items-center rounded-lg border border-white/10 text-destructive-foreground hover:bg-destructive/15">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <div className="my-10 w-full max-w-xl rounded-3xl border border-white/10 bg-scout-deep p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editing.id ? "Modifier l'adresse" : "Nouvelle adresse"}</h2>
              <button onClick={() => setEditing(null)} className="text-white/55 hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <Field label="Fonction">
                <input
                  value={editing.function_name ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEditing({ ...editing, function_name: v, local_part: editing.id || editing.local_part ? editing.local_part : slug(v) });
                  }}
                  placeholder="Commissaire Provincial"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-scout-green"
                />
              </Field>
              <Field label="Département / Service (optionnel)">
                <input value={editing.department ?? ""} onChange={(e) => setEditing({ ...editing, department: e.target.value })} placeholder="Commissariat Provincial" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-scout-green" />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
                <Field label="Partie locale">
                  <input value={editing.local_part ?? ""} onChange={(e) => setEditing({ ...editing, local_part: e.target.value.toLowerCase() })} placeholder="commissaire" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-scout-green" />
                </Field>
                <div className="pb-2 text-center text-white/45">@</div>
                <Field label="Domaine">
                  <input value={editing.domain ?? DEFAULT_DOMAIN} onChange={(e) => setEditing({ ...editing, domain: e.target.value.toLowerCase() })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-scout-green" />
                </Field>
              </div>
              <Field label="Redirection vers (email personnel)">
                <input type="email" value={editing.forward_to ?? ""} onChange={(e) => setEditing({ ...editing, forward_to: e.target.value })} placeholder="titulaire@gmail.com" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-scout-green" />
              </Field>
              <Field label="Titulaire (optionnel)">
                <input value={editing.holder_name ?? ""} onChange={(e) => setEditing({ ...editing, holder_name: e.target.value })} placeholder="Jack MAKUTANO" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-scout-green" />
              </Field>
              <Field label="Notes internes (optionnel)">
                <textarea rows={2} value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-scout-green" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ordre d'affichage">
                  <input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-scout-green" />
                </Field>
                <Field label="Statut">
                  <div className="flex gap-2">
                    {[true, false].map((s) => (
                      <button key={String(s)} onClick={() => setEditing({ ...editing, active: s })} className={`rounded-full px-4 py-2 text-xs uppercase tracking-wider transition ${(editing.active ?? true) === s ? "bg-scout-green text-scout-deep" : "border border-white/10 text-white/65 hover:bg-white/5"}`}>
                        {s ? "Active" : "Désactivée"}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2 border-t border-white/10 pt-4">
              <button onClick={() => setEditing(null)} className="rounded-full border border-white/15 px-5 py-2 text-sm text-white/75 hover:bg-white/5">Annuler</button>
              <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-scout-green px-5 py-2 text-sm font-medium text-scout-deep hover:opacity-90 disabled:opacity-50">
                {saving && <Loader2 className="size-4 animate-spin" />} Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-wider text-white/55">{label}</span>
      {children}
    </label>
  );
}