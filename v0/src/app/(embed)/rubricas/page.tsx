"use client";

/**
 * EvalUA v3.0 — CRUD de Rúbricas (Iframe)
 * Listado, creación y edición con versionamiento
 * Incluye edición de descriptores por nivel de logro (1-7)
 */

import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";

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
  return NIVELES_DEFAULT.map(n => ({
    notaNivel: n.notaNivel,
    etiqueta: n.etiqueta,
    bulletPoints: [] as string[],
  }));
}

export default function RubricasPage() {
  const [rubricas, setRubricas] = useState<RubricaItem[]>([]);
  const [vista, setVista] = useState<Vista>("lista");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [notaAprobacion, setNotaAprobacion] = useState(4.0);
  const [criterios, setCriterios] = useState<Array<{
    id: string; nombre: string; ponderacion: number; tipo: string; esExcluyente: boolean; notaCorte: number; descripcion: string;
    descriptores: Array<{ notaNivel: number; etiqueta: string; bulletPoints: string[] }>;
  }>>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [criterioExpandido, setCriterioExpandido] = useState<string | null>(null);

  const headers = { Authorization: "Bearer dev-token", "Content-Type": "application/json" };

  useEffect(() => { cargarRubricas(); }, []);

  const cargarRubricas = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rubricas", { headers });
      const data = await res.json();
      if (data.success) setRubricas(data.data);
    } catch { setError("Error cargando rúbricas"); }
    setLoading(false);
  };

  const handleCrear = () => {
    setVista("crear");
    setTitulo("");
    setNotaAprobacion(4.0);
    setCriterios([{
      id: uuid(), nombre: "", ponderacion: 1.0, tipo: "ESTRUCTURAL", esExcluyente: false, notaCorte: 4.0, descripcion: "",
      descriptores: crearDescriptoresDefault(),
    }]);
    setCriterioExpandido(null);
  };

  const handleEditar = (rubrica: RubricaItem) => {
    setVista("editar");
    setEditandoId(rubrica._id);
    setTitulo(rubrica.titulo);
    setNotaAprobacion(rubrica.notaAprobacion ?? 4.0);
    setCriterios(rubrica.criterios.map(c => ({
      id: c._id, nombre: c.nombre, ponderacion: c.ponderacion, tipo: c.tipo,
      esExcluyente: c.esExcluyente, notaCorte: c.notaCorte ?? 4.0, descripcion: c.descripcion || "",
      descriptores: c.descriptores.length >= 7 ? c.descriptores : crearDescriptoresDefault(),
    })));
    setCriterioExpandido(null);
  };

  const handleGuardar = async () => {
    // Validar que todos los criterios tengan nombre
    for (const c of criterios) {
      if (!c.nombre.trim()) {
        setError("Todos los criterios deben tener un nombre");
        return;
      }
      // Validar que todos los descriptores tengan etiqueta
      for (const d of c.descriptores) {
        if (!d.etiqueta.trim()) {
          setError(`El criterio "${c.nombre || '(sin nombre)'}" tiene niveles sin etiqueta. Complete todas las etiquetas.`);
          return;
        }
      }
    }

    const suma = criterios.filter(c => c.tipo === "ESTRUCTURAL").reduce((a, c) => a + c.ponderacion, 0);
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
      criterios: criterios.map(c => ({
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
      const url = vista === "editar" ? `/api/rubricas/${editandoId}` : "/api/rubricas";
      const method = vista === "editar" ? "PUT" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) {
        setVista("lista");
        await cargarRubricas();
        if (data.data?._id) {
          window.parent.postMessage({
            source: "evalua", version: "3.0", type: "evalua.rubrica.created",
            payload: { rubricaId: data.data._id }
          }, "*");
        }
      } else {
        setError(data.error?.detail || "Error guardando rúbrica");
      }
    } catch { setError("Error de red"); }
  };

  const copiarId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const actualizarDescriptor = (critIdx: number, notaNivel: number, campo: "etiqueta" | "bulletPoints", valor: string | string[]) => {
    const n = [...criterios];
    const descIdx = n[critIdx].descriptores.findIndex(d => d.notaNivel === notaNivel);
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
    const descIdx = n[critIdx].descriptores.findIndex(d => d.notaNivel === notaNivel);
    if (descIdx >= 0) {
      n[critIdx].descriptores[descIdx].bulletPoints.push("");
      setCriterios(n);
    }
  };

  const actualizarBulletPoint = (critIdx: number, notaNivel: number, bpIdx: number, valor: string) => {
    const n = [...criterios];
    const descIdx = n[critIdx].descriptores.findIndex(d => d.notaNivel === notaNivel);
    if (descIdx >= 0) {
      n[critIdx].descriptores[descIdx].bulletPoints[bpIdx] = valor;
      setCriterios(n);
    }
  };

  const eliminarBulletPoint = (critIdx: number, notaNivel: number, bpIdx: number) => {
    const n = [...criterios];
    const descIdx = n[critIdx].descriptores.findIndex(d => d.notaNivel === notaNivel);
    if (descIdx >= 0) {
      n[critIdx].descriptores[descIdx].bulletPoints.splice(bpIdx, 1);
      setCriterios(n);
    }
  };

  const sumaPonderaciones = criterios.filter(c => c.tipo === "ESTRUCTURAL").reduce((a, c) => a + c.ponderacion, 0);
  const sumaOk = Math.abs(sumaPonderaciones - 1.0) <= 0.001;

  // ─── Vista Crear / Editar ───
  if (vista === "crear" || vista === "editar") {
    return (
      <div className="flex flex-col h-full">
        <div className="embed-header">
          <div className="embed-title">{vista === "crear" ? "Nueva Rúbrica" : "Editar Rúbrica"}</div>
          <span className="embed-badge">{vista === "crear" ? "CREAR" : "EDITAR"}</span>
        </div>

        <div className="embed-content overflow-y-auto px-4 py-4 space-y-4">
          <div className="embed-panel px-4 py-4 space-y-6">
            <div className="space-y-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "rgba(57,64,73,0.65)" }}>
                Datos generales
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-[rgba(57,64,73,0.65)]" htmlFor="rubrica-title">
                  Título
                </label>
                <input
                  id="rubrica-title"
                  className="embed-input"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Proyecto de Ingeniería de Software"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-[rgba(57,64,73,0.65)]" htmlFor="nota-aprobacion">
                    Nota de Aprobación
                  </label>
                  <input
                    id="nota-aprobacion"
                    className="embed-input"
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="7.0"
                    value={notaAprobacion}
                    onChange={(e) => setNotaAprobacion(parseFloat(e.target.value) || 4.0)}
                  />
                  <p className="text-[10px]" style={{ color: "rgba(57,64,73,0.45)" }}>
                    Nota mínima para aprobar la evaluación (1.0–7.0)
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold" style={{ color: "var(--color-evalUA2)" }}>
                    Criterios ({criterios.length})
                  </p>
                  <p className="text-sm font-medium mt-1">Define cada criterio y los niveles de logro</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs" style={{ color: sumaOk ? "var(--color-evalUA21)" : "var(--color-evalUA8)" }}>
                    Σ ponderaciones = {sumaPonderaciones.toFixed(3)} {sumaOk ? "✓" : "✗"}
                  </span>
                  <button
                    className="embed-button-primary text-xs px-3 py-2 rounded"
                    type="button"
                    onClick={() => {
                      const newId = uuid();
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
                      setCriterioExpandido(newId);
                    }}
                  >
                    + Agregar criterio
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {criterios.map((crit, idx) => {
                  const expandido = criterioExpandido === crit.id;
                  return (
                    <div key={crit.id} className="embed-panel overflow-hidden">
                      <div className="p-4 space-y-4">
                        <div className="grid gap-3 sm:grid-cols-[1.8fr_1fr_1fr] items-start">
                          <div className="space-y-2">
                            <label className="text-[10px] font-semibold text-[rgba(57,64,73,0.65)]">Nombre criterio</label>
                            <input
                              className="embed-input"
                              placeholder="Nombre criterio"
                              value={crit.nombre}
                              onChange={(e) => {
                                const n = [...criterios];
                                n[idx].nombre = e.target.value;
                                setCriterios(n);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-semibold text-[rgba(57,64,73,0.65)]">Ponderación</label>
                            <input
                              className="embed-input w-full"
                              type="number"
                              step="0.01"
                              min="0"
                              max="1"
                              placeholder="0.25"
                              value={crit.ponderacion}
                              onChange={(e) => {
                                const n = [...criterios];
                                n[idx].ponderacion = parseFloat(e.target.value) || 0;
                                setCriterios(n);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-semibold text-[rgba(57,64,73,0.65)]">Tipo</label>
                            <select
                              className="embed-input w-full"
                              value={crit.tipo}
                              onChange={(e) => {
                                const n = [...criterios];
                                n[idx].tipo = e.target.value;
                                setCriterios(n);
                              }}
                            >
                              <option value="ESTRUCTURAL">Estructural</option>
                              <option value="COMPLEMENTARIO">Complementario</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-center">
                          <div className="space-y-2">
                            <label className="text-[10px] font-semibold text-[rgba(57,64,73,0.65)]">
                              Descripción del criterio
                            </label>
                            <input
                              className="embed-input"
                              placeholder="Descripción del criterio (opcional)"
                              value={crit.descripcion}
                              onChange={(e) => {
                                const n = [...criterios];
                                n[idx].descripcion = e.target.value;
                                setCriterios(n);
                              }}
                            />
                          </div>
                          <div className="flex flex-col gap-2 text-right">
                            <span className="text-[10px] uppercase tracking-[0.18em] text-[rgba(57,64,73,0.65)]">
                              Ponderación
                            </span>
                            <span className="text-xs" style={{ color: "rgba(57,64,73,0.65)" }}>
                              {(crit.ponderacion * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>

                        {/* Excluyente + Nota de corte */}
                        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end">
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={crit.esExcluyente}
                                onChange={(e) => {
                                  const n = [...criterios];
                                  n[idx].esExcluyente = e.target.checked;
                                  setCriterios(n);
                                }}
                                className="w-4 h-4"
                              />
                              <span className="text-[10px] font-semibold text-[rgba(57,64,73,0.65)]">
                                Criterio excluyente (Gatekeeper)
                              </span>
                            </label>
                          </div>
                          {crit.esExcluyente && (
                            <div className="space-y-2">
                              <label className="text-[10px] font-semibold text-[rgba(57,64,73,0.65)]">
                                Nota de corte
                              </label>
                              <input
                                className="embed-input"
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
                              />
                            </div>
                          )}
                          <div />
                        </div>

                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={crit.tipo === "ESTRUCTURAL" ? "embed-summary-badge success" : "embed-summary-badge warning"}>
                              {crit.tipo === "ESTRUCTURAL" ? "Estr." : "Comp."}
                            </span>
                            {crit.esExcluyente && (
                              <span className="embed-summary-badge danger">Excluyente (corte: {crit.notaCorte.toFixed(1)})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <button
                              className="embed-button-outline text-xs px-3 py-2 rounded"
                              type="button"
                              onClick={() => {
                                const n = criterios.filter((_, i) => i !== idx);
                                setCriterios(n);
                              }}
                            >
                              Eliminar
                            </button>
                            <button
                              className="text-xs font-semibold text-[var(--color-evalUA1)]"
                              type="button"
                              onClick={() => setCriterioExpandido(expandido ? null : crit.id)}
                            >
                              {expandido ? "▲ Ocultar niveles de logro" : "▼ Mostrar niveles de logro (7 niveles)"}
                            </button>
                          </div>
                        </div>
                      </div>

                      {expandido && (
                        <div className="border-t border-[rgba(57,64,73,0.1)] bg-[rgba(255,255,255,0.95)] p-4 space-y-4">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-evalUA2)]">
                            Descriptores por nivel de logro
                          </div>
                          {[...crit.descriptores]
                            .sort((a, b) => b.notaNivel - a.notaNivel)
                            .map((desc) => (
                              <div key={desc.notaNivel} className="embed-panel p-3 space-y-3">
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                  <span className="text-[10px] font-semibold" style={{ color: desc.notaNivel >= 4 ? "var(--color-evalUA21)" : "var(--color-evalUA8)" }}>
                                    Nota {desc.notaNivel}
                                  </span>
                                  <span className={`embed-summary-badge ${desc.notaNivel >= 4 ? "success" : "warning"}`}>
                                    {desc.notaNivel >= 4 ? "Bueno" : "Mejorable"}
                                  </span>
                                </div>
                                <div className="space-y-3">
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-semibold text-[rgba(57,64,73,0.65)]">Etiqueta</label>
                                    <input
                                      className="embed-input"
                                      placeholder="Etiqueta del nivel"
                                      value={desc.etiqueta}
                                      onChange={(e) => actualizarDescriptor(idx, desc.notaNivel, "etiqueta", e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <label className="text-[10px] font-semibold text-[rgba(57,64,73,0.65)]">Puntos clave</label>
                                      <button
                                        className="embed-button-outline text-xs px-2 py-1 rounded"
                                        type="button"
                                        onClick={() => agregarBulletPoint(idx, desc.notaNivel)}
                                      >
                                        + Agregar
                                      </button>
                                    </div>
                                    <div className="space-y-2">
                                      {desc.bulletPoints.map((bp, bpIdx) => (
                                        <div key={bpIdx} className="flex items-center gap-2">
                                          <span className="text-xs" style={{ color: "rgba(57,64,73,0.4)" }}>
                                            •
                                          </span>
                                          <input
                                            className="embed-input flex-1"
                                            placeholder="Descripción del puntaje"
                                            value={bp}
                                            onChange={(e) => actualizarBulletPoint(idx, desc.notaNivel, bpIdx, e.target.value)}
                                          />
                                          <button
                                            className="text-xs text-[var(--color-evalUA8)]"
                                            type="button"
                                            onClick={() => eliminarBulletPoint(idx, desc.notaNivel, bpIdx)}
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="text-xs" style={{ color: "var(--color-evalUA8)" }}>
                {error}
              </div>
            )}
          </div>

          <div className="embed-panel-footer">
            <button
              className="embed-button-outline"
              onClick={() => {
                setVista("lista");
                setError(null);
              }}
            >
              Cancelar
            </button>
            <button
              className="embed-button-primary"
              onClick={handleGuardar}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Vista Lista ───
  return (
    <div className="flex flex-col h-full">
      <div className="embed-header">
        <div className="embed-title">Rúbricas</div>
        <span className="embed-badge">GESTIÓN</span>
      </div>
      <div className="embed-content overflow-y-auto px-4 py-4 space-y-3">
        <div className="embed-panel px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--color-evalUA2)" }}>
              Administrar rúbricas
            </p>
            <p className="text-sm font-medium mt-1">Crea, edita y copia rúbricas según tu política.</p>
          </div>
          <button className="px-3 py-1 text-xs rounded text-white" style={{ backgroundColor: "var(--color-evalUA1)" }}
            onClick={handleCrear}>+ Nueva</button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1.5">
        {loading ? (
          <div className="text-xs text-center py-4">Cargando...</div>
        ) : rubricas.length === 0 ? (
          <div className="text-xs text-center py-4" style={{ color: "rgba(57,64,73,0.5)" }}>No hay rúbricas creadas</div>
        ) : (
          rubricas.map(r => (
            <div key={r._id} className="px-3 py-2 rounded border"
              style={{ borderColor: "rgba(57,64,73,0.1)", backgroundColor: "var(--color-evalUA16)" }}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{r.titulo}</span>
                    <span className="text-xs px-1 py-0.5 rounded" style={{
                      backgroundColor: r.esActiva ? "rgba(25,135,84,0.1)" : "rgba(200,16,46,0.1)",
                      color: r.esActiva ? "var(--color-evalUA21)" : "var(--color-evalUA8)"
                    }}>{r.esActiva ? "Activa" : "Inactiva"}</span>
                    <span className="text-xs" style={{ color: "rgba(57,64,73,0.4)" }}>v{r.version}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono" style={{ color: "rgba(57,64,73,0.4)" }}>
                      {r._id.substring(0, 8)}...
                    </span>
                    <button className="text-xs" style={{ color: "var(--color-evalUA1)" }}
                      onClick={() => copiarId(r._id)}>{copiadoId === r._id ? "✓" : "📋"}</button>
                    <span className="text-xs" style={{ color: "rgba(57,64,73,0.4)" }}>
                      {r.criterios.length} criterio{r.criterios.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <button className="px-2 py-1 text-xs rounded border hover:opacity-80"
                  style={{ borderColor: "rgba(57,64,73,0.2)" }}
                  onClick={() => handleEditar(r)}>Editar</button>
              </div>

              {/* Resumen de criterios con niveles */}
              <div className="mt-1.5 space-y-1">
                {r.criterios.map(c => (
                  <div key={c._id} className="flex items-center gap-2 text-xs">
                    <span className="font-medium">{c.nombre}</span>
                    <span style={{ color: "rgba(57,64,73,0.4)" }}>({(c.ponderacion * 100).toFixed(0)}%)</span>
                    <span className="px-1 py-0.5 rounded" style={{
                      backgroundColor: c.tipo === "ESTRUCTURAL" ? "rgba(234,118,0,0.1)" : "rgba(57,64,73,0.08)",
                      color: c.tipo === "ESTRUCTURAL" ? "var(--color-evalUA1)" : "var(--color-evalUA2)",
                      fontSize: "10px",
                    }}>{c.tipo === "ESTRUCTURAL" ? "Estr." : "Comp."}</span>
                    {c.esExcluyente && <span className="text-xs" style={{ color: "var(--color-evalUA8)" }}>Excl.</span>}
                    {c.descriptores.length > 0 && (
                      <span style={{ color: "rgba(57,64,73,0.3)" }}>
                        · {c.descriptores.filter(d => d.etiqueta).length} niveles
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        </div>
        {error && <div className="text-xs" style={{ color: "var(--color-evalUA8)" }}>{error}</div>}
      </div>
    </div>
  );
}