import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Search, Loader2, Newspaper, Calendar, FileText, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/cms";

const searchSchema = z.object({
  q: z.string().default(""),
});

export const Route = createFileRoute("/recherche")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Recherche — Scouts du Nord-Kivu" },
      { name: "description", content: "Recherche globale : actualités, événements, documents et galerie." },
    ],
  }),
  component: Page,
});

type Result = {
  kind: "Actualité" | "Événement" | "Document" | "Galerie";
  title: string;
  excerpt?: string;
  date?: string;
  to: string;
  href?: string;
  image?: string;
};

const ICONS = {
  "Actualité": Newspaper,
  "Événement": Calendar,
  "Document": FileText,
  "Galerie": ImageIcon,
} as const;

function Page() {
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [input, setInput] = useState(q);
  const [results, setResults] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInput(q);
  }, [q]);

  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setResults(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const like = `%${term}%`;
      const [posts, events, docs, albums] = await Promise.all([
        supabase.from("posts").select("id, slug, title, excerpt, cover_url, published_at, created_at")
          .eq("status", "published").or(`title.ilike.${like},excerpt.ilike.${like}`).limit(20),
        supabase.from("events").select("id, title, location, starts_at")
          .eq("status", "published").or(`title.ilike.${like},location.ilike.${like}`).limit(20),
        supabase.from("documents").select("id, name, category, file_url")
          .eq("status", "published").or(`name.ilike.${like},category.ilike.${like}`).limit(20),
        supabase.from("albums").select("id, slug, name, description, cover_url")
          .eq("status", "published").or(`name.ilike.${like},description.ilike.${like}`).limit(20),
      ]);
      if (cancelled) return;
      const out: Result[] = [];
      (posts.data ?? []).forEach((p: any) => out.push({
        kind: "Actualité", title: p.title, excerpt: p.excerpt ?? "",
        date: formatDate(p.published_at ?? p.created_at),
        to: "/actualites", image: p.cover_url ?? undefined,
      }));
      (events.data ?? []).forEach((e: any) => out.push({
        kind: "Événement", title: e.title, excerpt: e.location ?? "",
        date: e.starts_at ? formatDate(e.starts_at) : undefined,
        to: "/evenements",
      }));
      (docs.data ?? []).forEach((d: any) => out.push({
        kind: "Document", title: d.name, excerpt: d.category ?? "",
        to: "/documents", href: d.file_url ?? undefined,
      }));
      (albums.data ?? []).forEach((a: any) => out.push({
        kind: "Galerie", title: a.name, excerpt: a.description ?? "",
        to: "/galerie", image: a.cover_url ?? undefined,
      }));
      setResults(out);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ search: { q: input.trim() } });
  };

  return (
    <>
      <PageHero eyebrow="Recherche" title="Trouvez tout ce qui se passe au mouvement." lead="Actualités, événements, documents et galerie — en un seul endroit." />
      <section className="mx-auto max-w-5xl px-5 py-12 lg:px-8">
        <form onSubmit={submit} className="flex gap-2 rounded-full border border-white/15 bg-card p-2">
          <div className="flex flex-1 items-center gap-2 pl-3">
            <Search className="size-4 text-white/50" />
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Rechercher un article, un événement, un document…"
              className="w-full bg-transparent py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
            />
          </div>
          <button type="submit" className="rounded-full bg-scout-green px-5 py-2 text-sm font-medium text-scout-deep transition hover:opacity-90">
            Rechercher
          </button>
        </form>

        <div className="mt-10">
          {loading && (
            <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-white/60" /></div>
          )}
          {!loading && results === null && (
            <p className="text-center text-sm text-white/55">Tapez un mot-clé pour lancer la recherche.</p>
          )}
          {!loading && results && results.length === 0 && (
            <p className="text-center text-sm text-white/55">Aucun résultat pour « {q} ».</p>
          )}
          {!loading && results && results.length > 0 && (
            <ul className="grid gap-3">
              {results.map((r, i) => {
                const Icon = ICONS[r.kind];
                const inner = (
                  <div className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-card p-5 transition hover:border-scout-green/40 hover:bg-white/5">
                    {r.image ? (
                      <img src={r.image} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-scout-green/15 text-scout-green">
                        <Icon className="size-5" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-white/55">
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-scout-green">{r.kind}</span>
                        {r.date && <span>{r.date}</span>}
                      </div>
                      <div className="mt-1 truncate text-base font-medium text-white">{r.title}</div>
                      {r.excerpt && <div className="mt-1 line-clamp-2 text-sm text-white/65">{r.excerpt}</div>}
                    </div>
                  </div>
                );
                return (
                  <Reveal as="li" key={i} delay={i * 40}>
                    {r.href ? (
                      <a href={r.href} target="_blank" rel="noreferrer">{inner}</a>
                    ) : (
                      <Link to={r.to}>{inner}</Link>
                    )}
                  </Reveal>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}