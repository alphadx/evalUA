'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  FileText,
  Clock,
  CheckCircle,
  Shield,
  Activity,
  Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import {
  mockEvaluaciones,
  mockRubricas,
  getRubricaTitle,
  formatDate,
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

interface DashboardViewProps {
  rol: 'ADMINISTRADOR' | 'MANTENEDOR';
}

// ---------- Compact Metric Card ----------
function CompactMetricCard({
  title,
  value,
  icon,
  accentColor,
  subtitle,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  accentColor: string;
  subtitle?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3 rounded-md border px-3 py-2.5"
      style={{ backgroundColor: COLORS.card, borderColor: '#e5e7eb' }}
    >
      {/* Accent strip */}
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-md"
        style={{
          width: '34px',
          height: '34px',
          backgroundColor: `${accentColor}18`,
          color: accentColor,
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-gray-500 leading-tight">{title}</p>
        <p className="text-lg font-bold leading-tight" style={{ color: COLORS.dark }}>
          {value}
        </p>
        {subtitle && (
          <p className="text-[9px] text-gray-400 leading-tight mt-0.5">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}

// ---------- Status Badge (compact) ----------
function CompactStatusBadge({ estado }: { estado: string }) {
  if (estado === 'COMPLETADA') {
    return (
      <Badge
        className="text-[9px] h-4 px-1.5 border-0 font-semibold"
        style={{ backgroundColor: '#ecfdf5', color: COLORS.success }}
      >
        COMPLETADA
      </Badge>
    );
  }
  return (
    <Badge
      className="text-[9px] h-4 px-1.5 border-0 font-semibold"
      style={{ backgroundColor: '#fff7ed', color: COLORS.primary }}
    >
      EN CURSO
    </Badge>
  );
}

// ---------- Note Badge (compact) ----------
function CompactNoteBadge({ nota }: { nota: number | null }) {
  if (nota === null) return <span className="text-[10px] text-gray-300">—</span>;
  const passing = nota >= 4.0;
  return (
    <Badge
      variant="outline"
      className="text-[10px] font-bold h-4 px-1.5"
      style={{
        borderColor: passing ? COLORS.success : COLORS.danger,
        color: passing ? COLORS.success : COLORS.danger,
      }}
    >
      {nota.toFixed(1)}
    </Badge>
  );
}

// ---------- Dashboard View ----------
export default function DashboardView({ rol }: DashboardViewProps) {
  // Compute metrics from mock data
  const rubricasCount = mockRubricas.length;
  const enProgreso = mockEvaluaciones.filter(
    (e) => e.estado === 'EN_PROGRESO'
  ).length;
  const completadas = mockEvaluaciones.filter(
    (e) => e.estado === 'COMPLETADA'
  ).length;

  const aprobadas = useMemo(
    () =>
      mockEvaluaciones.filter(
        (e) => e.estado === 'COMPLETADA' && (e.notaFinal ?? 0) >= 4.0
      ).length,
    []
  );

  const reprobadas = useMemo(
    () =>
      mockEvaluaciones.filter(
        (e) => e.estado === 'COMPLETADA' && (e.notaFinal ?? 0) < 4.0
      ).length,
    []
  );

  const promedioNotas = useMemo(() => {
    const conNota = mockEvaluaciones.filter(
      (e) => e.notaFinal !== null && e.estado === 'COMPLETADA'
    );
    if (conNota.length === 0) return 0;
    const sum = conNota.reduce((acc, e) => acc + (e.notaFinal ?? 0), 0);
    return Math.round((sum / conNota.length) * 100) / 100;
  }, []);

  const now = new Date();

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
          {/* Left: Title and icon */}
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4" style={{ color: COLORS.primary }} />
            <span className="text-xs font-bold" style={{ color: COLORS.dark }}>
              Dashboard de Métricas
            </span>
            <Separator orientation="vertical" className="h-4" />
            {/* Role badge */}
            <Badge
              className="text-[9px] h-4 px-1.5 border-0 font-semibold"
              style={{
                backgroundColor:
                  rol === 'ADMINISTRADOR' ? '#fef3c7' : '#e0f2fe',
                color:
                  rol === 'ADMINISTRADOR' ? '#92400e' : '#075985',
              }}
            >
              <Shield className="size-2.5 mr-0.5" />
              {rol}
            </Badge>
          </div>

          {/* Right: JWT simulation info */}
          <div className="flex items-center gap-2">
            <code
              className="text-[9px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-mono"
            >
              JWT: &#123; sub: &quot;{rol === 'ADMINISTRADOR' ? 'admin.ua' : 'mant.ua'}&quot;, rol: &quot;{rol}&quot; &#125;
            </code>
            <Lock className="size-3 text-gray-300" />
          </div>
        </div>

        {/* ===== CONTENT AREA (ScrollArea ~346px) ===== */}
        <ScrollArea style={{ height: '346px' }}>
          <div className="px-4 py-3 space-y-3">
            {/* Mantenedor notice */}
            {rol === 'MANTENEDOR' && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-md border px-3 py-1.5"
                style={{
                  backgroundColor: '#eff6ff',
                  borderColor: '#bfdbfe',
                }}
              >
                <Shield className="size-3.5" style={{ color: '#3b82f6' }} />
                <span className="text-[10px]" style={{ color: '#1e40af' }}>
                  Solo visualiza métricas de sus propias rúbricas
                </span>
              </motion.div>
            )}

            {/* ---- Metric Cards Row (3 in a row) ---- */}
            <div className="grid grid-cols-3 gap-2.5">
              <CompactMetricCard
                title="Rúbricas Creadas"
                value={rubricasCount}
                icon={<FileText className="size-4" />}
                accentColor={COLORS.primary}
                subtitle={
                  rol === 'MANTENEDOR'
                    ? 'Solo las suyas'
                    : `${mockRubricas.filter((r) => r.esActiva).length} activas`
                }
              />
              <CompactMetricCard
                title="En Progreso"
                value={enProgreso}
                icon={<Clock className="size-4" />}
                accentColor={COLORS.selected}
                subtitle="Evaluaciones abiertas"
              />
              <CompactMetricCard
                title="Completadas"
                value={completadas}
                icon={<CheckCircle className="size-4" />}
                accentColor={COLORS.success}
                subtitle={`${aprobadas} aprobadas · ${reprobadas} reprobadas`}
              />
            </div>

            {/* ---- Secondary metrics row ---- */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500">Promedio General:</span>
                <Badge
                  className="text-[10px] font-bold h-4 px-1.5 border-0"
                  style={{
                    backgroundColor:
                      promedioNotas >= 4.0 ? '#ecfdf5' : '#fef2f2',
                    color: promedioNotas >= 4.0 ? COLORS.success : COLORS.danger,
                  }}
                >
                  {promedioNotas.toFixed(2)}
                </Badge>
              </div>
              <Separator orientation="vertical" className="h-3" />
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500">Tasa Aprobación:</span>
                <Badge
                  variant="outline"
                  className="text-[10px] font-medium h-4 px-1.5"
                  style={{ borderColor: COLORS.primary, color: COLORS.primary }}
                >
                  {completadas > 0
                    ? Math.round((aprobadas / completadas) * 100)
                    : 0}
                  %
                </Badge>
              </div>
              <Separator orientation="vertical" className="h-3" />
              <div className="flex items-center gap-1.5">
                <Activity className="size-3 text-gray-400" />
                <span className="text-[10px] text-gray-500">
                  Total evaluaciones: {mockEvaluaciones.length}
                </span>
              </div>
            </div>

            {/* ---- Recent Evaluations Table (compact) ---- */}
            <div className="rounded-md border" style={{ borderColor: '#e5e7eb' }}>
              {/* Table header */}
              <div
                className="flex items-center px-3 py-1.5 border-b"
                style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}
              >
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: COLORS.dark }}
                >
                  Evaluaciones Recientes
                </span>
              </div>

              {/* Table header row */}
              <div
                className="grid grid-cols-[60px_1fr_70px_100px_90px] gap-1 px-3 py-1 border-b text-[9px] font-semibold text-gray-500 uppercase tracking-wider"
                style={{ borderColor: '#f3f4f6' }}
              >
                <span>ID</span>
                <span>Rúbrica</span>
                <span>Nota</span>
                <span>Fecha</span>
                <span>Estado</span>
              </div>

              {/* Table rows */}
              <div className="max-h-[152px] overflow-y-auto">
                {mockEvaluaciones.map((evalItem, idx) => (
                  <motion.div
                    key={evalItem.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="grid grid-cols-[60px_1fr_70px_100px_90px] gap-1 px-3 py-1.5 border-b last:border-b-0 items-center hover:bg-gray-50 transition-colors"
                    style={{ borderColor: '#f9fafb' }}
                  >
                    <span className="text-[10px] font-mono text-gray-500">
                      {evalItem.id.slice(-4)}
                    </span>
                    <span className="text-[10px] truncate" style={{ color: COLORS.dark }}>
                      {getRubricaTitle(evalItem.rubricaId)}
                    </span>
                    <CompactNoteBadge nota={evalItem.notaFinal} />
                    <span className="text-[10px] text-gray-400">
                      {formatDate(evalItem.createdAt)}
                    </span>
                    <CompactStatusBadge estado={evalItem.estado} />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* ===== BOTTOM BAR (40px) ===== */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2 border-t bg-white"
          style={{ height: '40px' }}
        >
          {/* Left: Read-only or real-time label */}
          <div className="flex items-center gap-2">
            {rol === 'MANTENEDOR' ? (
              <>
                <Lock className="size-3 text-gray-400" />
                <span className="text-[10px] text-gray-400">
                  Solo lectura — Métricas de sus rúbricas
                </span>
              </>
            ) : (
              <>
                <Activity className="size-3" style={{ color: COLORS.success }} />
                <span className="text-[10px]" style={{ color: COLORS.success }}>
                  Métricas en tiempo real
                </span>
              </>
            )}
          </div>

          {/* Right: Timestamp */}
          <div className="flex items-center gap-1.5">
            <Clock className="size-3 text-gray-300" />
            <span className="text-[10px] text-gray-400">
              Actualizado: {now.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })} {now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
