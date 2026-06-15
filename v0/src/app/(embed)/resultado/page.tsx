"use client";

/**
 * EvalUA v3.0 — Vista de Resultados (Iframe)
 * Solo lectura con acordeón single-open
 */

import { useEffect, useState } from "react";

interface EvaluacionData {
  _id: string;
  rubricaId: string;
  notaFinal: number;
  observaciones: string | null;
  puntajes: Array<{
    criterioId: string;
    notaAsignada: number;
    observaciones: string | null;
  }>;
}

interface RubricaData {
  _id: string;
  titulo: string;
  notaAprobacion: number;
  criterios: Array<{
    _id: string;
    nombre: string;
    ponderacion: number;
    tipo: string;
    esExcluyente: boolean;
    notaCorte: number;
    descriptores: Array<{
      notaNivel: number;
      etiqueta: string;
      bulletPoints: string[];
    }>;
  }>;
}

export default function ResultadoPage() {
  const [evaluacion, setEvaluacion] = useState<EvaluacionData | null>(null);
  const [rubrica, setRubrica] = useState<RubricaData | null>(null);
  const [criterioExpandido, setCriterioExpandido] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("jwt") || params.get("token");
        let evaluacionId =
          params.get("id") ||
          params.get("evaluacion_id") ||
          params.get("evaluacionId");

        // Si no hay evaluacionId directo pero hay JWT, usar el launch endpoint
        if (!evaluacionId && token) {
          const launchRes = await fetch("/api/embed/launch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          const launchData = await launchRes.json();
          if (!launchData.success) {
            setError(launchData.error?.detail || "Error en lanzamiento");
            setLoading(false);
            return;
          }
          evaluacionId = launchData.data.evaluacionId || null;
          // Si el launch indica modo evaluar (borrador), redirigir
          if (launchData.data.modo === "evaluar" && evaluacionId) {
            window.location.href = `/evaluar?jwt=${encodeURIComponent(token)}`;
            return;
          }
        }

        if (!evaluacionId) {
          setError("Se requiere ID de evaluación (id, evaluacion_id o JWT válido)");
          setLoading(false);
          return;
        }

        const evalRes = await fetch(`/api/evaluaciones/${evaluacionId}`, {
          headers: { Authorization: "Bearer dev-token" },
        });
        const evalData = await evalRes.json();
        if (!evalData.success) {
          setError(evalData.error?.detail || "Error cargando evaluación");
          setLoading(false);
          return;
        }

        setEvaluacion(evalData.data);

        // Cargar rúbrica
        const rubricaRes = await fetch(
          `/api/rubricas/${evalData.data.rubricaId}`,
          { headers: { Authorization: "Bearer dev-token" } }
        );
        const rubricaData = await rubricaRes.json();
        if (rubricaData.success) {
          setRubrica(rubricaData.data);
        }
      } catch {
        setError("Error cargando datos");
      }
      setLoading(false);
    };

    init();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div style={{ color: "var(--color-evalUA2)" }}>Cargando resultado...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="font-semibold" style={{ color: "var(--color-evalUA8)" }}>
          {error}
        </div>
      </div>
    );
  }

  if (!evaluacion || !rubrica) {
    return (
      <div className="flex items-center justify-center h-full">
        <div>No se encontraron datos</div>
      </div>
    );
  }

  const notaAprobacion = rubrica?.notaAprobacion ?? 4.0;
  const aprobada = evaluacion.notaFinal >= notaAprobacion;

  return (
    <div className="flex flex-col h-full">
      <div className="embed-header">
        <div className="embed-title">Resultado de evaluación</div>
        <span className="embed-badge">RESULTADO</span>
      </div>

      <div className="embed-content overflow-y-auto px-4 py-4 space-y-3">
        <div className="embed-panel px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--color-evalUA2)" }}>
                {rubrica.titulo}
              </p>
              <p className="text-sm font-medium mt-1">Nota final</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs" style={{ color: "rgba(57,64,73,0.6)" }}>
                Promedio
              </span>
              <span className="text-base font-bold px-3 py-1 rounded" style={{ backgroundColor: aprobada ? "var(--color-evalUA21)" : "var(--color-evalUA8)", color: "#fff" }}>
                {evaluacion.notaFinal.toFixed(2)}
              </span>
              <span className={"embed-summary-badge " + (aprobada ? "success" : "warning")}>{aprobada ? "Aprobada" : "No aprobada"}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {rubrica.criterios.map((criterio) => {
            const puntaje = evaluacion.puntajes.find(
              (p) => p.criterioId === criterio._id
            );
            const expandido = criterioExpandido === criterio._id;
            const descriptorSeleccionado = puntaje
              ? criterio.descriptores.find((d) => d.notaNivel === puntaje.notaAsignada)
              : null;

            return (
              <div
                key={criterio._id}
                className="embed-panel overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                  onClick={() =>
                    setCriterioExpandido(expandido ? null : criterio._id)
                  }
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{criterio.nombre}</span>
                    <span className="text-xs" style={{ color: "rgba(57,64,73,0.5)" }}>
                      ({(criterio.ponderacion * 100).toFixed(0)}%)
                    </span>
                  </div>
                  {puntaje && (
                    <span className={"embed-tag " + (puntaje.notaAsignada >= (criterio.notaCorte ?? 4.0) ? "success" : "danger")}>
                      {puntaje.notaAsignada.toFixed(1)}
                    </span>
                  )}
                </button>

                {expandido && (
                  <div
                    className="border-t px-4 py-3 bg-[rgba(255,254,253,0.85)]"
                    style={{ borderColor: "rgba(57,64,73,0.1)" }}
                  >
                    {[...criterio.descriptores]
                      .sort((a, b) => b.notaNivel - a.notaNivel)
                      .map((descriptor) => {
                        const esSeleccionado =
                          descriptorSeleccionado?.notaNivel === descriptor.notaNivel;
                        return (
                          <div
                            key={descriptor.notaNivel}
                            className="rounded-md px-3 py-3 mb-2 text-sm"
                            style={{
                              backgroundColor: esSeleccionado
                                ? "var(--color-evalUA4)"
                                : "transparent",
                              borderLeft: esSeleccionado
                                ? "3px solid var(--color-evalUA21)"
                                : "3px solid transparent",
                              opacity: esSeleccionado ? 1 : 0.85,
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">
                                Nota {descriptor.notaNivel}:
                              </span>
                              <span>{descriptor.etiqueta}</span>
                            </div>
                            {esSeleccionado && descriptor.bulletPoints.length > 0 && (
                              <ul className="mt-2 ml-5 list-disc" style={{ color: "rgba(57,64,73,0.7)" }}>
                                {descriptor.bulletPoints.map((bp, i) => (
                                  <li key={i} className="text-xs text-gray-600">
                                    {bp}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {evaluacion.observaciones && (
          <div className="embed-panel px-4 py-4">
            <span className="text-xs font-medium" style={{ color: "var(--color-evalUA2)" }}>
              Observaciones
            </span>
            <p className="text-xs mt-2" style={{ color: "rgba(57,64,73,0.7)" }}>
              {evaluacion.observaciones}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
