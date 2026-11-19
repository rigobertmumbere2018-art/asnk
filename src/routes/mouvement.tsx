import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { 
  Users, 
  BookOpen, 
  HeartHandshake, 
  Award, 
  Lightbulb, 
  Globe, 
  Network, 
  MessageSquare, 
  TrendingUp, 
  Coins, 
  Cpu, 
  Gamepad2, 
  UserCheck, 
  Heart, 
  ShieldAlert, 
  Scale, 
  Handshake, 
  Leaf, 
  Church,
  ScrollText,
  Users2,
  Settings
} from "lucide-react";
import chasseAsset from "@/assets/grande-chasse-scout.jpg.asset.json";
const community = chasseAsset.url;

export const Route = createFileRoute("/mouvement")({
  head: () => ({
    meta: [
      { title: "Qui sommes-nous — ASNK · Scouts du Nord-Kivu (RDC)" },
      {
        name: "description",
        content:
          "Découvrez l'Association des Scouts du Nord-Kivu (ASNK) : histoire depuis 1923, mission éducative, vision 2030, gouvernance et 13 départements au service de 32 000+ jeunes en RDC.",
      },
      { name: "keywords", content: "ASNK, Scouts du Nord-Kivu, scoutisme RDC, Goma, Bukavu, éducation des jeunes, mouvement scout, Congo" },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Qui sommes-nous — ASNK · Scouts du Nord-Kivu" },
      {
        property: "og:description",
        content:
          "Histoire, mission, vision 2030 et organisation de l'Association des Scouts du Nord-Kivu (RDC).",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/mouvement" },
      { property: "og:site_name", content: "Scouts du Nord-Kivu" },
      { property: "og:image", content: community },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Qui sommes-nous — ASNK · Scouts du Nord-Kivu" },
      {
        name: "twitter:description",
        content: "Histoire, mission et organisation de l'Association des Scouts du Nord-Kivu (RDC).",
      },
      { name: "twitter:image", content: community },
    ],
    links: [{ rel: "canonical", href: "/mouvement" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "NGO",
          name: "Association des Scouts du Nord-Kivu",
          alternateName: "ASNK",
          url: "/mouvement",
          logo: "/favicon.ico",
          foundingDate: "1994",
          areaServed: {
            "@type": "AdministrativeArea",
            name: "Nord-Kivu, République Démocratique du Congo",
          },
          description:
            "Association des Scouts du Nord-Kivu (ASNK) : mouvement éducatif au service de plus de 32 000 jeunes sur 11 districts, encadrés par 6 750 adultes volontaires au sein de 245 groupes scouts.",
          sameAs: ["https://www.facebook.com/scoutsdunordkivu"],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Accueil", item: "/" },
            { "@type": "ListItem", position: 2, name: "Qui sommes-nous", item: "/mouvement" },
          ],
        }),
      },
    ],
  }),
  component: Page,
});

const ADULTE_PILLARS = [
  { icon: Users, title: "Recrutement & Accueil", text: "Accompagner l'intégration de nouveaux bénévoles dans le mouvement." },
  { icon: BookOpen, title: "Formation", text: "Ateliers, séminaires et perfectionnement conformes aux orientations nationales." },
  { icon: HeartHandshake, title: "Encadrement", text: "Soutien continu et valorisation des responsables à tous les niveaux." },
  { icon: Award, title: "Leadership", text: "Développement du leadership et partage des expériences entre pairs." },
  { icon: Lightbulb, title: "Compétences", text: "Renforcement des capacités pour une éducation scoute de qualité." },
  { icon: Globe, title: "Scoutisme Mondial", text: "Alignement sur les principes du Scoutisme Mondial et des orientations nationales." },
];

const DIRECTION_DEPARTMENTS = [
  { icon: Handshake, title: "Relations publiques" },
  { icon: MessageSquare, title: "Communication et Suivi" },
  { icon: TrendingUp, title: "Expansion du Mouvement" },
  { icon: Coins, title: "Finances" },
  { icon: Cpu, title: "Numérique et Innovation" },
];

const ANIMATION_DEPARTMENTS = [
  { icon: Gamepad2, title: "Programme des Jeunes" },
  { icon: UserCheck, title: "Adultes dans le scoutisme" },
  { icon: Heart, title: "Développement communautaire" },
  { icon: ShieldAlert, title: "Genre, inclusion & Protection" },
  { icon: Scale, title: "Bonne Gouvernance & Audit" },
  { icon: Users2, title: "Partenariats" },
  { icon: Leaf, title: "Écologie & Environnement" },
  { icon: Church, title: "Aumônerie Provinciale" },
];

