import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Newspaper, CalendarDays, FileText, UserPlus, MessageSquare, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Administration — Scouts du Nord-Kivu" }] }),
  component: Page,
});

function Page() {
  const [stats, setStats] = useState({ posts: 0, events: 0, docs: 0, pending: 0 });

  useEffect(() => {
    (async () => {
      const [p, e, d, i] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }),
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("documents").select("id", { count: "exact", head: true }),
        supabase.from("inscriptions").select("id", { count: "exact", head: true }).eq("status", "en_attente"),
      ]);
      setStats({
        posts: p.count ?? 0,
        events: e.count ?? 0,
        docs: d.count ?? 0,
        pending: i.count ?? 0,
      });
    })();
  }, []);

  const cards = [
    { to: "/admin/posts", label: "Actualités", icon: Newspaper, value: stats.posts, hint: "articles au total" },
    { to: "/admin/events", label: "Événements", icon: CalendarDays, value: stats.events, hint: "événements" },
    { to: "/admin/documents", label: "Documents", icon: FileText, value: stats.docs, hint: "fichiers" },
    { to: "/admin/inscriptions", label: "Inscriptions", icon: UserPlus, value: stats.pending, hint: "en attente" },
  ] as const;

  return (
    <div className="px-5 py-10 lg:px-10 lg:py-12">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-scout-green">Vue d'ensemble</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Tableau de bord</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/65">
          Pilotez les contenus du site, suivez les demandes d'inscription et discutez avec votre équipe — le tout depuis cet espace.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="group rounded-2xl border border-white/10 bg-card p-6 transition hover:border-scout-green/40 hover:bg-white/5"
          >
            <div className="flex items-center justify-between">
              <c.icon className="size-5 text-scout-green" />
              <ArrowRight className="size-4 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-scout-green" />
            </div>
            <div className="mt-6 text-3xl font-semibold">{c.value}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-white/55">{c.label}</div>
            <div className="mt-1 text-xs text-white/40">{c.hint}</div>
          </Link>
        ))}
      </div>

      <div className="mt-12 grid gap-4 lg:grid-cols-2">
        <Link
          to="/chat"
          className="group flex items-center justify-between rounded-2xl border border-white/10 bg-card p-6 transition hover:border-scout-green/40"
        >
          <div className="flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-xl bg-scout-purple/20 text-scout-purple">
              <MessageSquare className="size-5" />
            </span>
            <div>
              <div className="text-base font-medium">Ouvrir le chat communautaire</div>
              <div className="text-xs text-white/55">Échangez en temps réel avec votre équipe</div>
            </div>
          </div>
          <ArrowRight className="size-4 text-white/40 transition group-hover:translate-x-0.5" />
        </Link>

        <div className="rounded-2xl border border-white/10 bg-card p-6">
          <div className="text-xs uppercase tracking-wider text-white/45">Astuce</div>
          <p className="mt-2 text-sm text-white/75">
            Les contenus que vous publiez ici (statut <span className="text-scout-green">Publié</span>) apparaissent immédiatement sur le site public.
            Les brouillons restent invisibles aux visiteurs.
          </p>
        </div>
      </div>
    </div>
  );
}