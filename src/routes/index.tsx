import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, BadgeCheck, Lightbulb, Award, HandHeart, Users } from "lucide-react";
import heroAsset from "@/assets/hero-scouts-drapeau.jpg.asset.json";

import ceremonyImg from "@/assets/scouts-ceremony.jpg";
import commissaireAsset from "@/assets/commissaire-jack-makutano.jpg.asset.json";
import { Reveal } from "@/components/site/Reveal";
import { Counter } from "@/components/site/Counter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Accueil — Scouts du Nord-Kivu" },
      { name: "description", content: "Le site officiel de l'Association des Scouts du Nord-Kivu (RDC). Un mouvement éducatif au service de la jeunesse, de la paix et du développement communautaire." },
      { property: "og:title", content: "Scouts du Nord-Kivu — Toujours Prêts" },
      { property: "og:description", content: "Un mouvement éducatif au service de la jeunesse du Nord-Kivu." },
      { property: "og:image", content: heroAsset.url },
      { name: "twitter:image", content: heroAsset.url },
    ],
  }),
  component: Index,
});

const VALUES = [
  { icon: ShieldCheck, title: "Intégrité", text: "Tolérance zéro pour la corruption, fiabilité des informations, respect des engagements et de la parole donnée, probité absolue, honnêteté et sincérité." },
  { icon: BadgeCheck, title: "Responsabilité", text: "Capacité à assumer ses actes, ses décisions et leurs conséquences. Conscience professionnelle, redevabilité et dévouement envers l'ASNK, ses membres et ses partenaires." },
  { icon: Lightbulb, title: "Innovation", text: "S'adapter à l'évolution numérique et aux tendances des jeunes ; réexaminer périodiquement nos méthodes pour accroître l'impact du Mouvement scout au Nord-Kivu." },
  { icon: Award, title: "Excellence", text: "Excellence organisationnelle, opérationnelle, administrative et des processus — représentation idéale de la nature éducative du scoutisme dans la société." },
  { icon: HandHeart, title: "Engagement", text: "Implication volontaire des bénévoles avec enthousiasme. Faire vivre les valeurs scoutes pour la paix, la justice et la solidarité dans les communautés." },
  { icon: Users, title: "Diversité", text: "Faire vivre la diversité au sein de l'ASNK : inclure les personnes de tous milieux sociaux, ethniques et de genres, et attirer les meilleurs talents." },
];

