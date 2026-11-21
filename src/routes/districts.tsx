import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/districts")({
  head: () => ({
    meta: [
      { title: "Les Districts — Scouts du Nord-Kivu" },
      { name: "description", content: "Découvrez les onze districts de l'Association des Scouts du Nord-Kivu." },
      { property: "og:title", content: "Les Districts scouts du Nord-Kivu" },
      { property: "og:description", content: "Les onze districts de l'ASNK." },
    ],
  }),
  component: Page,
});

type District = {
  id: string;
  slug: string;
  name: string;
  code: string | null;
};

const DISTRICT_LIST: District[] = [
  { id: "beni-territoire", slug: "beni-territoire", name: "District Scout de Beni Territoire", code: "DSBT" },
  { id: "beni-ville", slug: "beni-ville", name: "District Scout de Beni Ville", code: "DSBV" },
  { id: "butembo", slug: "butembo", name: "District Scout de Butembo", code: "DSB" },
  { id: "goma", slug: "goma", name: "District Scout de Goma", code: "DSG" },
  { id: "lubero", slug: "lubero", name: "District Scout de Lubero", code: "DSL" },
  { id: "masisi", slug: "masisi", name: "District Scout de Masisi", code: "DSM" },
  { id: "mughulungu", slug: "mughulungu", name: "District Scout de Mughulungu", code: "DSMU" },
  { id: "nyiragongo", slug: "nyiragongo", name: "District Scout de Nyiragongo", code: "DSN" },
  { id: "rutshuru", slug: "rutshuru", name: "District Scout de Rutshuru", code: "DSR" },
  { id: "walikale", slug: "walikale", name: "District Scout de Walikale", code: "DSW" },
  { id: "luholu", slug: "luholu", name: "District Scout de la Luholu", code: "DSL" },
];

function Page() {
  const [districts, setDistricts] = useState<District[]>(DISTRICT_LIST);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("districts")
        .select("id, slug, name, code")
        .order("name", { ascending: true });

      if (!active || !Array.isArray(data) || data.length === 0) return;

      const savedBySlug = new Map((data as District[]).map((district) => [district.slug, district]));
      setDistricts(DISTRICT_LIST.map((fallback) => ({
        ...fallback,
        ...(savedBySlug.get(fallback.slug) ?? {}),
      })));
    })();

    return () => { active = false; };
  }, []);

  return (
    <>
      <PageHero
        eyebrow="Les Districts"
        title="Onze districts au cœur du Nord-Kivu."
        lead="Explorez les onze districts qui structurent le mouvement scout à travers la province."
      />
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {districts.map((district, i) => (
            <Reveal key={district.id} delay={i * 55}>
              <Link
                to="/districts/$slug"
                params={{ slug: district.slug }}
                aria-label={`Consulter le ${district.name} (${district.code})`}
                className="group relative flex min-h-36 h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition duration-300 hover:-translate-y-1 hover:border-scout-green/50 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-scout-green"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-scout-green">
                    {district.code}
                  </span>
                  <ArrowUpRight className="size-5 text-white/35 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-scout-green" />
                </div>
                <h2 className="mt-8 max-w-[17rem] text-xl font-semibold leading-snug text-white">
                  {district.name}
                </h2>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
