'use client';

import { useState } from 'react';
import {
  Plus,
  Pencil,
  Copy,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  GripVertical,
  ClipboardCopy,
  Check,
  Fingerprint,
  FileText,
  Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';

import { mockRubricas, type Rubrica, formatDate } from '@/components/evalua/mock-data';

// evalUA color palette
const COLORS = {
  primary: '#EA7600',
  dark: '#394049',
  selected: '#9DD4D3',
  danger: '#C8102E',
  card: '#fffefd',
  success: '#198754',
};

// ---------- Criterion form shape ----------
interface CriterionForm {
  nombre: string;
  ponderacion: string;
  tipo: 'ESTRUCTURAL' | 'COMPLEMENTARIO';
  esExcluyente: boolean;
  descriptorsOpen: boolean;
  descriptores: { notaNivel: number; etiqueta: string; bulletPoints: string }[];
}

function createEmptyCriterion(): CriterionForm {
  return {
    nombre: '',
    ponderacion: '',
    tipo: 'ESTRUCTURAL',
    esExcluyente: false,
    descriptorsOpen: false,
    descriptores: [1, 2, 3, 4, 5, 6, 7].map((nota) => ({
      notaNivel: nota,
      etiqueta: '',
      bulletPoints: '',
    })),
  };
}

// ---------- Compact Rubrica Card ----------
function CompactRubricaCard({
  rubrica,
  onClone,
}: {
  rubrica: Rubrica;
  onClone: (id: string) => void;
}) {
  const metadata = rubrica.metadata as Record<string, unknown> | null;
  const department = (metadata?.departamento as string) ?? '—';
  const version = (metadata?.version as number) ?? 1;
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [idCopied, setIdCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  function copyIdToClipboard() {
    navigator.clipboard.writeText(rubrica.id).then(() => {
      setIdCopied(true);
      setTimeout(() => setIdCopied(false), 2000);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="overflow-hidden"
        style={{ backgroundColor: COLORS.card }}
      >
        {/* Top accent bar */}
        <div
          className="h-[3px] w-full"
          style={{ backgroundColor: rubrica.esActiva ? COLORS.success : '#9ca3af' }}
        />

        <div className="px-3 py-2">
          {/* Row 1: Title + badges + actions */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-semibold truncate"
                  style={{ color: COLORS.dark }}
                >
                  {rubrica.titulo}
                </span>
                {rubrica.esActiva ? (
                  <Badge
                    className="border-0 text-[9px] h-4 px-1.5 shrink-0"
                    style={{ backgroundColor: COLORS.success, color: '#fff' }}
                  >
                    Activa
                  </Badge>
                ) : (
                  <Badge
                    className="border-0 text-[9px] h-4 px-1.5 shrink-0"
                    style={{ backgroundColor: '#9ca3af', color: '#fff' }}
                  >
                    Inactiva
                  </Badge>
                )}
                <Badge variant="outline" className="text-[9px] h-4 px-1">
                  v{version}
                </Badge>
                <Badge variant="outline" className="text-[9px] h-4 px-1">
                  {department}
                </Badge>
                <Badge variant="secondary" className="text-[9px] h-4 px-1">
                  {rubrica.criterios.length} crit.
                </Badge>
              </div>
            </div>

            {/* Expand/collapse toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 shrink-0"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="size-3 text-gray-400" />
              ) : (
                <ChevronDown className="size-3 text-gray-400" />
              )}
            </Button>
          </div>

          {/* Row 2: ID reference — always visible */}
          <div className="mt-1.5 flex items-center gap-1.5">
            <div
              className="flex items-center gap-1 rounded border border-dashed px-1.5 py-0.5 text-[10px]"
              style={{
                backgroundColor: '#f8f9fa',
                borderColor: '#dee2e6',
                color: '#6c757d',
              }}
            >
              <Fingerprint className="size-3 shrink-0" style={{ color: COLORS.primary }} />
              <span className="font-semibold" style={{ color: COLORS.dark }}>ID</span>
              <code
                className="font-mono select-all"
                style={{ color: COLORS.dark, fontSize: '10px' }}
                title="Identificador de referencia para el JWT de lanzamiento del Host (rubrica_id)"
              >
                {rubrica.id}
              </code>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-5 gap-1 px-1.5 text-[9px]"
              onClick={copyIdToClipboard}
              title="Copiar ID al portapapeles"
            >
              {idCopied ? (
                <>
                  <Check className="size-2.5" style={{ color: COLORS.success }} />
                  <span style={{ color: COLORS.success }}>Copiado</span>
                </>
              ) : (
                <>
                  <ClipboardCopy className="size-2.5" />
                  <span>Copiar ID</span>
                </>
              )}
            </Button>

            {/* Inline action buttons */}
            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-5 gap-1 px-1.5 text-[9px] text-gray-500 hover:text-gray-700"
                disabled={!rubrica.esActiva}
              >
                <Pencil className="size-2.5" />
                Editar
              </Button>

              {/* HU-04: Clone Version Dialog */}
              <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 gap-1 px-1.5 text-[9px] text-gray-500 hover:text-gray-700"
                  >
                    <Copy className="size-2.5" />
                    Clonar
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-sm" style={{ color: COLORS.dark }}>
                      Clonar Rúbrica como Nueva Versión
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 py-1">
                    <div
                      className="rounded-md border p-3 space-y-1.5"
                      style={{ backgroundColor: '#fefce8' }}
                    >
                      <p className="text-xs font-medium" style={{ color: '#92400e' }}>
                        Al clonar esta rúbrica:
                      </p>
                      <ul className="text-[11px] text-gray-600 list-disc list-inside space-y-0.5">
                        <li>Se creará una copia con versión <strong>v{version + 1}</strong></li>
                        <li>La original (<strong>v{version}</strong>) se marcará como <strong>Inactiva</strong></li>
                        <li>Las evaluaciones existentes mantienen la referencia a la versión original</li>
                        <li>Se abrirá el editor sobre la nueva versión</li>
                      </ul>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="clone-title" className="text-xs">Título de la nueva versión</Label>
                      <Input id="clone-title" defaultValue={rubrica.titulo} className="h-8 text-xs" />
                    </div>
                    <Separator />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setCloneDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs text-white"
                        style={{ backgroundColor: COLORS.primary }}
                        onClick={() => {
                          onClone(rubrica.id);
                          setCloneDialogOpen(false);
                        }}
                      >
                        <Copy className="size-3 mr-1" />
                        Clonar y Editar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {rubrica.esActiva && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 gap-1 px-1.5 text-[9px] text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="size-2.5" />
                  Eliminar
                </Button>
              )}
            </div>
          </div>

          {/* Expanded: criteria preview */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-1">
                  <Separator className="mb-1.5" />
                  <div className="flex items-center gap-3 text-[10px] text-gray-500 mb-1">
                    <span>
                      Creada: {formatDate(rubrica.createdAt)}
                    </span>
                    <span>
                      Actualizada: {formatDate(rubrica.updatedAt)}
                    </span>
                  </div>
                  {rubrica.criterios.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded border px-2 py-1"
                      style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}
                    >
                      <div className="flex items-center gap-1.5">
                        {c.esExcluyente && (
                          <span
                            className="inline-flex size-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: COLORS.danger }}
                            title="Excluyente (Gatekeeper)"
                          />
                        )}
                        <span className="text-[10px]" style={{ color: COLORS.dark }}>
                          {c.nombre}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[9px] h-3.5 px-1 font-mono">
                          {(c.ponderacion * 100).toFixed(0)}%
                        </Badge>
                        <Badge variant="secondary" className="text-[9px] h-3.5 px-1">
                          {c.tipo === 'ESTRUCTURAL' ? 'E' : 'C'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}

// ---------- Create / Edit Dialog ----------
function RubricaDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [title, setTitle] = useState('');
  const [criterios, setCriterios] = useState<CriterionForm[]>([
    createEmptyCriterion(),
  ]);

  const ponderacionSum = criterios.reduce((sum, c) => {
    const val = parseFloat(c.ponderacion);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const isPonderacionValid = Math.abs(ponderacionSum - 1.0) < 0.001;

  function addCriterion() {
    setCriterios((prev) => [...prev, createEmptyCriterion()]);
  }

  function removeCriterion(index: number) {
    setCriterios((prev) => prev.filter((_, i) => i !== index));
  }

  function updateCriterion(index: number, field: keyof CriterionForm, value: unknown) {
    setCriterios((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  }

  function updateDescriptor(
    critIndex: number,
    descIndex: number,
    field: 'etiqueta' | 'bulletPoints',
    value: string
  ) {
    setCriterios((prev) =>
      prev.map((c, i) => {
        if (i !== critIndex) return c;
        const newDescs = [...c.descriptores];
        newDescs[descIndex] = { ...newDescs[descIndex], [field]: value };
        return { ...c, descriptores: newDescs };
      })
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle style={{ color: COLORS.dark }}>
            Nueva Rúbrica
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title field */}
          <div className="space-y-1.5">
            <Label htmlFor="rubrica-title" className="text-xs">Título</Label>
            <Input
              id="rubrica-title"
              placeholder="Ej: Proyecto de Ingeniería de Software"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <Separator />

          {/* Criteria builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold" style={{ color: COLORS.dark }}>
                Criterios
              </h3>
              <Button
                type="button"
                size="sm"
                className="gap-1 text-white text-xs h-7"
                style={{ backgroundColor: COLORS.primary }}
                onClick={addCriterion}
              >
                <Plus className="size-3" />
                Agregar Criterio
              </Button>
            </div>

            {/* Ponderacion counter */}
            <div className="flex items-center gap-2 rounded-md border px-3 py-2">
              <span className="text-xs" style={{ color: COLORS.dark }}>
                Ponderaciones:
              </span>
              <span
                className="font-bold text-xs"
                style={{ color: isPonderacionValid ? COLORS.success : COLORS.danger }}
              >
                {ponderacionSum.toFixed(2)}
              </span>
              {isPonderacionValid ? (
                <Badge
                  className="border-0 text-[10px] h-4 px-1.5"
                  style={{ backgroundColor: COLORS.success, color: '#fff' }}
                >
                  ✓ Válido
                </Badge>
              ) : (
                <Badge
                  className="border-0 text-[10px] h-4 px-1.5"
                  style={{ backgroundColor: COLORS.danger, color: '#fff' }}
                >
                  Debe sumar 1.0
                </Badge>
              )}
            </div>

            {/* Criterion cards */}
            <AnimatePresence>
              {criterios.map((crit, critIdx) => (
                <motion.div
                  key={critIdx}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Collapsible
                    open={crit.descriptorsOpen}
                    onOpenChange={(open) =>
                      updateCriterion(critIdx, 'descriptorsOpen', open)
                    }
                  >
                    <div
                      className="rounded-lg border p-3 space-y-2"
                      style={{ backgroundColor: COLORS.card }}
                    >
                      {/* Criterion header row */}
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-2 size-3.5 text-muted-foreground shrink-0" />
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
                          {/* Nombre */}
                          <div className="sm:col-span-2 space-y-1">
                            <Label className="text-[10px]">Nombre</Label>
                            <Input
                              className="h-7 text-xs"
                              placeholder="Nombre del criterio"
                              value={crit.nombre}
                              onChange={(e) =>
                                updateCriterion(critIdx, 'nombre', e.target.value)
                              }
                            />
                          </div>

                          {/* Ponderación */}
                          <div className="space-y-1">
                            <Label className="text-[10px]">Ponderación</Label>
                            <Input
                              className="h-7 text-xs"
                              type="number"
                              step="0.05"
                              min="0"
                              max="1"
                              placeholder="0.25"
                              value={crit.ponderacion}
                              onChange={(e) =>
                                updateCriterion(critIdx, 'ponderacion', e.target.value)
                              }
                            />
                          </div>

                          {/* Tipo */}
                          <div className="space-y-1">
                            <Label className="text-[10px]">Tipo</Label>
                            <Select
                              value={crit.tipo}
                              onValueChange={(val) =>
                                updateCriterion(critIdx, 'tipo', val)
                              }
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ESTRUCTURAL">
                                  Estructural
                                </SelectItem>
                                <SelectItem value="COMPLEMENTARIO">
                                  Complementario
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 mt-4 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-6"
                            disabled={criterios.length <= 1}
                            onClick={() => removeCriterion(critIdx)}
                          >
                            <X className="size-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Excluyente toggle */}
                      <div className="flex items-center gap-2 ml-5">
                        <Switch
                          checked={crit.esExcluyente}
                          onCheckedChange={(val) =>
                            updateCriterion(critIdx, 'esExcluyente', val)
                          }
                        />
                        <Label className="text-[10px]" style={{ color: COLORS.dark }}>
                          Excluyente (Gatekeeper)
                        </Label>
                        {crit.esExcluyente && (
                          <Badge
                            className="border-0 text-[9px] h-4 px-1 ml-1"
                            style={{ backgroundColor: COLORS.danger, color: '#fff' }}
                          >
                            Gatekeeper
                          </Badge>
                        )}
                      </div>

                      {/* Descriptors toggle */}
                      <div className="ml-5">
                        <CollapsibleTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1 w-full justify-between h-6 text-[10px]"
                          >
                            <span>Descriptores (7 niveles)</span>
                            {crit.descriptorsOpen ? (
                              <ChevronUp className="size-3" />
                            ) : (
                              <ChevronDown className="size-3" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </div>

                      <CollapsibleContent>
                        <div className="ml-5 mt-2 space-y-2">
                          {crit.descriptores.map((desc, descIdx) => (
                            <div
                              key={desc.notaNivel}
                              className="rounded-md border p-2 space-y-1.5"
                              style={{
                                backgroundColor:
                                  desc.notaNivel >= 5
                                    ? '#f0fdf4'
                                    : desc.notaNivel >= 4
                                      ? '#fefce8'
                                      : '#fef2f2',
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Badge
                                  className="border-0 font-bold shrink-0 text-[10px] h-4 px-1.5"
                                  style={{
                                    backgroundColor:
                                      desc.notaNivel >= 5
                                        ? COLORS.success
                                        : desc.notaNivel >= 4
                                          ? COLORS.primary
                                          : COLORS.danger,
                                    color: '#fff',
                                  }}
                                >
                                  Nota {desc.notaNivel}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="space-y-0.5">
                                  <Label className="text-[9px]">Etiqueta</Label>
                                  <Input
                                    className="h-6 text-[11px]"
                                    placeholder="Ej: Excelente"
                                    value={desc.etiqueta}
                                    onChange={(e) =>
                                      updateDescriptor(
                                        critIdx,
                                        descIdx,
                                        'etiqueta',
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                                <div className="space-y-0.5">
                                  <Label className="text-[9px]">
                                    Bullet Points (separados por ;)
                                  </Label>
                                  <Input
                                    className="h-6 text-[11px]"
                                    placeholder="Ej: Código limpio; Modular"
                                    value={desc.bulletPoints}
                                    onChange={(e) =>
                                      updateDescriptor(
                                        critIdx,
                                        descIdx,
                                        'bulletPoints',
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <Separator />

          {/* Dialog actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs text-white"
              style={{ backgroundColor: COLORS.primary }}
              onClick={() => onOpenChange(false)}
            >
              Guardar Rúbrica
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Rúbricas View (iframe-style) ----------
export default function RubricasView({
  rol,
}: {
  rol: 'ADMINISTRADOR' | 'MANTENEDOR';
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

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
        {/* ===== HEADER BAR (40px) ===== */}
        <div
          className="flex items-center justify-between px-4 py-2 border-b"
          style={{ backgroundColor: '#f8f8f6', height: '40px' }}
        >
          {/* Left: Title with icon */}
          <div className="flex items-center gap-2">
            <FileText className="size-4" style={{ color: COLORS.primary }} />
            <span className="text-xs font-semibold" style={{ color: COLORS.dark }}>
              Gestión de Rúbricas
            </span>
          </div>

          {/* Center: Role badge */}
          <div className="flex items-center gap-2">
            <Badge
              className="text-[10px] h-5 px-2 border-0 font-semibold gap-1"
              style={{
                backgroundColor: rol === 'ADMINISTRADOR' ? '#fef3c7' : '#e0e7ff',
                color: rol === 'ADMINISTRADOR' ? '#92400e' : '#3730a3',
              }}
            >
              <Shield className="size-3" />
              {rol}
            </Badge>
          </div>

          {/* Right: Nueva Rúbrica button */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="h-7 text-[11px] text-white gap-1"
                style={{ backgroundColor: COLORS.primary }}
              >
                <Plus className="size-3" />
                Nueva Rúbrica
              </Button>
            </DialogTrigger>
            <RubricaDialog open={dialogOpen} onOpenChange={setDialogOpen} />
          </Dialog>
        </div>

        {/* ===== SCROLLABLE CONTENT AREA (~346px) ===== */}
        <ScrollArea style={{ height: '346px' }}>
          <div className="px-4 py-3 space-y-2">
            {mockRubricas.map((rubrica) => (
              <CompactRubricaCard
                key={rubrica.id}
                rubrica={rubrica}
                onClone={(id) => {
                  const r = mockRubricas.find((m) => m.id === id);
                  const v =
                    ((r?.metadata as Record<string, unknown>)?.version as number) ??
                    1;
                  alert(
                    `Rúbrica "${r?.titulo}" clonada como v${v + 1}. La versión original ahora es Inactiva. Se abrirá el editor.`
                  );
                }}
              />
            ))}
          </div>
        </ScrollArea>

        {/* ===== BOTTOM BAR (40px) ===== */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2 border-t bg-white"
          style={{ height: '40px' }}
        >
          {/* Left: Rubrica count */}
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[10px] h-5 px-2 font-medium"
              style={{ borderColor: COLORS.primary, color: COLORS.primary }}
            >
              {mockRubricas.length} rúbrica{mockRubricas.length !== 1 ? 's' : ''}
            </Badge>
            <span className="text-[10px] text-gray-400">
              {mockRubricas.filter((r) => r.esActiva).length} activa{mockRubricas.filter((r) => r.esActiva).length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Right: postMessage simulation */}
          <code className="text-[10px] text-gray-400 bg-gray-50 px-3 py-1 rounded">
            postMessage(&#123; type: &quot;evalua.rubrica.created&quot; &#125;)
          </code>
        </div>
      </div>
    </div>
  );
}