function Index() {
  return (
    <>
      {/* HERO */}
      <section className="relative min-h-dvh overflow-hidden">
        <img
          src={heroAsset.url}
          alt="Trois scouts du Nord-Kivu drapés du drapeau de la RDC"
          width={1920}
          height={1440}
          className="absolute inset-0 size-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-scout-deep/70 via-scout-deep/60 to-scout-deep" />
        <div className="absolute inset-0 gradient-radial opacity-50" />

        <div className="relative mx-auto flex min-h-dvh max-w-7xl flex-col justify-end px-5 pb-20 pt-40 lg:px-8 lg:pb-32">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.35em] text-scout-green">
              ASSOCIATION DES SCOUTS DU NORD-KIVU · RDC
            </p>
          </Reveal>
          <Reveal delay={120}>
            <h1 className="mt-5 max-w-4xl text-balance text-5xl font-semibold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
              Préparer la jeunesse à <span className="text-scout-green">bâtir la paix</span> et à servir.
            </h1>
          </Reveal>
          <Reveal delay={240}>
            <p className="mt-6 max-w-2xl text-lg text-white/75">
              Depuis des décennies, nous formons des citoyens éveillés, courageux et solidaires à travers le mouvement scout du Nord-Kivu.
            </p>
          </Reveal>
          <Reveal delay={360}>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/inscription"
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-scout-green px-6 text-sm font-medium text-scout-deep transition-all hover:gap-3 hover:shadow-[0_20px_60px_-20px_color-mix(in_oklab,var(--scout-green)_60%,transparent)]"
              >
                Rejoindre le mouvement
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/mouvement"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 px-6 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/5"
              >
                Découvrir notre mission
              </Link>
            </div>
          </Reveal>

          <Reveal delay={500}>
            <div className="mt-16 grid max-w-3xl grid-cols-2 gap-8 border-t border-white/10 pt-8 sm:grid-cols-4">
              {[
                { v: 32000, s: "+", l: "Jeunes encadrés" },
                { v: 6750, s: "+", l: "Adultes volontaires" },
                { v: 245, s: "", l: "Groupes scouts" },
                { v: 11, s: "", l: "Districts" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-3xl font-semibold text-white sm:text-4xl">
                    <Counter to={s.v} suffix={s.s} />
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-white/55">{s.l}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>


      {/* MESSAGE COMMISSAIRE */}
      <section className="relative bg-gradient-to-b from-transparent via-scout-purple/10 to-transparent">
        <div className="mx-auto max-w-7xl px-5 py-28 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:items-center">
            <Reveal>
              <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-3xl ring-1 ring-white/10">
                <img src={commissaireAsset.url} alt="Jack MAKUTANO, Commissaire Provincial des Scouts du Nord-Kivu" width={800} height={1024} loading="lazy" className="size-full object-cover" />
              </div>
            </Reveal>
            <div>
              <Reveal>
                <p className="text-xs uppercase tracking-[0.3em] text-scout-purple">Message du Commissaire Provincial</p>
              </Reveal>
              <Reveal delay={120}>
                <blockquote className="mt-6 text-balance text-3xl font-medium leading-snug text-white sm:text-4xl">
                  « Le scout du Nord-Kivu se lève chaque matin pour servir. Notre province a besoin de jeunes debout, formés, libres — c'est notre mission. »
                </blockquote>
              </Reveal>
              <Reveal delay={240}>
                <p className="mt-6 text-sm uppercase tracking-wider text-white/55">— Jack MAKUTANO, dit Pekinois · Commissaire Provincial</p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* VALEURS */}
      <section className="mx-auto max-w-7xl px-5 py-28 lg:px-8">
        <div className="max-w-3xl">
          <Reveal><p className="text-xs uppercase tracking-[0.3em] text-scout-green">Nos valeurs</p></Reveal>
          <Reveal delay={100}>
            <h2 className="mt-4 text-balance text-4xl font-semibold text-white sm:text-5xl">
              Les valeurs organisationnelles de l'ASNK.
            </h2>
          </Reveal>
        </div>
        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/5 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 80} className="group bg-scout-deep p-8 transition-colors hover:bg-card">
              <v.icon className="size-7 text-scout-green transition-transform group-hover:scale-110" />
              <h3 className="mt-6 text-xl font-semibold text-white">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{v.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA REJOINDRE */}
      <section className="mx-auto max-w-7xl px-5 pb-28 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10">
            <img src={ceremonyImg} alt="Cérémonie scoute" width={1280} height={960} loading="lazy" className="absolute inset-0 size-full object-cover opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-r from-scout-deep via-scout-deep/80 to-scout-deep/30" />
            <div className="relative grid gap-8 p-10 sm:p-16 lg:grid-cols-2 lg:items-end">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-scout-green">Rejoindre</p>
                <h2 className="mt-4 text-balance text-4xl font-semibold leading-tight text-white sm:text-5xl">
                  Et si vous écriviez la suite avec nous ?
                </h2>
                <p className="mt-5 max-w-xl text-base text-white/70">
                  Que vous soyez un jeune curieux, un groupe constitué, un donateur ou un partenaire, il y a une place pour vous dans le mouvement.
                </p>
              </div>
              <div className="flex flex-wrap justify-start gap-3 lg:justify-end">
                <Link to="/inscription" className="inline-flex h-12 items-center gap-2 rounded-full bg-scout-green px-6 text-sm font-medium text-scout-deep transition hover:opacity-90">
                  S'inscrire
                  <ArrowRight className="size-4" />
                </Link>
                <Link to="/contact" className="inline-flex h-12 items-center rounded-full border border-white/20 px-6 text-sm font-medium text-white transition hover:bg-white/5">
                  Nous écrire
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
