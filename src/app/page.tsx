/**
 * EvalUA v3.0 — Página raíz
 * Redirige al dashboard embebido
 */

export default function Home() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-evalUA1)" }}>
          EvalUA v3.0
        </h1>
        <p className="text-sm" style={{ color: "var(--color-evalUA2)" }}>
          Sistema de Evaluación Curricular por Rúbricas
        </p>
        <p className="text-xs" style={{ color: "rgba(57,64,73,0.5)" }}>
          Esta aplicación está diseñada para ser embebida en un iframe del Host.
        </p>
        <div className="flex gap-2 justify-center text-xs">
          <a href="/evaluar?rubricaId=demo" className="px-3 py-1 rounded" style={{ backgroundColor: "var(--color-evalUA1)", color: "#fff" }}>
            Demo Wizard
          </a>
          <a href="/rubricas" className="px-3 py-1 rounded border" style={{ borderColor: "var(--color-evalUA1)", color: "var(--color-evalUA1)" }}>
            Rúbricas
          </a>
          <a href="/dashboard" className="px-3 py-1 rounded border" style={{ borderColor: "var(--color-evalUA1)", color: "var(--color-evalUA1)" }}>
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
