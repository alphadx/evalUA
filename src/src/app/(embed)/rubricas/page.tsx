"use client";

/**
 * EvalUA v3.0 — CRUD de Rúbricas (Iframe)
 * Listado, creación y edición con versionamiento compacto.
 * Patrón accordion: un solo criterio expandido a la vez,
 * scroll-into-view, footer sticky, datos generales colapsable.
 */

import { useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { apiUrl } from "@/lib/api-url";

interface RubricaItem {
  _id: string;
  titulo: string;
  notaAprobacion: number;
  version: number;
  esActiva: boolean;
  criterios: Array<{
    _id: string;
    nombre: string;
    ponderacion: number;
    tipo: string;
    esExcluyente: boolean;
    notaCorte: number;
    descripcion: string | null;
    descriptores: Array<{ notaNivel: number; etiqueta: string; bulletPoints: string[] }>;
  }>;
  createdAt: string;
  updatedAt: string;
}

type Vista = "lista" | "crear" | "editar";

const NIVELES_DEFAULT = [
  { notaNivel: 1, etiqueta: "Muy deficiente" },
  { notaNivel: 2, etiqueta: "Deficiente" },
  { notaNivel: 3, etiqueta: "Insuficiente" },
  { notaNivel: 4, etiqueta: "Suficiente" },
  { notaNivel: 5, etiqueta: "Adecuado" },
  { notaNivel: 6, etiqueta: "Bueno" },
  { notaNivel: 7, etiqueta: "Excelente" },
];

function crearDescriptoresDefault() {
  return NIVELES_DEFAULT.map((n) => ({
    notaNivel: n.notaNivel,
    etiqueta: n.etiqueta,
    bulletPoints: [] as string[],
  }));
}

function descriptorLevelClass(nota: number): string {
  if (nota >= 5) return "level-high";
  if (nota >= 4) return "level-mid";
  return "level-low";
}

function descriptorBadgeClass(nota: number): string {
  if (nota >= 5) return "success";
  if (nota >= 4) return "primary";
  return "danger";
}

export default function RubricasPage() {
  const [rubricas, setRubricas] = useState<RubricaItem[]>([]);
  const [vista, setVista] = useState<Vista>("lista");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [notaAprobacion, setNotaAprobacion] = useState(4.0);
  const [criterios, setCriterios] = useState<
    Array<{
      id: string;
      nombre: string;
      ponderacion: number;
      tipo: string;
      esExcluyente: boolean;
      notaCorte: number;
      descripcion: string;
      descriptores: Array<{ notaNivel: number; etiqueta: string; bulletPoints: string[] }>;
    }>
  >([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [listaExpandida, setListaExpandida] = useState<string | null>(null);

  // ── Accordion state ──
  const [criterioActivoIdx, setCriterioActivoIdx] = useState<number | null>(0);
  const [datosGeneralesAbierto, setDatosGeneralesAbierto] = useState(true);
  const criterioRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const headers = { Authorization: "Bearer dev-token", "Content-Type": "application/json" };

  useEffect(() => {
    cargarRubricas();
  }, []);

  const cargarRubricas = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/rubricas"), { headers });
      const data = await res.json();
      if (data.success) setRubricas(data.data);
    } catch {
      setError("Error cargando rúbricas");
    }
    setLoading(false);
  };

  const handleCrear = () => {
    setVista("crear");
    setTitulo("");
    setNotaAprobacion(4.0);
    setCriterios([
      {
        id: uuid(),
        nombre: "",
        ponderacion: 1.0,
        tipo: "ESTRUCTURAL",
        esExcluyente: false,
        notaCorte: 4.0,
        descripcion: "",
        descriptores: crearDescriptoresDefault(),
      },
    ]);
    setCriterioActivoIdx(0);
    setDatosGeneralesAbierto(true);
  };

  const handleEditar = (rubrica: RubricaItem) => {
    setVista("editar");
    setEditandoId(rubrica._id);
    setTitulo(rubrica.titulo);
    setNotaAprobacion(rubrica.notaAprobacion ?? 4.0);
    setCriterios(
      rubrica.criterios.map((c) => ({
        id: c._id,
        nombre: c.nombre,
        ponderacion: c.ponderacion,
        tipo: c.tipo,
        esExcluyente: c.esExcluyente,
        notaCorte: c.notaCorte ?? 4.0,
        descripcion: c.descripcion || "",
        descriptores: c.descriptores.length >= 7 ? c.descriptores : crearDescriptoresDefault(),
      }))
    );
    setCriterioActivoIdx(0);
    setDatosGeneralesAbierto(false);
  };

  const toggleCriterioActivo = (idx: number) => {
    const nuevo = criterioActivoIdx === idx ? null : idx;
    setCriterioActivoIdx(nuevo);
    if (nuevo !== null) {
      // Scroll-into-view con delay para que el DOM se actualice
      requestAnimationFrame(() => {
        const el = criterioRefs.current.get(nuevo);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
  };

  const handleGuardar = async () => {
    for (const c of criterios) {
      if (!c.nombre.trim()) {
        setError("Todos los criterios deben tener un nombre");
        return;
      }
      for (const d of c.descriptores) {
        if (!d.etiqueta.trim()) {
          setError(`El criterio "${c.nombre || "(sin nombre)"}" tiene niveles sin etiqueta.`);
          return;
        }
      }
    }

    const suma = criterios
      .filter((c) => c.tipo === "ESTRUCTURAL")
      .reduce((a, c) => a + c.ponderacion, 0);
    if (Math.abs(suma - 1.0) > 0.001) {
      setError(`La suma de ponderaciones debe ser 1.0 (actual: ${suma.toFixed(3)})`);
      return;
    }

    if (!titulo.trim()) {
      setError("El título es obligatorio");
      return;
    }

    const body = {
      titulo,
      notaAprobacion,
      criterios: criterios.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        ponderacion: c.ponderacion,
        tipo: c.tipo,
        esExcluyente: c.esExcluyente,
        notaCorte: c.notaCorte,
        descripcion: c.descripcion || null,
        descriptores: c.descriptores,
      })),
    };

    try {
      const url = vista === "editar" ? apiUrl(`/api/rubricas/${editandoId}`) : apiUrl("/api/rubricas");
      const method = vista === "editar" ? "PUT" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) {
        setVista("lista");
        await cargarRubricas();
        if (data.data?._id) {
          window.parent.postMessage(
            {
              source: "evalua",
              version: "3.0",
              type: "evalua.rubrica.created",
              payload: { rubricaId: data.data._id },
            },
            "*"
          );
        }
      } else {
        setError(data.error?.detail || "Error guardando rúbrica");
      }
    } catch {
      setError("Error de red");
    }
  };

  const copiarId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const actualizarDescriptor = (
    critIdx: number,
    notaNivel: number,
    campo: "etiqueta" | "bulletPoints",
    valor: string | string[]
  ) => {
    const n = [...criterios];
    const descIdx = n[critIdx].descriptores.findIndex((d) => d.notaNivel === notaNivel);
    if (descIdx >= 0) {
      if (campo === "etiqueta") {
        n[critIdx].descriptores[descIdx].etiqueta = valor as string;
      } else {
        n[critIdx].descriptores[descIdx].bulletPoints = valor as string[];
      }
    }
    setCriterios(n);
  };

  const agregarBulletPoint = (critIdx: number, notaNivel: number) => {
    const n = [...criterios];
    const descIdx = n[critIdx].descriptores.findIndex((d) => d.notaNivel === notaNivel);
    if (descIdx >= 0) {
      n[critIdx].descriptores[descIdx].bulletPoints.push("");
      setCriterios(n);
    }
  };

  const actualizarBulletPoint = (critIdx: number, notaNivel: number, bpIdx: number, valor: string) => {
    const n = [...criterios];
    const descIdx = n[critIdx].descriptores.findIndex((d) => d.notaNivel === notaNivel);
    if (descIdx >= 0) {
      n[critIdx].descriptores[descIdx].bulletPoints[bpIdx] = valor;
      setCriterios(n);
    }
  };

  const eliminarBulletPoint = (critIdx: number, notaNivel: number, bpIdx: number) => {
    const n = [...criterios];
    const descIdx = n[critIdx].descriptores.findIndex((d) => d.notaNivel === notaNivel);
    if (descIdx >= 0) {
      n[critIdx].descriptores[descIdx].bulletPoints.splice(bpIdx, 1);
      setCriterios(n);
    }
  };

  const sumaPonderaciones = criterios
    .filter((c) => c.tipo === "ESTRUCTURAL")
    .reduce((a, c) => a + c.ponderacion, 0);
  const sumaOk = Math.abs(sumaPonderaciones - 1.0) <= 0.001;

  // ─── Vista Crear / Editar ───
  if (vista === "crear" || vista === "editar") {
    return (
      <div className="flex flex-col h-full">
        <div className="embed-header">
          <div className="embed-title">
            {vista === "crear" ? "Nueva Rúbrica" : "Editar Rúbrica"}
          </div>
          <span className="embed-badge">{vista === "crear" ? "CREAR" : "EDITAR"}</span>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ paddingBottom: "4rem" }}>
          {/* ── Datos generales (colapsable) ── */}
          <div className="embed-criterion-card">
            <button
              className="w-full flex items-center justify-between py-0.5"
              type="button"
              onClick={() => setDatosGeneralesAbierto(!datosGeneralesAbierto)}
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: "rgba(57,64,73,0.55)" }}
                >
                  Datos generales
                </span>
                {titulo.trim() && (
                  <span className="text-[10px] truncate max-w-[12rem]" style={{ color: "rgba(57,64,73,0.4)" }}>
                    {titulo}
                  </span>
                )}
              </div>
              <span style={{ fontSize: "10px", color: "rgba(57,64,73,0.4)" }}>
                {datosGeneralesAbierto ? "▲" : "▼"}
              </span>
            </button>
            {datosGeneralesAbierto && (
              <div className="grid gap-2 sm:grid-cols-[1fr_auto] items-end mt-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold" style={{ color: "rgba(57,64,73,0.6)" }}>
                    Título
                  </label>
                  <input
                    className="embed-input-compact"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ej: Proyecto de Ingeniería de Software"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold" style={{ color: "rgba(57,64,73,0.6)" }}>
                    Nota aprobación
                  </label>
                  <input
                    className="embed-input-compact"
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="7.0"
                    value={notaAprobacion}
                    onChange={(e) => setNotaAprobacion(parseFloat(e.target.value) || 4.0)}
                    style={{ width: "5rem" }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Header de criterios (sticky) ── */}
          <div
            className="flex items-center justify-between gap-2"
            style={{
              position: "sticky",
              top: 0,
              zIndex: 5,
              backgroundColor: "var(--embed-bg)",
              paddingBottom: "0.375rem",
              borderBottom: "1px solid rgba(229, 231, 235, 0.5)",
              paddingTop: "0.25rem",
              margin: "0 -0.75rem",
              paddingLeft: "0.75rem",
              paddingRight: "0.75rem",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: "var(--color-evalUA2)" }}>
                Criterios
              </span>
              <span className="embed-badge-sm neutral">{criterios.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="embed-badge-sm"
                style={{
                  backgroundColor: sumaOk ? "rgb(236,253,245)" : "rgb(254,242,242)",
                  color: sumaOk ? "var(--color-evalUA21)" : "var(--color-evalUA8)",
                }}
              >
                Σ {sumaPonderaciones.toFixed(2)} {sumaOk ? "✓" : "✗"}
              </span>
              <button
                className="embed-button-primary text-[11px] px-2.5 py-1 rounded-md font-semibold"
                type="button"
                onClick={() => {
                  const newId = uuid();
                  const newIdx = criterios.length;
                  setCriterios([
                    ...criterios,
                    {
                      id: newId,
                      nombre: "",
                      ponderacion: 0,
                      tipo: "ESTRUCTURAL",
                      esExcluyente: false,
                      notaCorte: 4.0,
                      descripcion: "",
                      descriptores: crearDescriptoresDefault(),
                    },
                  ]);
                  // Expandir el nuevo criterio y scrollear
                  setCriterioActivoIdx(newIdx);
                  requestAnimationFrame(() => {
                    setTimeout(() => {
                      const el = criterioRefs.current.get(newIdx);
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 50);
                  });
                }}
              >
                + Criterio
              </button>
            </div>
          </div>

          {/* ── Lista de criterios (accordion) ── */}
          <div className="space-y-2">
            {criterios.map((crit, idx) => {
              const isActive = criterioActivoIdx === idx;
              return (
                <div
                  key={crit.id}
                  className="embed-criterion-card space-y-2"
                  ref={(el) => {
                    if (el) criterioRefs.current.set(idx, el);
                    else criterioRefs.current.delete(idx);
                  }}
                  style={isActive ? { borderColor: "var(--color-evalUA1)", boxShadow: "0 0 0 1px rgba(234,118,0,0.15)" } : undefined}
                >
                  {/* ── Header colapsado: resumen o formulario ── */}
                  {!isActive ? (
                    /* Estado colapsado: resumen compacto */
                    <div
                      className="flex items-center justify-between gap-2 cursor-pointer py-0.5"
                      onClick={() => toggleCriterioActivo(idx)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="embed-badge-sm neutral" style={{ minWidth: "1.2rem", textAlign: "center" }}>
                          {idx + 1}
                        </span>
                        <span className="text-xs font-medium truncate" style={{ color: crit.nombre ? "var(--color-evalUA2)" : "rgba(57,64,73,0.4)" }}>
                          {crit.nombre || "Sin nombre"}
                        </span>
                        <span className={`embed-badge-sm ${crit.tipo === "ESTRUCTURAL" ? "primary" : "neutral"}`}>
                          {crit.tipo === "ESTRUCTURAL" ? "Estr." : "Comp."}
                        </span>
                        <span className="embed-badge-sm neutral">{(crit.ponderacion * 100).toFixed(0)}%</span>
                        {crit.esExcluyente && (
                          <span className="embed-badge-sm danger">GK</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          className="text-[10px] px-1 hover:opacity-70"
                          style={{ color: "var(--color-evalUA8)" }}
                          type="button"
                          title="Eliminar criterio"
                          onClick={(e) => {
                            e.stopPropagation();
                            const n = criterios.filter((_, i) => i !== idx);
                            setCriterios(n);
                            if (criterioActivoIdx === idx) setCriterioActivoIdx(null);
                            else if (criterioActivoIdx !== null && criterioActivoIdx > idx) {
                              setCriterioActivoIdx(criterioActivoIdx - 1);
                            }
                          }}
                        >
                          ✕
                        </button>
                        <span style={{ fontSize: "10px", color: "rgba(57,64,73,0.3)" }}>▼</span>
                      </div>
                    </div>
                  ) : (
                    /* Estado expandido: formulario completo */
                    <>
                      {/* Fila superior: indicador de progreso + cerrar */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="embed-badge-sm primary">
                          Criterio {idx + 1} de {criterios.length}
                        </span>
                        <button
                          className="text-[10px] px-1.5 py-0.5 rounded hover:bg-gray-100"
                          style={{ color: "rgba(57,64,73,0.5)" }}
                          type="button"
                          onClick={() => toggleCriterioActivo(idx)}
                        >
                          ▲ Colapsar
                        </button>
                      </div>

                      {/* Fila 1: Grid compacto nombre | ponderación | tipo | acciones */}
                      <div className="grid gap-2 items-start" style={{ gridTemplateColumns: "1fr auto auto auto" }}>
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-semibold" style={{ color: "rgba(57,64,73,0.55)" }}>
                            Nombre
                          </label>
                          <input
                            className="embed-input-compact"
                            placeholder="Nombre del criterio"
                            value={crit.nombre}
                            onChange={(e) => {
                              const n = [...criterios];
                              n[idx].nombre = e.target.value;
                              setCriterios(n);
                            }}
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-semibold" style={{ color: "rgba(57,64,73,0.55)" }}>
                            Peso
                          </label>
                          <input
                            className="embed-input-compact"
                            type="number"
                            step="0.05"
                            min="0"
                            max="1"
                            placeholder="0.25"
                            value={crit.ponderacion}
                            onChange={(e) => {
                              const n = [...criterios];
                              n[idx].ponderacion = parseFloat(e.target.value) || 0;
                              setCriterios(n);
                            }}
                            style={{ width: "4.5rem" }}
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-semibold" style={{ color: "rgba(57,64,73,0.55)" }}>
                            Tipo
                          </label>
                          <select
                            className="embed-input-compact"
                            value={crit.tipo}
                            onChange={(e) => {
                              const n = [...criterios];
                              n[idx].tipo = e.target.value;
                              setCriterios(n);
                            }}
                            style={{ width: "7rem" }}
                          >
                            <option value="ESTRUCTURAL">Estructural</option>
                            <option value="COMPLEMENTARIO">Complementario</option>
                          </select>
                        </div>
                        <div className="flex items-end h-full pb-0.5">
                          <button
                            className="text-[11px] px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors"
                            style={{ color: "var(--color-evalUA8)" }}
                            type="button"
                            title="Eliminar criterio"
                            onClick={() => {
                              const n = criterios.filter((_, i) => i !== idx);
                              setCriterios(n);
                              setCriterioActivoIdx(null);
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Fila 2: Excluyente switch + badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div
                          className={`embed-switch ${crit.esExcluyente ? "active" : ""}`}
                          onClick={() => {
                            const n = [...criterios];
                            n[idx].esExcluyente = !n[idx].esExcluyente;
                            setCriterios(n);
                          }}
                          role="switch"
                          aria-checked={crit.esExcluyente}
                          tabIndex={0}
                        />
                        <span className="text-[10px] font-semibold" style={{ color: "rgba(57,64,73,0.65)" }}>
                          Excluyente
                        </span>
                        {crit.esExcluyente && (
                          <>
                            <span className="embed-badge-sm danger">Gatekeeper</span>
                            <input
                              className="embed-input-xs"
                              type="number"
                              step="0.1"
                              min="1.0"
                              max="7.0"
                              value={crit.notaCorte}
                              onChange={(e) => {
                                const n = [...criterios];
                                n[idx].notaCorte = parseFloat(e.target.value) || 4.0;
                                setCriterios(n);
                              }}
                              style={{ width: "3.5rem" }}
                              placeholder="Corte"
                            />
                          </>
                        )}
                        <div className="ml-auto">
                          <span
                            className="embed-badge-sm"
                            style={{
                              backgroundColor:
                                crit.tipo === "ESTRUCTURAL"
                                  ? "var(--embed-primary-light)"
                                  : "rgba(57,64,73,0.06)",
                              color:
                                crit.tipo === "ESTRUCTURAL"
                                  ? "var(--color-evalUA1)"
                                  : "rgba(57,64,73,0.6)",
                            }}
                          >
                            {crit.tipo === "ESTRUCTURAL" ? "Estr." : "Comp."} ·{" "}
                            {(crit.ponderacion * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {/* Descriptores (siempre visibles en modo activo) */}
                      <div>
                        <div
                          className="text-[10px] font-semibold py-1 px-1"
                          style={{ color: "rgba(57,64,73,0.55)" }}
                        >
                          Descriptores (7 niveles)
                        </div>
                        <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: "12rem" }}>
                          {[...crit.descriptores]
                            .sort((a, b) => b.notaNivel - a.notaNivel)
                            .map((desc) => (
                              <div
                                key={desc.notaNivel}
                                className={`embed-descriptor-card ${descriptorLevelClass(desc.notaNivel)}`}
                              >
                                <div className="flex items-start gap-2">
                                  <span
                                    className={`embed-badge-sm ${descriptorBadgeClass(desc.notaNivel)} shrink-0`}
                                    style={{ minWidth: "2.5rem", textAlign: "center" }}
                                  >
                                    {desc.notaNivel}
                                  </span>
                                  <div className="flex-1 min-w-0 space-y-1">
                                    <input
                                      className="embed-input-xs"
                                      placeholder="Etiqueta"
                                      value={desc.etiqueta}
                                      onChange={(e) =>
                                        actualizarDescriptor(idx, desc.notaNivel, "etiqueta", e.target.value)
                                      }
                                    />
                                    <div className="space-y-1">
                                      {desc.bulletPoints.map((bp, bpIdx) => (
                                        <div key={bpIdx} className="flex items-center gap-1">
                                          <span style={{ color: "rgba(57,64,73,0.3)", fontSize: "10px" }}>•</span>
                                          <input
                                            className="embed-input-xs flex-1"
                                            placeholder="Punto clave"
                                            value={bp}
                                            onChange={(e) =>
                                              actualizarBulletPoint(idx, desc.notaNivel, bpIdx, e.target.value)
                                            }
                                          />
                                          <button
                                            className="text-[10px] px-1 hover:opacity-70"
                                            style={{ color: "var(--color-evalUA8)" }}
                                            type="button"
                                            onClick={() => eliminarBulletPoint(idx, desc.notaNivel, bpIdx)}
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        className="text-[10px] font-semibold"
                                        style={{ color: "var(--color-evalUA1)" }}
                                        type="button"
                                        onClick={() => agregarBulletPoint(idx, desc.notaNivel)}
                                      >
                                        + Punto
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Botón para avanzar al siguiente criterio */}
                      {idx < criterios.length - 1 && (
                        <button
                          className="w-full text-[10px] py-1.5 rounded-md font-semibold hover:bg-gray-50 transition-colors"
                          style={{ color: "var(--color-evalUA1)", border: "1px dashed rgba(234,118,0,0.3)" }}
                          type="button"
                          onClick={() => toggleCriterioActivo(idx + 1)}
                        >
                          Siguiente criterio →
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <div
              className="text-xs font-medium px-2 py-1.5 rounded-md"
              style={{ color: "var(--color-evalUA8)", backgroundColor: "rgb(254,242,242)" }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer sticky */}
        <div className="embed-panel-footer" style={{ position: "sticky", bottom: 0, zIndex: 10 }}>
          <button
            className="embed-button-outline text-xs px-3 py-1.5 rounded-md font-semibold"
            onClick={() => {
              setVista("lista");
              setError(null);
            }}
          >
            Cancelar
          </button>
          <button
            className="embed-button-primary text-xs px-3 py-1.5 rounded-md font-semibold"
            onClick={handleGuardar}
          >
            Guardar Rúbrica
          </button>
        </div>
      </div>
    );
  }

  // ─── Vista Lista ───
  return (
    <div className="flex flex-col h-full">
      <div className="embed-header">
        <div className="embed-title">Gestión de Rúbricas</div>
        <button
          className="embed-button-primary text-[11px] px-2.5 py-1 rounded-md font-semibold"
          onClick={handleCrear}
        >
          + Nueva Rúbrica
        </button>
      </div>
      <div className="embed-content overflow-y-auto px-3 py-2 space-y-1.5">
        {loading ? (
          <div className="text-xs text-center py-6" style={{ color: "rgba(57,64,73,0.5)" }}>
            Cargando...
          </div>
        ) : rubricas.length === 0 ? (
          <div className="text-xs text-center py-6" style={{ color: "rgba(57,64,73,0.5)" }}>
            No hay rúbricas creadas
          </div>
        ) : (
          rubricas.map((r) => {
            const expandido = listaExpandida === r._id;
            return (
              <div key={r._id} className="embed-card-compact">
                <div className={`embed-card-accent ${r.esActiva ? "success" : "muted"}`} />
                <div className="px-3 py-2">
                  {/* Row 1: título + badges + expand toggle */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="text-xs font-semibold truncate" style={{ color: "var(--color-evalUA2)" }}>
                        {r.titulo}
                      </span>
                      <span className={`embed-badge-sm ${r.esActiva ? "success" : "neutral"}`}>
                        {r.esActiva ? "Activa" : "Inactiva"}
                      </span>
                      <span className="embed-badge-sm neutral">v{r.version}</span>
                      <span className="embed-badge-sm neutral">{r.criterios.length} crit.</span>
                    </div>
                    <button
                      className="text-[10px] px-1 hover:opacity-70"
                      style={{ color: "rgba(57,64,73,0.4)" }}
                      onClick={() => setListaExpandida(expandido ? null : r._id)}
                    >
                      {expandido ? "▲" : "▼"}
                    </button>
                  </div>

                  {/* Row 2: ID + acciones */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <div
                      className="flex items-center gap-1 rounded border border-dashed px-1.5 py-0.5"
                      style={{
                        backgroundColor: "#f8f9fa",
                        borderColor: "#dee2e6",
                      }}
                    >
                      <span className="font-mono select-all" style={{ color: "rgba(57,64,73,0.55)", fontSize: "10px" }}>
                        {r._id}
                      </span>
                    </div>
                    <button
                      className="text-[10px] px-1.5 py-0.5 rounded border hover:opacity-80"
                      style={{ borderColor: "rgba(57,64,73,0.2)", color: "var(--color-evalUA1)" }}
                      onClick={() => copiarId(r._id)}
                    >
                      {copiadoId === r._id ? "✓" : "📋"}
                    </button>
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        className="text-[10px] px-1.5 py-0.5 rounded hover:bg-gray-100 font-semibold"
                        style={{ color: "rgba(57,64,73,0.6)" }}
                        onClick={() => handleEditar(r)}
                      >
                        Editar
                      </button>
                    </div>
                  </div>

                  {/* Expanded: criteria preview */}
                  {expandido && (
                    <div className="mt-2 space-y-1 border-t pt-2" style={{ borderColor: "rgba(229,231,235,0.5)" }}>
                      {r.criterios.map((c) => (
                        <div
                          key={c._id}
                          className="flex items-center justify-between rounded-md border px-2 py-1"
                          style={{ backgroundColor: "#f9fafb", borderColor: "#e5e7eb" }}
                        >
                          <div className="flex items-center gap-1.5">
                            {c.esExcluyente && (
                              <span
                                className="inline-flex size-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: "var(--color-evalUA8)" }}
                                title="Excluyente"
                              />
                            )}
                            <span className="text-[10px]" style={{ color: "var(--color-evalUA2)" }}>
                              {c.nombre}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="embed-badge-sm primary">{(c.ponderacion * 100).toFixed(0)}%</span>
                            <span className="embed-badge-sm neutral">{c.tipo === "ESTRUCTURAL" ? "E" : "C"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        {error && (
          <div
            className="text-xs font-medium px-2 py-1.5 rounded-md"
            style={{ color: "var(--color-evalUA8)", backgroundColor: "rgb(254,242,242)" }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}