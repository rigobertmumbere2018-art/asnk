import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, Loader2, Eye, EyeOff } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { slugify, uploadFile, formatDate } from "@/lib/cms";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  cover_url: string | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/admin/posts")({
  head: () => ({ meta: [{ title: "Actualités — Administration" }] }),
  component: Page,
});

function emptyPost(): Partial<Post> {
  return { title: "", slug: "", excerpt: "", body: "", cover_url: "", status: "draft" };
}

function Page() {
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Post> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function refresh() {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as Post[]);
    setLoading(false);
  }
  useEffect(() => {
    refresh();
  }, []);

  async function save() {
    if (!editing) return;
    if (!editing.title?.trim()) return toast.error("Le titre est obligatoire");
    setSaving(true);
    const slug = editing.slug?.trim() || slugify(editing.title);
    const payload = {
      title: editing.title.trim(),
      slug,
      excerpt: editing.excerpt?.trim() || null,
      body: editing.body?.trim() || null,
      cover_url: editing.cover_url || null,
      status: (editing.status ?? "draft") as "draft" | "published",
      published_at:
        editing.status === "published"
          ? editing.published_at ?? new Date().toISOString()
          : null,
    };
    const { error } = editing.id
      ? await supabase.from("posts").update(payload).eq("id", editing.id)
      : await supabase.from("posts").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing.id ? "Article mis à jour" : "Article créé");
    setEditing(null);
    refresh();
  }

  async function remove(id: string) {
    if (!confirm("Supprimer définitivement cet article ?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Supprimé");
    refresh();
  }

  async function togglePublish(p: Post) {
    const next = p.status === "published" ? "draft" : "published";
    const { error } = await supabase
      .from("posts")
      .update({
        status: next,
        published_at: next === "published" ? new Date().toISOString() : null,
      })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    refresh();
  }

  async function onUpload(file: File) {
    setUploading(true);
    try {
      const r = await uploadFile("media", file, "posts");
      setEditing((e) => ({ ...(e ?? {}), cover_url: r.url }));
      toast.success("Image téléversée");
    } catch (err: any) {
      toast.error(err.message ?? "Échec de l'envoi");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="px-5 py-10 lg:px-10 lg:py-12">
      <AdminPageHeader
        eyebrow="Contenu"
        title="Actualités"
        description="Créez, modifiez et publiez les articles affichés sur la page Actualités."
        actions={
          <button
            onClick={() => setEditing(emptyPost())}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-scout-green px-5 text-sm font-medium text-scout-deep transition hover:opacity-90"
          >
            <Plus className="size-4" /> Nouvel article
          </button>
        }
      />

      {loading ? (
        <div className="mt-10 flex justify-center"><Loader2 className="size-6 animate-spin text-white/60" /></div>
      ) : items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/55">
          Aucun article pour le moment. Cliquez sur « Nouvel article » pour commencer.
        </div>
      ) : (
        <div className="mt-8 grid gap-3">
          {items.map((p) => (
            <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-card p-4">
              <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-white/5">
                {p.cover_url ? (
                  <img src={p.cover_url} alt="" className="size-full object-cover" />
                ) : (
                  <div className="size-full bg-gradient-to-br from-scout-purple/30 to-scout-green/30" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                      p.status === "published"
                        ? "bg-scout-green/15 text-scout-green"
                        : "bg-white/5 text-white/55"
                    }`}
                  >
                    {p.status === "published" ? "Publié" : "Brouillon"}
                  </span>
                  <span className="text-xs text-white/45">{formatDate(p.published_at ?? p.created_at)}</span>
                </div>
                <div className="mt-1 truncate text-base font-medium">{p.title}</div>
                {p.excerpt && <div className="truncate text-xs text-white/55">{p.excerpt}</div>}
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => togglePublish(p)}
                  title={p.status === "published" ? "Dépublier" : "Publier"}
                  className="grid size-9 place-items-center rounded-lg border border-white/10 text-white/75 hover:bg-white/5"
                >
                  {p.status === "published" ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
                <button
                  onClick={() => setEditing(p)}
                  className="grid size-9 place-items-center rounded-lg border border-white/10 text-white/75 hover:bg-white/5"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => remove(p.id)}
                  className="grid size-9 place-items-center rounded-lg border border-white/10 text-destructive-foreground hover:bg-destructive/15"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "Modifier l'article" : "Nouvel article"}>
          <div className="space-y-4">
            <Field label="Titre">
              <input
                value={editing.title ?? ""}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-scout-green"
              />
            </Field>
            <Field label="Extrait court">
              <textarea
                rows={2}
                value={editing.excerpt ?? ""}
                onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-scout-green"
              />
            </Field>
            <Field label="Contenu complet">
              <textarea
                rows={8}
                value={editing.body ?? ""}
                onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-scout-green"
              />
            </Field>
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
                {editing.cover_url && (
                  <button
                    onClick={() => setEditing({ ...editing, cover_url: "" })}
                    className="text-xs text-white/55 underline-offset-4 hover:underline"
                  >
                    Retirer
                  </button>
                )}
              </div>
            </Field>
            <Field label="Statut">
              <div className="flex gap-2">
                {(["draft", "published"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setEditing({ ...editing, status: s })}
                    className={`rounded-full px-4 py-2 text-xs uppercase tracking-wider transition ${
                      editing.status === s
                        ? "bg-scout-green text-scout-deep"
                        : "border border-white/10 text-white/65 hover:bg-white/5"
                    }`}
                  >
                    {s === "draft" ? "Brouillon" : "Publié"}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <div className="mt-6 flex justify-end gap-2 border-t border-white/10 pt-4">
            <button
              onClick={() => setEditing(null)}
              className="rounded-full border border-white/15 px-5 py-2 text-sm text-white/75 hover:bg-white/5"
            >
              Annuler
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-scout-green px-5 py-2 text-sm font-medium text-scout-deep transition hover:opacity-90 disabled:opacity-50"
            >
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

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
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