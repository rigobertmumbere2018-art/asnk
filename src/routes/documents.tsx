import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { FileText, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBytes } from "@/lib/cms";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Documents — Scouts du Nord-Kivu" },
      { name: "description", content: "Statuts, règlements, formulaires et circulaires officiels de l'Association des Scouts du Nord-Kivu." },
      { property: "og:title", content: "Documents officiels" },
      { property: "og:description", content: "Téléchargez statuts, règlements et formulaires." },
    ],
  }),
  component: Page,
});

type Doc = { cat: string; name: string; size: string; url?: string };

const SEED: Doc[] = [
  { cat: "Statuts", name: "Statuts de l'Association", size: "PDF — à venir" },
  { cat: "Règlements", name: "Règlement intérieur", size: "PDF — à venir" },
  { cat: "Formulaires", name: "Fiche d'inscription", size: "PDF — à venir" },
  { cat: "Circulaires", name: "Circulaire — Camp Provincial", size: "PDF — à venir" },
  { cat: "Guides", name: "Guide du Chef Scout", size: "PDF — à venir" },
  { cat: "Guides", name: "Manuel du Louveteau", size: "PDF — à venir" },
];

function Page() {
  const [docs, setDocs] = useState<Doc[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("documents")
        .select("name, category, file_size, file_url")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      const mapped: Doc[] = (data ?? []).map((d) => ({
        cat: d.category ?? "Document",
        name: d.name,
        size: d.file_size ? formatBytes(d.file_size) : "Fichier",
        url: d.file_url ?? undefined,
      }));
      setDocs(mapped.length > 0 ? mapped : SEED);
    })();
  }, []);

  return (
    <>
      <PageHero eyebrow="Documents" title="Les documents officiels du mouvement." lead="Statuts, règlements, formulaires et circulaires — à télécharger." />
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        {docs === null ? (
          <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-white/60" /></div>
        ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {docs.map((d, i) => (
            <Reveal key={`${d.name}-${i}`} delay={i * 60}>
              <a
                href={d.url ?? undefined}
                target={d.url ? "_blank" : undefined}
                rel="noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-card p-5 transition hover:border-scout-green/40 hover:bg-white/5"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-scout-green/15 text-scout-green">
                  <FileText className="size-5" />
                </span>
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-wider text-white/45">{d.cat}</div>
                  <div className="text-base font-medium text-white">{d.name}</div>
                  <div className="mt-1 text-xs text-white/50">{d.size}</div>
                </div>
                <Download className="size-4 text-white/40 transition group-hover:text-scout-green" />
              </a>
            </Reveal>
          ))}
        </div>
        )}
      </section>
    </>
  );
}