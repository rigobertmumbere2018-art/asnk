import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Calendar, MapPin, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/cms";

export const Route = createFileRoute("/evenements")({
  head: () => ({
    meta: [
      { title: "Événements — Scouts du Nord-Kivu" },
      { name: "description", content: "Calendrier des camps, formations, assemblées et événements officiels des Scouts du Nord-Kivu." },
      { property: "og:title", content: "Événements — Scouts du Nord-Kivu" },
      { property: "og:description", content: "Camps, formations et événements scouts au Nord-Kivu." },
    ],
  }),
  component: Page,
});

type Evt = { t: string; d: string; h: string; l: string };

const SEED: Evt[] = [
  { t: "Assemblée Provinciale Annuelle", d: "À programmer", h: "Toute la journée", l: "Goma" },
  { t: "Camp Provincial des Éclaireurs", d: "À programmer", h: "5 jours", l: "Site naturel à définir" },
  { t: "Formation des Chefs", d: "À programmer", h: "Week-end", l: "Centre scout, Goma" },
];

function Page() {
  const [events, setEvents] = useState<Evt[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("title, location, starts_at, ends_at")
        .eq("status", "published")
        .order("starts_at", { ascending: true });
      const mapped: Evt[] = (data ?? []).map((e: any) => {
        const d = e.starts_at ? formatDate(e.starts_at) : "À programmer";
        const h = e.starts_at
          ? new Date(e.starts_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
          : "Heure à confirmer";
        return { t: e.title, d, h, l: e.location ?? "Lieu à confirmer" };
      });
      setEvents(mapped.length > 0 ? mapped : SEED);
    })();
  }, []);

  return (
    <>
      <PageHero eyebrow="Événements" title="Vivons l'aventure ensemble." lead="Camps, formations, célébrations : retrouvez l'agenda complet du mouvement." />
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        {events === null ? (
          <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-white/60" /></div>
        ) : (
        <ul className="divide-y divide-white/10 overflow-hidden rounded-3xl border border-white/10 bg-card">
          {events.map((e, i) => (
            <Reveal as="li" key={i} delay={i * 80} className="group block">
              <div className="grid gap-4 p-7 transition-colors hover:bg-white/5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <h3 className="text-2xl font-semibold text-white">{e.t}</h3>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/65">
                    <span className="inline-flex items-center gap-2"><Calendar className="size-4 text-scout-green" /> {e.d}</span>
                    <span className="inline-flex items-center gap-2"><Clock className="size-4 text-scout-green" /> {e.h}</span>
                    <span className="inline-flex items-center gap-2"><MapPin className="size-4 text-scout-green" /> {e.l}</span>
                  </div>
                </div>
                <span className="inline-flex h-11 items-center rounded-full border border-white/15 px-5 text-sm font-medium text-white transition group-hover:border-scout-green group-hover:text-scout-green">
                  Bientôt l'inscription
                </span>
              </div>
            </Reveal>
          ))}
        </ul>
        )}
      </section>
    </>
  );
}