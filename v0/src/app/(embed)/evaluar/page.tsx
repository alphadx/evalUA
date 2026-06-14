"use client";

/**
 * EvalUA v3.0 — Wizard de Evaluación (Iframe)
 * Paso a paso interactivo con auto-save y pantalla de resumen
 */

import { Criterio } from "@/domain/entities/criterio";
import { Descriptor } from "@/domain/entities/descriptor";
import { Puntaje } from "@/domain/entities/puntaje";
import { EvaluacionStrategy } from "@/domain/strategies/evaluacion-strategy";
import { CriterioId } from "@/domain/types";
import { Nota } from "@/domain/value-objects/nota";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

/** Rúbrica de demostración hardcodeada para modo demo */
const DEMO_RUBRICA: RubricaData = {
  _id: "demo",
  titulo: "Rúbrica de Demostración",
  criterios: [
    {
      _id: "demo-c1",
      nombre: "Contenido",
      ponderacion: 0.5,
      tipo: "ESTRUCTURAL",
      esExcluyente: false,
      descripcion: "Evalúa la calidad y profundidad del contenido presentado.",
      descriptores: [
        { notaNivel: 7, etiqueta: "Excelente", bulletPoints: ["Contenido completo y exhaustivo", "Análisis profundo y bien fundamentado", "Fuentes confiables y actualizadas"] },
        { notaNivel: 6, etiqueta: "Muy Bueno", bulletPoints: ["Contenido completo con buen análisis", "Fundamentación sólida"] },
        { notaNivel: 5, etiqueta: "Bueno", bulletPoints: ["Contenido adecuado", "Análisis razonable"] },
        { notaNivel: 4, etiqueta: "Suficiente", bulletPoints: ["Contenido básico cumple requisitos mínimos", "Análisis superficial"] },
        { notaNivel: 3, etiqueta: "Insuficiente", bulletPoints: ["Contenido incompleto", "Falta de fundamentación"] },
        { notaNivel: 2, etiqueta: "Deficiente", bulletPoints: ["Contenido muy escaso", "Sin análisis claro"] },
        { notaNivel: 1, etiqueta: "Nulo", bulletPoints: ["Sin contenido relevante"] },
      ],
    },
    {
      _id: "demo-c2",
      nombre: "Redacción",
      ponderacion: 0.3,
      tipo: "ESTRUCTURAL",
      esExcluyente: false,
      descripcion: "Evalúa la claridad, coherencia y ortografía del texto.",
      descriptores: [
        { notaNivel: 7, etiqueta: "Excelente", bulletPoints: ["Redacción impecable", "Fluidez y coherencia total", "Sin errores ortográficos"] },
        { notaNivel: 6, etiqueta: "Muy Bueno", bulletPoints: ["Redacción clara y fluida", "Mínimos errores"] },
        { notaNivel: 5, etiqueta: "Bueno", bulletPoints: ["Redacción aceptable", "Algunos errores menores"] },
        { notaNivel: 4, etiqueta: "Suficiente", bulletPoints: ["Redacción comprensible", "Varios errores ortográficos"] },
        { notaNivel: 3, etiqueta: "Insuficiente", bulletPoints: ["Redacción confusa", "Errores frecuentes"] },
        { notaNivel: 2, etiqueta: "Deficiente", bulletPoints: ["Redacción difícil de entender", "Muchos errores"] },
        { notaNivel: 1, etiqueta: "Nulo", bulletPoints: ["Redacción incomprensible"] },
      ],
    },
    {
      _id: "demo-c3",
      nombre: "Presentación",
      ponderacion: 0.2,
      tipo: "COMPLEMENTARIO",
      esExcluyente: false,
      descripcion: "Evalúa el formato, diseño visual y organización del documento.",
      descriptores: [
        { notaNivel: 7, etiqueta: "Excelente", bulletPoints: ["Diseño profesional", "Estructura impecable", "Uso adecuado de imágenes y gráficos"] },
        { notaNivel: 6, etiqueta: "Muy Bueno", bulletPoints: ["Buen diseño y estructura", "Elementos visuales bien integrados"] },
        { notaNivel: 5, etiqueta: "Bueno", bulletPoints: ["Diseño aceptable", "Estructura clara"] },
        { notaNivel: 4, etiqueta: "Suficiente", bulletPoints: ["Diseño básico", "Estructura simple pero funcional"] },
        { notaNivel: 3, etiqueta: "Insuficiente", bulletPoints: ["Diseño descuidado", "Estructura confusa"] },
        { notaNivel: 2, etiqueta: "Deficiente", bulletPoints: ["Sin formato claro", "Desorganizado"] },
        { notaNivel: 1, etiqueta: "Nulo", bulletPoints: ["Sin presentación"] },
      ],
    },
  ],
};

