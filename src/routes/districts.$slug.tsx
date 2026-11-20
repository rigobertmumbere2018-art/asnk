import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, MapPin, Mail, Phone, Users, UserRound } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/districts/$slug")({
  head: () => ({
    meta: [
      { title: "Fiche du district — Scouts du Nord-Kivu" },
      { name: "description", content: "Informations officielles et groupes scouts du district." },
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
  history: string | null;
  commissioner_name: string | null;
  office_address: string | null;
  phone: string | null;
  professional_email: string | null;
  other_contacts: unknown;
  social_links: unknown;
};

type ScoutGroup = {
  id: string;
  name: string;
  locality: string | null;
  description: string | null;
  young_members: number;
  adult_volunteers: number;
};

function parseList(value: unknown): Array<{ label?: string; name?: string; url?: string; value?: string }> {
  if (Array.isArray(value)) return value as Array<{ label?: string; name?: string; url?: string; value?: string }>;
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? parsed as Array<{ label?: string; name?: string; url?: string; value?: string }> : [];
    } catch { return []; }
  }
  return [];
}

function display(value: string | null | undefined) {
  return value?.trim() || "À renseigner";
}

function Page() {
  const { slug } = Route.useParams();
  const [district, setDistrict] = useState<District | null>(null);
  const [groups, setGroups] = useState<ScoutGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(false);
      const { data, error: districtError } = await supabase
        .from("districts")
        .select("id, slug, name, code, description, history, commissioner_name, office_address, phone, professional_email, other_contacts, social_links")
        .eq("slug", slug)
        .maybeSingle();
      if (!active) return;
      if (districtError || !data) {
        setError(true);
        setDistrict(null);
        setGroups([]);
        setLoading(false);
        return;
      }
      setDistrict(data as District);
      const { data: groupRows } = await supabase
        .from("scout_groups")
        .select("id, name, locality, description, young_members, adult_volunteers")
        .eq("district_id", data.id)
        .eq("status", "approved")
        .order("name", { ascending: true });
      if (!active) return;
      setGroups((groupRows ?? []) as ScoutGroup[]);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [slug]);

  const young = groups.reduce((sum, group) => sum + (Number(group.young_members) || 0), 0);
  const adults = groups.reduce((sum, group) => sum + (Number(group.adult_volunteers) || 0), 0);
  const socialLinks = district ? parseList(district.social_links) : [];
  const contacts = district ? parseList(district.other_contacts) : [];

  if (loading) {
    return <section className="mx-auto flex min-h-[50vh] max-w-7xl items-center justify-center px-5"><Loader2 className="size-7 animate-spin text-white/60" /></section>;
  }

  if (error || !district) {
    return (
      <>
        <PageHero eyebrow="Districts ASNK" title="Fiche du district indisponible." lead="Cette fiche n'est pas encore disponible ou n'a pas pu être chargée." />
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <Link to="/districts" className="inline-flex items-center gap-2 text-sm text-scout-green"><ArrowLeft className="size-4" /> Retour aux districts</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHero eyebrow={district.code || "District ASNK"} title={district.name} lead={display(district.description)} />
      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <Link to="/districts" className="mb-8 inline-flex items-center gap-2 text-sm text-scout-green transition hover:text-white">
          <ArrowLeft className="size-4" /> Retour aux districts
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <article className="rounded-2xl border border-white/10 bg-card p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-white">Historique du district</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-white/65">{display(district.history)}</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-card p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-white">Groupes scouts</h2>
              {groups.length === 0 ? (
                <p className="mt-4 text-sm text-white/60">Les groupes scouts de ce district sont à renseigner.</p>
              ) : (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {groups.map(group => (
                    <div key={group.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                      <h3 className="font-semibold text-white">{group.name}</h3>
                      <p className="mt-1 text-sm text-white/55">{display(group.locality)}</p>
                      <p className="mt-3 text-sm text-white/65">{display(group.description)}</p>
                      <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/60">
                        <span className="inline-flex items-center gap-1.5"><Users className="size-3.5 text-scout-green" /> {group.young_members} jeunes</span>
                        <span className="inline-flex items-center gap-1.5"><UserRound className="size-3.5 text-scout-green" /> {group.adult_volunteers} adultes</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </div>

          <aside className="space-y-6">
            <article className="rounded-2xl border border-white/10 bg-card p-6">
              <h2 className="text-lg font-semibold text-white">Commissariat du district</h2>
              <p className="mt-4 text-sm text-white/75">{display(district.commissioner_name)}</p>
              <div className="mt-4 space-y-3 text-sm text-white/60">
                <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-scout-green" /> {display(district.office_address)}</p>
                <p className="flex items-center gap-2"><Phone className="size-4 shrink-0 text-scout-green" /> {display(district.phone)}</p>
                <p className="flex items-center gap-2 break-all"><Mail className="size-4 shrink-0 text-scout-green" /> {display(district.professional_email)}</p>
              </div>
              {contacts.length > 0 && (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45">Autres contacts</h3>
                  <ul className="mt-3 space-y-2 text-sm text-white/65">
                    {contacts.map((contact, i) => <li key={i}>{contact.label || contact.name || contact.value || "Contact"}</li>)}
                  </ul>
                </div>
              )}
              {socialLinks.length > 0 && (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45">Réseaux sociaux</h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    {socialLinks.map((link, i) => (
                      <li key={i}>
                        {link.url && /^https?:\/\//i.test(link.url) ? <a className="text-scout-green hover:text-white" href={link.url} target="_blank" rel="noreferrer">{link.label || link.name || link.url}</a> : <span className="text-white/60">{link.label || link.name || "À renseigner"}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>

            <article className="rounded-2xl border border-white/10 bg-card p-6">
              <h2 className="text-lg font-semibold text-white">Effectifs validés</h2>
              <p className="mt-4 text-3xl font-semibold text-white">{groups.length > 0 ? young + adults : "À renseigner"}</p>
              <p className="text-xs text-white/45">Membres et bénévoles des groupes approuvés</p>
              {groups.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                  <div><p className="text-xl font-semibold text-white">{young}</p><p className="text-xs text-white/45">Jeunes</p></div>
                  <div><p className="text-xl font-semibold text-white">{adults}</p><p className="text-xs text-white/45">Adultes bénévoles</p></div>
                </div>
              ) : (
                <p className="mt-4 border-t border-white/10 pt-4 text-xs text-white/50">Les effectifs seront affichés après validation des données du district.</p>
              )}
              <p className="mt-3 text-[11px] text-white/40">{groups.length > 0 ? `${groups.length} groupe(s) approuvé(s)` : "Groupes approuvés : à renseigner"}</p>
            </article>
          </aside>
        </div>
      </section>
    </>
  );
}
