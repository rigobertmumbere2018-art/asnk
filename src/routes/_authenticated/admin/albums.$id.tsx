import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Upload, Trash2, Loader2, Eye, EyeOff, ArrowUp, ArrowDown, Pencil } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { uploadFile, formatBytes, logActivity } from "@/lib/cms";

type Album = { id: string; name: string; kind: "photo" | "video"; slug: string };
type Media = {
  id: string;
  album_id: string;
  kind: "photo" | "video";
  title: string | null;
  caption: string | null;
  url: string;
  storage_path: string | null;
  mime: string | null;
  size: number | null;
  sort_order: number;
  status: "draft" | "published";
};

export const Route = createFileRoute("/_authenticated/admin/albums/$id")({
  head: () => ({ meta: [{ title: "Album — Administration" }] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const [album, setAlbum] = useState<Album | null>(null);
  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<Media | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  async function refresh() {
    setLoading(true);
    const [{ data: alb }, { data: med, error }] = await Promise.all([
      supabase.from("albums").select("id,name,kind,slug").eq("id", id).single(),
      supabase.from("media").select("*").eq("album_id", id).order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
    ]);
    if (error) toast.error(error.message);
    setAlbum((alb ?? null) as Album | null);
    setItems((med ?? []) as Media[]);
    setLoading(false);
  }
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onFiles(files: FileList | null) {
    if (!files || !files.length || !album) return;
    setUploading(true);
    try {
      const baseOrder = items.length;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const r = await uploadFile("media", file, `albums/${album.slug}`);
        const kind: "photo" | "video" = file.type.startsWith("video/") ? "video" : "photo";
        const { error, data } = await supabase
          .from("media")
          .insert({
            album_id: album.id,
            kind,
            url: r.url,
            storage_path: r.path,
            mime: r.mime,
            size: r.size,
            sort_order: baseOrder + i,
            status: "published",
          })
          .select()
          .single();
        if (error) throw error;
        await logActivity("media.uploaded", "media", data?.id, { album: album.name, file: file.name });
      }
      toast.success(`${files.length} fichier(s) ajouté(s)`);
      refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Échec de l'envoi");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function remove(m: Media) {
    if (!confirm("Supprimer ce média ?")) return;
    const { error } = await supabase.from("media").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    if (m.storage_path) {
      await supabase.storage.from("media").remove([m.storage_path]).catch(() => {});
    }
    await logActivity("media.deleted", "media", m.id);
    setItems((list) => list.filter((x) => x.id !== m.id));
  }

  async function togglePublish(m: Media) {
    const next = m.status === "published" ? "draft" : "published";
    const { error } = await supabase.from("media").update({ status: next }).eq("id", m.id);
    if (error) return toast.error(error.message);
    setItems((list) => list.map((x) => (x.id === m.id ? { ...x, status: next } : x)));
  }

  async function move(m: Media, dir: -1 | 1) {
    const i = items.findIndex((x) => x.id === m.id);
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const a = items[i];
    const b = items[j];
    const aOrder = a.sort_order;
    const bOrder = b.sort_order;
    const next = [...items];
    next[i] = { ...b, sort_order: aOrder };
    next[j] = { ...a, sort_order: bOrder };
    setItems(next);
    await Promise.all([
      supabase.from("media").update({ sort_order: bOrder }).eq("id", a.id),
      supabase.from("media").update({ sort_order: aOrder }).eq("id", b.id),
    ]);
  }

  async function saveEdit() {
    if (!editing) return;
    const { error } = await supabase
      .from("media")
      .update({ title: editing.title, caption: editing.caption })
      .eq("id", editing.id);
    if (error) return toast.error(error.message);
    setItems((l) => l.map((x) => (x.id === editing.id ? editing : x)));
    setEditing(null);
    toast.success("Légende enregistrée");
  }

  return (
    <div className="px-5 py-10 lg:px-10 lg:py-12">
      <Link to="/admin/albums" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-white/55 hover:text-white">
        <ArrowLeft className="size-3.5" /> Tous les albums
      </Link>
      <div className="mt-4">
        <AdminPageHeader
          eyebrow={album?.kind === "video" ? "Album vidéos" : "Album photos"}
          title={album?.name ?? "Album"}
          description={`${items.length} média${items.length > 1 ? "s" : ""} dans cet album.`}
          actions={
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-scout-green px-5 text-sm font-medium text-scout-deep transition hover:opacity-90">
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              Ajouter des médias
              <input
                ref={fileInput}
                type="file"
                multiple
                accept={album?.kind === "video" ? "video/*" : "image/*,video/*"}
                className="hidden"
                onChange={(e) => onFiles(e.target.files)}
              />
            </label>
          }
        />
      </div>

      {loading ? (
        <div className="mt-10 flex justify-center"><Loader2 className="size-6 animate-spin text-white/60" /></div>
      ) : items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/55">
          Aucun média. Cliquez sur « Ajouter des médias » pour en téléverser plusieurs à la fois.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m, idx) => (
            <div key={m.id} className="group overflow-hidden rounded-xl border border-white/10 bg-card">
              <div className="relative aspect-square w-full bg-white/5">
                {m.kind === "video" ? (
                  <video src={m.url} className="size-full object-cover" muted />
                ) : (
                  <img src={m.url} alt={m.title ?? ""} className="size-full object-cover" loading="lazy" />
                )}
                <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${m.status === "published" ? "bg-scout-green text-scout-deep" : "bg-black/60 text-white/75"}`}>
                  {m.status === "published" ? "Publié" : "Brouillon"}
                </span>
              </div>
              <div className="p-2.5">
                <div className="truncate text-xs font-medium">{m.title || "Sans titre"}</div>
                <div className="mt-0.5 text-[10px] text-white/45">{formatBytes(m.size)}</div>
                <div className="mt-2 flex items-center justify-between gap-1">
                  <div className="flex gap-0.5">
                    <button onClick={() => move(m, -1)} disabled={idx === 0} className="grid size-7 place-items-center rounded border border-white/10 text-white/65 hover:bg-white/5 disabled:opacity-30"><ArrowUp className="size-3" /></button>
                    <button onClick={() => move(m, 1)} disabled={idx === items.length - 1} className="grid size-7 place-items-center rounded border border-white/10 text-white/65 hover:bg-white/5 disabled:opacity-30"><ArrowDown className="size-3" /></button>
                  </div>
                  <div className="flex gap-0.5">
                    <button onClick={() => setEditing(m)} className="grid size-7 place-items-center rounded border border-white/10 text-white/65 hover:bg-white/5"><Pencil className="size-3" /></button>
                    <button onClick={() => togglePublish(m)} className="grid size-7 place-items-center rounded border border-white/10 text-white/65 hover:bg-white/5">{m.status === "published" ? <EyeOff className="size-3" /> : <Eye className="size-3" />}</button>
                    <button onClick={() => remove(m)} className="grid size-7 place-items-center rounded border border-white/10 text-destructive-foreground hover:bg-destructive/15"><Trash2 className="size-3" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <div className="my-10 w-full max-w-lg rounded-3xl border border-white/10 bg-scout-deep p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Légende du média</h2>
              <button onClick={() => setEditing(null)} className="text-white/55 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <input
                placeholder="Titre"
                value={editing.title ?? ""}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-scout-green"
              />
              <textarea
                placeholder="Légende"
                rows={3}
                value={editing.caption ?? ""}
                onChange={(e) => setEditing({ ...editing, caption: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-scout-green"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-full border border-white/15 px-5 py-2 text-sm text-white/75 hover:bg-white/5">Annuler</button>
              <button onClick={saveEdit} className="rounded-full bg-scout-green px-5 py-2 text-sm font-medium text-scout-deep hover:opacity-90">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}