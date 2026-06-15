"use client";

/**
 * EvalUA v3.0 — Wizard de Evaluación (Iframe)
 * Paso a paso interactivo con auto-save, pantalla de resumen y visualización completa.
 * Adaptado desde mockup con: stepper, grade circle colors, gatekeeper badge,
 * cumulative grade, per-criterion observations, calculation detail, modify buttons.
 */

import { Criterio } from "@/domain/entities/criterio";
import { Descriptor } from "@/domain/entities/descriptor";
import { Puntaje } from "@/domain/entities/puntaje";
import { EvaluacionStrategy } from "@/domain/strategies/evaluacion-strategy";
import { CriterioId } from "@/domain/types";
import { Nota } from "@/domain/value-objects/nota";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";

/** Rúbrica de demostración hardcodeada para modo demo */
const DEMO_RUBRICA: RubricaData = {
  _id: "demo",
  titulo: "Rúbrica de Demostración",
  notaAprobacion: 4.0,
  criterios: [
    {
      _id: "demo-c1",
      nombre: "Contenido",
      ponderacion: 0.5,
      tipo: "ESTRUCTURAL",
      esExcluyente: false,
      notaCorte: 4.0,
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
      notaCorte: 4.0,
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
      notaCorte: 4.0,
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
  notaAprobacion: number;
  criterios: Array<{
    _id: string;
    nombre: string;
    ponderacion: number;
    tipo: "ESTRUCTURAL" | "COMPLEMENTARIO";
    esExcluyente: boolean;
    notaCorte: number;
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

type WizardPhase = "evaluando" | "resumen" | "completada";

/** Color de fondo del círculo de nota según nivel */
function notaCircleColor(nota: number): string {
  if (nota >= 5) return "var(--color-evalUA21)"; // success green
  if (nota >= 4) return "var(--color-evalUA1)";  // primary orange
  if (nota >= 3) return "#eab308";                // yellow
  return "var(--color-evalUA8)";                  // danger red
}

export default function EvaluarPage() {
  const [rubrica, setRubrica] = useState<RubricaData | null>(null);
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [phase, setPhase] = useState<WizardPhase>("evaluando");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [puntajes, setPuntajes] = useState<
    Map<string, { nota: number; observaciones: string | null }>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [observacionesGenerales, setObservacionesGenerales] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);
  const [calculando, setCalculando] = useState(false);
  const [showObservations, setShowObservations] = useState(false);
  const [obsCriterio, setObsCriterio] = useState("");

  // ── Derived state ──

  const criterios = useMemo(() => {
    if (!rubrica) return [];
    return [...rubrica.criterios].sort((a, b) =>
      (a._id || "").localeCompare(b._id || "")
    );
  }, [rubrica]);

  const totalCriterios = criterios.length;
  const currentCriterio = criterios[currentIdx] ?? null;

  const allEvaluated = useMemo(() => {
    return criterios.length > 0 && criterios.every((c) => puntajes.has(c._id));
  }, [puntajes, criterios]);

  // Nota de aprobación configurable de la rúbrica
  const notaAprobacion = rubrica?.notaAprobacion ?? 4.0;

  // Gatekeeper: si un criterio excluyente tiene nota < notaCorte → activado
  const gatekeeperTriggered = useMemo(() => {
    for (const c of criterios) {
      if (c.esExcluyente) {
        const p = puntajes.get(c._id);
        if (p !== undefined && p.nota < c.notaCorte) return true;
      }
    }
    return false;
  }, [puntajes, criterios]);

  // Nota final provisional (usa domain strategy)
  const notaFinalProvisional = useMemo((): number | null => {
    if (!rubrica || puntajes.size === 0) return null;
    try {
      const criteriosDomain = rubrica.criterios.map(
        (c) =>
          new Criterio(
            c._id as CriterioId,
            c.nombre,
            c.ponderacion,
            c.tipo,
            c.esExcluyente,
            c.notaCorte,
            c.descripcion,
            null,
            null,
            0,
            c.descriptores.map((d) =>
              Descriptor.create({
                notaNivel: d.notaNivel,
                etiqueta: d.etiqueta,
                bulletPoints: d.bulletPoints,
              })
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
  }, [rubrica, puntajes]);

  // Cumulative grade for display while evaluating (may be partial)
  const cumulativeGrade = useMemo(() => {
    let weightedSum = 0;
    let totalWeight = 0;
    for (const c of criterios) {
      const p = puntajes.get(c._id);
      if (p !== undefined) {
        weightedSum += p.nota * c.ponderacion;
        totalWeight += c.ponderacion;
      }
    }
    return totalWeight > 0
      ? Math.round((weightedSum / totalWeight) * 100) / 100
      : 0;
  }, [puntajes, criterios]);

  // ── Initialization ──

  useEffect(() => {
    const init = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("jwt") || params.get("token");
        const rubricaId = params.get("rubricaId");
        const evaluacionId = params.get("evaluacionId");

        if (!token && !rubricaId) {
          setError(
            "Se requiere token JWT o rubricaId para iniciar evaluación"
          );
          setLoading(false);
          return;
        }

        // Modo demo
        if (rubricaId === "demo") {
          setRubrica(DEMO_RUBRICA);
          setDraft({
            evaluacionId: "demo-eval-" + Date.now(),
            rubricaId: "demo",
            estado: "EN_PROGRESO",
            observaciones: null,
            puntajes: [],
          });
          setLoading(false);
          return;
        }

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
          const data = launchData.data;
          if (data.rubricaId) {
            await cargarRubricaYDraft(data.rubricaId, data.evaluacionId);
          } else if (data.evaluacionId) {
            // Fallback: si el launch no devolvió rubricaId, intentar
            // obtenerlo del borrador existente en el servidor
            const evalRes = await fetch(`/api/evaluaciones/${data.evaluacionId}`, {
              headers: { Authorization: "Bearer dev-token" },
            });
            const evalData = await evalRes.json();
            if (evalData.success && evalData.data.rubricaId) {
              await cargarRubricaYDraft(evalData.data.rubricaId, data.evaluacionId);
            } else if (data.modo === "ver_resultado") {
              window.location.href = `/resultado?id=${data.evaluacionId}`;
              return;
            } else {
              setError("No se pudo determinar la rúbrica para esta evaluación");
            }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarRubricaYDraft = async (
    rubricaId: string,
    evaluacionId?: string
  ) => {
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

    if (evaluacionId) {
      const evalRes = await fetch(`/api/evaluaciones/${evaluacionId}`, {
        headers: { Authorization: "Bearer dev-token" },
      });
      const evalData = await evalRes.json();
      if (evalData.success && evalData.data.estado !== "COMPLETADA") {
        const d = evalData.data;
        setDraft(d);
        setObservacionesGenerales(d.observaciones || "");
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
      } else if (
        evalData.success &&
        evalData.data.estado === "COMPLETADA"
      ) {
        setPhase("completada");
        return;
      }
    }

    if (!evaluacionId) {
      const newEvalId = crypto.randomUUID();
      const createRes = await fetch("/api/evaluaciones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer dev-token",
        },
        body: JSON.stringify({ evaluacionId: newEvalId, rubricaId }),
      });
      const createData = await createRes.json();
      if (createData.success) {
        setDraft(createData.data);
      }
    }
  };

  // ── Auto-save ──

  const autoSave = useCallback(
    async (
      newPuntajes: Map<
        string,
        { nota: number; observaciones: string | null }
      >,
      estado?: string
    ) => {
      if (!draft) return;
      if (draft.evaluacionId.startsWith("demo-eval-")) return;
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

  // ── Handlers ──

  const handleSeleccionarDescriptor = useCallback(
    async (criterioId: string, nota: number) => {
      const newPuntajes = new Map(puntajes);
      newPuntajes.set(criterioId, { nota, observaciones: null });
      setPuntajes(newPuntajes);

      // Visual feedback on auto-save
      setSavingDraft(true);
      setTimeout(() => setSavingDraft(false), 600);

      await autoSave(newPuntajes);

      // Auto-advance after 400ms delay
      if (rubrica) {
        setTimeout(() => {
          setCurrentIdx((prevIdx) => {
            const nextIdx = prevIdx + 1;
            if (nextIdx >= rubrica.criterios.length) {
              setPhase("resumen");
              autoSave(newPuntajes, "EN_REVISION");
              return prevIdx;
            }
            return nextIdx;
          });
        }, 400);
      }
    },
    [puntajes, rubrica, autoSave]
  );

  const goToCriterion = useCallback((idx: number) => {
    setPhase("evaluando");
    setCurrentIdx(idx);
    setShowObservations(false);
  }, []);

  const handleFinalizar = async () => {
    if (!draft) return;
    setCalculando(true);
    try {
      await autoSave(puntajes, "EN_REVISION");

      const res = await fetch(
        `/api/evaluaciones/${draft.evaluacionId}/calcular`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer dev-token",
            "Idempotency-Key": crypto.randomUUID(),
          },
        }
      );
      const data = await res.json();
      if (data.success) {
        setPhase("completada");
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

  // Helper: get descriptor label for a given criterio and note
  const getDescriptorLabel = (
    criterioId: string,
    nota: number
  ): string => {
    const crit = criterios.find((c) => c._id === criterioId);
    if (!crit) return "—";
    const desc = crit.descriptores.find((d) => d.notaNivel === Math.round(nota));
    return desc?.etiqueta || "—";
  };

  // ── Loading / Error states ──

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div style={{ color: "var(--color-evalUA2)" }}>
          Cargando evaluación...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div
          className="font-semibold"
          style={{ color: "var(--color-evalUA8)" }}
        >
          {error}
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

  // ════════════════════════════════════════════
  //  COMPLETADA
  // ════════════════════════════════════════════
  if (phase === "completada") {
    const nota = notaFinalProvisional ?? 0;
    const aprobada = nota >= notaAprobacion;
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-4 px-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              backgroundColor: aprobada
                ? "rgba(25,135,84,0.1)"
                : "rgba(200,16,46,0.1)",
            }}
          >
            <span
              className="text-2xl font-bold"
              style={{
                color: aprobada
                  ? "var(--color-evalUA21)"
                  : "var(--color-evalUA8)",
              }}
            >
              ✓
            </span>
          </motion.div>
          <h2
            className="text-xl font-bold"
            style={{ color: "var(--color-evalUA2)" }}
          >
            Evaluación Finalizada
          </h2>
          <p
            className="text-sm"
            style={{ color: "rgba(57,64,73,0.6)" }}
          >
            La evaluación ha sido consolidada y el resultado ha sido enviado
            al sistema Host.
          </p>
          <div className="flex items-center justify-center gap-3">
            <span
              className="text-sm"
              style={{ color: "rgba(57,64,73,0.6)" }}
            >
              Nota Final:
            </span>
            <span
              className="text-lg font-bold px-3 py-1 rounded"
              style={{
                backgroundColor: aprobada
                  ? "rgba(25,135,84,0.1)"
                  : "rgba(200,16,46,0.1)",
                color: aprobada
                  ? "var(--color-evalUA21)"
                  : "var(--color-evalUA8)",
              }}
            >
              {nota.toFixed(2)}
            </span>
            {gatekeeperTriggered && (
              <span
                className="text-xs px-2 py-1 rounded"
                style={{
                  backgroundColor: "rgba(200,16,46,0.1)",
                  color: "var(--color-evalUA8)",
                }}
              >
                ⚠ Gatekeeper activado
              </span>
            )}
          </div>
          <div className="pt-2">
            <code
              className="text-[10px] px-3 py-1 rounded"
              style={{
                color: "rgba(57,64,73,0.4)",
                backgroundColor: "rgba(57,64,73,0.05)",
              }}
            >
              postMessage(&#123; type: "evalua.evaluation.completed"
              &#125;)
            </code>
          </div>
        </motion.div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  //  RESUMEN
  // ════════════════════════════════════════════
  if (phase === "resumen") {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="embed-header">
          <div className="embed-title">
            <span
              className="inline-flex items-center justify-center w-4 h-4"
              style={{ color: "var(--color-evalUA1)" }}
            >
              👁
            </span>
            <span>Resumen de Evaluación</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="embed-summary-badge warning"
            >
              Pendiente de confirmación
            </span>
            <button
              className="text-xs hover:opacity-70"
              style={{ color: "rgba(57,64,73,0.5)" }}
              onClick={() => {
                setPhase("evaluando");
                setCurrentIdx(0);
              }}
            >
              ✕ Cancelar
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="embed-content overflow-y-auto px-4 py-3 space-y-3">
          {/* Criteria review list */}
          <div className="space-y-1.5">
            {criterios.map((c, idx) => {
              const p = puntajes.get(c._id);
              const isPassing = p !== undefined && p.nota >= notaAprobacion;
              const isExclFailed =
                c.esExcluyente && p !== undefined && p.nota < c.notaCorte;

              return (
                <motion.div
                  key={c._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:shadow-sm transition-shadow"
                  style={{
                    backgroundColor: isExclFailed
                      ? "#fef2f2"
                      : isPassing
                      ? "#f0fdf4"
                      : "var(--color-evalUA16)",
                    borderColor: isExclFailed
                      ? "#fecaca"
                      : isPassing
                      ? "#bbf7d0"
                      : "rgba(57,64,73,0.1)",
                    borderLeftWidth: "4px",
                    borderLeftColor: isExclFailed
                      ? "var(--color-evalUA8)"
                      : isPassing
                      ? "var(--color-evalUA21)"
                      : "rgba(57,64,73,0.2)",
                  }}
                  onClick={() => goToCriterion(idx)}
                >
                  {/* Number circle */}
                  <div
                    className="flex-shrink-0 rounded-full flex items-center justify-center text-white font-bold text-[10px]"
                    style={{
                      width: "22px",
                      height: "22px",
                      backgroundColor: "var(--color-evalUA2)",
                    }}
                  >
                    {idx + 1}
                  </div>

                  {/* Name & descriptor */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "var(--color-evalUA2)" }}
                      >
                        {c.nombre}
                      </span>
                      <span
                        className="text-[10px] px-1 py-0.5 rounded border"
                        style={{
                          borderColor: "rgba(57,64,73,0.2)",
                          color: "rgba(57,64,73,0.5)",
                        }}
                      >
                        {Math.round(c.ponderacion * 100)}%
                      </span>
                      {c.esExcluyente && (
                        <span
                          className="text-[10px] px-1 py-0.5 rounded"
                          style={{
                            backgroundColor: "rgba(200,16,46,0.1)",
                            color: "var(--color-evalUA8)",
                          }}
                        >
                          Excluyente
                        </span>
                      )}
                    </div>
                    <span
                      className="text-[10px]"
                      style={{ color: "rgba(57,64,73,0.5)" }}
                    >
                      {p !== undefined
                        ? getDescriptorLabel(c._id, p.nota)
                        : "Sin calificar"}
                    </span>
                  </div>

                  {/* Note badge */}
                  {p !== undefined && (
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: isPassing
                          ? "#dcfce7"
                          : "#fee2e2",
                        color: isPassing
                          ? "var(--color-evalUA21)"
                          : "var(--color-evalUA8)",
                      }}
                    >
                      {p.nota.toFixed(1)}
                    </span>
                  )}

                  {/* Modify button */}
                  <button
                    className="text-[10px] px-2 py-0.5 rounded hover:opacity-70"
                    style={{ color: "var(--color-evalUA1)" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      goToCriterion(idx);
                    }}
                  >
                    ✏ Modificar
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Observations field */}
          <div className="space-y-1.5">
            <label
              className="text-xs font-semibold"
              style={{ color: "var(--color-evalUA2)" }}
            >
              💬 Observaciones Generales
            </label>
            <textarea
              className="embed-textarea"
              style={{ minHeight: "52px" }}
              placeholder="Ingrese observaciones sobre la evaluación (opcional)..."
              value={observacionesGenerales}
              onChange={(e) => {
                setObservacionesGenerales(e.target.value);
                setSavingDraft(true);
                setTimeout(() => setSavingDraft(false), 600);
              }}
              onBlur={() => autoSave(puntajes)}
            />
          </div>

          {/* Calculation detail */}
          <div className="embed-panel px-3 py-2.5">
            <p
              className="text-[10px] font-semibold mb-1"
              style={{ color: "var(--color-evalUA2)" }}
            >
              Detalle del Cálculo:
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {criterios.map((c) => {
                const p = puntajes.get(c._id);
                const nota = p?.nota ?? 0;
                const contrib = nota * c.ponderacion;
                return (
                  <span
                    key={c._id}
                    className="text-[10px]"
                    style={{ color: "rgba(57,64,73,0.5)" }}
                  >
                    {c.nombre.split(" ").slice(0, 2).join(" ")}:{" "}
                    {nota.toFixed(1)} ×{" "}
                    {Math.round(c.ponderacion * 100)}% ={" "}
                    <span
                      className="font-medium"
                      style={{ color: "var(--color-evalUA2)" }}
                    >
                      {contrib.toFixed(2)}
                    </span>
                  </span>
                );
              })}
            </div>
            <div className="mt-1 pt-1 border-t flex items-center justify-between" style={{ borderColor: "rgba(57,64,73,0.1)" }}>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px]"
                  style={{ color: "rgba(57,64,73,0.5)" }}
                >
                  Nota Final:
                </span>
                <span
                  className="text-sm font-bold"
                  style={{
                    color:
                      (notaFinalProvisional ?? 0) >= notaAprobacion
                        ? "var(--color-evalUA21)"
                        : "var(--color-evalUA8)",
                  }}
                >
                  {(notaFinalProvisional ?? 0).toFixed(2)}
                </span>
              </div>
              {gatekeeperTriggered && (
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: "rgba(200,16,46,0.1)",
                    color: "var(--color-evalUA8)",
                  }}
                >
                  ⚠ Gatekeeper: nota 1.0 por criterio excluyente reprobado
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="embed-panel-footer">
          <button
            className="embed-button-outline px-3 py-1.5 text-xs rounded"
            onClick={() => goToCriterion(totalCriterios - 1)}
          >
            ← Volver al Wizard
          </button>
          <div className="flex items-center gap-2">
            {!savingDraft && (
              <div className="flex items-center gap-1">
                <span
                  className="text-xs"
                  style={{ color: "var(--color-evalUA21)" }}
                >
                  ✓
                </span>
                <span
                  className="text-[10px]"
                  style={{ color: "var(--color-evalUA21)" }}
                >
                  Borrador guardado
                </span>
              </div>
            )}
            <button
              className="embed-button-primary px-3 py-1.5 text-xs rounded flex items-center gap-1 disabled:opacity-50"
              onClick={handleFinalizar}
              disabled={calculando}
            >
              {calculando ? "Calculando..." : "✓ Finalizar Evaluación"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  //  EVALUANDO (wizard principal)
  // ════════════════════════════════════════════
  return (
    <div className="flex flex-col h-full">
      {/* Header con stepper */}
      <div className="embed-header">
        <div className="embed-title">
          <span
            className="truncate text-xs font-semibold"
            style={{ maxWidth: "220px" }}
          >
            Rúbrica: {rubrica.titulo}
          </span>
        </div>

        {/* Progress stepper */}
        <div className="flex items-center gap-1.5">
          <span
            className="text-[11px] font-medium mr-1"
            style={{ color: "var(--color-evalUA2)" }}
          >
            Criterio {currentIdx + 1} de {totalCriterios}
          </span>
          {criterios.map((c, i) => {
            const isCompleted = puntajes.has(c._id) && i !== currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <div
                key={c._id}
                className="cursor-pointer"
                onClick={() => setCurrentIdx(i)}
              >
                <div
                  className="rounded-full flex items-center justify-center text-[9px] font-bold transition-all"
                  style={{
                    width: isCurrent ? "22px" : "18px",
                    height: isCurrent ? "22px" : "18px",
                    backgroundColor: isCompleted
                      ? "var(--color-evalUA21)"
                      : isCurrent
                      ? "var(--color-evalUA1)"
                      : "rgba(57,64,73,0.2)",
                    color: "#fff",
                  }}
                >
                  {isCompleted ? "✓" : i + 1}
                </div>
              </div>
            );
          })}
          {/* Summary step indicator */}
          <div className="flex items-center gap-1 ml-1">
            <div className="h-3 w-px" style={{ backgroundColor: "rgba(57,64,73,0.2)" }} />
            <div
              className="rounded-full flex items-center justify-center text-[9px] font-bold transition-all cursor-pointer"
              style={{
                width: "18px",
                height: "18px",
                backgroundColor: allEvaluated
                  ? "var(--color-evalUA1)"
                  : "rgba(57,64,73,0.2)",
                color: "#fff",
              }}
              onClick={() => allEvaluated && setPhase("resumen")}
            >
              👁
            </div>
          </div>
        </div>

        {/* Cancel */}
        <button
          className="text-[11px] hover:opacity-70 flex-shrink-0"
          style={{ color: "rgba(57,64,73,0.5)" }}
        >
          ✕ Cancelar
        </button>
      </div>

      {/* Content */}
      <div className="embed-content overflow-y-auto">
        <AnimatePresence mode="wait">
          {showObservations && currentCriterio ? (
            /* ── Observaciones por criterio ── */
            <motion.div
              key={`obs-${currentCriterio._id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col px-4 py-3"
              style={{ backgroundColor: "#fdfcfa" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span style={{ color: "var(--color-evalUA1)" }}>💬</span>
                <h2
                  className="text-sm font-bold"
                  style={{ color: "var(--color-evalUA2)" }}
                >
                  Observaciones — {currentCriterio.nombre}
                </h2>
              </div>
              <textarea
                className="embed-textarea flex-1"
                placeholder="Ingrese observaciones para este criterio (opcional)..."
                value={obsCriterio}
                onChange={(e) => setObsCriterio(e.target.value)}
              />
              <div className="flex justify-end mt-2">
                <button
                  className="embed-button-outline px-3 py-1.5 text-xs rounded"
                  onClick={() => {
                    // Save observation for this criterion
                    const newPuntajes = new Map(puntajes);
                    const existing = newPuntajes.get(currentCriterio._id);
                    if (existing) {
                      newPuntajes.set(currentCriterio._id, {
                        ...existing,
                        observaciones: obsCriterio,
                      });
                      setPuntajes(newPuntajes);
                      autoSave(newPuntajes);
                    }
                    setShowObservations(false);
                  }}
                >
                  ✓ Listo
                </button>
              </div>
            </motion.div>
          ) : currentCriterio ? (
            /* ── Descriptores ── */
            <motion.div
              key={`crit-${currentCriterio._id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Criterion title row */}
              <div
                className="flex items-center gap-3 px-4 py-2 border-b"
                style={{ backgroundColor: "#fdfcfa" }}
              >
                <h2
                  className="text-sm font-bold"
                  style={{ color: "var(--color-evalUA2)" }}
                >
                  {currentCriterio.nombre}
                </h2>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded border font-medium"
                  style={{
                    borderColor: "var(--color-evalUA1)",
                    color: "var(--color-evalUA1)",
                  }}
                >
                  Ponderación:{" "}
                  {Math.round(currentCriterio.ponderacion * 100)}%
                </span>
                {currentCriterio.esExcluyente && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                    style={{
                      backgroundColor: "rgba(200,16,46,0.1)",
                      color: "var(--color-evalUA8)",
                    }}
                  >
                    ⚠ Excluyente
                  </span>
                )}
                {currentCriterio.descripcion && (
                  <span
                    className="text-[10px] italic truncate"
                    style={{ color: "rgba(57,64,73,0.4)" }}
                  >
                    {currentCriterio.descripcion}
                  </span>
                )}
              </div>

              {/* Descriptor cards */}
              <div className="px-3 py-2 flex flex-col gap-1.5" style={{ maxHeight: "302px", overflowY: "auto" }}>
                {[...currentCriterio.descriptores]
                  .sort((a, b) => b.notaNivel - a.notaNivel)
                  .map((desc) => {
                    const isSelected =
                      puntajes.get(currentCriterio._id)?.nota ===
                      desc.notaNivel;
                    return (
                      <motion.button
                        key={desc.notaNivel}
                        onClick={() =>
                          handleSeleccionarDescriptor(
                            currentCriterio._id,
                            desc.notaNivel
                          )
                        }
                        className="w-full text-left flex items-start gap-2.5 rounded-md border px-3 py-2 transition-colors cursor-pointer"
                        style={{
                          backgroundColor: isSelected
                            ? "var(--color-evalUA4)"
                            : "var(--color-evalUA16)",
                          borderColor: isSelected
                            ? "var(--color-evalUA1)"
                            : "rgba(57,64,73,0.1)",
                          borderLeftWidth: isSelected ? "4px" : "1px",
                          borderLeftColor: isSelected
                            ? "var(--color-evalUA1)"
                            : "rgba(57,64,73,0.1)",
                        }}
                        whileHover={{ scale: 1.002 }}
                        whileTap={{ scale: 0.998 }}
                      >
                        {/* Color-coded note circle */}
                        <div
                          className="flex-shrink-0 rounded-full flex items-center justify-center text-white font-bold"
                          style={{
                            width: "28px",
                            height: "28px",
                            backgroundColor: notaCircleColor(
                              desc.notaNivel
                            ),
                            fontSize: "12px",
                          }}
                        >
                          {desc.notaNivel}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs font-semibold"
                              style={{ color: "var(--color-evalUA2)" }}
                            >
                              {desc.etiqueta}
                            </span>
                            {isSelected && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-xs"
                                style={{ color: "var(--color-evalUA1)" }}
                              >
                                ✓
                              </motion.span>
                            )}
                          </div>
                          {desc.bulletPoints.filter((bp: string) => bp.trim()).length > 0 && (
                            <div className="mt-0.5">
                              <span
                                className="text-[10px] leading-snug"
                                style={{ color: "rgba(57,64,73,0.5)" }}
                              >
                                {desc.bulletPoints
                                  .filter((bp: string) => bp.trim())
                                  .join(" — ")}
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
              </div>

              {/* Observation toggle row */}
              <div
                className="flex items-center justify-between px-4 py-1.5 border-t"
                style={{
                  backgroundColor: "#f8f8f6",
                  borderColor: "rgba(57,64,73,0.08)",
                }}
              >
                <button
                  className="text-[10px] flex items-center gap-1 hover:opacity-70"
                  style={{ color: "rgba(57,64,73,0.5)" }}
                  onClick={() => {
                    setObsCriterio(
                      puntajes.get(currentCriterio._id)?.observaciones ||
                        ""
                    );
                    setShowObservations(true);
                  }}
                >
                  💬 Agregar observación a este criterio
                </button>
                {puntajes.has(currentCriterio._id) && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: "rgba(25,135,84,0.1)",
                      color: "var(--color-evalUA21)",
                    }}
                  >
                    Calificado:{" "}
                    {puntajes
                      .get(currentCriterio._id)
                      ?.nota.toFixed(1)}
                  </span>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="embed-panel-footer">
        {/* Left: Navigation */}
        <div className="flex items-center gap-2">
          <button
            className="embed-button-outline px-3 py-1.5 text-xs rounded"
            disabled={currentIdx === 0}
            style={{ opacity: currentIdx === 0 ? 0.4 : 1 }}
            onClick={() => {
              if (currentIdx > 0) {
                setCurrentIdx(currentIdx - 1);
                setShowObservations(false);
              }
            }}
          >
            ← Atrás
          </button>
          {allEvaluated ? (
            <button
              className="embed-button-primary px-3 py-1.5 text-xs rounded flex items-center gap-1"
              onClick={() => setPhase("resumen")}
            >
              👁 Ver Resumen
            </button>
          ) : (
            <button
              className="embed-button-outline px-3 py-1.5 text-xs rounded"
              disabled={currentIdx >= totalCriterios - 1}
              style={{
                opacity: currentIdx >= totalCriterios - 1 ? 0.4 : 1,
              }}
              onClick={() => {
                if (currentIdx < totalCriterios - 1) {
                  setCurrentIdx(currentIdx + 1);
                  setShowObservations(false);
                }
              }}
            >
              Siguiente →
            </button>
          )}
        </div>

        {/* Center: Auto-save indicator */}
        <div className="flex items-center gap-1">
          {savingDraft ? (
            <span className="text-[10px]" style={{ color: "rgba(57,64,73,0.4)" }}>
              Guardando borrador...
            </span>
          ) : (
            <div className="flex items-center gap-1">
              <span
                className="text-[10px]"
                style={{ color: "var(--color-evalUA21)" }}
              >
                ✓
              </span>
              <span
                className="text-[10px]"
                style={{ color: "var(--color-evalUA21)" }}
              >
                Borrador guardado
              </span>
            </div>
          )}
        </div>

        {/* Right: Cumulative grade + Gatekeeper */}
        <div className="flex items-center gap-2">
          {gatekeeperTriggered && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: "rgba(200,16,46,0.1)",
                color: "var(--color-evalUA8)",
              }}
            >
              ⚠ Gatekeeper
            </span>
          )}
          <span
            className="text-[10px]"
            style={{ color: "rgba(57,64,73,0.5)" }}
          >
            Cálculo Acumulado:
          </span>
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded"
            style={{
              backgroundColor:
                cumulativeGrade >= notaAprobacion
                  ? "rgba(25,135,84,0.1)"
                  : "rgba(200,16,46,0.1)",
              color:
                cumulativeGrade >= notaAprobacion
                  ? "var(--color-evalUA21)"
                  : "var(--color-evalUA8)",
            }}
          >
            Nota {cumulativeGrade.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}