# Estándares de Código — EvalUA v3.0

## TypeScript
- Usar **TypeScript estricto** (`strict: true` en tsconfig)
- NO usar `any`. Usar `unknown` y hacer type narrowing
- Preferir `interface` para contratos de objetos y `type` para uniones/intersecciones
- Usar `as const` para constantes de cadena que representan estados/roles
- Enums como objetos congelados, no como `enum` de TypeScript

```typescript
// CORRECTO
export const RolUsuario = {
  ADMINISTRADOR: 'ADMINISTRADOR',
  MANTENEDOR: 'MANTENEDOR',
  PROFESOR: 'PROFESOR',
  ALUMNO: 'ALUMNO',
} as const;

export type RolUsuario = (typeof RolUsuario)[keyof typeof RolUsuario];
```

## Nombres y Convenciones
- **Archivos:** `kebab-case` para todos los archivos (`crear-rubrica.ts`, `evaluacion-card.tsx`)
- **Componentes React:** `PascalCase` para nombres de componentes (`EvaluacionCard`)
- **Variables y funciones:** `camelCase`
- **Constantes globales:** `SCREAMING_SNAKE_CASE`
- **Interfaces de dominio:** Prefijo `I` solo si es necesario para desambiguar
- **Pruebas:** Sufijo `.test.ts` o `.spec.ts`

## Estructura de Imports
```typescript
// 1. Librerías externas
import { z } from 'zod';
import { useState } from 'react';

// 2. Dominio (capas internas)
import { Rubrica } from '@/domain/entities/rubrica';
import { EstadoEvaluacion } from '@/domain/value-objects/estado-evaluacion';

// 3. Aplicación
import { CrearRubricaUseCase } from '@/application/use-cases/crear-rubrica';

// 4. Infraestructura
import { RubricaRepository } from '@/infrastructure/persistence/rubrica.repository';

// 5. Presentación (UI)
import { Button } from '@/components/ui/button';
```

## Validación de Datos
- Usar **Zod** para toda validación de inputs en API routes y formularios
- Los schemas de Zod se definen en `infrastructure/` o en el archivo de la ruta API
- Los errores de validación se transforman a formato **RFC 7807**

```typescript
import { z } from 'zod';

export const crearRubricaSchema = z.object({
  nombre: z.string().min(3).max(200),
  criterios: z.array(criterioSchema).min(1),
}).refine(
  (data) => Math.abs(
    data.criterios.reduce((sum, c) => sum + c.ponderacion, 0) - 1.0
  ) < 0.001,
  { message: 'La suma de ponderaciones debe ser exactamente 1.0' }
);
```

## Manejo de Errores
- Errores de dominio: clases que extienden `Error` con código y mensaje
- Errores de API: formato RFC 7807 (`type`, `title`, `status`, `detail`, `code`)
- NUNCA exponer stack traces ni rutas internas en respuestas HTTP
- Usar try/catch en use-cases y transformar a respuestas HTTP apropiadas

```typescript
// domain/errors/rubrica-errors.ts
export class PonderacionInvalidaError extends Error {
  readonly code = 'RUBRICA_PONDERACION_INVALIDA';
  constructor(public readonly sumaActual: number) {
    super(`La suma de ponderaciones es ${sumaActual}, debe ser 1.0`);
  }
}
```

## Componentes React
- Componentes funcionales con hooks (NO class components)
- Desestructurar props en la firma de la función
- Separar lógica de presentación: custom hooks para lógica, componentes para UI
- Máximo 200 líneas por componente. Si excede, dividir en sub-componentes

```typescript
// CORRECTO
interface EvaluacionCardProps {
  evaluacion: Evaluacion;
  onVerDetalle: (id: string) => void;
}

export function EvaluacionCard({ evaluacion, onVerDetalle }: EvaluacionCardProps) {
  // ...
}
```

## CSS y Estilos
- Usar variables CSS corporativas de evalUA:
  ```css
  --color-evalUA1--: #EA7600;   /* Naranja Primario */
  --color-evalUA2--: #394049;   /* Gris Carbón */
  --color-evalUA4--: #9DD4D3;   /* Celeste Turquesa */
  --color-evalUA8--: #C8102E;   /* Rojo Peligro */
  --color-evalUA16--: #fffefd;  /* Blanco Cálido */
  --color-evalUA21--: #198754;  /* Verde Éxito */
  ```
- Tailwind CSS para utilidades, CSS vanilla para variables y temas
- NO usar estilos inline excepto para valores dinámicos

## Testing
- **Unit tests:** Vitest para dominio y lógica de negocio
- **Integration tests:** Vitest + mongodb-memory-server para repositorios
- **E2E:** Playwright para flujos de iframe
- Cobertura mínima objetivo: 80% en capa de dominio
- Cada feature file (.feature) debe tener sus step definitions correspondientes