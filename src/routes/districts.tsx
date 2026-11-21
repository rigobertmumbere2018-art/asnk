import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";

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
  code: string;
  image: string;
  displayName: string;
};

const MEDIA = "https://pub-09215c6a4e1441598c606e92ab2a3793.r2.dev/a/v1/576f8e4d-1ed9-4839-9a34-ca86e6082572";

const DISTRICT_LIST: District[] = [
  { id: "beni-territoire", slug: "beni-territoire", name: "District Scout de Beni Territoire", displayName: "Beni Territoire", code: "DSBT", image: MEDIA + "/0ed3a12f-6f60-471d-9631-3057bf879c16/hero-scouts-drapeau.jpg" },
  { id: "beni-ville", slug: "beni-ville", name: "District Scout de Beni Ville", displayName: "Beni Ville", code: "DSBV", image: MEDIA + "/39529a5e-974c-457d-aead-b08b8f60b56d/jeunesse-groupe.jpg" },
  { id: "butembo", slug: "butembo", name: "District Scout de Butembo", displayName: "Butembo", code: "DSB", image: MEDIA + "/42efcd35-a6de-4a72-8a5c-6dbea0e4f94f/formation-classe.jpg" },
  { id: "goma", slug: "goma", name: "District Scout de Goma", displayName: "Goma", code: "DSG", image: MEDIA + "/6acea410-5e19-4a1f-9d2b-f87a72424883/salongo-marche.jpg" },
  { id: "lubero", slug: "lubero", name: "District Scout de Lubero", displayName: "Lubero", code: "DSL", image: MEDIA + "/76228f31-2608-49c3-aaaa-118dc527bfa0/branches-enfants.jpg" },
  { id: "masisi", slug: "masisi", name: "District Scout de Masisi", displayName: "Masisi", code: "DSM", image: MEDIA + "/94076a1a-9dd2-49ff-a1d5-0f0bec1d8b5a/campagne-anti-incendie.jpg" },
  { id: "mughulungu", slug: "mughulungu", name: "District Scout de Mughulungu", displayName: "Mughulungu", code: "DSMU", image: MEDIA + "/a19e504c-f7e1-40a5-beff-61793eba02a8/grande-chasse-scout.jpg" },
  { id: "nyiragongo", slug: "nyiragongo", name: "District Scout de Nyiragongo", displayName: "Nyiragongo", code: "DSN", image: MEDIA + "/bff9890d-c4a2-47bf-9172-81b17459351b/scouts-community.jpg" },
  { id: "rutshuru", slug: "rutshuru", name: "District Scout de Rutshuru", displayName: "Rutshuru", code: "DSR", image: MEDIA + "/cc8e8114-5842-4217-8fd0-665831fac069/scouts-ecole-paix.jpg" },
  { id: "walikale", slug: "walikale", name: "District Scout de Walikale", displayName: "Walikale", code: "DSW", image: MEDIA + "/ece49a34-6aa4-4983-9dcf-1f4be7ce13e3/ceremonie-passation.jpg" },
  { id: "luholu", slug: "luholu", name: "District Scout de la Luholu", displayName: "Luholu", code: "DSLH", image: MEDIA + "/f8c7a8f6-e8ec-49d9-885e-617eb0d302a1/formation-salle.jpg" },
];

function Page() {
  const [districts, setDistricts] = useState<District[]>(DISTRICT_LIST);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("districts")
        .select("id, slug, name")
        .order("name", { ascending: true });

      if (!active || !Array.isArray(data) || data.length === 0) return;

      const savedBySlug = new Map((data as Array<{ id: string; slug: string; name: string }>).map((district) => [district.slug, district]));
      setDistricts(DISTRICT_LIST.map((fallback) => ({
        ...fallback,
        ...(savedBySlug.get(fallback.slug) ?? {}),
        code: fallback.code,
        image: fallback.image,
        displayName: fallback.displayName,
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
            <Reveal key={district.id} delay={i * 45}>
              <Link
                to="/districts/$slug"
                params={{ slug: district.slug }}
                aria-label={`Ouvrir la fiche du district ${district.displayName} — ${district.code}`}
                className="group block h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition duration-300 hover:-translate-y-1 hover:border-scout-green/50 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-scout-green"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-scout-deep">
                  <img
                    src={district.image}
                    alt="Photographie du mouvement scout de l'ASNK"
                    loading="lazy"
                    className="size-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-scout-deep/75 via-transparent to-transparent" />
                </div>
                <div className="flex min-h-28 flex-col justify-center gap-2 p-5 sm:p-6">
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-scout-green">{district.code}</span>
                  <h2 className="text-xl font-semibold leading-snug text-white">{district.displayName}</h2>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
