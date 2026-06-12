/**
 * EvalUA v3.0 — Embedded Layout
 * Viewport estricto 1029x466px sin scroll global
 */

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-[1029px] h-[466px] max-w-[1029px] max-h-[466px] overflow-hidden bg-[var(--color-evalUA16)] text-[var(--color-evalUA2)]">
      {children}
    </div>
  );
}
