import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Mail, MapPin, Phone, Youtube } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="relative mt-24 border-t border-white/10 bg-scout-deep">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-scout-green/60 to-transparent" />
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-1">
          <Link to="/" className="flex items-center gap-3 text-white">
            <img src="/favicon.svg" alt="Logo ASNK" className="size-12 rounded-md object-contain" />
            <span className="font-semibold leading-tight">ASNK</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-white/60">
            Association des Scouts du Nord-Kivu — un mouvement éducatif pour la jeunesse de la République Démocratique du Congo.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Mouvement</h3>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li><Link to="/mouvement" className="story-link">Qui sommes-nous</Link></li>
            <li><Link to="/districts" className="story-link">Les districts</Link></li>
            <li><Link to="/galerie" className="story-link">Galerie</Link></li>
            <li><Link to="/documents" className="story-link">Documents officiels</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Participer</h3>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li><Link to="/inscription" className="story-link">Devenir membre</Link></li>
            <li><Link to="/evenements" className="story-link">Événements</Link></li>
            <li><Link to="/actualites" className="story-link">Actualités</Link></li>
            <li><Link to="/contact" className="story-link">Nous contacter</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/75">
            <li className="flex items-start gap-2"><MapPin className="size-4 shrink-0 mt-0.5 text-scout-green" /> Goma, Nord-Kivu, RDC</li>
            <li className="flex items-start gap-2"><Phone className="size-4 shrink-0 mt-0.5 text-scout-green" /> +243 000 000 000</li>
            <li className="flex items-start gap-2"><Mail className="size-4 shrink-0 mt-0.5 text-scout-green" /> contact@scouts-nordkivu.org</li>
          </ul>
          <div className="mt-5 flex gap-2">
            {[Facebook, Instagram, Youtube].map((Icon, i) => (
              <a key={i} href={i === 1 ? "https://www.instagram.com/asnk.fesco/" : "#"} target={i === 1 ? "_blank" : undefined} rel={i === 1 ? "noopener noreferrer" : undefined} aria-label="Réseau social" className="grid size-9 place-items-center rounded-full border border-white/15 text-white/70 transition hover:bg-white/5 hover:text-white">
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-white/50 sm:flex-row lg:px-8">
          <p>© {new Date().getFullYear()} Association des Scouts du Nord-Kivu. Tous droits réservés.</p>
          <p>Toujours Prêt — Always Ready</p>
          <Link to="/auth" className="text-white/40 hover:text-white/70 transition">© Rigoura Design</Link>
        </div>
      </div>
    </footer>
  );
}