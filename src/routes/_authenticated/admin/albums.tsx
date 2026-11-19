import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, Loader2, Eye, EyeOff, Images, ArrowRight } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { slugify, uploadFile, logActivity } from "@/lib/cms";

type Album = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  kind: "photo" | "video";
  sort_order: number;
  status: "draft" | "published";
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/admin/albums")({
  head: () => ({ meta: [{ title: "Galerie — Administration" }] }),
  component: Page,
});

function emptyAlbum(): Partial<Album> {
  return { name: "", slug: "", description: "", cover_url: "", kind: "photo", status: "draft", sort_order: 0 };
}

function Page() {
  const [items, setItems] = useState<Album[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Album> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function refresh() {
    setLoading(true);
    const { data, error } = await supabase
      .from("albums")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    const list = (data ?? []) as Album[];
    setItems(list);
    // counts per album
    if (list.length) {
      const { data: media } = await supabase.from("media").select("album_id");
      const c: Record<string, number> = {};
      (media ?? []).forEach((m: any) => {
        c[m.album_id] = (c[m.album_id] ?? 0) + 1;
      });
      setCounts(c);
    }
    setLoading(false);
  }
  useEffect(() => {
    refresh();
  }, []);

  async function save() {
    if (!editing) return;
    if (!editing.name?.trim()) return toast.error("Le nom est obligatoire");
    setSaving(true);
    const slug = editing.slug?.trim() || slugify(editing.name);
    const payload = {
      name: editing.name.trim(),
      slug,
      description: editing.description?.trim() || null,
      cover_url: editing.cover_url || null,
      kind: (editing.kind ?? "photo") as "photo" | "video",
      status: (editing.status ?? "draft") as "draft" | "published",
      sort_order: editing.sort_order ?? 0,
    };
    const { error, data } = editing.id
      ? await supabase.from("albums").update(payload).eq("id", editing.id).select().single()
      : await supabase.from("albums").insert(payload).select().single();
    setSaving(false);
    if (error) return toast.error(error.message);
    await logActivity(editing.id ? "album.updated" : "album.created", "album", data?.id, { name: payload.name });
    toast.success(editing.id ? "Album mis à jour" : "Album créé");
    setEditing(null);
    refresh();
  }

  async function remove(a: Album) {
    if (!confirm(`Supprimer l'album « ${a.name} » et tous ses médias ?`)) return;
    const { error } = await supabase.from("albums").delete().eq("id", a.id);
    if (error) return toast.error(error.message);
    await logActivity("album.deleted", "album", a.id, { name: a.name });
    toast.success("Album supprimé");
    refresh();
  }

  async function togglePublish(a: Album) {
    const next = a.status === "published" ? "draft" : "published";
    const { error } = await supabase.from("albums").update({ status: next }).eq("id", a.id);
    if (error) return toast.error(error.message);
    await logActivity("album." + next, "album", a.id, { name: a.name });
    refresh();
  }

  async function onUpload(file: File) {
    setUploading(true);
    try {
      const r = await uploadFile("media", file, "albums");
      setEditing((e) => ({ ...(e ?? {}), cover_url: r.url }));
      toast.success("Couverture téléversée");
    } catch (err: any) {
      toast.error(err.message ?? "Échec de l'envoi");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="px-5 py-10 lg:px-10 lg:py-12">
      <AdminPageHeader
        eyebrow="Médias"
        title="Galerie — Albums"
        description="Organisez vos photos et vidéos par albums. Chaque album publié apparaît sur la page Galerie."
        actions={
          <button
            onClick={() => setEditing(emptyAlbum())}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-scout-green px-5 text-sm font-medium text-scout-deep transition hover:opacity-90"
          >
            <Plus className="size-4" /> Nouvel album
          </button>
        }
      />

      {loading ? (
        <div className="mt-10 flex justify-center"><Loader2 className="size-6 animate-spin text-white/60" /></div>
      ) : items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/55">
          <Images className="mx-auto mb-3 size-6 text-white/40" />
          Aucun album. Créez-en un pour commencer à organiser vos médias.
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((a) => (
            <div key={a.id} className="overflow-hidden rounded-2xl border border-white/10 bg-card">
              <div className="relative aspect-[16/10] w-full bg-white/5">
                {a.cover_url ? (
                  <img src={a.cover_url} alt="" className="size-full object-cover" />
                ) : (
                  <div className="size-full bg-gradient-to-br from-scout-purple/30 to-scout-green/30" />
                )}
                <span className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${a.status === "published" ? "bg-scout-green text-scout-deep" : "bg-black/60 text-white/75"}`}>
                  {a.status === "published" ? "Publié" : "Brouillon"}
                </span>
                <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/85">
                  {a.kind === "video" ? "Vidéo" : "Photo"} · {counts[a.id] ?? 0}
                </span>
              </div>
              <div className="p-4">
                <div className="text-base font-medium">{a.name}</div>
                {a.description && <div className="mt-1 line-clamp-2 text-xs text-white/55">{a.description}</div>}
                <div className="mt-4 flex items-center justify-between">
                  <Link
                    to="/admin/albums/$id"
                    params={{ id: a.id }}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-scout-green hover:underline"
                  >
                    Gérer les médias <ArrowRight className="size-3.5" />
                  </Link>
                  <div className="flex gap-1">
                    <button
                      onClick={() => togglePublish(a)}
                      title={a.status === "published" ? "Dépublier" : "Publier"}
                      className="grid size-8 place-items-center rounded-lg border border-white/10 text-white/75 hover:bg-white/5"
                    >
                      {a.status === "published" ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                    <button
                      onClick={() => setEditing(a)}
                      className="grid size-8 place-items-center rounded-lg border border-white/10 text-white/75 hover:bg-white/5"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => remove(a)}
                      className="grid size-8 place-items-center rounded-lg border border-white/10 text-destructive-foreground hover:bg-destructive/15"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "Modifier l'album" : "Nouvel album"}>
          <div className="space-y-4">
            <Field label="Nom de l'album">
              <input
                value={editing.name ?? ""}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-scout-green"
              />
            </Field>
            <Field label="Description">
              <textarea
                rows={3}
                value={editing.description ?? ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-scout-green"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type">
                <div className="flex gap-2">
                  {(["photo", "video"] as const).map((k) => (
                    <button
                      key={k}
                      onClick={() => setEditing({ ...editing, kind: k })}
                      className={`rounded-full px-4 py-2 text-xs uppercase tracking-wider transition ${editing.kind === k ? "bg-scout-green text-scout-deep" : "border border-white/10 text-white/65 hover:bg-white/5"}`}
                    >
                      {k === "photo" ? "Photos" : "Vidéos"}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Ordre">
                <input
                  type="number"
                  value={editing.sort_order ?? 0}
                  onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-scout-green"
                />
              </Field>
            </div>
            <Field label="Image de couverture">
              <div className="flex items-center gap-4">
                {editing.cover_url && (
                  <img src={editing.cover_url} alt="" className="size-20 rounded-xl object-cover" />
                )}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white/85 hover:bg-white/5">
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                  {editing.cover_url ? "Remplacer" : "Téléverser"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
                  />
                </label>
              </div>
            </Field>
            <Field label="Statut">
              <div className="flex gap-2">
                {(["draft", "published"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setEditing({ ...editing, status: s })}
                    className={`rounded-full px-4 py-2 text-xs uppercase tracking-wider transition ${editing.status === s ? "bg-scout-green text-scout-deep" : "border border-white/10 text-white/65 hover:bg-white/5"}`}
                  >
                    {s === "draft" ? "Brouillon" : "Publié"}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <div className="mt-6 flex justify-end gap-2 border-t border-white/10 pt-4">
            <button onClick={() => setEditing(null)} className="rounded-full border border-white/15 px-5 py-2 text-sm text-white/75 hover:bg-white/5">Annuler</button>
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-scout-green px-5 py-2 text-sm font-medium text-scout-deep transition hover:opacity-90 disabled:opacity-50">
              {saving && <Loader2 className="size-4 animate-spin" />}
              Enregistrer
            </button>
          </div>
        </Modal>
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

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div className="my-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-scout-deep p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="text-white/55 hover:text-white">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}