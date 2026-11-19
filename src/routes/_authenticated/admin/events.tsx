import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, Loader2, Eye, EyeOff, MapPin, Calendar } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { slugify, uploadFile } from "@/lib/cms";

type Ev = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  cover_url: string | null;
  status: "draft" | "published";
};

export const Route = createFileRoute("/_authenticated/admin/events")({
  head: () => ({ meta: [{ title: "Événements — Administration" }] }),
  component: Page,
});

function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

function empty(): Partial<Ev> {
  return { title: "", description: "", location: "", starts_at: new Date().toISOString(), status: "draft" };
}

function Page() {
  const [items, setItems] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Ev> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function refresh() {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("starts_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as Ev[]);
    setLoading(false);
  }
  useEffect(() => {
    refresh();
  }, []);

  async function save() {
    if (!editing) return;
    if (!editing.title?.trim()) return toast.error("Titre requis");
    if (!editing.starts_at) return toast.error("Date de début requise");
    setSaving(true);
    const payload = {
      title: editing.title.trim(),
      slug: editing.slug?.trim() || slugify(editing.title),
      description: editing.description?.trim() || null,
      location: editing.location?.trim() || null,
      starts_at: new Date(editing.starts_at).toISOString(),
      ends_at: editing.ends_at ? new Date(editing.ends_at).toISOString() : null,
      cover_url: editing.cover_url || null,
      status: (editing.status ?? "draft") as "draft" | "published",
    };
    const { error } = editing.id
      ? await supabase.from("events").update(payload).eq("id", editing.id)
      : await supabase.from("events").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Enregistré");
    setEditing(null);
    refresh();
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cet événement ?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }

  async function togglePublish(ev: Ev) {
    const next = ev.status === "published" ? "draft" : "published";
    const { error } = await supabase.from("events").update({ status: next }).eq("id", ev.id);
    if (error) return toast.error(error.message);
    refresh();
  }

  async function onUpload(file: File) {
    setUploading(true);
    try {
      const r = await uploadFile("media", file, "events");
      setEditing((e) => ({ ...(e ?? {}), cover_url: r.url }));
    } catch (err: any) {
      toast.error(err.message ?? "Échec");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="px-5 py-10 lg:px-10 lg:py-12">
      <AdminPageHeader
        eyebrow="Contenu"
        title="Événements"
        description="Planifiez et publiez les camps, formations et assemblées."
        actions={
          <button
            onClick={() => setEditing(empty())}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-scout-green px-5 text-sm font-medium text-scout-deep hover:opacity-90"
          >
            <Plus className="size-4" /> Nouvel événement
          </button>
        }
      />

      {loading ? (
        <div className="mt-10 flex justify-center"><Loader2 className="size-6 animate-spin text-white/60" /></div>
      ) : items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/55">
          Aucun événement programmé.
        </div>
      ) : (
        <div className="mt-8 grid gap-3">
          {items.map((ev) => (
            <div key={ev.id} className="rounded-2xl border border-white/10 bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${ev.status === "published" ? "bg-scout-green/15 text-scout-green" : "bg-white/5 text-white/55"}`}>
                      {ev.status === "published" ? "Publié" : "Brouillon"}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold">{ev.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-white/60">
                    <span className="inline-flex items-center gap-1"><Calendar className="size-3 text-scout-green" /> {new Date(ev.starts_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</span>
                    {ev.location && <span className="inline-flex items-center gap-1"><MapPin className="size-3 text-scout-green" /> {ev.location}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => togglePublish(ev)} className="grid size-9 place-items-center rounded-lg border border-white/10 text-white/75 hover:bg-white/5">
                    {ev.status === "published" ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                  <button onClick={() => setEditing(ev)} className="grid size-9 place-items-center rounded-lg border border-white/10 text-white/75 hover:bg-white/5">
                    <Pencil className="size-4" />
                  </button>
                  <button onClick={() => remove(ev.id)} className="grid size-9 place-items-center rounded-lg border border-white/10 text-destructive-foreground hover:bg-destructive/15">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <div className="my-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-scout-deep p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editing.id ? "Modifier l'événement" : "Nouvel événement"}</h2>
              <button onClick={() => setEditing(null)} className="text-white/55 hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <Field label="Titre">
                <input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-scout-green" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Début">
                  <input type="datetime-local" value={toLocalInput(editing.starts_at)} onChange={(e) => setEditing({ ...editing, starts_at: new Date(e.target.value).toISOString() })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-scout-green" />
                </Field>
                <Field label="Fin (optionnel)">
                  <input type="datetime-local" value={toLocalInput(editing.ends_at)} onChange={(e) => setEditing({ ...editing, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-scout-green" />
                </Field>
              </div>
              <Field label="Lieu">
                <input value={editing.location ?? ""} onChange={(e) => setEditing({ ...editing, location: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-scout-green" />
              </Field>
              <Field label="Description">
                <textarea rows={5} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-scout-green" />
              </Field>
              <Field label="Image de couverture">
                <div className="flex items-center gap-4">
                  {editing.cover_url && <img src={editing.cover_url} alt="" className="size-20 rounded-xl object-cover" />}
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white/85 hover:bg-white/5">
                    {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                    {editing.cover_url ? "Remplacer" : "Téléverser"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
                  </label>
                </div>
              </Field>
              <Field label="Statut">
                <div className="flex gap-2">
                  {(["draft", "published"] as const).map((s) => (
                    <button key={s} onClick={() => setEditing({ ...editing, status: s })} className={`rounded-full px-4 py-2 text-xs uppercase tracking-wider transition ${editing.status === s ? "bg-scout-green text-scout-deep" : "border border-white/10 text-white/65 hover:bg-white/5"}`}>
                      {s === "draft" ? "Brouillon" : "Publié"}
                    </button>
                  ))}
                </div>
              </Field>
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