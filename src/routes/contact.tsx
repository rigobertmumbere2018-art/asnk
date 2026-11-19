import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Scouts du Nord-Kivu" },
      { name: "description", content: "Contactez l'Association des Scouts du Nord-Kivu : téléphone, email, adresse et formulaire de contact." },
      { property: "og:title", content: "Contact — Scouts du Nord-Kivu" },
      { property: "og:description", content: "Nous écrire, nous appeler, nous rendre visite." },
    ],
  }),
  component: Page,
});

function Page() {
  const [sending, setSending] = useState(false);
  return (
    <>
      <PageHero eyebrow="Contact" title="Une question ? Nous sommes à l'écoute." />
      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[1fr_2fr] lg:px-8">
        <Reveal>
          <div className="space-y-6">
            {[
              { I: MapPin, l: "Adresse", v: "Goma, Nord-Kivu, RDC" },
              { I: Phone, l: "Téléphone", v: "+243 000 000 000" },
              { I: Mail, l: "Email", v: "contact@scouts-nordkivu.org" },
            ].map(({ I, l, v }) => (
              <div key={l} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-card p-5">
                <span className="grid size-10 place-items-center rounded-xl bg-scout-green/15 text-scout-green"><I className="size-5" /></span>
                <div>
                  <div className="text-xs uppercase tracking-wider text-white/50">{l}</div>
                  <div className="mt-1 text-base text-white">{v}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={150}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (sending) return;
              setSending(true);
              const form = e.currentTarget;
              const values = new FormData(form);
              const name = String(values.get("name") ?? "").trim();
              const email = String(values.get("email") ?? "").trim();
              const subject = String(values.get("subject") ?? "").trim();
              const message = String(values.get("message") ?? "").trim();
              const { error } = await supabase.from("inscriptions").insert({
                type: "contact",
                status: "en_attente",
                full_name: name,
                email,
                message: message,
                data: { subject, source: "formulaire_contact" },
              });
              setSending(false);
              if (error) {
                toast.error("Le message n'a pas pu être enregistré. Réessayez dans quelques instants.");
                return;
              }
              toast.success("Votre message a bien été transmis à l'ASNK.");
              form.reset();
            }}
            className="space-y-4 rounded-3xl border border-white/10 bg-card p-7"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom complet" name="name" required />
              <Field label="Email" name="email" type="email" required />
            </div>
            <Field label="Sujet" name="subject" required />
            <div>
              <label className="text-xs uppercase tracking-wider text-white/50">Message</label>
              <textarea required name="message" rows={6} className="mt-2 w-full rounded-xl border border-white/10 bg-scout-deep px-4 py-3 text-white outline-none transition focus:border-scout-green" />
            </div>
            <button disabled={sending} className="inline-flex h-12 items-center gap-2 rounded-full bg-scout-green px-6 text-sm font-medium text-scout-deep transition hover:opacity-90 disabled:opacity-50">
              {sending ? "Envoi…" : "Envoyer le message"}
            </button>
          </form>
        </Reveal>
      </section>
    </>
  );
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-white/50">{label}</label>
      <input {...props} className="mt-2 w-full rounded-xl border border-white/10 bg-scout-deep px-4 py-3 text-white outline-none transition focus:border-scout-green" />
    </div>
  );
}
