"use client";

/**
 * EvalUA v3.0 — Visor de Rúbrica en Matriz (Iframe)
 * Vista de solo lectura que muestra la rúbrica como una tabla/matriz.
 * Columnas: 1..n (donde n = max descriptores por criterio)
 * Filas: un criterio por fila con sus descriptores alineados por notaNivel.
 * Diseñado para ser embebido en iframe 1029×466px.
 */

import { apiUrl } from "@/lib/api-url";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

/* ── Tipos ── */
interface Descriptor {
  notaNivel: number;
  etiqueta: string;
  bulletPoints: string[];
}

interface Criterio {
  _id: string;
  nombre: string;
  ponderacion: number;
  tipo: string;
  esExcluyente: boolean;
  notaCorte: number;
  descripcion: string | null;
  descriptores: Descriptor[];
}

interface RubricaData {
  _id: string;
  titulo: string;
  notaAprobacion: number;
  exigencia: number;
  version: number;
  esActiva: boolean;
  expuesta: boolean;
  criterios: Criterio[];
}

/* ── Rúbrica demo ── */
const DEMO_RUBRICA: RubricaData = {
  _id: "demo-00000000-0000-0000-0000-000000000001",
  titulo: "Rúbrica de Demostración — Proyecto de Ingeniería de Software",
  notaAprobacion: 4.0,
  exigencia: 0.5,
  version: 1,
  esActiva: true,
  expuesta: true,
  criterios: [
    {
      _id: "demo-c1",
      nombre: "Definición del Problema",
      ponderacion: 0.15,
      tipo: "ESTRUCTURAL",
      esExcluyente: false,
      notaCorte: 4.0,
      descripcion: null,
      descriptores: [
        { notaNivel: 1, etiqueta: "Deficiente", bulletPoints: ["No evidencia definición del problema", "No se observa compromiso ni desarrollo"] },
        { notaNivel: 2, etiqueta: "Insuficiente", bulletPoints: ["Evidencia mínima en definición del problema", "Presenta graves deficiencias que comprometen el resultado"] },
        { notaNivel: 3, etiqueta: "Regular", bulletPoints: ["Evidencia parcial en definición del problema", "Cumple de manera incompleta, con errores relevantes"] },
        { notaNivel: 4, etiqueta: "Suficiente", bulletPoints: ["Evidencia básica en definición del problema", "Cumple los requisitos mínimos aceptables"] },
        { notaNivel: 5, etiqueta: "Adecuado", bulletPoints: ["Evidencia adecuada en definición del problema", "Cumple cabalmente los criterios establecidos"] },
        { notaNivel: 6, etiqueta: "Notable", bulletPoints: ["Evidencia notable en definición del problema", "Supera las expectativas con calidad sobresaliente"] },
        { notaNivel: 7, etiqueta: "Excepcional", bulletPoints: ["Evidencia excepcional en definición del problema", "Alcanza un nivel destacado, referente para el curso"] },
      ],
    },
    {
      _id: "demo-c2",
      nombre: "Marco Teórico y Estado del Arte",
      ponderacion: 0.15,
      tipo: "ESTRUCTURAL",
      esExcluyente: false,
      notaCorte: 4.0,
      descripcion: null,
      descriptores: [
        { notaNivel: 1, etiqueta: "Deficiente", bulletPoints: ["No evidencia marco teórico y estado del arte", "No se observa compromiso ni desarrollo"] },
        { notaNivel: 2, etiqueta: "Insuficiente", bulletPoints: ["Evidencia mínima en marco teórico y estado del arte", "Presenta graves deficiencias que comprometen el resultado"] },
        { notaNivel: 3, etiqueta: "Regular", bulletPoints: ["Evidencia parcial en marco teórico y estado del arte", "Cumple de manera incompleta, con errores relevantes"] },
        { notaNivel: 4, etiqueta: "Suficiente", bulletPoints: ["Evidencia básica en marco teórico y estado del arte", "Cumple los requisitos mínimos aceptables"] },
        { notaNivel: 5, etiqueta: "Adecuado", bulletPoints: ["Evidencia adecuada en marco teórico y estado del arte", "Cumple cabalmente los criterios establecidos"] },
        { notaNivel: 6, etiqueta: "Notable", bulletPoints: ["Evidencia notable en marco teórico y estado del arte", "Supera las expectativas con calidad sobresaliente"] },
        { notaNivel: 7, etiqueta: "Excepcional", bulletPoints: ["Evidencia excepcional en marco teórico y estado del arte", "Alcanza un nivel destacado, referente para el curso"] },
      ],
    },
    {
      _id: "demo-c3",
      nombre: "Metodología y Diseño",
      ponderacion: 0.20,
      tipo: "ESTRUCTURAL",
      esExcluyente: true,
      notaCorte: 4.0,
      descripcion: null,
      descriptores: [
        { notaNivel: 1, etiqueta: "Deficiente", bulletPoints: ["No evidencia metodología y diseño", "No se observa compromiso ni desarrollo"] },
        { notaNivel: 2, etiqueta: "Insuficiente", bulletPoints: ["Evidencia mínima en metodología y diseño", "Presenta graves deficiencias que comprometen el resultado"] },
        { notaNivel: 3, etiqueta: "Regular", bulletPoints: ["Evidencia parcial en metodología y diseño", "Cumple de manera incompleta, con errores relevantes"] },
        { notaNivel: 4, etiqueta: "Suficiente", bulletPoints: ["Evidencia básica en metodología y diseño", "Cumple los requisitos mínimos aceptables"] },
        { notaNivel: 5, etiqueta: "Adecuado", bulletPoints: ["Evidencia adecuada en metodología y diseño", "Cumple cabalmente los criterios establecidos"] },
        { notaNivel: 6, etiqueta: "Notable", bulletPoints: ["Evidencia notable en metodología y diseño", "Supera las expectativas con calidad sobresaliente"] },
        { notaNivel: 7, etiqueta: "Excepcional", bulletPoints: ["Evidencia excepcional en metodología y diseño", "Alcanza un nivel destacado, referente para el curso"] },
      ],
    },
    {
      _id: "demo-c4",
      nombre: "Implementación y Resultados",
      ponderacion: 0.20,
      tipo: "ESTRUCTURAL",
      esExcluyente: true,
      notaCorte: 4.0,
      descripcion: null,
      descriptores: [
        { notaNivel: 1, etiqueta: "Deficiente", bulletPoints: ["No evidencia implementación y resultados", "No se observa compromiso ni desarrollo"] },
        { notaNivel: 2, etiqueta: "Insuficiente", bulletPoints: ["Evidencia mínima en implementación y resultados", "Presenta graves deficiencias que comprometen el resultado"] },
        { notaNivel: 3, etiqueta: "Regular", bulletPoints: ["Evidencia parcial en implementación y resultados", "Cumple de manera incompleta, con errores relevantes"] },
        { notaNivel: 4, etiqueta: "Suficiente", bulletPoints: ["Evidencia básica en implementación y resultados", "Cumple los requisitos mínimos aceptables"] },
        { notaNivel: 5, etiqueta: "Adecuado", bulletPoints: ["Evidencia adecuada en implementación y resultados", "Cumple cabalmente los criterios establecidos"] },
        { notaNivel: 6, etiqueta: "Notable", bulletPoints: ["Evidencia notable en implementación y resultados", "Supera las expectativas con calidad sobresaliente"] },
        { notaNivel: 7, etiqueta: "Excepcional", bulletPoints: ["Evidencia excepcional en implementación y resultados", "Alcanza un nivel destacado, referente para el curso"] },
      ],
    },
    {
      _id: "demo-c5",
      nombre: "Conclusiones y Trabajo Futuro",
      ponderacion: 0.10,
      tipo: "ESTRUCTURAL",
      esExcluyente: false,
      notaCorte: 4.0,
      descripcion: null,
      descriptores: [
        { notaNivel: 1, etiqueta: "Deficiente", bulletPoints: ["No evidencia conclusiones y trabajo futuro", "No se observa compromiso ni desarrollo"] },
        { notaNivel: 2, etiqueta: "Insuficiente", bulletPoints: ["Evidencia mínima en conclusiones y trabajo futuro", "Presenta graves deficiencias que comprometen el resultado"] },
        { notaNivel: 3, etiqueta: "Regular", bulletPoints: ["Evidencia parcial en conclusiones y trabajo futuro", "Cumple de manera incompleta, con errores relevantes"] },
        { notaNivel: 4, etiqueta: "Suficiente", bulletPoints: ["Evidencia básica en conclusiones y trabajo futuro", "Cumple los requisitos mínimos aceptables"] },
        { notaNivel: 5, etiqueta: "Adecuado", bulletPoints: ["Evidencia adecuada en conclusiones y trabajo futuro", "Cumple cabalmente los criterios establecidos"] },
        { notaNivel: 6, etiqueta: "Notable", bulletPoints: ["Evidencia notable en conclusiones y trabajo futuro", "Supera las expectativas con calidad sobresaliente"] },
        { notaNivel: 7, etiqueta: "Excepcional", bulletPoints: ["Evidencia excepcional en conclusiones y trabajo futuro", "Alcanza un nivel destacado, referente para el curso"] },
      ],
    },
    {
      _id: "demo-c6",
      nombre: "Presentación Oral",
      ponderacion: 0.10,
      tipo: "ESTRUCTURAL",
      esExcluyente: false,
      notaCorte: 4.0,
      descripcion: null,
      descriptores: [
        { notaNivel: 1, etiqueta: "Deficiente", bulletPoints: ["No evidencia presentación oral", "No se observa compromiso ni desarrollo"] },
        { notaNivel: 2, etiqueta: "Insuficiente", bulletPoints: ["Evidencia mínima en presentación oral", "Presenta graves deficiencias que comprometen el resultado"] },
        { notaNivel: 3, etiqueta: "Regular", bulletPoints: ["Evidencia parcial en presentación oral", "Cumple de manera incompleta, con errores relevantes"] },
        { notaNivel: 4, etiqueta: "Suficiente", bulletPoints: ["Evidencia básica en presentación oral", "Cumple los requisitos mínimos aceptables"] },
        { notaNivel: 5, etiqueta: "Adecuado", bulletPoints: ["Evidencia adecuada en presentación oral", "Cumple cabalmente los criterios establecidos"] },
        { notaNivel: 6, etiqueta: "Notable", bulletPoints: ["Evidencia notable en presentación oral", "Supera las expectativas con calidad sobresaliente"] },
        { notaNivel: 7, etiqueta: "Excepcional", bulletPoints: ["Evidencia excepcional en presentación oral", "Alcanza un nivel destacado, referente para el curso"] },
      ],
    },
    {
      _id: "demo-c7",
      nombre: "Documentación Escrita",
      ponderacion: 0.10,
      tipo: "ESTRUCTURAL",
      esExcluyente: false,
      notaCorte: 4.0,
      descripcion: null,
      descriptores: [
        { notaNivel: 1, etiqueta: "Deficiente", bulletPoints: ["No evidencia documentación escrita", "No se observa compromiso ni desarrollo"] },
        { notaNivel: 2, etiqueta: "Insuficiente", bulletPoints: ["Evidencia mínima en documentación escrita", "Presenta graves deficiencias que comprometen el resultado"] },
        { notaNivel: 3, etiqueta: "Regular", bulletPoints: ["Evidencia parcial en documentación escrita", "Cumple de manera incompleta, con errores relevantes"] },
        { notaNivel: 4, etiqueta: "Suficiente", bulletPoints: ["Evidencia básica en documentación escrita", "Cumple los requisitos mínimos aceptables"] },
        { notaNivel: 5, etiqueta: "Adecuado", bulletPoints: ["Evidencia adecuada en documentación escrita", "Cumple cabalmente los criterios establecidos"] },
        { notaNivel: 6, etiqueta: "Notable", bulletPoints: ["Evidencia notable en documentación escrita", "Supera las expectativas con calidad sobresaliente"] },
        { notaNivel: 7, etiqueta: "Excepcional", bulletPoints: ["Evidencia excepcional en documentación escrita", "Alcanza un nivel destacado, referente para el curso"] },
      ],
    },
  ],
};

