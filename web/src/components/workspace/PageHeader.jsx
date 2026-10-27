export function PageHeader({ eyebrow, title, children }) {
  return (
    <div className="mb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">{eyebrow}</p>
      <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">{title}</h1>
      {children && <p className="mt-3 max-w-2xl text-lg leading-relaxed text-mocha">{children}</p>}
    </div>
  );
}
