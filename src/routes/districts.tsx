import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/districts")({
  head: () => ({
    meta: [
      { title: "Les Districts — Scouts du Nord-Kivu" },
      { name: "description", content: "Les onze districts scouts placés sous la responsabilité de l'Association des Scouts du Nord-Kivu." },
      { property: "og:title", content: "Les Districts scouts du Nord-Kivu" },
      { property: "og:description", content: "Les fiches officielles des districts de l'ASNK." },
    ],
  }),
  component: Page,
});

type District = {
  id: string;
  slug: string;
  name: string;
  code: string | null;
  description: string | null;
};

const DISTRICT_LIST_FALLBACK: District[] = [
  { id: "beni-territoire", slug: "beni-territoire", name: "District Scout de Beni Territoire", code: "DSBT", description: null },
  { id: "beni-ville", slug: "beni-ville", name: "District Scout de Beni Ville", code: "DSBV", description: null },
  { id: "butembo", slug: "butembo", name: "District Scout de Butembo", code: "DSB", description: null },
  { id: "goma", slug: "goma", name: "District Scout de Goma", code: "DSG", description: null },
  { id: "lubero", slug: "lubero", name: "District Scout de Lubero", code: "DSL", description: null },
  { id: "masisi", slug: "masisi", name: "District Scout de Masisi", code: "DSM", description: null },
  { id: "mughulungu", slug: "mughulungu", name: "District Scout de Mughulungu", code: "DSMU", description: null },
  { id: "nyiragongo", slug: "nyiragongo", name: "District Scout de Nyiragongo", code: "DSN", description: null },
  { id: "rutshuru", slug: "rutshuru", name: "District Scout de Rutshuru", code: "DSR", description: null },
  { id: "walikale", slug: "walikale", name: "District Scout de Walikale", code: "DSW", description: null },
  { id: "luholu", slug: "luholu", name: "District Scout de la Luholu", code: "DSL", description: null },
];

function Page() {
  const [districts, setDistricts] = useState<District[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error: queryError } = await supabase
        .from("districts")
        .select("id, slug, name, code, description")
        .eq("status", "active")
        .order("name", { ascending: true });
      if (!active) return;
      if (queryError) {
        setError(null);
        setDistricts(DISTRICT_LIST_FALLBACK);
      } else {
        setError(null);
        setDistricts((data ?? []) as District[]);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <>
      <PageHero
        eyebrow="Les Districts"
        title="Onze districts au cœur du Nord-Kivu."
        lead="L'Association des Scouts du Nord-Kivu coordonne onze districts qui structurent le mouvement à travers toute la province."
      />
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        {districts === null ? (
          <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-white/60" /></div>
        ) : error ? (
          <p role="status" className="rounded-2xl border border-white/10 bg-card p-8 text-center text-sm text-white/65">
            Les informations des districts ne sont pas disponibles pour le moment.
          </p>
        ) : districts.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-card p-8 text-center text-sm text-white/65">
            Les fiches des districts sont en cours de renseignement.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {districts.map((district, i) => (
              <Reveal key={district.id} delay={i * 60}>
                <Link
                  to="/districts/$slug"
                  params={{ slug: district.slug }}
                  className="group relative block h-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-scout-green/50 hover:bg-white/[0.07]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid size-11 place-items-center rounded-xl bg-scout-green/15 text-scout-green ring-1 ring-scout-green/20">
                      <MapPin className="size-5" />
                    </div>
                    <span className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
                      {district.code || "Code à renseigner"}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold leading-snug text-white">{district.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-white/55">
                    {district.description || "Description : à renseigner"}
                  </p>
                  <span className="mt-5 inline-flex text-xs font-semibold uppercase tracking-wider text-scout-green">
                    Consulter la fiche
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
