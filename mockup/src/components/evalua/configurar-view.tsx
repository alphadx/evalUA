'use client';

import { useState, useCallback } from 'react';
import { Settings, Lock, AlertTriangle, Save, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

// evalUA color palette
const COLORS = {
  primary: '#EA7600',
  dark: '#394049',
  danger: '#C8102E',
  card: '#fffefd',
  success: '#198754',
};

// Configuration item type
interface ConfigItem {
  key: string;
  value: string;
  description: string;
}

// Mock configuration items
const INITIAL_CONFIG: ConfigItem[] = [
  {
    key: 'TTL_BORRADORES_DIAS',
    value: '30',
    description: 'Días de vida de borradores en Redis',
  },
  {
    key: 'TTL_CACHE_RUBRICA_HORAS',
    value: '24',
    description: 'Horas de caché L2 para rúbricas en Redis',
  },
  {
    key: 'MAX_CRITERIOS',
    value: '10',
    description: 'Máximo de criterios por rúbrica',
  },
  {
    key: 'NOTA_MINIMA_APROBACION',
    value: '4.0',
    description: 'Nota mínima para aprobar (escala 1-7)',
  },
  {
    key: 'GATEKEEPER_NOTA_CORTE',
    value: '4.0',
    description: 'Nota de corte para criterios excluyentes',
  },
  {
    key: 'EXPIRACION_JWT_MINUTOS',
    value: '5',
    description: 'Minutos de expiración del JWT de lanzamiento',
  },
];

export default function ConfigurarView() {
  const [configItems, setConfigItems] = useState<ConfigItem[]>(
    INITIAL_CONFIG.map((item) => ({ ...item }))
  );
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());

  const handleValueChange = useCallback((index: number, newValue: string) => {
    setConfigItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], value: newValue };
      return next;
    });
    // Remove saved indicator when value changes
    setSavedItems((prev) => {
      const next = new Set(prev);
      next.delete(configItems[index].key);
      return next;
    });
  }, [configItems]);

  const handleSave = useCallback((index: number) => {
    // Mark as saved temporarily
    const key = configItems[index].key;
    setSavedItems((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    // Remove "Guardado" indicator after 2 seconds
    setTimeout(() => {
      setSavedItems((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 2000);
  }, [configItems]);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Outer label */}
      <p className="text-xs text-gray-400 font-mono">
        Simulación de Iframe — 1029 × 466 px
      </p>

      {/* Iframe simulation container */}
      <div
        className="relative border border-gray-200 shadow-md overflow-hidden bg-white flex flex-col"
        style={{ width: '1029px', height: '466px', maxWidth: '100%' }}
      >
        {/* ===== HEADER BAR (40px) ===== */}
        <div
          className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0"
          style={{ backgroundColor: '#f8f8f6', height: '40px' }}
        >
          <div className="flex items-center gap-2">
            <Settings className="size-4" style={{ color: COLORS.primary }} />
            <span className="text-xs font-semibold" style={{ color: COLORS.dark }}>
              Configuración del Sistema
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className="text-[10px] h-5 px-2 border-0 font-semibold"
              style={{ backgroundColor: '#fef2f2', color: COLORS.danger }}
            >
              ADMINISTRADOR
            </Badge>
            <Lock className="size-3.5 text-gray-400" />
          </div>
        </div>

        {/* ===== CONTENT AREA (ScrollArea, ~346px) ===== */}
        <ScrollArea style={{ height: '346px' }}>
          <div className="px-4 py-3 space-y-3">
            {/* Warning banner */}
            <div
              className="flex items-start gap-2 rounded-md border px-3 py-2"
              style={{
                backgroundColor: '#fffbeb',
                borderColor: '#fde68a',
              }}
            >
              <AlertTriangle className="size-3.5 mt-0.5 flex-shrink-0" style={{ color: '#b45309' }} />
              <span className="text-[11px] leading-tight" style={{ color: '#92400e' }}>
                Los cambios en estos parámetros afectan el comportamiento global del micro-frontend.
              </span>
            </div>

            {/* Configuration items list */}
            <div className="space-y-0">
              {configItems.map((item, idx) => (
                <div key={item.key}>
                  <div className="flex items-center gap-3 py-2.5">
                    {/* Key name */}
                    <div className="w-52 flex-shrink-0">
                      <Label
                        className="text-[11px] font-mono font-semibold leading-tight"
                        style={{ color: COLORS.dark }}
                      >
                        {item.key}
                      </Label>
                      <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
                        {item.description}
                      </p>
                    </div>

                    {/* Separator visual */}
                    <Separator orientation="vertical" className="h-6" />

                    {/* Value input */}
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={item.value}
                        onChange={(e) => handleValueChange(idx, e.target.value)}
                        className="h-7 text-xs font-mono w-32"
                        style={{
                          borderColor: savedItems.has(item.key) ? COLORS.success : undefined,
                        }}
                      />
                      <Button
                        size="sm"
                        className="h-7 text-[10px] text-white gap-1 flex-shrink-0"
                        style={{ backgroundColor: COLORS.primary }}
                        onClick={() => handleSave(idx)}
                      >
                        <Save className="size-3" />
                        Guardar
                      </Button>
                      {/* Saved indicator */}
                      {savedItems.has(item.key) && (
                        <span
                          className="text-[10px] font-semibold flex items-center gap-0.5"
                          style={{ color: COLORS.success }}
                        >
                          <Check className="size-3" />
                          Guardado
                        </span>
                      )}
                    </div>
                  </div>
                  {idx < configItems.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* ===== BOTTOM BAR (40px) ===== */}
        <div
          className="mt-auto flex items-center justify-between px-4 py-2 border-t bg-white flex-shrink-0"
          style={{ height: '40px' }}
        >
          <div className="flex items-center gap-1.5">
            <Lock className="size-3 text-gray-400" />
            <span className="text-[10px] text-gray-400">
              Solo Administrador
            </span>
          </div>
          <code className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
            postMessage: evalua.config.updated
          </code>
        </div>
      </div>
    </div>
  );
}
