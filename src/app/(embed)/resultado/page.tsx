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
  criterios: Array<{
    _id: string;
    nombre: string;
    ponderacion: number;
    tipo: string;
    esExcluyente: boolean;
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
        const evaluacionId = params.get("id");

        if (!evaluacionId) {
          setError("Se requiere ID de evaluación");
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

  const aprobada = evaluacion.notaFinal >= 4.0;

  return (
    <div className="flex flex-col h-full">
      {/* Header con nota final */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{
          borderColor: "rgba(57,64,73,0.15)",
          backgroundColor: "var(--color-evalUA16)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm" style={{ color: "var(--color-evalUA1)" }}>
            Resultado:
          </span>
          <span className="text-sm font-medium">{rubrica.titulo}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "rgba(57,64,73,0.6)" }}>
            Nota Final:
          </span>
          <span
            className="text-base font-bold px-3 py-1 rounded"
            style={{
              backgroundColor: aprobada ? "var(--color-evalUA21)" : "var(--color-evalUA8)",
              color: "#fff",
            }}
          >
            {evaluacion.notaFinal.toFixed(2)}
          </span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded"
            style={{
              backgroundColor: aprobada ? "var(--color-evalUA21)" : "var(--color-evalUA8)",
              color: "#fff",
            }}
          >
            {aprobada ? "Aprobada" : "Reprobada"}
          </span>
        </div>
      </div>

      {/* Acordeón de criterios */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
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
              className="border rounded overflow-hidden"
              style={{ borderColor: "rgba(57,64,73,0.15)" }}
            >
              {/* Fila colapsada */}
              <button
                className="w-full flex items-center justify-between px-3 py-2 hover:opacity-80 transition-opacity text-left"
                style={{ backgroundColor: "var(--color-evalUA16)" }}
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
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{
                      backgroundColor:
                        puntaje.notaAsignada >= 4.0
                          ? "var(--color-evalUA21)"
                          : "var(--color-evalUA8)",
                      color: "#fff",
                    }}
                  >
                    {puntaje.notaAsignada.toFixed(1)}
                  </span>
                )}
              </button>

              {/* Contenido expandido */}
              {expandido && (
                <div
                  className="px-3 py-2 border-t space-y-1"
                  style={{
                    borderColor: "rgba(57,64,73,0.1)",
                    backgroundColor: "rgba(255,254,253,0.5)",
                  }}
                >
                  {[...criterio.descriptores]
                    .sort((a, b) => b.notaNivel - a.notaNivel)
                    .map((descriptor) => {
                      const esSeleccionado =
                        descriptorSeleccionado?.notaNivel === descriptor.notaNivel;
                      return (
                        <div
                          key={descriptor.notaNivel}
                          className="px-3 py-2 rounded text-sm"
                          style={{
                            backgroundColor: esSeleccionado
                              ? "var(--color-evalUA4)"
                              : "transparent",
                            borderLeft: esSeleccionado
                              ? "3px solid var(--color-evalUA21)"
                              : "3px solid transparent",
                            opacity: esSeleccionado ? 1 : 0.5,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              Nota {descriptor.notaNivel}:
                            </span>
                            <span>{descriptor.etiqueta}</span>
                          </div>
                          {esSeleccionado && descriptor.bulletPoints.length > 0 && (
                            <ul className="mt-1 ml-4 list-disc">
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

      {/* Footer con observaciones */}
      {evaluacion.observaciones && (
        <div
          className="px-4 py-2 border-t"
          style={{
            borderColor: "rgba(57,64,73,0.15)",
            backgroundColor: "var(--color-evalUA16)",
          }}
        >
          <span className="text-xs font-medium" style={{ color: "var(--color-evalUA2)" }}>
            Observaciones:{" "}
          </span>
          <span className="text-xs" style={{ color: "rgba(57,64,73,0.7)" }}>
            {evaluacion.observaciones}
          </span>
        </div>
      )}
    </div>
  );
}
