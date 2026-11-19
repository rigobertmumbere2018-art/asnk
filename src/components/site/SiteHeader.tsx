import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Menu, X, Search } from "lucide-react";
import logo from "@/assets/asnk-logo.jpg.asset.json";

const NAV = [
  { to: "/", label: "Accueil" },
  { to: "/mouvement", label: "Qui sommes-nous" },
  { to: "/actualites", label: "Actualités" },
  { to: "/evenements", label: "Événements" },
  { to: "/districts", label: "Districts" },
  { to: "/galerie", label: "Galerie" },
  { to: "/documents", label: "Documents" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-scout-deep/85 backdrop-blur-xl border-b border-white/10"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link
          to="/"
          className={cn(
            "flex items-center gap-2 font-semibold tracking-tight transition-all",
            scrolled ? "py-3 text-base" : "py-5 text-lg",
          )}
        >
          <img
            src={logo.url}
            alt="Logo ASNK — Association des Scouts du Nord-Kivu"
            className={cn(
              "rounded-md object-contain transition-all",
              scrolled ? "size-9" : "size-11",
            )}
          />
          <span className="leading-none">
            ASNK
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="px-3 py-2 text-sm text-white/80 transition-colors hover:text-white relative"
              activeProps={{ className: "text-white" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <Link
            to="/recherche"
            aria-label="Recherche"
            className="grid size-9 place-items-center rounded-full border border-white/15 text-white/90 transition hover:bg-white/5"
          >
            <Search className="size-4" />
          </Link>
          <Link
            to="/auth"
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/90 transition hover:bg-white/5"
          >
            Connexion
          </Link>
        </div>

        <button
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden grid size-10 place-items-center rounded-full border border-white/15 text-white"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-white/10 bg-scout-deep/95 backdrop-blur-xl">
          <nav className="mx-auto flex max-w-7xl flex-col px-5 py-4">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="py-3 text-base text-white/85 border-b border-white/5"
                activeProps={{ className: "text-scout-green" }}
              >
                {item.label}
              </Link>
            ))}
            <Link to="/recherche" className="py-3 text-base text-white/85 border-b border-white/5 inline-flex items-center gap-2">
              <Search className="size-4" /> Recherche
            </Link>
            <div className="mt-4 flex gap-2">
              <Link to="/auth" className="flex-1 rounded-full border border-white/15 py-3 text-center text-sm text-white">
                Connexion
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}