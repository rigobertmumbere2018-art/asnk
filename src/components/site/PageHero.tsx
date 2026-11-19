import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

export function PageHero({ eyebrow, title, lead, children }: { eyebrow: string; title: string; lead?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-white/10 pb-20 pt-40">
      <div className="absolute inset-0 gradient-radial opacity-60" />
      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.35em] text-scout-green">{eyebrow}</p>
        </Reveal>
        <Reveal delay={100}>
          <h1 className="mt-5 max-w-4xl text-balance text-5xl font-semibold leading-[1.05] text-white sm:text-6xl">
            {title}
          </h1>
        </Reveal>
        {lead && (
          <Reveal delay={200}>
            <p className="mt-6 max-w-2xl text-lg text-white/70">{lead}</p>
          </Reveal>
        )}
        {children && <div className="mt-10">{children}</div>}
      </div>
    </section>
  );
}