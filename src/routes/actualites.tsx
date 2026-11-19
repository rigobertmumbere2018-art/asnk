import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Calendar, Loader2 } from "lucide-react";
import campagneImg from "@/assets/campagne-anti-incendie.jpg.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/cms";

export const Route = createFileRoute("/actualites")({
  head: () => ({
    meta: [
      { title: "Actualités — Scouts du Nord-Kivu" },
      { name: "description", content: "Suivez l'actualité de l'Association des Scouts du Nord-Kivu : événements, formations, témoignages et engagements." },
      { property: "og:title", content: "Actualités — Scouts du Nord-Kivu" },
      { property: "og:description", content: "Actualités du mouvement scout au Nord-Kivu." },
    ],
  }),
  component: Page,
});

type Article = { id?: string; cat: string; date: string; title: string; excerpt: string; image?: string };

const SEED: Article[] = [
  {
    cat: "Prévention",
    date: "28 juin 2026",
    title: "Campagne anti-incendie — Ensemble, la prévention sauve des vies",
    excerpt: "En ce moment, plusieurs incendies détruisent des maisons et mettent des vies en danger. 4 gestes simples pour agir : vérifiez l'électricité, ne laissez jamais une cuisson sans surveillance, ne fumez pas près de matières inflammables, et gardez un moyen de lutte à portée de main.",
    image: campagneImg.url,
  },
];

function Page() {
  const [articles, setArticles] = useState<Article[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("posts")
        .select("id, title, excerpt, cover_url, published_at, created_at")
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false });
      const fromDb: Article[] = (data ?? []).map((p: any) => ({
        id: p.id,
        cat: "Actualité",
        date: formatDate(p.published_at ?? p.created_at),
        title: p.title,
        excerpt: p.excerpt ?? "",
        image: p.cover_url ?? undefined,
      }));
      setArticles(fromDb.length > 0 ? fromDb : SEED);
    })();
  }, []);

  return (
    <>
      <PageHero eyebrow="Actualités" title="Les nouvelles du mouvement, en continu." lead="Articles, reportages, témoignages et annonces officielles de l'Association." />
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        {articles === null ? (
          <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-white/60" /></div>
        ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((a, i) => (
            <Reveal key={i} delay={i * 100}>
              <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-card transition hover:border-scout-green/40">
                <div className="aspect-[16/10] overflow-hidden">
                  {a.image ? (
                    <img src={a.image} alt={a.title} loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="size-full bg-gradient-to-br from-scout-purple/30 to-scout-green/30" />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-white/55">
                    <span className="rounded-full bg-white/5 px-3 py-1 text-scout-green">{a.cat}</span>
                    <span className="inline-flex items-center gap-1"><Calendar className="size-3" /> {a.date}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-white">{a.title}</h3>
                  <p className="mt-3 flex-1 text-sm text-white/65">{a.excerpt}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        )}
      </section>
    </>
  );
}