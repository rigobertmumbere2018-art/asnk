import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { supabase } from "@/integrations/supabase/client";
import ceremonie from "@/assets/gallery/ceremonie-passation.jpg.asset.json";
import branchesEnfants from "@/assets/gallery/branches-enfants.jpg.asset.json";
import salongoMarche from "@/assets/gallery/salongo-marche.jpg.asset.json";
import salongoVille from "@/assets/gallery/salongo-ville.jpg.asset.json";
import jeunesseGroupe from "@/assets/gallery/jeunesse-groupe.jpg.asset.json";
import formationClasse from "@/assets/gallery/formation-classe.jpg.asset.json";
import formationSalle from "@/assets/gallery/formation-salle.jpg.asset.json";
import partenariatVsi from "@/assets/gallery/partenariat-vsi.jpg.asset.json";

export const Route = createFileRoute("/galerie")({
  head: () => ({
    meta: [
      { title: "Galerie — Scouts du Nord-Kivu" },
      { name: "description", content: "Photos et reportages visuels des activités, camps et événements scouts du Nord-Kivu." },
      { property: "og:title", content: "Galerie — Scouts du Nord-Kivu" },
      { property: "og:description", content: "Photos des activités scoutes du Nord-Kivu." },
    ],
  }),
  component: Page,
});

type Photo = { src: string; caption: string };
type Album = { id: string; title: string; description: string; kind: "photo" | "video"; photos: Photo[] };

const SEED_ALBUMS: Album[] = [
  {
    id: "ceremonies",
    title: "Cérémonies & Vie associative",
    description: "Moments forts, passations et levées des couleurs.",
    kind: "photo",
    photos: [
      { src: ceremonie.url, caption: "Levée des couleurs et passation — Goma" },
    ],
  },
  {
    id: "formation",
    title: "Formation des cadres",
    description: "Sessions de formation, séminaires et renforcement des capacités.",
    kind: "photo",
    photos: [
      { src: formationClasse.url, caption: "Session de formation des chefs scouts" },
      { src: formationSalle.url, caption: "Atelier des cadres de l'ASNK" },
    ],
  },
  {
    id: "action",
    title: "Action communautaire",
    description: "Salongo, assainissement et services rendus à la cité.",
    kind: "photo",
    photos: [
      { src: salongoMarche.url, caption: "Marche communautaire pour l'assainissement" },
      { src: salongoVille.url, caption: "Salongo dans le centre-ville de Goma" },
    ],
  },
  {
    id: "jeunesse",
    title: "Jeunesse & Branches",
    description: "Louveteaux, éclaireurs et scouts en activité.",
    kind: "photo",
    photos: [
      { src: branchesEnfants.url, caption: "Rassemblement des branches enfants" },
      { src: jeunesseGroupe.url, caption: "Scouts en sortie pédagogique" },
    ],
  },
  {
    id: "partenariats",
    title: "Partenariats",
    description: "Rencontres avec nos partenaires nationaux et internationaux.",
    kind: "photo",
    photos: [
      { src: partenariatVsi.url, caption: "Échange avec nos partenaires internationaux" },
    ],
  },
];

