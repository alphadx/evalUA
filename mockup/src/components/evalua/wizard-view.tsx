'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  AlertTriangle,
  Save,
  MessageSquare,
  Eye,
  Pencil,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { mockRubrica1, type Criterio, type Descriptor } from '@/components/evalua/mock-data';

// evalUA color palette
const COLORS = {
  primary: '#EA7600',
  dark: '#394049',
  selected: '#9DD4D3',
  danger: '#C8102E',
  card: '#fffefd',
  success: '#198754',
};

// Wizard phases
type WizardPhase = 'evaluating' | 'summary' | 'completed';

export default function WizardView() {
  const criterios = mockRubrica1.criterios;
  const totalCriterios = criterios.length;

  // Phase state
  const [phase, setPhase] = useState<WizardPhase>('evaluating');

  // Interactive state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedNotes, setSelectedNotes] = useState<Map<string, number>>(() => {
    // Start empty for full demo flow
    return new Map<string, number>();
  });
  const [observaciones, setObservaciones] = useState<string>('');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saving' | 'saved'>('saved');
  const [showObservations, setShowObservations] = useState(false);

  const currentCriterio = criterios[currentIdx];

  // Calculate weighted grade (proper calculation matching the domain strategy)
  const calculatedGrade = useMemo(() => {
    // Check Gatekeeper first
    for (const c of criterios) {
      if (c.esExcluyente) {
        const note = selectedNotes.get(c.id);
        if (note !== undefined && note < 4.0) {
          return 1.0; // Gatekeeper: automatic failure
        }
      }
    }
    // Weighted average of ALL criteria (ponderaciones sum to 1.0)
    let weightedSum = 0;
    for (const c of criterios) {
      const note = selectedNotes.get(c.id);
      if (note !== undefined) {
        weightedSum += note * c.ponderacion;
      }
    }
    return Math.round(weightedSum * 100) / 100;
  }, [selectedNotes, criterios]);

  // Cumulative grade for display while evaluating (may be partial)
  const cumulativeGrade = useMemo(() => {
    let weightedSum = 0;
    let totalWeight = 0;
    for (const c of criterios) {
      const note = selectedNotes.get(c.id);
      if (note !== undefined) {
        weightedSum += note * c.ponderacion;
        totalWeight += c.ponderacion;
      }
    }
    return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0;
  }, [selectedNotes, criterios]);

  const allEvaluated = useMemo(() => {
    return criterios.every(c => selectedNotes.has(c.id));
  }, [selectedNotes, criterios]);

  // Check if Gatekeeper is triggered
  const gatekeeperTriggered = useMemo(() => {
    for (const c of criterios) {
      if (c.esExcluyente) {
        const note = selectedNotes.get(c.id);
        if (note !== undefined && note < 4.0) return true;
      }
    }
    return false;
  }, [selectedNotes, criterios]);

  // Select a descriptor — HU-06: auto-advance to next criterion
  const handleSelectDescriptor = useCallback((criterioId: string, nota: number) => {
    setSelectedNotes(prev => {
      const next = new Map(prev);
      next.set(criterioId, nota);
      return next;
    });
    // Simulate auto-save (HU-07)
    setAutoSaveStatus('saving');
    setTimeout(() => setAutoSaveStatus('saved'), 600);

    // HU-06: Auto-advance after selection
    setTimeout(() => {
      setCurrentIdx(prevIdx => {
        const nextIdx = prevIdx + 1;
        // If we've evaluated the last criterion, go to summary
        if (nextIdx >= criterios.length) {
          // All criteria evaluated → show summary
          setPhase('summary');
          return prevIdx; // Keep index at last
        }
        return nextIdx;
      });
    }, 400); // Small delay so user sees the selection before advancing
  }, [criterios.length]);

  // Navigation
  const goNext = useCallback(() => {
    if (currentIdx < totalCriterios - 1) {
      setCurrentIdx(prev => prev + 1);
    }
  }, [currentIdx, totalCriterios]);

  const goPrev = useCallback(() => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
    setShowObservations(false);
  }, [currentIdx]);

  // Go to a specific criterion from summary (HU-08: modify from review)
  const goToCriterion = useCallback((idx: number) => {
    setPhase('evaluating');
    setCurrentIdx(idx);
    setShowObservations(false);
  }, []);

  // Finalize evaluation
  const handleFinalize = useCallback(() => {
    setPhase('completed');
  }, []);

  // Back to summary from completed state
  const handleBackToSummary = useCallback(() => {
    setPhase('summary');
  }, []);

  // Get descriptor label for a note
  const getDescriptorLabel = (criterioId: string, nota: number): string => {
    const criterio = criterios.find(c => c.id === criterioId);
    if (!criterio) return '—';
    const rounded = Math.round(nota);
    const desc = criterio.descriptores.find(d => d.notaNivel === rounded);
    return desc?.etiqueta || '—';
  };

  // ===== COMPLETED STATE =====
  if (phase === 'completed') {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs text-gray-400 font-mono">
          Simulación de Iframe — 1029 × 466 px
        </p>
        <div
          className="relative border border-gray-200 shadow-md overflow-hidden bg-white flex items-center justify-center"
          style={{ width: '1029px', height: '466px', maxWidth: '100%' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center space-y-4 px-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                backgroundColor: calculatedGrade >= 4.0 ? '#ecfdf5' : '#fef2f2',
              }}
            >
              <Check
                className="size-8"
                style={{ color: calculatedGrade >= 4.0 ? COLORS.success : COLORS.danger }}
              />
            </motion.div>
            <h2 className="text-xl font-bold" style={{ color: COLORS.dark }}>
              Evaluación Finalizada
            </h2>
            <p className="text-sm text-gray-500">
              La evaluación ha sido consolidada y el resultado ha sido enviado al sistema Host.
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-sm text-gray-500">Nota Final:</span>
              <Badge
                className="text-lg font-bold h-9 px-4 border-0"
                style={{
                  backgroundColor: calculatedGrade >= 4.0 ? '#ecfdf5' : '#fef2f2',
                  color: calculatedGrade >= 4.0 ? COLORS.success : COLORS.danger,
                }}
              >
                {calculatedGrade.toFixed(2)}
              </Badge>
              {gatekeeperTriggered && (
                <Badge
                  className="text-xs h-7 px-2 border-0"
                  style={{ backgroundColor: '#fef2f2', color: COLORS.danger }}
                >
                  <AlertTriangle className="size-3 mr-1" />
                  Gatekeeper activado
                </Badge>
              )}
            </div>
            <div className="pt-2">
              <code className="text-[10px] text-gray-400 bg-gray-50 px-3 py-1 rounded">
                postMessage(&#123; type: &quot;evalua.evaluation.completed&quot; &#125;)
              </code>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ===== SUMMARY / REVIEW PHASE (HU-08) =====
  if (phase === 'summary') {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs text-gray-400 font-mono">
          Simulación de Iframe — 1029 × 466 px
        </p>
        <div
          className="relative border border-gray-200 shadow-md overflow-hidden bg-white"
          style={{ width: '1029px', height: '466px', maxWidth: '100%' }}
        >
          {/* Summary Header */}
          <div
            className="flex items-center justify-between px-4 py-2 border-b"
            style={{ backgroundColor: '#f8f8f6', height: '40px' }}
          >
            <div className="flex items-center gap-2">
              <Eye className="size-4" style={{ color: COLORS.primary }} />
              <span className="text-xs font-semibold" style={{ color: COLORS.dark }}>
                Resumen de Evaluación
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className="text-[10px] h-5 px-2 border-0 font-semibold"
                style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
              >
                Pendiente de confirmación
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] text-gray-500 hover:text-red-500"
                onClick={() => { setPhase('evaluating'); setCurrentIdx(0); }}
              >
                <X className="size-3 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>

          {/* Summary Content */}
          <ScrollArea style={{ height: '346px' }}>
            <div className="px-4 py-3 space-y-3">
              {/* Criteria Review List */}
              <div className="space-y-1.5">
                {criterios.map((c, idx) => {
                  const nota = selectedNotes.get(c.id);
                  const isPassing = nota !== undefined && nota >= 4.0;
                  const isExcluyenteFailed = c.esExcluyente && nota !== undefined && nota < 4.0;

                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:shadow-sm transition-shadow"
                      style={{
                        backgroundColor: isExcluyenteFailed ? '#fef2f2' : isPassing ? '#f0fdf4' : '#fffefd',
                        borderColor: isExcluyenteFailed ? '#fecaca' : isPassing ? '#bbf7d0' : '#e5e7eb',
                        borderLeftWidth: '4px',
                        borderLeftColor: isExcluyenteFailed ? COLORS.danger : isPassing ? COLORS.success : '#d1d5db',
                      }}
                      onClick={() => goToCriterion(idx)}
                    >
                      {/* Criterion number */}
                      <div
                        className="flex-shrink-0 rounded-full flex items-center justify-center text-white font-bold text-[10px]"
                        style={{ width: '22px', height: '22px', backgroundColor: COLORS.dark }}
                      >
                        {idx + 1}
                      </div>

                      {/* Name & descriptor */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold" style={{ color: COLORS.dark }}>
                            {c.nombre}
                          </span>
                          <Badge variant="outline" className="text-[9px] h-4 px-1" style={{ borderColor: '#d1d5db', color: '#6b7280' }}>
                            {Math.round(c.ponderacion * 100)}%
                          </Badge>
                          {c.esExcluyente && (
                            <Badge className="text-[9px] h-4 px-1 border-0" style={{ backgroundColor: '#fef2f2', color: COLORS.danger }}>
                              Excluyente
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500">
                          {nota !== undefined ? getDescriptorLabel(c.id, nota) : 'Sin calificar'}
                        </span>
                      </div>

                      {/* Note badge */}
                      {nota !== undefined && (
                        <Badge
                          className="text-[11px] font-bold h-5 px-2 border-0"
                          style={{
                            backgroundColor: isPassing ? '#dcfce7' : '#fee2e2',
                            color: isPassing ? COLORS.success : COLORS.danger,
                          }}
                        >
                          {nota.toFixed(1)}
                        </Badge>
                      )}

                      {/* Edit button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] gap-1"
                        style={{ color: COLORS.primary }}
                        onClick={(e) => { e.stopPropagation(); goToCriterion(idx); }}
                      >
                        <Pencil className="size-3" />
                        Modificar
                      </Button>
                    </motion.div>
                  );
                })}
              </div>

              {/* Observations field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: COLORS.dark }}>
                  <MessageSquare className="size-3.5" />
                  Observaciones Generales
                </label>
                <Textarea
                  placeholder="Ingrese observaciones sobre la evaluación (opcional)..."
                  className="text-xs resize-none"
                  style={{ minHeight: '52px' }}
                  value={observaciones}
                  onChange={(e) => {
                    setObservaciones(e.target.value);
                    setAutoSaveStatus('saving');
                    setTimeout(() => setAutoSaveStatus('saved'), 600);
                  }}
                />
              </div>

              {/* Calculation detail */}
              <div className="p-2.5 rounded-md border bg-gray-50">
                <p className="text-[10px] font-semibold mb-1" style={{ color: COLORS.dark }}>
                  Detalle del Cálculo:
                </p>
                <div className="flex flex-wrap gap-x-5 gap-y-1">
                  {criterios.map((c) => {
                    const nota = selectedNotes.get(c.id) ?? 0;
                    const contrib = nota * c.ponderacion;
                    return (
                      <span key={c.id} className="text-[10px] text-gray-500">
                        {c.nombre.split(' ').slice(0, 2).join(' ')}: {nota.toFixed(1)} × {Math.round(c.ponderacion * 100)}% ={' '}
                        <span className="font-medium" style={{ color: COLORS.dark }}>{contrib.toFixed(2)}</span>
                      </span>
                    );
                  })}
                </div>
                <div className="mt-1 pt-1 border-t flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500">Nota Final:</span>
                    <span className="text-sm font-bold" style={{ color: calculatedGrade >= 4.0 ? COLORS.success : COLORS.danger }}>
                      {calculatedGrade.toFixed(2)}
                    </span>
                  </div>
                  {gatekeeperTriggered && (
                    <Badge className="text-[9px] h-4 px-1.5 border-0" style={{ backgroundColor: '#fef2f2', color: COLORS.danger }}>
                      <AlertTriangle className="size-2.5 mr-0.5" />
                      Gatekeeper: nota 1.0 por criterio excluyente reprobado
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Summary Bottom Bar */}
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2 border-t bg-white"
            style={{ height: '40px' }}
          >
            {/* Left: Back button */}
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] gap-1"
              onClick={() => goToCriterion(totalCriterios - 1)}
            >
              <ArrowLeft className="size-3" />
              Volver al Wizard
            </Button>

            {/* Center: Auto-save */}
            <div className="flex items-center gap-1">
              <Check className="size-3" style={{ color: COLORS.success }} />
              <span className="text-[10px]" style={{ color: COLORS.success }}>
                Borrador guardado
              </span>
            </div>

            {/* Right: Finalize button */}
            <Button
              size="sm"
              className="h-7 text-[11px] text-white gap-1"
              style={{ backgroundColor: COLORS.primary }}
              onClick={handleFinalize}
            >
              <Check className="size-3" />
              Finalizar Evaluación
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ===== EVALUATING PHASE (main wizard) =====
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
        {/* ===== WIZARD HEADER BAR ===== */}
        <div
          className="flex items-center justify-between px-4 py-2 border-b"
          style={{ backgroundColor: '#f8f8f6', height: '40px' }}
        >
          {/* Left: Rubric name */}
          <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
            <span
              className="text-xs font-semibold truncate"
              style={{ color: COLORS.dark }}
            >
              Rúbrica: {mockRubrica1.titulo}
            </span>
          </div>

          {/* Center: Progress stepper */}
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-medium mr-1"
              style={{ color: COLORS.dark }}
            >
              Criterio {currentIdx + 1} de {totalCriterios}
            </span>
            <div className="flex items-center gap-1.5">
              {criterios.map((c, i) => {
                const isCompleted = selectedNotes.has(c.id) && i !== currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => setCurrentIdx(i)}
                  >
                    <div
                      className="rounded-full flex items-center justify-center text-[9px] font-bold transition-all"
                      style={{
                        width: isCurrent ? '22px' : '18px',
                        height: isCurrent ? '22px' : '18px',
                        backgroundColor: isCompleted
                          ? COLORS.success
                          : isCurrent
                          ? COLORS.primary
                          : '#d1d5db',
                        color: '#fff',
                      }}
                    >
                      {isCompleted ? (
                        <Check className="size-2.5" />
                      ) : (
                        i + 1
                      )}
                    </div>
                  </div>
                );
              })}
              {/* Summary step indicator */}
              <div className="flex items-center gap-1 ml-1">
                <div className="h-3 w-px bg-gray-300" />
                <div
                  className="rounded-full flex items-center justify-center text-[9px] font-bold transition-all"
                  style={{
                    width: '18px',
                    height: '18px',
                    backgroundColor: allEvaluated ? COLORS.primary : '#d1d5db',
                    color: '#fff',
                  }}
                >
                  <Eye className="size-2.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Cancel button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] text-gray-500 hover:text-red-500 flex-shrink-0"
          >
            <X className="size-3 mr-1" />
            Cancelar
          </Button>
        </div>

        {/* ===== CRITERION CONTENT AREA ===== */}
        <AnimatePresence mode="wait">
          <motion.div
            key={showObservations ? `obs-${currentCriterio.id}` : currentCriterio.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            style={{ height: '386px' }}
          >
            {showObservations ? (
              /* ===== OBSERVATIONS SUB-VIEW ===== */
              <div className="h-full flex flex-col px-4 py-3" style={{ backgroundColor: '#fdfcfa' }}>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="size-4" style={{ color: COLORS.primary }} />
                  <h2 className="text-sm font-bold" style={{ color: COLORS.dark }}>
                    Observaciones — {currentCriterio.nombre}
                  </h2>
                </div>
                <Textarea
                  placeholder="Ingrese observaciones para este criterio (opcional)..."
                  className="flex-1 text-sm resize-none"
                  style={{ backgroundColor: COLORS.card }}
                />
                <div className="flex justify-end mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] gap-1"
                    onClick={() => setShowObservations(false)}
                  >
                    <Check className="size-3" />
                    Listo
                  </Button>
                </div>
              </div>
            ) : (
              /* ===== DESCRIPTOR CARDS VIEW ===== */
              <>
                {/* Criterion title row */}
                <div className="flex items-center gap-3 px-4 py-2 border-b" style={{ backgroundColor: '#fdfcfa' }}>
                  <h2
                    className="text-sm font-bold"
                    style={{ color: COLORS.dark }}
                  >
                    {currentCriterio.nombre}
                  </h2>
                  <Badge
                    variant="outline"
                    className="text-[10px] h-5 px-1.5 font-medium"
                    style={{ borderColor: COLORS.primary, color: COLORS.primary }}
                  >
                    Ponderación: {Math.round(currentCriterio.ponderacion * 100)}%
                  </Badge>
                  {currentCriterio.esExcluyente && (
                    <Badge
                      className="text-[10px] h-5 px-1.5 font-medium border-0"
                      style={{ backgroundColor: '#fef2f2', color: COLORS.danger }}
                    >
                      <AlertTriangle className="size-2.5 mr-0.5" />
                      Excluyente
                    </Badge>
                  )}
                  {currentCriterio.descripcion && (
                    <span className="text-[10px] text-gray-400 italic truncate">
                      {currentCriterio.descripcion}
                    </span>
                  )}
                </div>

                {/* Descriptor cards - scrollable */}
                <ScrollArea style={{ height: '302px' }}>
                  <div className="px-3 py-2 flex flex-col gap-1.5">
                    {currentCriterio.descriptores.map((desc) => {
                      const isSelected = selectedNotes.get(currentCriterio.id) === desc.notaNivel;
                      return (
                        <DescriptorCard
                          key={desc.notaNivel}
                          descriptor={desc}
                          isSelected={isSelected}
                          onSelect={() => handleSelectDescriptor(currentCriterio.id, desc.notaNivel)}
                        />
                      );
                    })}
                  </div>
                </ScrollArea>

                {/* Observation toggle row */}
                <div
                  className="flex items-center justify-between px-4 py-1.5 border-t"
                  style={{ backgroundColor: '#f8f8f6' }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] gap-1 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowObservations(true)}
                  >
                    <MessageSquare className="size-3" />
                    Agregar observación a este criterio
                  </Button>
                  {selectedNotes.has(currentCriterio.id) && (
                    <Badge
                      className="text-[10px] h-4 px-1.5 border-0"
                      style={{ backgroundColor: '#ecfdf5', color: COLORS.success }}
                    >
                      Calificado: {selectedNotes.get(currentCriterio.id)?.toFixed(1)}
                    </Badge>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ===== BOTTOM BAR ===== */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2 border-t bg-white"
          style={{ height: '40px' }}
        >
          {/* Left: Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px]"
              onClick={goPrev}
              disabled={currentIdx === 0}
            >
              <ChevronLeft className="size-3 mr-0.5" />
              Atrás
            </Button>
            {allEvaluated ? (
              <Button
                size="sm"
                className="h-7 text-[11px] text-white gap-1"
                style={{ backgroundColor: COLORS.primary }}
                onClick={() => setPhase('summary')}
              >
                <Eye className="size-3" />
                Ver Resumen
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                onClick={goNext}
                disabled={currentIdx === totalCriterios - 1}
              >
                Siguiente
                <ChevronRight className="size-3 ml-0.5" />
              </Button>
            )}
          </div>

          {/* Center: Auto-save indicator (HU-07) */}
          <div className="flex items-center gap-1">
            {autoSaveStatus === 'saving' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1"
              >
                <Save className="size-3 text-gray-400" />
                <span className="text-[10px] text-gray-400">Guardando borrador...</span>
              </motion.div>
            ) : (
              <div className="flex items-center gap-1">
                <Check className="size-3" style={{ color: COLORS.success }} />
                <span className="text-[10px]" style={{ color: COLORS.success }}>
                  Borrador guardado
                </span>
              </div>
            )}
          </div>

          {/* Right: Cumulative grade + Gatekeeper alert */}
          <div className="flex items-center gap-2">
            {gatekeeperTriggered && (
              <Badge
                className="text-[9px] h-5 px-1.5 border-0"
                style={{ backgroundColor: '#fef2f2', color: COLORS.danger }}
              >
                <AlertTriangle className="size-2.5 mr-0.5" />
                Gatekeeper
              </Badge>
            )}
            <span className="text-[10px] text-gray-500">Cálculo Acumulado:</span>
            <Badge
              className="text-[11px] font-bold h-6 px-2 border-0"
              style={{
                backgroundColor: cumulativeGrade >= 4.0 ? '#ecfdf5' : '#fef2f2',
                color: cumulativeGrade >= 4.0 ? COLORS.success : COLORS.danger,
              }}
            >
              Nota {cumulativeGrade.toFixed(2)}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Descriptor Card Component =====
function DescriptorCard({
  descriptor,
  isSelected,
  onSelect,
}: {
  descriptor: Descriptor;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      onClick={onSelect}
      className="w-full text-left flex items-start gap-2.5 rounded-md border px-3 py-2 transition-colors cursor-pointer"
      style={{
        backgroundColor: isSelected ? COLORS.selected : COLORS.card,
        borderColor: isSelected ? COLORS.primary : '#e5e7eb',
        borderLeftWidth: isSelected ? '4px' : '1px',
        borderLeftColor: isSelected ? COLORS.primary : '#e5e7eb',
      }}
      whileHover={{ scale: 1.002 }}
      whileTap={{ scale: 0.998 }}
    >
      {/* Note number circle */}
      <div
        className="flex-shrink-0 rounded-full flex items-center justify-center text-white font-bold"
        style={{
          width: '28px',
          height: '28px',
          backgroundColor:
            descriptor.notaNivel >= 5
              ? COLORS.success
              : descriptor.notaNivel >= 4
              ? COLORS.primary
              : descriptor.notaNivel >= 3
              ? '#eab308'
              : COLORS.danger,
          fontSize: '12px',
        }}
      >
        {descriptor.notaNivel}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold"
            style={{ color: COLORS.dark }}
          >
            {descriptor.etiqueta}
          </span>
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center"
            >
              <Check
                className="size-3.5"
                style={{ color: COLORS.primary }}
              />
            </motion.div>
          )}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0 mt-0.5">
          {descriptor.bulletPoints.map((bp, i) => (
            <span key={i} className="text-[10px] text-gray-500 leading-tight">
              • {bp}
            </span>
          ))}
        </div>
      </div>
    </motion.button>
  );
}
