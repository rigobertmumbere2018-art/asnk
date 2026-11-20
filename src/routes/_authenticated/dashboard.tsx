import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, LogOut, Mail, ShieldCheck, ArrowRight, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Tableau de bord — Scouts du Nord-Kivu" }] }),
  component: Page,
});

function Page() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const rs = (r ?? []).map((x: { role: string }) => x.role);
      setRoles(rs);
      if (rs.includes("admin") || rs.includes("super_admin")) {
        navigate({ to: "/admin", replace: true });
        return;
      }
      const { data: assignments } = await supabase.from("district_commissioners").select("district_id").eq("user_id", user.id).eq("status", "active");
      if ((assignments ?? []).length > 0) {
        navigate({ to: "/district", replace: true });
        return;
      }
      setLoading(false);
    })();
  }, [user.id, navigate]);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Vous êtes déconnecté.");
    navigate({ to: "/" });
  }

  return (
    <section className="min-h-dvh pt-32 pb-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-scout-green">Espace membre</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Bonjour, {user.email}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              {roles.length === 0 && <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/55">Aucun rôle</span>}
              {roles.map((r) => (
                <span key={r} className="inline-flex items-center gap-1 rounded-full bg-scout-green/15 px-3 py-1 text-xs text-scout-green">
                  <ShieldCheck className="size-3" /> {r}
                </span>
              ))}
            </div>
          </div>
          <button onClick={signOut} className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-sm text-white/85 hover:bg-white/5">
            <LogOut className="size-4" /> Déconnexion
          </button>
        </div>

        {loading && (
          <div className="mt-16 flex justify-center"><Loader2 className="size-6 animate-spin text-white/60" /></div>
        )}

        {!loading && (
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-card p-8">
              <Mail className="size-6 text-scout-green" />
              <h2 className="mt-4 text-lg font-semibold text-white">Bienvenue dans votre espace membre</h2>
              <p className="mt-2 text-sm text-white/65">
                D'autres fonctionnalités (articles personnalisés, profil, badges) arriveront dans les prochaines phases.
              </p>
            </div>
            <Link to="/chat" className="group rounded-3xl border border-white/10 bg-card p-8 transition hover:border-scout-green/40">
              <MessageSquare className="size-6 text-scout-purple" />
              <h2 className="mt-4 text-lg font-semibold text-white">Chat communautaire</h2>
              <p className="mt-2 text-sm text-white/65">Échangez en temps réel avec les autres membres.</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm text-scout-green">
                Ouvrir le chat <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}