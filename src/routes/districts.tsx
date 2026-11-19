import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { MapPin } from "lucide-react";

export const Route = createFileRoute("/districts")({
  head: () => ({
    meta: [
      { title: "Les Districts — Scouts du Nord-Kivu" },
      { name: "description", content: "Les onze districts scouts placés sous la responsabilité de l'Association des Scouts du Nord-Kivu." },
      { property: "og:title", content: "Les Districts scouts du Nord-Kivu" },
      { property: "og:description", content: "Goma, Nyiragongo, Rutshuru, Luholu, Lubero, Butembo, Beni Ville, Beni Territoire, Mughulungu, Masisi, Walikale." },
    ],
  }),
  component: Page,
});

const DISTRICTS = [
  { code: "DSG", name: "District Scout de Goma" },
  { code: "DSN", name: "District Scout de Nyiragongo" },
  { code: "DSR", name: "District Scout de Rutshuru" },
  { code: "DSL", name: "District Scout de la Luholu" },
  { code: "DSL", name: "District Scout de Lubero" },
  { code: "DSB", name: "District Scout de Butembo" },
  { code: "DSBV", name: "District Scout de Beni Ville" },
  { code: "DSBT", name: "District Scout de Beni Territoire" },
  { code: "DSMU", name: "District Scout de Mughulungu" },
  { code: "DSM", name: "District Scout de Masisi" },
  { code: "DSW", name: "District Scout de Walikale" },
];

function Page() {
  return (
    <>
      <PageHero
        eyebrow="Les Districts"
        title="Onze districts au cœur du Nord-Kivu."
        lead="L'Association des Scouts du Nord-Kivu coordonne onze districts qui structurent le mouvement à travers toute la province."
      />
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DISTRICTS.map((d, i) => (
            <Reveal key={`${d.code}-${i}`} delay={i * 60}>
              <article className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-scout-green/50 hover:bg-white/[0.07]">
                <div className="flex items-start justify-between gap-4">
                  <div className="grid size-11 place-items-center rounded-xl bg-scout-green/15 text-scout-green ring-1 ring-scout-green/20">
                    <MapPin className="size-5" />
                  </div>
                  <span className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
                    {d.code}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold leading-snug text-white">{d.name}</h3>
                <p className="mt-2 text-sm text-white/55">Nord-Kivu · RDC</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}