interface RubricaData {
  _id: string;
  titulo: string;
  criterios: Array<{
    _id: string;
    nombre: string;
    ponderacion: number;
    tipo: "ESTRUCTURAL" | "COMPLEMENTARIO";
    esExcluyente: boolean;
    descripcion: string | null;
    descriptores: Array<{
      notaNivel: number;
      etiqueta: string;
      bulletPoints: string[];
    }>;
  }>;
}

interface DraftData {
  evaluacionId: string;
  rubricaId: string;
  estado: string;
  observaciones: string | null;
  puntajes: Array<{
    criterioId: string;
    notaAsignada: number;
    observaciones: string | null;
  }>;
}

type PasoWizard = number | "resumen";

export default function EvaluarPage() {
  const [rubrica, setRubrica] = useState<RubricaData | null>(null);
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [pasoActual, setPasoActual] = useState<PasoWizard>(0);
  const [puntajes, setPuntajes] = useState<
    Map<string, { nota: number; observaciones: string | null }>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [observacionesGenerales, setObservacionesGenerales] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);
  const [calculando, setCalculando] = useState(false);
  const [completada, setCompletada] = useState(false);

  // Inicializar: obtener datos del token (simulado por searchParams)
  useEffect(() => {
    const init = async () => {
      try {
        // En modo iframe real, el token vendría del Host
        // Por ahora, buscamos params en la URL para desarrollo
        const params = new URLSearchParams(window.location.search);
        const token = params.get("jwt") || params.get("token");
        const rubricaId = params.get("rubricaId");
        const evaluacionId = params.get("evaluacionId");

        if (!token && !rubricaId) {
          setError("Se requiere token JWT o rubricaId para iniciar evaluación");
          setLoading(false);
          return;
        }

        // Modo demo: usar rúbrica hardcodeada
        if (rubricaId === "demo") {
          setRubrica(DEMO_RUBRICA);
          const demoDraft: DraftData = {
            evaluacionId: "demo-eval-" + Date.now(),
            rubricaId: "demo",
            estado: "EN_PROGRESO",
            observaciones: null,
            puntajes: [],
          };
          setDraft(demoDraft);
          setLoading(false);
          return;
        }

        // Si hay token, llamar al launch endpoint
        if (token) {
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

          // Usar datos del launch
          const data = launchData.data;
          if (data.rubricaId) {
            await cargarRubricaYDraft(data.rubricaId, data.evaluacionId);
          } else if (data.modo === "ver_resultado" && data.evaluacionId) {
            window.location.href = `/resultado?id=${data.evaluacionId}`;
            return;
          }
        } else if (rubricaId) {
          await cargarRubricaYDraft(rubricaId, evaluacionId || undefined);
        }
      } catch (err) {
        setError("Error inicializando evaluación");
        console.error(err);
      }
      setLoading(false);
    };

    init();
  }, []);

  const cargarRubricaYDraft = async (
    rubricaId: string,
    evaluacionId?: string
  ) => {
    // Cargar rúbrica
    const rubricaRes = await fetch(`/api/rubricas/${rubricaId}`, {
      headers: { Authorization: "Bearer dev-token" },
    });
    const rubricaData = await rubricaRes.json();
    if (rubricaData.success) {
      setRubrica(rubricaData.data);
    } else {
      setError("Error cargando rúbrica");
      return;
    }

    // Crear o recuperar evaluación
    if (evaluacionId) {
      const evalRes = await fetch(`/api/evaluaciones/${evaluacionId}`, {
        headers: { Authorization: "Bearer dev-token" },
      });
      const evalData = await evalRes.json();
      if (evalData.success && evalData.data.estado !== "COMPLETADA") {
        const d = evalData.data;
        setDraft(d);
        setObservacionesGenerales(d.observaciones || "");
        // Cargar puntajes existentes
        const pMap = new Map<
          string,
          { nota: number; observaciones: string | null }
        >();
        for (const p of d.puntajes || []) {
          pMap.set(p.criterioId, {
            nota: p.notaAsignada,
            observaciones: p.observaciones,
          });
        }
        setPuntajes(pMap);
      } else if (evalData.success && evalData.data.estado === "COMPLETADA") {
        setCompletada(true);
        return;
      }
    }

    // Si no hay draft, crear uno nuevo
    if (!evaluacionId || !draft) {
      const newEvalId = evaluacionId || crypto.randomUUID();
      const createRes = await fetch("/api/evaluaciones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer dev-token",
        },
        body: JSON.stringify({
          evaluacionId: newEvalId,
          rubricaId,
        }),
      });
      const createData = await createRes.json();
      if (createData.success) {
        setDraft(createData.data);
      }
    }
  };

  const autoSave = useCallback(
    async (
      newPuntajes: Map<string, { nota: number; observaciones: string | null }>,
      estado?: string
    ) => {
      if (!draft) return;
      // En modo demo, skip API calls
      if (draft.evaluacionId.startsWith("demo-eval-")) {
        return;
      }
      setSavingDraft(true);
      try {
        await fetch(`/api/evaluaciones/${draft.evaluacionId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer dev-token",
          },
          body: JSON.stringify({
            estado: estado || draft.estado,
            observaciones: observacionesGenerales,
            puntajes: Array.from(newPuntajes.entries()).map(
              ([criterioId, p]) => ({
                criterioId,
                notaAsignada: p.nota,
                observaciones: p.observaciones,
              })
            ),
          }),
        });
      } catch (err) {
        console.error("Auto-save error:", err);
      }
      setSavingDraft(false);
    },
    [draft, observacionesGenerales]
  );

  const handleSeleccionarDescriptor = async (
    criterioId: string,
    nota: number
  ) => {
    const newPuntajes = new Map(puntajes);
    newPuntajes.set(criterioId, { nota, observaciones: null });
    setPuntajes(newPuntajes);

    // Auto-save
    await autoSave(newPuntajes);

    // Avanzar automáticamente al siguiente criterio o al resumen
    if (rubrica) {
      const totalCriterios = rubrica.criterios.length;
      if (typeof pasoActual === "number") {
        if (pasoActual < totalCriterios - 1) {
          setPasoActual(pasoActual + 1);
        } else {
          // Último criterio → ir a resumen
          setPasoActual("resumen");
          await autoSave(newPuntajes, "EN_REVISION");
          if (draft) {
            setDraft({ ...draft, estado: "EN_REVISION" });
          }
        }
      }
    }
  };

  const calcularNotaFinal = (): number | null => {
    if (!rubrica) return null;
    try {
      const criteriosDomain = rubrica.criterios.map(
        (c) =>
          new Criterio(
            c._id as CriterioId,
            c.nombre,
            c.ponderacion,
            c.tipo,
            c.esExcluyente,
            c.descripcion,
            null,
            null,
            0,
            c.descriptores.map(
              (d) => Descriptor.create({ notaNivel: d.notaNivel, etiqueta: d.etiqueta, bulletPoints: d.bulletPoints })
            )
          )
      );

      const puntajesDomain: Puntaje[] = [];
      for (const [criterioId, p] of puntajes.entries()) {
        puntajesDomain.push(
          Puntaje.create({
            criterioId: criterioId as CriterioId,
            notaAsignada: Nota.create(p.nota),
            observaciones: p.observaciones,
          })
        );
      }

      const strategy = new EvaluacionStrategy();
      const nota = strategy.calcular(puntajesDomain, criteriosDomain);
      return nota.valor;
    } catch {
      return null;
    }
  };

  const handleFinalizar = async () => {
    if (!draft) return;
    setCalculando(true);
    try {
      // Primero guardar observaciones generales
      await autoSave(puntajes, "EN_REVISION");

      const res = await fetch(`/api/evaluaciones/${draft.evaluacionId}/calcular`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer dev-token",
          "Idempotency-Key": crypto.randomUUID(),
        },
      });
      const data = await res.json();
      if (data.success) {
        setCompletada(true);
        // Emitir postMessage al host
        window.parent.postMessage(
          {
            source: "evalua",
            version: "3.0",
            type: "evalua.evaluation.completed",
            payload: {
              evaluacionId: draft.evaluacionId,
              status: "completed",
            },
          },
          "*"
        );
      } else {
        setError(data.error?.detail || "Error al finalizar evaluación");
      }
    } catch (err) {
      setError("Error al finalizar evaluación");
      console.error(err);
    }
    setCalculando(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg" style={{ color: "var(--color-evalUA2)" }}>
          Cargando evaluación...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div
          className="text-lg font-semibold"
          style={{ color: "var(--color-evalUA8)" }}
        >
          {error}
        </div>
      </div>
    );
  }

  if (completada) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div
          className="text-2xl font-bold"
          style={{ color: "var(--color-evalUA21)" }}
        >
          ✓ Evaluación Finalizada
        </div>
        <div className="text-sm" style={{ color: "var(--color-evalUA2)" }}>
          La evaluación ha sido consolidada exitosamente.
        </div>
      </div>
    );
  }

  if (!rubrica || !draft) {
    return (
      <div className="flex items-center justify-center h-full">
        <div>No se pudo cargar la evaluación</div>
      </div>
    );
  }

  const criteriosOrdenados = [...rubrica.criterios].sort(
    (a, b) => (a._id || "").localeCompare(b._id || "")
  );
  const notaFinalProvisional = calcularNotaFinal();

  return (
    <div className="flex flex-col h-full">
      <div className="embed-header">
        <div className="embed-title">Evaluación</div>
        <span className="embed-badge">RÚBRICA</span>
      </div>

      <div className="embed-content overflow-y-auto px-4 py-4 space-y-4">
        <div className="embed-panel px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--color-evalUA2)" }}>
                {rubrica.titulo}
              </p>
              <p className="text-sm font-medium mt-1">
                {pasoActual === "resumen" ? "Resumen" : `Criterio ${(typeof pasoActual === "number" ? pasoActual : 0) + 1} de ${criteriosOrdenados.length}`}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {savingDraft && (
                <span className="text-xs" style={{ color: "var(--color-evalUA1)" }}>
                  Guardando...
                </span>
              )}
              <span className="text-xs" style={{ color: "rgba(57,64,73,0.6)" }}>
                {pasoActual === "resumen" ? "Resumen completo" : "Avance en evaluación"}
              </span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {pasoActual === "resumen" ? (
            <motion.div
              key="resumen"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <h3 className="text-base font-semibold">
                Resumen de Calificaciones
              </h3>
              <p className="text-xs" style={{ color: "rgba(57,64,73,0.6)" }}>
                Haga clic en un criterio para editar
              </p>
              <div className="space-y-1.5">
                {criteriosOrdenados.map((criterio, idx) => {
                  const puntaje = puntajes.get(criterio._id);
                  const descriptor = puntaje
                    ? criterio.descriptores.find(
                        (d) => d.notaNivel === puntaje.nota
                      )
                    : null;
                  const aprobado = puntaje && puntaje.nota >= 4.0;

                  return (
                    <div
                      key={criterio._id}
                      className="flex items-center justify-between px-3 py-2 rounded cursor-pointer hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: "rgba(157,212,211,0.15)",
                        borderLeft: `3px solid ${aprobado ? "var(--color-evalUA21)" : puntaje ? "var(--color-evalUA8)" : "rgba(57,64,73,0.2)"}`,
                      }}
                      onClick={() => setPasoActual(idx)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">
                          {idx + 1}. {criterio.nombre}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: "rgba(57,64,73,0.5)" }}
                        >
                          ({(criterio.ponderacion * 100).toFixed(0)}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {puntaje ? (
                          <>
                            <span className="text-xs">
                              Nota {puntaje.nota}: {descriptor?.etiqueta || ""}
                            </span>
                            <span
                              className="text-xs px-2 py-0.5 rounded font-medium"
                              style={{
                                backgroundColor: aprobado
                                  ? "var(--color-evalUA21)"
                                  : "var(--color-evalUA8)",
                                color: "#fff",
                              }}
                            >
                              {aprobado ? "Aprobado" : "Reprobado"}
                            </span>
                          </>
                        ) : (
                          <span
                            className="text-xs"
                            style={{ color: "var(--color-evalUA8)" }}
                          >
                            Sin calificar
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Observaciones generales */}
              <div className="pt-2">
                <label className="text-xs font-medium block mb-1">
                  Observaciones generales:
                </label>
                <textarea
                  className="w-full text-sm border rounded p-2 resize-none"
                  rows={3}
                  style={{
                    borderColor: "rgba(57,64,73,0.2)",
                    backgroundColor: "#fff",
                  }}
                  value={observacionesGenerales}
                  onChange={(e) => setObservacionesGenerales(e.target.value)}
                  onBlur={() => autoSave(puntajes)}
                  placeholder="Ingrese observaciones generales sobre la evaluación..."
                />
              </div>
            </motion.div>
          ) : (
            typeof pasoActual === "number" && (
              <motion.div
                key={`criterio-${pasoActual}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <div>
                  <h3 className="text-base font-semibold">
                    {criteriosOrdenados[pasoActual].nombre}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-xs"
                      style={{ color: "rgba(57,64,73,0.6)" }}
                    >
                      Ponderación:{" "}
                      {(
                        criteriosOrdenados[pasoActual].ponderacion * 100
                      ).toFixed(0)}
                      %
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor:
                          criteriosOrdenados[pasoActual].tipo === "ESTRUCTURAL"
                            ? "rgba(234,118,0,0.15)"
                            : "rgba(57,64,73,0.1)",
                        color:
                          criteriosOrdenados[pasoActual].tipo === "ESTRUCTURAL"
                            ? "var(--color-evalUA1)"
                            : "var(--color-evalUA2)",
                      }}
                    >
                      {criteriosOrdenados[pasoActual].tipo}
                    </span>
                    {criteriosOrdenados[pasoActual].esExcluyente && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-medium"
                        style={{
                          backgroundColor: "rgba(200,16,46,0.1)",
                          color: "var(--color-evalUA8)",
                        }}
                      >
                        Excluyente
                      </span>
                    )}
                  </div>
                  {criteriosOrdenados[pasoActual].descripcion && (
                    <p
                      className="text-xs mt-1"
                      style={{ color: "rgba(57,64,73,0.7)" }}
                    >
                      {criteriosOrdenados[pasoActual].descripcion}
                    </p>
                  )}
                </div>

                {/* Descriptores */}
                <div className="space-y-1.5">
                  {[...criteriosOrdenados[pasoActual].descriptores]
                    .sort((a, b) => b.notaNivel - a.notaNivel)
                    .map((descriptor) => {
                      const isSelected =
                        puntajes.get(criteriosOrdenados[pasoActual]._id)
                          ?.nota === descriptor.notaNivel;
                      return (
                        <button
                          key={descriptor.notaNivel}
                          className="w-full text-left px-3 py-2.5 rounded border transition-all"
                          style={{
                            backgroundColor: isSelected
                              ? "var(--color-evalUA4)"
                              : "var(--color-evalUA16)",
                            borderColor: isSelected
                              ? "var(--color-evalUA1)"
                              : "rgba(57,64,73,0.15)",
                            borderWidth: isSelected ? "2px" : "1px",
                          }}
                          onClick={() =>
                            handleSeleccionarDescriptor(
                              criteriosOrdenados[pasoActual]._id,
                              descriptor.notaNivel
                            )
                          }
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className="font-semibold text-sm shrink-0"
                              style={{
                                color: isSelected
                                  ? "var(--color-evalUA2)"
                                  : "var(--color-evalUA1)",
                              }}
                            >
                              Nota {descriptor.notaNivel}:
                            </span>
                            <span className="text-sm font-medium">
                              {descriptor.etiqueta}
                            </span>
                          </div>
                          {descriptor.bulletPoints.length > 0 && (
                            <ul className="mt-1 ml-6 list-disc">
                              {descriptor.bulletPoints.map((bp, i) => (
                                <li
                                  key={i}
                                  className="text-xs"
                                  style={{
                                    color: "rgba(57,64,73,0.7)",
                                  }}
                                >
                                  {bp}
                                </li>
                              ))}
                            </ul>
                          )}
                        </button>
                      );
                    })}
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>

      <div className="embed-panel-footer">
        <button
          className="px-4 py-1.5 text-sm rounded border hover:opacity-80 transition-opacity"
          style={{
            borderColor: "rgba(57,64,73,0.3)",
            color: "var(--color-evalUA2)",
          }}
          onClick={() => {
            if (pasoActual === "resumen") {
              setPasoActual(criteriosOrdenados.length - 1);
            } else if (typeof pasoActual === "number" && pasoActual > 0) {
              setPasoActual(pasoActual - 1);
            }
          }}
        >
          Atrás
        </button>

        <div className="flex items-center gap-3 flex-wrap">
          {notaFinalProvisional !== null && (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "rgba(57,64,73,0.6)" }}>
                Nota Final Provisional:
              </span>
              <span
                className="text-sm font-bold px-2 py-0.5 rounded"
                style={{
                  backgroundColor:
                    notaFinalProvisional >= 4.0
                      ? "var(--color-evalUA21)"
                      : "var(--color-evalUA8)",
                  color: "#fff",
                }}
              >
                {notaFinalProvisional.toFixed(2)}
              </span>
            </div>
          )}

          {pasoActual === "resumen" ? (
            <button
              className="px-4 py-1.5 text-sm rounded text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{
                backgroundColor: "var(--color-evalUA1)",
              }}
              onClick={handleFinalizar}
              disabled={calculando}
            >
              {calculando ? "Calculando..." : "Finalizar Evaluación"}
            </button>
          ) : (
            <button
              className="px-4 py-1.5 text-sm rounded text-white hover:opacity-90 transition-opacity"
              style={{
                backgroundColor: "var(--color-evalUA1)",
              }}
              onClick={() => {
                if (
                  typeof pasoActual === "number" &&
                  pasoActual < criteriosOrdenados.length - 1
                ) {
                  setPasoActual(pasoActual + 1);
                } else {
                  setPasoActual("resumen");
                  autoSave(puntajes, "EN_REVISION");
                }
              }}
            >
              Siguiente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
