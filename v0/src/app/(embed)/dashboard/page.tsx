"use client";

/**
 * EvalUA v3.0 — Dashboard de Métricas (Iframe)
 * Tarjetas de métricas y historial reciente
 */

import { useEffect, useState } from "react";

interface Metricas {
  rubricasCreadas: number;
  evaluacionesEnCurso: number;
  evaluacionesCompletadas: number;
}

interface EvaluacionHistorial {
  _id: string;
  rubricaId: string;
  notaFinal: number;
  createdAt: string;
}

export default function DashboardPage() {
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [historial, setHistorial] = useState<EvaluacionHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch("/api/dashboard/metricas", {
          headers: { Authorization: "Bearer dev-token" },
        });
        const data = await res.json();
        if (data.success) {
          setMetricas(data.data.metricas);
          setHistorial(data.data.historial);
        } else {
          setError(data.error?.detail || "Error cargando métricas");
        }
      } catch {
        setError("Error de red");
      }
      setLoading(false);
    };
    cargar();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div style={{ color: "var(--color-evalUA2)" }}>Cargando dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div style={{ color: "var(--color-evalUA8)" }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="embed-header">
        <div className="embed-title">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-chart-column size-4"
            aria-hidden="true"
            style={{ color: "var(--color-evalUA1)" }}
          >
            <path d="M3 3v16a2 2 0 0 0 2 2h16"></path>
            <path d="M18 17V9"></path>
            <path d="M13 17V5"></path>
            <path d="M8 17v-3"></path>
          </svg>
          <span>Dashboard de Métricas</span>
        </div>
        <span className="embed-badge">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-shield size-2.5"
            aria-hidden="true"
          >
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
          </svg>
          ADMINISTRADOR
        </span>
      </div>

      <div className="embed-content overflow-y-auto">
        <div className="px-4 py-3 space-y-3">
          <div className="grid grid-cols-3 gap-2.5">
            <div className="embed-card">
              <div className="embed-card-icon primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-file-text size-4"
                  aria-hidden="true"
                >
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                  <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                  <path d="M10 9H8"></path>
                  <path d="M16 13H8"></path>
                  <path d="M16 17H8"></path>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="embed-card-label">Rúbricas Creadas</p>
                <p className="embed-card-value">{metricas?.rubricasCreadas || 0}</p>
                <p className="embed-card-note">{metricas?.rubricasCreadas || 0} totales</p>
              </div>
            </div>
            <div className="embed-card">
              <div className="embed-card-icon info">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-clock size-4"
                  aria-hidden="true"
                >
                  <path d="M12 6v6l4 2"></path>
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="embed-card-label">En Progreso</p>
                <p className="embed-card-value">{metricas?.evaluacionesEnCurso || 0}</p>
                <p className="embed-card-note">Evaluaciones abiertas</p>
              </div>
            </div>
            <div className="embed-card">
              <div className="embed-card-icon success">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-circle-check-big size-4"
                  aria-hidden="true"
                >
                  <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                  <path d="m9 11 3 3L22 4"></path>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="embed-card-label">Completadas</p>
                <p className="embed-card-value">{metricas?.evaluacionesCompletadas || 0}</p>
                <p className="embed-card-note">Evaluaciones finalizadas</p>
              </div>
            </div>
          </div>

          <div className="embed-panel">
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "rgba(229,231,235,1)" }}>
              <span className="text-xs font-semibold" style={{ color: "var(--color-evalUA2)" }}>
                Evaluaciones Recientes
              </span>
              <div className="embed-summary">
                <span>Resumen</span>
                <span className="embed-summary-badge success">{metricas ? (metricas.evaluacionesCompletadas / Math.max(1, metricas.evaluacionesEnCurso + metricas.evaluacionesCompletadas) * 100).toFixed(0) + '%' : '—'}</span>
              </div>
            </div>
            <div className="embed-table">
              <div className="embed-table-header">
                <span>ID</span>
                <span>Rúbrica</span>
                <span>Nota</span>
                <span>Fecha</span>
                <span>Estado</span>
              </div>
              <div className="max-h-[152px] overflow-y-auto">
                {historial.map((ev) => (
                  <div key={ev._id} className="embed-table-row hover:bg-gray-50 transition-colors">
                    <span className="text-[10px] font-mono text-gray-500">{ev._id.substring(0, 8)}...</span>
                    <span className="text-[10px] truncate" style={{ color: "var(--color-evalUA2)" }}>
                      {ev.rubricaId}
                    </span>
                    <span className="embed-tag" style={{ borderColor: ev.notaFinal >= 4.0 ? "var(--color-evalUA21)" : "var(--color-evalUA8)", color: ev.notaFinal >= 4.0 ? "var(--color-evalUA21)" : "var(--color-evalUA8)" }}>
                      {ev.notaFinal.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-gray-400">{new Date(ev.createdAt).toLocaleDateString("es-CL")}</span>
                    <span className={"embed-tag " + (ev.notaFinal >= 4.0 ? "success" : "danger")}>
                      COMPLETADA
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="embed-panel-footer">
          <div className="flex items-center gap-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-activity size-3"
              aria-hidden="true"
              style={{ color: "var(--color-evalUA4)" }}
            >
              <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path>
            </svg>
            <span>Métricas en tiempo real</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-clock size-3"
              aria-hidden="true"
              style={{ color: "rgb(156, 163, 175)" }}
            >
              <path d="M12 6v6l4 2"></path>
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
            <span className="text-[10px] text-gray-400">Actualizado: ahora</span>
          </div>
        </div>
      </div>
    </div>
  );
}
