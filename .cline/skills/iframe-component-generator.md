# Skill: Iframe Component Generator

## Propósito
Generar componentes React optimizados para el viewport de iframe de EvalUA (1029×466px).

## Instrucciones
Cuando el usuario solicite crear una vista o componente que se renderice dentro del iframe:

### Restricciones de Viewport
- **Ancho máximo:** 1029px
- **Alto máximo:** 466px
- **Scroll:** SOLO local (ScrollArea de shadcn/ui), NUNCA scroll global del documento
- **Layout:** Una columna vertical (no sidebar, no grid multi-columna amplio)
- **Tipografía:** Compacta, sin márgenes excesivos

### Plantilla de Componente Embed
```tsx
// src/presentation/components/[nombre]-embed.tsx
'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

interface NombreEmbedProps {
  // Props del componente
}

export function NombreEmbed({ ...props }: NombreEmbedProps) {
  return (
    <div className="h-[466px] w-[1029px] overflow-hidden">
      <ScrollArea className="h-full w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="p-4 space-y-4"
        >
          {/* Contenido del componente */}
        </motion.div>
      </ScrollArea>
    </div>
  );
}
```

### Reglas de Diseño
- Usar `h-[466px] w-[1029px]` como dimensiones del contenedor raíz
- SIEMPRE envolver contenido en `ScrollArea` de shadcn/ui
- Usar `overflow-hidden` en el contenedor raíz para evitar scrollbars externos
- Framer Motion para transiciones entre pasos del wizard
- Espaciado compacto: `p-4` o `p-3`, NO `p-8` o `p-10`
- Tarjetas con `bg-[var(--color-evalUA16--)]` y sombra mínima
- Botones primarios con `bg-[var(--color-evalUA1--)]` (naranja)
- Alertas de exclusión con `bg-[var(--color-evalUA8--)]` (rojo)
- Estados de éxito con `bg-[var(--color-evalUA21--)]` (verde)

### Wizard Steps
Para el wizard de evaluación (embed/evaluar):
```tsx
// Usar un estado de paso actual
const [currentStep, setCurrentStep] = useState(0);

// AnimatePresence para transiciones entre pasos
<AnimatePresence mode="wait">
  <motion.div
    key={currentStep}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.15 }}
  >
    {/* Contenido del paso actual */}
  </motion.div>
</AnimatePresence>
```

### Ejemplo de Uso
Usuario: "Crear vista de resultado para alumno"
→ Generar componente con viewport fijo 1029×466, ScrollArea, y layout compacto para mostrar evaluación completada en modo solo lectura