/* ── Colores de badges por nivel (gradiente semántico) ── */
const NIVEL_COLORS: Record<number, { bg: string; text: string; border: string; cellBg: string }> = {
  1: { bg: "#fee2e2", text: "#b91c1c", border: "#fecaca", cellBg: "#fef2f2" },
  2: { bg: "#fee2e2", text: "#b91c1c", border: "#fecaca", cellBg: "#fef2f2" },
  3: { bg: "#fee2e2", text: "#b91c1c", border: "#fecaca", cellBg: "#fef2f2" },
  4: { bg: "#fef9c3", text: "#a16207", border: "#fde68a", cellBg: "#fefce8" },
  5: { bg: "#dcfce7", text: "#15803d", border: "#bbf7d0", cellBg: "#f0fdf4" },
  6: { bg: "#dcfce7", text: "#15803d", border: "#bbf7d0", cellBg: "#f0fdf4" },
  7: { bg: "#dcfce7", text: "#15803d", border: "#bbf7d0", cellBg: "#f0fdf4" },
};

/* ── Gradiente de badges del header (del ejemplo HTML) ── */
const HEADER_BADGE_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: "#fee2e2", text: "#b91c1c", border: "#fecaca" },
  2: { bg: "#ffedd5", text: "#c2410c", border: "#fed7aa" },
  3: { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
  4: { bg: "#fef9c3", text: "#a16207", border: "#fde68a" },
  5: { bg: "#ecfccb", text: "#4d7c0f", border: "#d9f99d" },
  6: { bg: "#dcfce7", text: "#15803d", border: "#bbf7d0" },
  7: { bg: "#d1fae5", text: "#047857", border: "#a7f3d0" },
};

