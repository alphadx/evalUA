'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home as HomeIcon,
  LayoutDashboard,
  FileText,
  Wand2,
  BarChart3,
  Settings,
  Shield,
  ChevronDown,
  ExternalLink,
  Eye,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import OverviewView from '@/components/evalua/overview-view';
import DashboardView from '@/components/evalua/dashboard-view';
import RubricasView from '@/components/evalua/rubricas-view';
import WizardView from '@/components/evalua/wizard-view';
import ResultadosView from '@/components/evalua/resultados-view';
import ConfigurarView from '@/components/evalua/configurar-view';

// ---- Role system ----
type Role = 'ADMINISTRADOR' | 'MANTENEDOR' | 'PROFESOR' | 'ALUMNO';

const ROLES: { id: Role; label: string; color: string }[] = [
  { id: 'ADMINISTRADOR', label: 'Administrador', color: '#C8102E' },
  { id: 'MANTENEDOR', label: 'Mantenedor', color: '#EA7600' },
  { id: 'PROFESOR', label: 'Profesor', color: '#9DD4D3' },
  { id: 'ALUMNO', label: 'Alumno', color: '#198754' },
];

// ---- View system ----
type ViewId = 'overview' | 'dashboard' | 'rubricas' | 'configurar' | 'wizard' | 'resultados';

interface ViewConfig {
  id: ViewId;
  label: string;
  icon: React.ReactNode;
  description: string;
  allowedRoles: Role[];
  isIframe: boolean;
}

const views: ViewConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <HomeIcon className="size-4" />,
    description: 'Vista general del proyecto',
    allowedRoles: ['ADMINISTRADOR', 'MANTENEDOR', 'PROFESOR', 'ALUMNO'],
    isIframe: false,
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="size-4" />,
    description: 'Métricas del sistema (iframe)',
    allowedRoles: ['ADMINISTRADOR', 'MANTENEDOR'],
    isIframe: true,
  },
  {
    id: 'rubricas',
    label: 'Rúbricas',
    icon: <FileText className="size-4" />,
    description: 'CRUD de rúbricas (iframe)',
    allowedRoles: ['ADMINISTRADOR', 'MANTENEDOR'],
    isIframe: true,
  },
  {
    id: 'configurar',
    label: 'Configurar',
    icon: <Settings className="size-4" />,
    description: 'Parámetros del sistema (iframe)',
    allowedRoles: ['ADMINISTRADOR'],
    isIframe: true,
  },
  {
    id: 'wizard',
    label: 'Wizard',
    icon: <Wand2 className="size-4" />,
    description: 'Evaluación paso a paso (iframe)',
    allowedRoles: ['ADMINISTRADOR', 'MANTENEDOR', 'PROFESOR'],
    isIframe: true,
  },
  {
    id: 'resultados',
    label: 'Resultados',
    icon: <BarChart3 className="size-4" />,
    description: 'Resultado en solo lectura (iframe)',
    allowedRoles: ['ADMINISTRADOR', 'MANTENEDOR', 'PROFESOR', 'ALUMNO'],
    isIframe: true,
  },
];

// Colors
const COLORS = {
  primary: '#EA7600',
  dark: '#394049',
  danger: '#C8102E',
  success: '#198754',
};