function Page() {
  return (
    <>
      <PageHero
        eyebrow="Qui sommes-nous"
        title="Une histoire d'engagement, une structure pour l'avenir."
        lead="Le scoutisme au Nord-Kivu s’inscrit dans la dynamique de l’expansion du mouvement scout en République Démocratique du Congo, introduit durant la période coloniale et consolidé après la Seconde Guerre mondiale."
      />

      {/* HISTOIRE */}
      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-start">
          <div className="space-y-6 text-white/75">
            <Reveal>
              <h2 className="text-3xl font-semibold text-white">Notre Histoire</h2>
            </Reveal>
            <Reveal delay={100}>
              <div className="space-y-4">
                <p>
                  Dans la région du Kivu, le scoutisme débute à Bukavu, au collège Alfajiri, avec la création de la première troupe par le Père Georges Defour, initialement destinée aux enfants des colons. Par la suite, le Mouvement scout s’étend progressivement à d’autres centres, notamment Goma, où il est implanté par le Père Aubret à travers une meute de louveteaux.
                </p>
                <p>
                  Au fil des années, le scoutisme connaît une expansion remarquable dans plusieurs localités du Nord-Kivu, notamment à Rutshuru, Walikale, Masisi, Lubero et Beni. Cette croissance est marquée par la création de nombreuses unités scoutes et par une meilleure structuration du mouvement.
                </p>
                <p>
                  Un tournant décisif intervient en 1994 avec la tenue de la première conférence provinciale du Nord-Kivu. Cette rencontre permet l’adoption d’un règlement d’ordre intérieur et la structuration officielle de l’Association des Scouts du Nord-Kivu (ASNK), reconnue comme membre de la Fédération des Scouts du Congo (FESCO).
                </p>
                <p className="text-sm italic text-white/50">
                  (Source : Travail des FA présente par Isidore MWAMBA DIBA 2019)
                </p>
              </div>
            </Reveal>
          </div>
          <Reveal delay={200}>
            <div className="aspect-[4/5] overflow-hidden rounded-3xl lg:mt-12">
              <img src={community} alt="Scouts en action" loading="lazy" className="size-full object-cover" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section className="bg-white/5 py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-3">
            <Reveal className="space-y-4">
              <h3 className="text-2xl font-semibold text-white">Notre mission</h3>
              <p className="text-white/70">« Contribuer à l'éducation des jeunes, via un système de valeurs pour bâtir un monde meilleur où chacun s'épanouit et joue un rôle constructif dans la société. »</p>
            </Reveal>
            <Reveal delay={100} className="space-y-4">
              <h3 className="text-2xl font-semibold text-white">Notre vision 2030</h3>
              <p className="text-white/70">« Être une organisation crédible et solidaire transformant la jeunesse de la province en une génération engagée, innovante et connectée, actrice de paix dans les communautés locales. »</p>
            </Reveal>
            <Reveal delay={200} className="space-y-4">
              <h3 className="text-2xl font-semibold text-white">Notre méthode</h3>
              <p className="text-white/70">Apprendre par l'action, vivre en petits groupes, suivre une progression personnelle, vivre dans la nature, et placer chaque jeune face à des défis qui le grandissent.</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ORGANISATION GOUVERNANCE */}
      <section className="mx-auto max-w-7xl px-5 py-28 lg:px-8">
        <Reveal>
          <h2 className="text-3xl font-semibold text-white">Les Organes de gestion de l’ASNK</h2>
          <p className="mt-4 max-w-2xl text-white/70">À chacun de 3 niveaux de l’ASNK (Provincial, District et Groupe) nous disposons de trois organes complémentaires :</p>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            { title: "La Conférence / AG", text: "Organe chargé de la conception, d’inspiration, d’orientation et de décision au niveau de l'ASNK." },
            { title: "Le Comité Provincial", text: "Organe de caution morale, de suivi et de contrôle des actions de l'Équipe provinciale." },
            { title: "L’Organe Exécutif", text: "Chargé de la gestion quotidienne et de l’exécution des décisions de la Conférence." },
          ].map((item, i) => (
            <Reveal key={item.title} delay={i * 100} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h4 className="text-lg font-semibold text-scout-green">{item.title}</h4>
              <p className="mt-3 text-sm text-white/60">{item.text}</p>
            </Reveal>
          ))}
        </div>

        <div className="mt-28">
          <Reveal>
            <h2 className="text-3xl font-semibold text-white">Mise en œuvre des activités</h2>
            <p className="mt-4 max-w-3xl text-white/70">
              Les activités sont mises en œuvre par une Équipe provinciale structurée en commissariats (ou Départements) pour appuyer le programme du Commissaire provincial (Mandat 2025 – 2028).
            </p>
          </Reveal>

          <div className="mt-16 grid gap-12 lg:grid-cols-2">
            <div>
              <Reveal className="flex items-center gap-3">
                <Settings className="size-6 text-scout-green" />
                <h3 className="text-xl font-semibold text-white">La Direction du Mouvement</h3>
              </Reveal>
              <div className="mt-6 space-y-3">
                {DIRECTION_DEPARTMENTS.map((dept, i) => (
                  <Reveal key={dept.title} delay={i * 50} className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <dept.icon className="size-5 text-scout-green/70" />
                    <span className="text-sm font-medium text-white/80">{dept.title}</span>
                  </Reveal>
                ))}
              </div>
            </div>

            <div>
              <Reveal className="flex items-center gap-3">
                <ScrollText className="size-6 text-scout-purple" />
                <h3 className="text-xl font-semibold text-white">L’Animation du Mouvement</h3>
              </Reveal>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {ANIMATION_DEPARTMENTS.map((dept, i) => (
                  <Reveal key={dept.title} delay={i * 50} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <dept.icon className="size-5 text-scout-purple/70" />
                    <span className="text-xs font-medium text-white/80">{dept.title}</span>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>

          <Reveal delay={400} className="mt-12 rounded-2xl border border-scout-green/20 bg-scout-green/5 p-8">
            <p className="text-sm leading-relaxed text-white/80">
              Les Responsables des départements de l’Animation du Mouvement sont assistés par des Chefs techniques en tant qu’experts et/ou des Chefs de Pools selon leur situation géographique (Nord ou Sud de la province).
            </p>
          </Reveal>
        </div>

        <div className="mt-24 grid gap-12 lg:grid-cols-2">
          <Reveal>
            <h3 className="text-2xl font-semibold text-white">Services d'appui</h3>
            <ul className="mt-6 space-y-4">
              {[
                "Secrétariat Exécutif Provincial",
                "Intendance Provinciale",
                "Intendance Provinciale Adjointe",
                "Communication visuelle et Multimédias",
              ].map((service, i) => (
                <li key={i} className="flex items-center gap-3 text-white/70">
                  <div className="size-1.5 rounded-full bg-scout-green" />
                  {service}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={100}>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <h3 className="text-2xl font-semibold text-white">Comité Provincial</h3>
              <p className="mt-4 text-white/70">
                Composé de 8 membres, cet organe est chargé de veiller aux actes de gestion du Commissaire provincial et de son Équipe.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ADULTES DANS LE SCOUTISME */}
      <section className="relative overflow-hidden border-t border-white/10">
        <div className="absolute inset-0 bg-scout-purple/5" />
        <div className="relative mx-auto max-w-7xl px-5 py-28 lg:px-8">
          <div className="max-w-3xl">
            <Reveal>
              <p className="text-xs uppercase tracking-[0.3em] text-scout-green">Engagement bénévole</p>
            </Reveal>
            <Reveal delay={100}>
              <h2 className="mt-4 text-balance text-4xl font-semibold text-white sm:text-5xl">
                Adultes dans le <span className="text-scout-green">Scoutisme</span>
              </h2>
            </Reveal>
          </div>

          <div className="mt-16 grid gap-16 lg:grid-cols-2">
            <div className="space-y-6 text-white/75">
              <Reveal>
                <p>
                  Les adultes bénévoles constituent l'un des piliers essentiels de l'Association des Scouts du Nord-Kivu. Par leur disponibilité, leur expérience et leur engagement, ils accompagnent les jeunes dans leur développement personnel, leur apprentissage du leadership et leur service envers la communauté.
                </p>
              </Reveal>
              <Reveal delay={100}>
                <p>
                  Au sein de notre Province, nous croyons qu'un adulte bien formé, motivé et soutenu est un acteur indispensable à la qualité de l'éducation scoute. C'est pourquoi nous nous engageons à favoriser un environnement où chaque bénévole peut développer ses compétences, exercer ses responsabilités avec confiance et contribuer pleinement à la mission du Scoutisme.
                </p>
              </Reveal>
            </div>

            <div className="space-y-4">
              {ADULTE_PILLARS.map((p, i) => (
                <Reveal key={p.title} delay={i * 80}>
                  <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.06]">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-scout-green/15 text-scout-green">
                      <p.icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">{p.title}</h3>
                      <p className="mt-1 text-sm text-white/60">{p.text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
