import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero } from "@/components/site/PageHero";
import { supabase } from "@/integrations/supabase/client";
import { Check, Loader2, User, Users, HeartHandshake, Building2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/inscription")({
  head: () => ({
    meta: [
      { title: "Inscription — Scouts du Nord-Kivu" },
      { name: "description", content: "Rejoignez les Scouts du Nord-Kivu comme membre, groupe scout, donateur ou partenaire." },
      { property: "og:title", content: "Rejoindre les Scouts du Nord-Kivu" },
      { property: "og:description", content: "Membre, groupe, donateur ou partenaire — choisissez votre profil." },
    ],
  }),
  component: Page,
});

type Type = "membre" | "groupe" | "donateur" | "partenaire";

const TYPES: { id: Type; title: string; desc: string; Icon: typeof User }[] = [
  { id: "membre", title: "Membre", desc: "Jeune, adolescent ou adulte souhaitant rejoindre le mouvement.", Icon: User },
  { id: "groupe", title: "Groupe scout", desc: "Vous représentez un groupe scout local au Nord-Kivu.", Icon: Users },
  { id: "donateur", title: "Donateur", desc: "Particulier ou structure souhaitant soutenir financièrement le mouvement.", Icon: HeartHandshake },
  { id: "partenaire", title: "Partenaire", desc: "Organisation, ONG, école, paroisse ou entreprise.", Icon: Building2 },
];

const baseSchema = z.object({
  full_name: z.string().trim().min(2, "Nom requis").max(120),
  email: z.string().trim().email("Email invalide").max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

function Page() {
  const [type, setType] = useState<Type | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function update(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!type) return;
    const parsed = baseSchema.safeParse({
      full_name: form.full_name ?? "",
      email: form.email ?? "",
      phone: form.phone ?? "",
      city: form.city ?? "",
      message: form.message ?? "",
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Données invalides");

    setLoading(true);
    const { full_name, email, phone, city, message } = parsed.data;
    const data: Record<string, string> = {};
    // Type-specific extras
    for (const k of ["age", "branch", "group_name", "members", "amount", "frequency", "organization", "role", "website"]) {
      if (form[k]) data[k] = form[k].toString().slice(0, 500);
    }
    const { error } = await supabase.from("inscriptions").insert({
      type,
      full_name,
      email,
      phone: phone || null,
      city: city || null,
      message: message || null,
      data,
      status: "en_attente",
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setDone(true);
  }

  if (done) {
    return (
      <>
        <PageHero eyebrow="Inscription" title="Merci !" />
        <section className="mx-auto max-w-2xl px-5 py-20 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-scout-green/15 text-scout-green">
            <Check className="size-7" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-white">Votre demande a bien été reçue.</h2>
          <p className="mt-3 text-white/65">
            L'équipe de l'Association des Scouts du Nord-Kivu reviendra vers vous par email dès que possible.
          </p>
          <Link to="/" className="mt-8 inline-flex h-11 items-center rounded-full bg-scout-green px-6 text-sm font-medium text-scout-deep">
            Retour à l'accueil
          </Link>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHero eyebrow="Inscription" title="Rejoignez le mouvement." lead="Choisissez le profil qui vous correspond. Le formulaire s'adapte automatiquement." />

      <section className="mx-auto max-w-5xl px-5 py-20 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TYPES.map(({ id, title, desc, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setType(id)}
              className={`group rounded-3xl border p-6 text-left transition ${
                type === id ? "border-scout-green bg-scout-green/10 ring-glow" : "border-white/10 bg-card hover:border-white/30"
              }`}
            >
              <Icon className={`size-6 ${type === id ? "text-scout-green" : "text-white/70"}`} />
              <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-xs text-white/60">{desc}</p>
            </button>
          ))}
        </div>

        {type && (
          <form onSubmit={submit} className="mt-12 space-y-5 rounded-3xl border border-white/10 bg-card p-7 lg:p-10 animate-reveal">
            <h2 className="text-2xl font-semibold text-white">Formulaire — {TYPES.find((t) => t.id === type)?.title}</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <F label="Nom complet" required name="full_name" v={form.full_name} on={update} />
              <F label="Email" required type="email" name="email" v={form.email} on={update} />
              <F label="Téléphone" name="phone" v={form.phone} on={update} />
              <F label="Ville / Territoire" name="city" v={form.city} on={update} />
            </div>

            {type === "membre" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <F label="Âge" name="age" type="number" v={form.age} on={update} />
                <F label="Branche souhaitée" name="branch" v={form.branch} on={update} placeholder="Louveteau, Éclaireur…" />
              </div>
            )}

            {type === "groupe" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <F label="Nom du groupe" required name="group_name" v={form.group_name} on={update} />
                <F label="Nombre de membres" name="members" type="number" v={form.members} on={update} />
              </div>
            )}

            {type === "donateur" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <F label="Montant envisagé (USD)" name="amount" type="number" v={form.amount} on={update} />
                <F label="Fréquence" name="frequency" v={form.frequency} on={update} placeholder="Ponctuel, mensuel…" />
              </div>
            )}

            {type === "partenaire" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <F label="Nom de l'organisation" required name="organization" v={form.organization} on={update} />
                <F label="Votre rôle" name="role" v={form.role} on={update} />
                <div className="sm:col-span-2">
                  <F label="Site web" name="website" v={form.website} on={update} placeholder="https://" />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs uppercase tracking-wider text-white/50">Message</label>
              <textarea
                rows={5}
                value={form.message ?? ""}
                onChange={(e) => update("message", e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-scout-deep px-4 py-3 text-white outline-none focus:border-scout-green"
              />
            </div>

            <button disabled={loading} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-scout-green px-8 text-sm font-medium text-scout-deep transition hover:opacity-90 disabled:opacity-50">
              {loading && <Loader2 className="size-4 animate-spin" />}
              Envoyer ma demande
            </button>
            <p className="text-xs text-white/45">
              Vos données sont traitées en toute confidentialité par l'Association des Scouts du Nord-Kivu.
            </p>
          </form>
        )}
      </section>
    </>
  );
}

function F({ label, name, v, on, ...props }: { label: string; name: string; v?: string; on: (k: string, v: string) => void } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-white/50">{label}</label>
      <input
        {...props}
        name={name}
        value={v ?? ""}
        onChange={(e) => on(name, e.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-scout-deep px-4 py-3 text-white outline-none transition focus:border-scout-green"
      />
    </div>
  );
}