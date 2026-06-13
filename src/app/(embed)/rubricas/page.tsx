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
  version: number;
  esActiva: boolean;
  criterios: Array<{
    _id: string;
    nombre: string;
    ponderacion: number;
    tipo: string;
    esExcluyente: boolean;
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
  const [criterios, setCriterios] = useState<Array<{
    id: string; nombre: string; ponderacion: number; tipo: string; esExcluyente: boolean; descripcion: string;
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
    setCriterios([{
      id: uuid(), nombre: "", ponderacion: 1.0, tipo: "ESTRUCTURAL", esExcluyente: false, descripcion: "",
      descriptores: crearDescriptoresDefault(),
    }]);
    setCriterioExpandido(null);
  };

  const handleEditar = (rubrica: RubricaItem) => {
    setVista("editar");
    setEditandoId(rubrica._id);
    setTitulo(rubrica.titulo);
    setCriterios(rubrica.criterios.map(c => ({
      id: c._id, nombre: c.nombre, ponderacion: c.ponderacion, tipo: c.tipo,
      esExcluyente: c.esExcluyente, descripcion: c.descripcion || "",
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
      criterios: criterios.map(c => ({
        id: c.id,
        nombre: c.nombre,
        ponderacion: c.ponderacion,
        tipo: c.tipo,
        esExcluyente: c.esExcluyente,
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
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: "rgba(57,64,73,0.15)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-evalUA1)" }}>
            {vista === "crear" ? "Nueva Rúbrica" : "Editar Rúbrica"}
          </h2>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-xs rounded border" style={{ borderColor: "rgba(57,64,73,0.3)" }}
              onClick={() => { setVista("lista"); setError(null); }}>Cancelar</button>
            <button className="px-3 py-1 text-xs rounded text-white" style={{ backgroundColor: "var(--color-evalUA1)" }}
              onClick={handleGuardar}>Guardar</button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {/* Título */}
          <div>
            <label className="text-xs font-medium">Título:</label>
            <input className="w-full border rounded px-2 py-1 text-sm mt-1" style={{ borderColor: "rgba(57,64,73,0.2)" }}
              value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Nombre de la rúbrica" />
          </div>

          {/* Criterios */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">Criterios ({criterios.length})</label>
              <span className="text-xs" style={{ color: sumaOk ? "var(--color-evalUA21)" : "var(--color-evalUA8)" }}>
                Σ ponderaciones = {sumaPonderaciones.toFixed(3)} {sumaOk ? "✓" : "✗"}
              </span>
            </div>

            {criterios.map((crit, idx) => {
              const expandido = criterioExpandido === crit.id;
              return (
                <div key={crit.id} className="border rounded mt-2" style={{ borderColor: "rgba(57,64,73,0.15)" }}>
                  {/* Cabecera del criterio */}
                  <div className="p-2 space-y-1">
                    <div className="flex gap-2 items-center">
                      <input className="flex-1 border rounded px-2 py-1 text-xs" placeholder="Nombre criterio"
                        value={crit.nombre} onChange={e => {
                          const n = [...criterios]; n[idx].nombre = e.target.value; setCriterios(n);
                        }} />
                      <input className="w-20 border rounded px-2 py-1 text-xs" type="number" step="0.01" min="0" max="1"
                        placeholder="Pond." value={crit.ponderacion}
                        onChange={e => { const n = [...criterios]; n[idx].ponderacion = parseFloat(e.target.value) || 0; setCriterios(n); }} />
                      <select className="border rounded px-2 py-1 text-xs" value={crit.tipo}
                        onChange={e => { const n = [...criterios]; n[idx].tipo = e.target.value; setCriterios(n); }}>
                        <option value="ESTRUCTURAL">Estructural</option>
                        <option value="COMPLEMENTARIO">Complementario</option>
                      </select>
                      <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" checked={crit.esExcluyente}
                          onChange={e => { const n = [...criterios]; n[idx].esExcluyente = e.target.checked; setCriterios(n); }} />
                        Excl.
                      </label>
                      <button className="text-xs px-1" style={{ color: "var(--color-evalUA8)" }}
                        onClick={() => { const n = criterios.filter((_, i) => i !== idx); setCriterios(n); }}>✕</button>
                    </div>
                    <div>
                      <input className="w-full border rounded px-2 py-1 text-xs" placeholder="Descripción del criterio (opcional)"
                        value={crit.descripcion} onChange={e => {
                          const n = [...criterios]; n[idx].descripcion = e.target.value; setCriterios(n);
                        }} style={{ borderColor: "rgba(57,64,73,0.15)" }} />
                    </div>
                    <button className="text-xs underline" style={{ color: "var(--color-evalUA1)" }}
                      onClick={() => setCriterioExpandido(expandido ? null : crit.id)}>
                      {expandido ? "▲ Ocultar niveles de logro" : "▼ Mostrar niveles de logro (7 niveles)"}
                    </button>
                  </div>

                  {/* Descriptores por nivel (expandible) */}
                  {expandido && (
                    <div className="border-t px-2 py-2 space-y-2" style={{ borderColor: "rgba(57,64,73,0.1)", backgroundColor: "rgba(57,64,73,0.02)" }}>
                      <div className="text-xs font-medium mb-1" style={{ color: "var(--color-evalUA1)" }}>
                        Descriptores por nivel de logro:
                      </div>
                      {[...crit.descriptores]
                        .sort((a, b) => b.notaNivel - a.notaNivel)
                        .map((desc) => (
                          <div key={desc.notaNivel} className="border rounded px-2 py-1.5" style={{
                            borderColor: desc.notaNivel >= 4 ? "rgba(25,135,84,0.2)" : "rgba(200,16,46,0.2)",
                            backgroundColor: desc.notaNivel >= 4 ? "rgba(25,135,84,0.03)" : "rgba(200,16,46,0.03)",
                          }}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold shrink-0" style={{
                                color: desc.notaNivel >= 4 ? "var(--color-evalUA21)" : "var(--color-evalUA8)",
                                minWidth: "55px",
                              }}>
                                Nota {desc.notaNivel}:
                              </span>
                              <input className="flex-1 border rounded px-2 py-0.5 text-xs" placeholder="Etiqueta del nivel"
                                value={desc.etiqueta}
                                onChange={e => actualizarDescriptor(idx, desc.notaNivel, "etiqueta", e.target.value)}
                                style={{ borderColor: "rgba(57,64,73,0.2)" }} />
                            </div>
                            {/* Bullet points */}
                            <div className="ml-14 space-y-0.5">
                              {desc.bulletPoints.map((bp, bpIdx) => (
                                <div key={bpIdx} className="flex items-center gap-1">
                                  <span className="text-xs" style={{ color: "rgba(57,64,73,0.4)" }}>•</span>
                                  <input className="flex-1 border rounded px-2 py-0.5 text-xs" placeholder="Descripción del puntaje"
                                    value={bp}
                                    onChange={e => actualizarBulletPoint(idx, desc.notaNivel, bpIdx, e.target.value)}
                                    style={{ borderColor: "rgba(57,64,73,0.15)" }} />
                                  <button className="text-xs px-1" style={{ color: "var(--color-evalUA8)" }}
                                    onClick={() => eliminarBulletPoint(idx, desc.notaNivel, bpIdx)}>✕</button>
                                </div>
                              ))}
                              <button className="text-xs underline" style={{ color: "var(--color-evalUA1)" }}
                                onClick={() => agregarBulletPoint(idx, desc.notaNivel)}>
                                + Descripción
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}

            <button className="mt-2 text-xs px-3 py-1 rounded border" style={{ borderColor: "var(--color-evalUA1)", color: "var(--color-evalUA1)" }}
              onClick={() => {
                const newId = uuid();
                setCriterios([...criterios, {
                  id: newId, nombre: "", ponderacion: 0, tipo: "ESTRUCTURAL", esExcluyente: false, descripcion: "",
                  descriptores: crearDescriptoresDefault(),
                }]);
                setCriterioExpandido(newId);
              }}>+ Agregar Criterio</button>
          </div>

          {error && <div className="text-xs" style={{ color: "var(--color-evalUA8)" }}>{error}</div>}
        </div>
      </div>
    );
  }

  // ─── Vista Lista ───
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: "rgba(57,64,73,0.15)" }}>
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-evalUA1)" }}>Rúbricas</h2>
        <button className="px-3 py-1 text-xs rounded text-white" style={{ backgroundColor: "var(--color-evalUA1)" }}
          onClick={handleCrear}>+ Nueva</button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5">
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
      {error && <div className="px-4 py-1 text-xs" style={{ color: "var(--color-evalUA8)" }}>{error}</div>}
    </div>
  );
}