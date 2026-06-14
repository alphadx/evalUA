'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  FileText,
  Award,
  Clock,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Calculator,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  mockEvaluaciones,
  mockRubrica1,
  formatDate,
  type Puntaje,
} from '@/components/evalua/mock-data';

// evalUA color palette
const COLORS = {
  primary: '#EA7600',
  dark: '#394049',
  selected: '#9DD4D3',
  danger: '#C8102E',
  card: '#fffefd',
  success: '#198754',
};

export default function ResultadosView() {
  const evaluacion = mockEvaluaciones[0]; // eval-001: COMPLETADA, nota 5.4
  const rubrica = mockRubrica1;

  const isPassing = (evaluacion.notaFinal ?? 0) >= 4.0;

  // Accordion state: only one criterion expanded at a time
  const [expandedCriterioId, setExpandedCriterioId] = useState<string | null>(null);

  function toggleCriterio(criterioId: string) {
    setExpandedCriterioId((prev) => (prev === criterioId ? null : criterioId));
  }

  // Map puntajes by criterioId for quick lookup
  const puntajeMap = useMemo(() => {
    const m = new Map<string, Puntaje>();
    evaluacion.puntajes.forEach((p) => m.set(p.criterioId, p));
    return m;
  }, [evaluacion.puntajes]);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Outer label */}
      <p className="text-xs text-gray-400 font-mono">
        Simulación de Iframe — 1029 × 466 px
      </p>

      {/* Iframe simulation container */}
      <div
        className="relative border border-gray-200 shadow-md overflow-hidden bg-white"
        style={{ width: '1029px', height: '466px', maxWidth: '100%' }}
      >
        {/* ===== RESULTS HEADER ===== */}
        <div
          className="flex items-center justify-between px-5 py-2.5 border-b"
          style={{ backgroundColor: '#fdfcfa' }}
        >
          {/* Left: Title and info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FileText className="size-4" style={{ color: COLORS.primary }} />
              <h1
                className="text-sm font-bold"
                style={{ color: COLORS.dark }}
              >
                Resultado de Evaluación
              </h1>
            </div>
            <Separator orientation="vertical" className="h-5" />
            <span className="text-[11px] text-gray-500">
              {rubrica.titulo}
            </span>
            <Separator orientation="vertical" className="h-5" />
            <span className="text-[10px] text-gray-400 font-mono">
              ID: {evaluacion.id}
            </span>
          </div>

          {/* Right: Status and grade */}
          <div className="flex items-center gap-3">
            <Badge
              className="text-[10px] h-5 px-2 border-0 font-semibold"
              style={{
                backgroundColor: '#ecfdf5',
                color: COLORS.success,
              }}
            >
              <CheckCircle2 className="size-3 mr-0.5" />
              COMPLETADA
            </Badge>

            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-md"
              style={{
                backgroundColor: isPassing ? '#ecfdf5' : '#fef2f2',
              }}
            >
              <Award
                className="size-4"
                style={{ color: isPassing ? COLORS.success : COLORS.danger }}
              />
              <span
                className="text-lg font-bold"
                style={{ color: isPassing ? COLORS.success : COLORS.danger }}
              >
                {evaluacion.notaFinal?.toFixed(1)}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <Clock className="size-3" />
              {formatDate(evaluacion.updatedAt)}
            </div>
          </div>
        </div>

        {/* ===== CRITERIA ACCORDION ===== */}
        <ScrollArea style={{ height: '348px' }}>
          <div className="px-5 py-3">
            <div className="flex flex-col gap-1.5">
              {rubrica.criterios.map((criterio, idx) => {
                const puntaje = puntajeMap.get(criterio.id);
                const notaAsignada = puntaje?.notaAsignada ?? 0;
                const passing = notaAsignada >= 4.0;
                const isExcluyente = criterio.esExcluyente;
                const isExpanded = expandedCriterioId === criterio.id;
                const selectedDescriptor = criterio.descriptores.find(
                  (d) => d.notaNivel === Math.round(notaAsignada)
                );

                return (
                  <div key={criterio.id}>
                    {/* ---- Collapsed row (clickable header) ---- */}
                    <motion.button
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => toggleCriterio(criterio.id)}
                      className="w-full flex items-center gap-2.5 rounded-md border px-3 py-2 text-left transition-colors cursor-pointer hover:brightness-[0.97]"
                      style={{
                        backgroundColor: isExpanded
                          ? passing
                            ? '#ecfdf5'
                            : '#fef2f2'
                          : passing
                            ? '#f0fdf4'
                            : '#fef2f2',
                        borderColor: isExpanded
                          ? passing
                            ? COLORS.success
                            : COLORS.danger
                          : passing
                            ? '#bbf7d0'
                            : '#fecaca',
                        borderLeftWidth: '4px',
                        borderLeftColor: passing ? COLORS.success : COLORS.danger,
                      }}
                    >
                      {/* Expand/collapse chevron */}
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronDown
                            className="size-3.5"
                            style={{ color: COLORS.dark }}
                          />
                        ) : (
                          <ChevronRight
                            className="size-3.5"
                            style={{ color: '#9ca3af' }}
                          />
                        )}
                      </div>

                      {/* Criterion number */}
                      <div
                        className="flex-shrink-0 rounded-full flex items-center justify-center text-white font-bold text-[10px]"
                        style={{
                          width: '22px',
                          height: '22px',
                          backgroundColor: COLORS.dark,
                        }}
                      >
                        {idx + 1}
                      </div>

                      {/* Criterion name and badges */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs font-semibold"
                            style={{ color: COLORS.dark }}
                          >
                            {criterio.nombre}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] h-4 px-1"
                            style={{ borderColor: '#d1d5db', color: '#6b7280' }}
                          >
                            {Math.round(criterio.ponderacion * 100)}%
                          </Badge>
                          {isExcluyente && (
                            <Badge
                              className="text-[9px] h-4 px-1 border-0"
                              style={{
                                backgroundColor: '#fef2f2',
                                color: COLORS.danger,
                              }}
                            >
                              Excluyente
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Descriptor label */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-gray-500">
                          {selectedDescriptor?.etiqueta ?? '—'}
                        </span>

                        {/* Note badge */}
                        <Badge
                          className="text-[11px] font-bold h-5 px-2 border-0"
                          style={{
                            backgroundColor: passing ? '#dcfce7' : '#fee2e2',
                            color: passing ? COLORS.success : COLORS.danger,
                          }}
                        >
                          {notaAsignada.toFixed(1)}
                        </Badge>

                        {/* Pass/fail icon */}
                        {passing ? (
                          <CheckCircle2
                            className="size-4"
                            style={{ color: COLORS.success }}
                          />
                        ) : (
                          <XCircle
                            className="size-4"
                            style={{ color: COLORS.danger }}
                          />
                        )}
                      </div>
                    </motion.button>

                    {/* ---- Expanded descriptors ---- */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="pl-7 pr-3 pt-1.5 pb-2 space-y-1">
                            {criterio.descriptores.map((desc) => {
                              const isSelected =
                                desc.notaNivel === Math.round(notaAsignada);
                              const descPassing = desc.notaNivel >= 4;

                              return (
                                <div
                                  key={desc.notaNivel}
                                  className="flex items-start gap-2 rounded-md border px-3 py-1.5 transition-all"
                                  style={{
                                    backgroundColor: isSelected
                                      ? COLORS.selected
                                      : '#f9fafb',
                                    borderColor: isSelected
                                      ? '#5cc5c3'
                                      : '#e5e7eb',
                                    borderLeftWidth: isSelected ? '4px' : '2px',
                                    borderLeftColor: isSelected
                                      ? descPassing
                                        ? COLORS.success
                                        : COLORS.danger
                                      : '#e5e7eb',
                                    opacity: isSelected ? 1 : 0.6,
                                  }}
                                >
                                  {/* Note level badge */}
                                  <Badge
                                    className="text-[10px] font-bold h-4 px-1.5 border-0 shrink-0 mt-0.5"
                                    style={{
                                      backgroundColor: isSelected
                                        ? descPassing
                                          ? COLORS.success
                                          : COLORS.danger
                                        : '#d1d5db',
                                      color: isSelected ? '#fff' : '#6b7280',
                                    }}
                                  >
                                    {desc.notaNivel}
                                  </Badge>

                                  {/* Label and bullets */}
                                  <div className="flex-1 min-w-0">
                                    <span
                                      className="text-[11px] font-semibold"
                                      style={{
                                        color: isSelected
                                          ? COLORS.dark
                                          : '#9ca3af',
                                      }}
                                    >
                                      {desc.etiqueta}
                                    </span>

                                    {/* Bullet points — visible when selected, collapsed for others */}
                                    {isSelected && (
                                      <ul className="mt-1 space-y-0.5">
                                        {desc.bulletPoints.map((bp, bpIdx) => (
                                          <li
                                            key={bpIdx}
                                            className="text-[10px] text-gray-600 flex items-start gap-1"
                                          >
                                            <span className="mt-1 size-1 rounded-full shrink-0" style={{ backgroundColor: descPassing ? COLORS.success : COLORS.danger }} />
                                            {bp}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                    {!isSelected && (
                                      <p className="text-[9px] text-gray-400 mt-0.5">
                                        {desc.bulletPoints[0]}
                                        {desc.bulletPoints.length > 1 && ' ...'}
                                      </p>
                                    )}
                                  </div>

                                  {/* Selected indicator */}
                                  {isSelected && (
                                    <div className="shrink-0 mt-0.5">
                                      <CheckCircle2
                                        className="size-3.5"
                                        style={{
                                          color: descPassing
                                            ? COLORS.success
                                            : COLORS.danger,
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Observation for this criterion */}
                            {puntaje?.observaciones && (
                              <div className="flex items-start gap-2 mt-1 px-2 py-1.5 rounded-md" style={{ backgroundColor: '#fffbeb' }}>
                                <MessageSquare className="size-3 mt-0.5 shrink-0" style={{ color: COLORS.primary }} />
                                <p className="text-[10px] text-gray-600 italic">
                                  {puntaje.observaciones}
                                </p>
                              </div>
                            )}

                            {/* Contribution to final grade */}
                            <div className="flex items-center gap-2 px-2 py-1">
                              <Calculator className="size-3 text-gray-400" />
                              <span className="text-[10px] text-gray-500">
                                Contribución: {notaAsignada.toFixed(1)} × {Math.round(criterio.ponderacion * 100)}% = 
                              </span>
                              <span className="text-[10px] font-bold" style={{ color: COLORS.dark }}>
                                {(notaAsignada * criterio.ponderacion).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* ===== OBSERVATIONS SECTION ===== */}
            <Separator className="my-3" />

            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3
                  className="text-xs font-semibold mb-1"
                  style={{ color: COLORS.dark }}
                >
                  Observaciones Generales:
                </h3>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  {evaluacion.observaciones || 'Sin observaciones.'}
                </p>
              </div>
              <div className="flex-shrink-0">
                <Badge
                  variant="outline"
                  className="text-[10px] h-5 px-2 font-medium"
                  style={{ borderColor: COLORS.primary, color: COLORS.primary }}
                >
                  Regla aplicada:{' '}
                  {(evaluacion.metadata as Record<string, string>)
                    ?.reglaAplicada || 'NORMAL'}
                </Badge>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* ===== BOTTOM BAR (read-only) ===== */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-5 py-2 border-t"
          style={{ backgroundColor: '#fdfcfa', height: '36px' }}
        >
          <div className="flex items-center gap-2">
            <Badge
              className="text-[10px] h-5 border-0 font-medium"
              style={{
                backgroundColor: isPassing ? '#ecfdf5' : '#fef2f2',
                color: isPassing ? COLORS.success : COLORS.danger,
              }}
            >
              {isPassing ? 'APROBADO' : 'REPROBADO'}
            </Badge>
            <span className="text-[10px] text-gray-400">
              Evaluación de solo lectura — Click en un criterio para ver detalle
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-400">
              Creada: {formatDate(evaluacion.createdAt)}
            </span>
            <span className="text-[10px] text-gray-400">
              Finalizada: {formatDate(evaluacion.updatedAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
