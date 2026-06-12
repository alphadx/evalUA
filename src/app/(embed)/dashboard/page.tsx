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
      <div className="px-4 py-2 border-b" style={{ borderColor: "rgba(57,64,73,0.15)" }}>
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-evalUA1)" }}>
          Dashboard
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Tarjetas de métricas */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg p-3 border" style={{ borderColor: "rgba(57,64,73,0.1)", backgroundColor: "var(--color-evalUA16)" }}>
            <div className="text-xs" style={{ color: "rgba(57,64,73,0.6)" }}>Rúbricas Creadas</div>
            <div className="text-2xl font-bold mt-1" style={{ color: "var(--color-evalUA1)" }}>
              {metricas?.rubricasCreadas || 0}
            </div>
          </div>
          <div className="rounded-lg p-3 border" style={{ borderColor: "rgba(57,64,73,0.1)", backgroundColor: "var(--color-evalUA16)" }}>
            <div className="text-xs" style={{ color: "rgba(57,64,73,0.6)" }}>Evaluaciones en Curso</div>
            <div className="text-2xl font-bold mt-1" style={{ color: "var(--color-evalUA4)" }}>
              {metricas?.evaluacionesEnCurso || 0}
            </div>
          </div>
          <div className="rounded-lg p-3 border" style={{ borderColor: "rgba(57,64,73,0.1)", backgroundColor: "var(--color-evalUA16)" }}>
            <div className="text-xs" style={{ color: "rgba(57,64,73,0.6)" }}>Evaluaciones Completadas</div>
            <div className="text-2xl font-bold mt-1" style={{ color: "var(--color-evalUA21)" }}>
              {metricas?.evaluacionesCompletadas || 0}
            </div>
          </div>
        </div>

        {/* Historial */}
        <div>
          <h3 className="text-xs font-semibold mb-2">Historial Reciente</h3>
          {historial.length === 0 ? (
            <div className="text-xs text-center py-4" style={{ color: "rgba(57,64,73,0.5)" }}>
              No hay evaluaciones completadas
            </div>
          ) : (
            <div className="space-y-1">
              {historial.map((ev) => (
                <div
                  key={ev._id}
                  className="flex items-center justify-between px-3 py-1.5 rounded border text-xs"
                  style={{ borderColor: "rgba(57,64,73,0.1)" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono" style={{ color: "rgba(57,64,73,0.5)" }}>
                      {ev._id.substring(0, 8)}...
                    </span>
                    <span>{new Date(ev.createdAt).toLocaleDateString("es-CL")}</span>
                  </div>
                  <span
                    className="font-bold px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: ev.notaFinal >= 4.0 ? "var(--color-evalUA21)" : "var(--color-evalUA8)",
                      color: "#fff",
                    }}
                  >
                    {ev.notaFinal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