function Page() {
  const [albums, setAlbums] = useState<Album[]>(SEED_ALBUMS);

  useEffect(() => {
    (async () => {
      const { data: alb } = await supabase
        .from("albums")
        .select("id, name, description, kind, sort_order")
        .eq("status", "published")
        .order("sort_order", { ascending: true });
      if (!alb || alb.length === 0) return;
      const ids = alb.map((a) => a.id);
      const { data: med } = await supabase
        .from("media")
        .select("album_id, url, title, caption, kind, sort_order")
        .in("album_id", ids)
        .eq("status", "published")
        .order("sort_order", { ascending: true });
      const grouped: Album[] = alb
        .map((a) => ({
          id: a.id,
          title: a.name,
          description: a.description ?? "",
          kind: (a.kind ?? "photo") as "photo" | "video",
          photos: (med ?? [])
            .filter((m) => m.album_id === a.id)
            .map((m) => ({ src: m.url, caption: m.caption || m.title || "" })),
        }))
        .filter((a) => a.photos.length > 0);
      if (grouped.length > 0) setAlbums(grouped);
    })();
  }, []);

  const ALL_PHOTOS: Photo[] = albums.flatMap((a) => a.photos);
  const [activeAlbum, setActiveAlbum] = useState<string>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const visible: Photo[] =
    activeAlbum === "all"
      ? ALL_PHOTOS
      : albums.find((a) => a.id === activeAlbum)?.photos ?? [];

  const close = useCallback(() => setLightboxIndex(null), []);
  const prev = useCallback(
    () => setLightboxIndex((i) => (i === null ? null : (i - 1 + visible.length) % visible.length)),
    [visible.length],
  );
  const next = useCallback(
    () => setLightboxIndex((i) => (i === null ? null : (i + 1) % visible.length)),
    [visible.length],
  );

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxIndex, close, prev, next]);

  return (
    <>
      <PageHero eyebrow="Galerie" title="Le mouvement, en images." />

      <section className="mx-auto max-w-7xl px-5 pb-8 pt-12 lg:px-8">
        <div className="flex flex-wrap gap-2">
          <FilterChip active={activeAlbum === "all"} onClick={() => setActiveAlbum("all")}>
            Tous ({ALL_PHOTOS.length})
          </FilterChip>
          {albums.map((a) => (
            <FilterChip
              key={a.id}
              active={activeAlbum === a.id}
              onClick={() => setActiveAlbum(a.id)}
            >
              {a.title} ({a.photos.length})
            </FilterChip>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 lg:px-8">
        {activeAlbum === "all" ? (
          <div className="space-y-16">
            {albums.map((album) => {
              const offset = albums.slice(0, albums.indexOf(album)).reduce(
                (acc, a) => acc + a.photos.length,
                0,
              );
              return (
                <div key={album.id}>
                  <Reveal>
                    <div className="mb-6 flex items-end justify-between gap-4 border-b border-white/10 pb-4">
                      <div>
                        <h2 className="text-2xl font-semibold text-foreground lg:text-3xl">{album.title}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{album.description}</p>
                      </div>
                      <span className="shrink-0 text-xs uppercase tracking-[0.2em] text-scout-green">
                        {album.photos.length} photo{album.photos.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </Reveal>
                  <Grid
                    photos={album.photos}
                    onOpen={(localIndex) => setLightboxIndex(offset + localIndex)}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <Grid photos={visible} onOpen={(i) => setLightboxIndex(i)} />
        )}
      </section>

      {lightboxIndex !== null && visible[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={close}
        >
          <button
            aria-label="Fermer"
            onClick={close}
            className="absolute right-4 top-4 grid size-11 place-items-center rounded-full border border-white/20 bg-white/5 text-white transition hover:bg-white/10"
          >
            <X className="size-5" />
          </button>
          {visible.length > 1 && (
            <>
              <button
                aria-label="Précédent"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-3 grid size-12 place-items-center rounded-full border border-white/20 bg-white/5 text-white transition hover:bg-white/10 lg:left-8"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                aria-label="Suivant"
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-3 grid size-12 place-items-center rounded-full border border-white/20 bg-white/5 text-white transition hover:bg-white/10 lg:right-8"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}
          <figure
            className="mx-auto flex max-h-[88vh] max-w-6xl flex-col items-center gap-3 px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={visible[lightboxIndex].src}
              alt={visible[lightboxIndex].caption}
              className="max-h-[80vh] w-auto rounded-lg object-contain"
            />
            <figcaption className="text-center text-sm text-white/80">
              {visible[lightboxIndex].caption}
              <span className="ml-2 text-white/40">
                · {lightboxIndex + 1} / {visible.length}
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-full border px-4 py-2 text-sm transition " +
        (active
          ? "border-scout-green bg-scout-green text-scout-deep"
          : "border-white/15 text-white/80 hover:bg-white/5")
      }
    >
      {children}
    </button>
  );
}

function Grid({ photos, onOpen }: { photos: Photo[]; onOpen: (i: number) => void }) {
  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [column-fill:_balance]">
      {photos.map((p, i) => (
        <Reveal key={p.src + i} delay={i * 50} className="mb-4 block break-inside-avoid">
          <button
            onClick={() => onOpen(i)}
            className="group relative block w-full overflow-hidden rounded-2xl"
          >
            <img
              src={p.src}
              alt={p.caption}
              loading="lazy"
              className="w-full transition-transform duration-700 group-hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-4 bg-gradient-to-t from-black/80 to-transparent p-4 text-left opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <p className="text-sm font-medium text-white">{p.caption}</p>
            </div>
          </button>
        </Reveal>
      ))}
    </div>
  );
}