export default function Home() {
  const [activeView, setActiveView] = useState<ViewId>('overview');
  const [activeRole, setActiveRole] = useState<Role>('ADMINISTRADOR');

  const currentView = views.find((v) => v.id === activeView)!;
  const roleInfo = ROLES.find((r) => r.id === activeRole)!;

  // Views accessible to the current role
  const accessibleViews = views.filter((v) => v.allowedRoles.includes(activeRole));

  const renderView = () => {
    switch (activeView) {
      case 'overview':
        return <OverviewView />;
      case 'dashboard':
        return <DashboardView rol={activeRole} />;
      case 'rubricas':
        return <RubricasView rol={activeRole} />;
      case 'configurar':
        return <ConfigurarView />;
      case 'wizard':
        return <WizardView />;
      case 'resultados':
        return <ResultadosView />;
    }
  };

  // Check if current view is accessible with current role
  const isViewAccessible = currentView.allowedRoles.includes(activeRole);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f9fafb' }}>
      {/* ===== Top Navigation Bar ===== */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{ backgroundColor: COLORS.dark }}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Logo + role selector */}
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setActiveView('overview')}
            >
              <div
                className="flex size-8 items-center justify-center rounded-md text-sm font-bold text-white"
                style={{ backgroundColor: COLORS.primary }}
              >
                E
              </div>
              <span className="text-lg font-semibold text-white hidden sm:inline">
                EvalUA <span className="text-sm font-normal opacity-70">v3.0</span>
              </span>
            </button>

            {/* Role selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 h-7 text-[11px] px-2 border border-white/20 text-white/90 hover:bg-white/10 hover:text-white"
                >
                  <Shield className="size-3" style={{ color: roleInfo.color }} />
                  <span>{roleInfo.label}</span>
                  <ChevronDown className="size-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Simular rol del JWT
                </div>
                {ROLES.map((role) => (
                  <DropdownMenuItem
                    key={role.id}
                    onClick={() => {
                      setActiveRole(role.id);
                      // If current view is not accessible with new role, go to overview
                      if (!views.find((v) => v.id === activeView)?.allowedRoles.includes(role.id)) {
                        setActiveView('overview');
                      }
                    }}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Shield className="size-3.5" style={{ color: role.color }} />
                    <span className="text-sm font-medium">{role.label}</span>
                    {activeRole === role.id && (
                      <Badge className="ml-auto text-[9px] h-4 px-1 border-0" style={{ backgroundColor: role.color, color: '#fff' }}>
                        activo
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Center: View tabs (only accessible views) */}
          <nav className="hidden md:flex items-center gap-1">
            {accessibleViews.map((view) => {
              const isActive = activeView === view.id;
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer"
                  style={{
                    backgroundColor: isActive ? 'rgba(234, 118, 0, 0.2)' : 'transparent',
                    color: isActive ? COLORS.primary : '#9ca3af',
                  }}
                >
                  {view.icon}
                  <span className="hidden lg:inline">{view.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Info + Mobile menu */}
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="hidden sm:flex text-[10px] border-gray-600 text-gray-400 gap-1"
            >
              <Eye className="size-2.5" />
              100% Iframe-Driven
            </Badge>

            {/* Mobile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden text-white hover:bg-white/10"
                >
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {accessibleViews.map((view) => (
                  <DropdownMenuItem
                    key={view.id}
                    onClick={() => setActiveView(view.id)}
                    className="flex items-center gap-3 py-2 cursor-pointer"
                  >
                    <span
                      className="flex size-6 items-center justify-center rounded-md text-xs"
                      style={{
                        backgroundColor: activeView === view.id ? COLORS.primary : '#f3f4f6',
                        color: activeView === view.id ? '#fff' : '#6b7280',
                      }}
                    >
                      {view.icon}
                    </span>
                    <span className="text-sm">{view.label}</span>
                    {activeView === view.id && (
                      <div
                        className="ml-auto size-2 rounded-full"
                        style={{ backgroundColor: COLORS.primary }}
                      />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <span className="hidden sm:inline text-xs text-gray-500">
              EvalUA
            </span>
          </div>
        </div>
      </header>

      {/* ===== Sub-header: Current view info ===== */}
      <div
        className="border-b"
        style={{ backgroundColor: '#fffefd' }}
      >
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span style={{ color: COLORS.primary }}>{currentView.icon}</span>
            <span className="text-sm font-semibold" style={{ color: COLORS.dark }}>
              {currentView.label}
            </span>
            <span className="text-xs text-gray-400">—</span>
            <span className="text-xs text-gray-500">{currentView.description}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Role badge for this view */}
            <Badge
              className="text-[10px] gap-1 border-0"
              style={{ backgroundColor: roleInfo.color + '20', color: roleInfo.color }}
            >
              <Shield className="size-2.5" />
              {roleInfo.label}
            </Badge>
            {/* Iframe indicator */}
            {currentView.isIframe && (
              <Badge
                variant="outline"
                className="text-[10px] gap-1"
                style={{ borderColor: COLORS.primary, color: COLORS.primary }}
              >
                <ExternalLink className="size-3" />
                Iframe 1029×466
              </Badge>
            )}
            {/* 403 notice */}
            {!isViewAccessible && (
              <Badge
                className="text-[10px] border-0"
                style={{ backgroundColor: '#fef2f2', color: COLORS.danger }}
              >
                403 Forbidden
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* ===== Main Content ===== */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {isViewAccessible ? renderView() : (
              <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-3">
                  <div
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                    style={{ backgroundColor: '#fef2f2' }}
                  >
                    <Shield className="size-8" style={{ color: COLORS.danger }} />
                  </div>
                  <h2 className="text-xl font-bold" style={{ color: COLORS.dark }}>
                    Acceso Denegado
                  </h2>
                  <p className="text-sm text-gray-500 max-w-md">
                    El rol <strong>{roleInfo.label}</strong> no tiene permiso para acceder a la vista <strong>{currentView.label}</strong>.
                    Cambia el rol en el selector superior o elige otra vista.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ===== Footer ===== */}
      <footer
        className="mt-auto border-t px-4 py-4"
        style={{ backgroundColor: COLORS.dark }}
      >
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} EvalUA v3.0
          </p>
          <div className="flex items-center gap-4">
            <span>DDD + MongoDB + Redis</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">100% Iframe-Driven · Zero-Knowledge</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
