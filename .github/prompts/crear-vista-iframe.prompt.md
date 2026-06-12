---
mode: agent
description: "Crear una vista embebida para iframe 1029×466px"
---

# Prompt: Crear Vista Iframe

Crea una nueva vista embebida para EvalUA optimizada para el viewport de iframe (1029×466px).

## Contexto
- Todas las vistas se renderizan en iframes de 1029×466px
- NO existe navegación independiente
- Usar ScrollArea de shadcn/ui para scroll local
- Framer Motion para transiciones
- Paleta de colores corporativa evalUA

## Instrucciones
1. Crear el componente en `src/presentation/components/[nombre]-embed.tsx`
2. Usar `'use client'` para componentes con interactividad
3. Envolver contenido en `ScrollArea` con dimensiones fijas
4. Usar Framer Motion para animaciones de entrada/salida
5. Crear la ruta en `src/app/embed/[nombre]/page.tsx`
6. Crear custom hook en `src/presentation/hooks/use-[nombre].ts` si necesita lógica de estado

## Dimensiones Obligatorias
- Contenedor raíz: `h-[466px] w-[1029px] overflow-hidden`
- Espaciado compacto: `p-4` o `p-3`
- Sin márgenes excesivos

## Paleta de Colores
- Botones primarios: `bg-[var(--color-evalUA1--)]` (#EA7600)
- Texto: `text-[var(--color-evalUA2--)]` (#394049)
- Seleccionado: `bg-[var(--color-evalUA4--)]` (#9DD4D3)
- Peligro: `bg-[var(--color-evalUA8--)]` (#C8102E)
- Fondo tarjetas: `bg-[var(--color-evalUA16--)]` (#fffefd)
- Éxito: `bg-[var(--color-evalUA21--)]` (#198754)