function getNivelColor(nota: number) {
  return NIVEL_COLORS[nota] || NIVEL_COLORS[4];
}

function getHeaderBadgeColor(nota: number) {
  return HEADER_BADGE_COLORS[nota] || HEADER_BADGE_COLORS[4];
}

/* ── Componente principal ── */
function VerRubricaContent() {
  const searchParams = useSearchParams();
  const jwt = searchParams.get("jwt") || "";
  const rubricaId = searchParams.get("rubrica_id") || "";

  const [rubrica, setRubrica] = useState<RubricaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rubricaId) {
      // Modo demo
      setRubrica(DEMO_RUBRICA);
      setLoading(false);
      return;
    }

    const fetchRubrica = async () => {
      setLoading(true);
      try {
        const res = await fetch(apiUrl(`/api/rubricas/${rubricaId}`), {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        const data = await res.json();
        if (data.success) {
          setRubrica(data.data);
        } else {
          setError(data.error?.detail || "Rúbrica no disponible");
        }
      } catch {
        setError("Error cargando rúbrica");
      }
      setLoading(false);
    };

    fetchRubrica();
  }, [rubricaId, jwt]);

  /* Calcular el N máximo de descriptores (columnas dinámicas) */
  const maxNiveles = useMemo(() => {
    if (!rubrica) return 0;
    return Math.max(...rubrica.criterios.map((c) => c.descriptores.length), 0);
  }, [rubrica]);

  /* Generar array de niveles ordenados (de mayor a menor: 7,6,5,4,3,2,1) */
  const niveles = useMemo(() => {
    if (!rubrica || maxNiveles === 0) return [];
    // Recopilar todos los notaNivel únicos de todos los criterios, ordenados desc
    const nivelesSet = new Set<number>();
    for (const c of rubrica.criterios) {
      for (const d of c.descriptores) {
        nivelesSet.add(d.notaNivel);
      }
    }
    return Array.from(nivelesSet).sort((a, b) => b - a);
  }, [rubrica, maxNiveles]);

  /* Buscar descriptor por criterio y nivel */
  const getDescriptor = (criterio: Criterio, nivel: number): Descriptor | undefined => {
    return criterio.descriptores.find((d) => d.notaNivel === nivel);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-xs" style={{ color: "rgba(57,64,73,0.5)" }}>Cargando rúbrica...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <span className="text-xs font-medium" style={{ color: "var(--color-evalUA8)" }}>{error}</span>
          <p className="text-[10px]" style={{ color: "rgba(57,64,73,0.4)" }}>
            Verifique que la rúbrica esté activa y expuesta.
          </p>
        </div>
      </div>
    );
  }

  if (!rubrica) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="embed-header" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.5rem" }}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--color-evalUA1)" }}>
              Rúbrica
            </span>
            <span className="embed-badge-sm neutral">v{rubrica.version}</span>
            {!rubricaId && (
              <span className="embed-badge-sm warning">DEMO</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="embed-badge-sm primary">Exigencia {Math.round(rubrica.exigencia * 100)}%</span>
            <span className="embed-badge-sm neutral">Nota mín. {rubrica.notaAprobacion.toFixed(1)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full">
          <span className="text-xs font-semibold truncate" style={{ color: "var(--color-evalUA2)" }}>
            {rubrica.titulo}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center gap-1 rounded border border-dashed px-1.5 py-0.5"
            style={{ backgroundColor: "#f8f9fa", borderColor: "#dee2e6" }}
          >
            <span className="font-mono select-all" style={{ color: "rgba(57,64,73,0.55)", fontSize: "9px" }}>
              {rubrica._id}
            </span>
          </div>
        </div>
      </div>

      {/* Matriz (tabla scrollable) */}
      <div className="flex-1 overflow-x-auto overflow-y-auto px-2 py-2">
        <div style={{ minWidth: "max-content" }}>
          <table
            className="w-full text-xs"
            style={{ borderCollapse: "separate", borderSpacing: "0" }}
          >
            {/* ── THEAD: Columnas numeradas ── */}
            <thead>
              <tr style={{ borderBottom: "1px solid #E5E0D8" }}>
                {/* Col 1: Criterio */}
                <th
                  className="p-2 text-left font-medium sticky left-0 z-10"
                  style={{ color: "#3D405B", backgroundColor: "var(--embed-bg)", minWidth: "11rem" }}
                >
                  Criterio
                </th>
                {/* Col 2..n: Niveles */}
                {niveles.map((nivel) => {
                  const color = getHeaderBadgeColor(nivel);
                  return (
                    <th key={nivel} className="p-2 text-center font-medium" style={{ minWidth: "10rem" }}>
                      <span
                        className="inline-flex items-center justify-center rounded-md font-bold text-xs"
                        style={{
                          backgroundColor: color.bg,
                          color: color.text,
                          border: `1px solid ${color.border}`,
                          height: "1.5rem",
                          width: "1.5rem",
                        }}
                      >
                        {nivel}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* ── TBODY: Una fila por criterio ── */}
            <tbody>
              {rubrica.criterios.map((criterio) => (
                <tr
                  key={criterio._id}
                  style={{ borderBottom: "1px solid #E5E0D8" }}
                >
                  {/* Col 1: Nombre + ponderación + gatekeeper */}
                  <td
                    className="p-2 sticky left-0 z-10"
                    style={{ backgroundColor: "var(--embed-bg)" }}
                  >
                    <div className="flex items-center gap-1">
                      {criterio.esExcluyente && (
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
                          className="shrink-0"
                          style={{ width: "0.75rem", height: "0.75rem", color: "#E07A5F" }}
                          aria-label="Excluyente"
                        >
                          <title>Excluyente</title>
                          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
                        </svg>
                      )}
                      <span className="font-medium" style={{ color: "#1A1A1A", fontSize: "11px" }}>
                        {criterio.nombre}
                      </span>
                    </div>
                    <span style={{ color: "#8A8578", fontSize: "10px" }}>
                      {(criterio.ponderacion * 100).toFixed(0)}%
                      {criterio.esExcluyente && (
                        <span style={{ color: "#E07A5F", marginLeft: "0.25rem" }}>excl.</span>
                      )}
                    </span>
                  </td>

                  {/* Col 2..n: Descriptores por nivel */}
                  {niveles.map((nivel) => {
                    const desc = getDescriptor(criterio, nivel);
                    const color = getNivelColor(nivel);

                    if (!desc) {
                      return (
                        <td
                          key={nivel}
                          className="p-1.5"
                          style={{
                            backgroundColor: "rgba(57,64,73,0.03)",
                            borderRadius: "0.375rem",
                          }}
                        >
                          <span style={{ color: "rgba(57,64,73,0.25)", fontSize: "10px", fontStyle: "italic" }}>
                            (vacío)
                          </span>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={nivel}
                        className="p-1.5"
                        style={{
                          backgroundColor: color.cellBg,
                          borderRadius: "0.375rem",
                          verticalAlign: "top",
                        }}
                      >
                        <div>
                          <span className="font-medium" style={{ color: "#3D405B", fontSize: "11px" }}>
                            {desc.etiqueta}
                          </span>
                          {desc.bulletPoints.length > 0 && (
                            <ul style={{ marginTop: "0.125rem" }}>
                              {desc.bulletPoints.map((bp, bpIdx) => (
                                <li
                                  key={bpIdx}
                                  style={{
                                    color: "#8A8578",
                                    fontSize: "10px",
                                    lineHeight: "1.2",
                                    listStyleType: "none",
                                  }}
                                >
                                  <span style={{ marginRight: "0.25rem" }}>•</span>
                                  {bp}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function VerRubricaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          <span className="text-xs" style={{ color: "rgba(57,64,73,0.5)" }}>Cargando...</span>
        </div>
      }
    >
      <VerRubricaContent />
    </Suspense>
  );
}