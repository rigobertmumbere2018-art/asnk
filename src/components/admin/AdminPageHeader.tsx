export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
      <div>
        {eyebrow && <p className="text-xs uppercase tracking-[0.3em] text-scout-green">{eyebrow}</p>}
        <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-white/60">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}