import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Réinitialiser le mot de passe — Scouts du Nord-Kivu" },
      { name: "description", content: "Choisissez un nouveau mot de passe pour votre compte." },
    ],
  }),
  component: Page,
});

function Page() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 10) return toast.error("Le mot de passe doit contenir au moins 10 caractères");
    if (password !== confirm) return toast.error("Les mots de passe ne correspondent pas");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Mot de passe modifié.");
    navigate({ to: "/dashboard" });
  }

  return (
    <section className="relative min-h-dvh pt-40 pb-20">
      <div className="mx-auto w-full max-w-md px-5">
        <h1 className="text-3xl font-semibold text-white">Nouveau mot de passe</h1>
        <p className="mt-2 text-sm text-white/55">Choisissez un mot de passe d'au moins 10 caractères. Cette page permet de le modifier lorsque votre session est active.</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-3xl border border-white/10 bg-card p-7">
          {!ready && <p className="text-xs text-amber-300">En attente de validation du lien…</p>}
          <div>
            <label className="text-xs uppercase tracking-wider text-white/50">Nouveau mot de passe</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-scout-deep px-4 py-3 text-white outline-none focus:border-scout-green" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-white/50">Confirmer</label>
            <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-scout-deep px-4 py-3 text-white outline-none focus:border-scout-green" />
          </div>
          <button disabled={loading || !ready} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-scout-green text-sm font-medium text-scout-deep transition hover:opacity-90 disabled:opacity-50">
            {loading && <Loader2 className="size-4 animate-spin" />}
            Mettre à jour
          </button>
        </form>
      </div>
    </section>
  );
}