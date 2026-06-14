/**
 * EvalUA v3.0 — Embedded Layout
 * Viewport adaptable con mínimo 466px de alto
 */

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="embed-frame w-full min-h-[466px] overflow-x-hidden overflow-y-auto text-[var(--color-evalUA2)]">
      {children}
    </div>
  );
}
