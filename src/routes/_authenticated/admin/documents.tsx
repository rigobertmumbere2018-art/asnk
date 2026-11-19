import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Upload, Loader2, Eye, EyeOff, FileText, Pencil } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { uploadFile, formatBytes } from "@/lib/cms";

type Doc = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  status: "draft" | "published";
};

export const Route = createFileRoute("/_authenticated/admin/documents")({
  head: () => ({ meta: [{ title: "Documents — Administration" }] }),
  component: Page,
});

function Page() {
  const [items, setItems] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Doc> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function refresh() {
    setLoading(true);
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as Doc[]);
    setLoading(false);
  }
  useEffect(() => {
    refresh();
  }, []);

  async function save() {
    if (!editing) return;
    if (!editing.name?.trim()) return toast.error("Nom requis");
    if (!editing.file_url) return toast.error("Fichier requis");
    setSaving(true);
    const payload = {
      name: editing.name.trim(),
      category: editing.category?.trim() || "Général",
      description: editing.description?.trim() || null,
      file_url: editing.file_url,
      file_size: editing.file_size ?? null,
      mime_type: editing.mime_type ?? null,
      status: (editing.status ?? "published") as "draft" | "published",
    };
    const { error } = editing.id
      ? await supabase.from("documents").update(payload).eq("id", editing.id)
      : await supabase.from("documents").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Enregistré");
    setEditing(null);
    refresh();
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ce document ?")) return;
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }

  async function togglePublish(d: Doc) {
    const next = d.status === "published" ? "draft" : "published";
    const { error } = await supabase.from("documents").update({ status: next }).eq("id", d.id);
    if (error) return toast.error(error.message);
    refresh();
  }

  async function onUpload(file: File) {
    setUploading(true);
    try {
      const r = await uploadFile("docs", file);
      setEditing((e) => ({
        ...(e ?? {}),
        file_url: r.url,
        file_size: r.size,
        mime_type: r.mime,
        name: e?.name || file.name,
      }));
      toast.success("Fichier téléversé");
    } catch (err: any) {
      toast.error(err.message ?? "Échec");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="px-5 py-10 lg:px-10 lg:py-12">
      <AdminPageHeader
        eyebrow="Bibliothèque"
        title="Documents"
        description="Statuts, règlements, formulaires et guides téléchargeables."
        actions={
          <button
            onClick={() => setEditing({ category: "Général", status: "published" })}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-scout-green px-5 text-sm font-medium text-scout-deep hover:opacity-90"
          >
            <Plus className="size-4" /> Nouveau document
          </button>
        }
      />

      {loading ? (
        <div className="mt-10 flex justify-center"><Loader2 className="size-6 animate-spin text-white/60" /></div>
      ) : items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/55">
          Aucun document. Ajoutez vos premiers fichiers.
        </div>
      ) : (
        <div className="mt-8 grid gap-3">
          {items.map((d) => (
            <div key={d.id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-card p-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-scout-green/15 text-scout-green">
                <FileText className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-white/45">{d.category}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${d.status === "published" ? "bg-scout-green/15 text-scout-green" : "bg-white/5 text-white/55"}`}>
                    {d.status === "published" ? "Publié" : "Brouillon"}
                  </span>
                </div>
                <div className="mt-1 truncate text-base font-medium">{d.name}</div>
                <div className="text-xs text-white/55">{formatBytes(d.file_size)} · {d.mime_type ?? "fichier"}</div>
              </div>
              <div className="flex shrink-0 gap-1">
                <a href={d.file_url} target="_blank" rel="noreferrer" className="grid size-9 place-items-center rounded-lg border border-white/10 text-white/75 hover:bg-white/5" title="Ouvrir">
                  <FileText className="size-4" />
                </a>
                <button onClick={() => togglePublish(d)} className="grid size-9 place-items-center rounded-lg border border-white/10 text-white/75 hover:bg-white/5">
                  {d.status === "published" ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
                <button onClick={() => setEditing(d)} className="grid size-9 place-items-center rounded-lg border border-white/10 text-white/75 hover:bg-white/5">
                  <Pencil className="size-4" />
                </button>
                <button onClick={() => remove(d.id)} className="grid size-9 place-items-center rounded-lg border border-white/10 text-destructive-foreground hover:bg-destructive/15">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <div className="my-10 w-full max-w-xl rounded-3xl border border-white/10 bg-scout-deep p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editing.id ? "Modifier le document" : "Nouveau document"}</h2>
              <button onClick={() => setEditing(null)} className="text-white/55 hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <Field label="Nom">
                <input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-scout-green" />
              </Field>
              <Field label="Catégorie">
                <input value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} placeholder="Statuts, Règlements, Formulaires…" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-scout-green" />
              </Field>
              <Field label="Description (optionnelle)">
                <textarea rows={3} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-scout-green" />
              </Field>
              <Field label="Fichier">
                <div className="flex items-center gap-4">
                  {editing.file_url && (
                    <a href={editing.file_url} target="_blank" rel="noreferrer" className="truncate text-xs text-scout-green underline-offset-4 hover:underline">
                      Voir le fichier ({formatBytes(editing.file_size)})
                    </a>
                  )}
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white/85 hover:bg-white/5">
                    {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                    {editing.file_url ? "Remplacer" : "Téléverser"}
                    <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
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