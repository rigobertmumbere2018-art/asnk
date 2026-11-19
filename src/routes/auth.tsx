import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — Scouts du Nord-Kivu" },
      { name: "description", content: "Connectez-vous ou créez votre compte sur le site officiel des Scouts du Nord-Kivu." },
    ],
  }),
  component: Page,
});

const schema = z.object({
  email: z.string().trim().email("Email invalide").max(200),
  password: z.string().min(10, "Au moins 10 caractères").max(128),
});

function Page() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Lien de réinitialisation envoyé. Vérifiez votre boîte mail.");
        setMode("login");
        return;
      }
      const parsed = schema.safeParse({ email, password });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Données invalides");
        return;
      }
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: fullName.trim() || null },
          },
        });
        if (error) throw error;
        toast.success("Compte créé. Vous pouvez maintenant vous connecter.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password, remember });
        if (error) throw error;
        toast.success("Bienvenue !");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative min-h-dvh overflow-hidden pt-32 pb-20">
      <div className="absolute inset-0 gradient-radial opacity-60" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2 lg:px-8">
        <div className="hidden lg:block">
          <ShieldCheck className="size-10 text-scout-green" />
          <h1 className="mt-6 text-balance text-5xl font-semibold leading-tight text-white">
            Espace membre des Scouts du Nord-Kivu.
          </h1>
          <p className="mt-5 max-w-md text-base text-white/65">
            Accédez à votre profil, vos formations, vos documents et à l'espace communautaire réservé aux membres.
          </p>
        </div>

        <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-card p-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]">
          <div className="flex gap-1 rounded-full bg-scout-deep p-1">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 rounded-full px-4 py-2 text-sm transition ${
                  mode === m ? "bg-scout-green text-scout-deep" : "text-white/65 hover:text-white"
                }`}
              >
                {m === "login" ? "Connexion" : "Inscription"}
              </button>
            ))}
          </div>

          <h2 className="mt-7 text-2xl font-semibold text-white">
            {mode === "login" && "Bon retour."}
            {mode === "signup" && "Créer un compte."}
            {mode === "forgot" && "Mot de passe oublié."}
          </h2>
          <p className="mt-1 text-sm text-white/55">
            {mode === "login" && "Entrez vos identifiants pour accéder à votre espace."}
            {mode === "signup" && "Quelques secondes suffisent."}
            {mode === "forgot" && "L’envoi automatique des liens n’est pas encore configuré. Contactez l’administration pour récupérer votre accès."}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <Input label="Nom complet" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
            )}
            <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            {mode !== "forgot" && (
              <div>
                <label className="text-xs uppercase tracking-wider text-white/50">Mot de passe</label>
                <div className="relative mt-2">
                  <input
                    required
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    className="w-full rounded-xl border border-white/10 bg-scout-deep px-4 py-3 pr-12 text-white outline-none transition focus:border-scout-green"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                  >
                    {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === "login" && (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-white/65">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-scout-green" />
                  Se souvenir de moi
                </label>
                <button type="button" onClick={() => setMode("forgot")} className="text-scout-green hover:underline">
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            <button
              disabled={loading}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-scout-green text-sm font-medium text-scout-deep transition hover:opacity-90 disabled:opacity-50"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {mode === "login" && "Se connecter"}
              {mode === "signup" && "Créer mon compte"}
              {mode === "forgot" && "Retour à la connexion"}
            </button>

            {mode === "forgot" && (
              <button type="button" onClick={() => setMode("login")} className="block w-full text-center text-xs text-white/55 hover:text-white">
                Retour à la connexion
              </button>
            )}
          </form>

          <p className="mt-6 text-center text-xs text-white/45">
            Vous voulez nous rejoindre comme membre, groupe, donateur ou partenaire ?{" "}
            <Link to="/inscription" className="text-scout-green hover:underline">Page d'inscription</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-white/50">{label}</label>
      <input {...props} className="mt-2 w-full rounded-xl border border-white/10 bg-scout-deep px-4 py-3 text-white outline-none transition focus:border-scout-green" />
    </div>
  );
}