# EvalUA v3.0 — Modelos de Datos

> **Motor:** MongoDB 7 (Mongoose 8)  
> **Patrón:** Documental DDD (agregados con subdocumentos embebidos)  
> **Cache:** Redis 7 (borradores + cache L2 de rúbricas)

---

## 1. Colecciones MongoDB

### 1.1 `rubricas`

Agregado raíz. Criterios y descriptores están embebidos como subdocumentos.

```json
{
  "_id": "550e8400-e29b-41d4-a716-446655440000",
  "rubricaGroupId": "550e8400-e29b-41d4-a716-446655440000",
  "version": 1,
  "parentRubricaId": null,
  "titulo": "Rúbrica Proyecto Final",
  "notaAprobacion": 4.0,
  "esActiva": true,
  "metadata": {
    "asignatura": "INF101",
    "semestre": "2026-1"
  },
  "criterios": [
    {
      "_id": "c1000000-0000-0000-0000-000000000001",
      "nombre": "Calidad del código",
      "ponderacion": 0.4,
      "tipo": "ESTRUCTURAL",
      "esExcluyente": false,
      "notaCorte": 4.0,
      "descripcion": "Evalúa la calidad general del código fuente",
      "minPalabras": 50,
      "maxPalabras": 500,
      "orden": 0,
      "descriptores": [
        {
          "notaNivel": 1,
          "etiqueta": "Deficiente",
          "bulletPoints": ["Código desordenado", "Sin convenciones"]
        },
        {
          "notaNivel": 4,
          "etiqueta": "Adecuado",
          "bulletPoints": ["Código limpio", "Buenas prácticas"]
        },
        {
          "notaNivel": 7,
          "etiqueta": "Excelente",
          "bulletPoints": ["Código ejemplar", "Patrones de diseño"]
        }
      ]
    },
    {
      "_id": "c1000000-0000-0000-0000-000000000002",
      "nombre": "Documentación",
      "ponderacion": 0.35,
      "tipo": "ESTRUCTURAL",
      "esExcluyente": false,
      "notaCorte": 4.0,
      "descripcion": null,
      "minPalabras": null,
      "maxPalabras": null,
      "orden": 1,
      "descriptores": []
    },
    {
      "_id": "c1000000-0000-0000-0000-000000000003",
      "nombre": "Bonus por innovación",
      "ponderacion": 0.0,
      "tipo": "COMPLEMENTARIO",
      "esExcluyente": false,
      "notaCorte": 4.0,
      "descripcion": "Criterio opcional que no afecta la nota",
      "minPalabras": null,
      "maxPalabras": null,
      "orden": 2,
      "descriptores": []
    }
  ],
  "createdAt": "2026-06-15T03:00:00.000Z",
  "updatedAt": "2026-06-15T03:00:00.000Z"
}
```

**Schema TypeScript:**

```typescript
interface RubricaDocument {
  _id: string;                    // UUID
  rubricaGroupId: string;         // Agrupa versiones de la misma rúbrica
  version: number;                // Versión incremental
  parentRubricaId: string | null; // UUID de la versión anterior
  titulo: string;                 // 1-300 chars
  notaAprobacion: number;         // 1.0-7.0, default 4.0
  esActiva: boolean;              // Solo una versión activa por grupo
  metadata: Record<string, unknown> | null;
  criterios: CriterioDocument[];
  createdAt: Date;
  updatedAt: Date;
}
```

**Índices recomendados:**

```javascript
db.rubricas.createIndex({ rubricaGroupId: 1, version: -1 })
db.rubricas.createIndex({ esActiva: 1, updatedAt: -1 })
db.rubricas.createIndex({ "metadata.asignatura": 1 })
```

**Reglas de negocio:**
- `_id` es un UUID v4 (no ObjectId de MongoDB)
- `rubricaGroupId` igual al `_id` en la primera versión
- `parentRubricaId` es null en la primera versión, apunta a `_id` de la versión anterior
- Solo una versión puede estar `esActiva: true` por `rubricaGroupId`
- Suma de `ponderacion` de criterios `ESTRUCTURAL` debe ser exactamente 1.0 (±0.001)
- `COMPLEMENTARIO` tiene ponderacion 0 y no afecta el cálculo

---

### 1.2 Subdocumento: Criterio

```typescript
interface CriterioDocument {
  _id: string;                        // UUID
  nombre: string;                     // 1-200 chars
  ponderacion: number;                // 0.0-1.0
  tipo: "ESTRUCTURAL" | "COMPLEMENTARIO";
  esExcluyente: boolean;              // true → aplica Gatekeeper
  notaCorte: number;                  // 1.0-7.0, default 4.0
  descripcion: string | null;         // max 500 chars
  minPalabras: number | null;         // validación observaciones
  maxPalabras: number | null;         // validación observaciones
  orden: number;                      // orden de presentación
  descriptores: DescriptorDocument[];
}
```

### 1.3 Subdocumento: Descriptor

```typescript
interface DescriptorDocument {
  notaNivel: number;        // entero 1-7
  etiqueta: string;         // 1-200 chars
  bulletPoints: string[];   // descripciones del nivel
}
```

**Reglas:**
- `notaNivel` debe ser entero entre 1 y 7
- Los descriptores sirven como guía visual para el evaluador
- No es obligatorio tener descriptores para todos los niveles (1-7)
- Se pueden tener 1, 3, 5, 7 descriptores o cualquier combinación

---

### 1.4 `evaluaciones`

Documento inmutable creado al finalizar una evaluación.

```json
{
  "_id": "660e8400-e29b-41d4-a716-446655440001",
  "rubricaId": "550e8400-e29b-41d4-a716-446655440000",
  "estado": "COMPLETADA",
  "notaFinal": 5.67,
  "observaciones": "Buen trabajo en general",
  "metadata": {
    "reglaAplicada": "NORMAL",
    "usuarioId": "profesor.001",
    "idempotencyKey": "uuid-de-idempotencia"
  },
  "puntajes": [
    {
      "criterioId": "c1000000-0000-0000-0000-000000000001",
      "notaAsignada": 6.0,
      "observaciones": "Código bien estructurado"
    },
    {
      "criterioId": "c1000000-0000-0000-0000-000000000002",
      "notaAsignada": 5.0,
      "observaciones": "Documentación aceptable"
    }
  ],
  "createdAt": "2026-06-15T03:30:00.000Z",
  "updatedAt": "2026-06-15T03:30:00.000Z"
}
```

**Schema TypeScript:**

```typescript
interface EvaluacionDocument {
  _id: string;                    // UUID (mismo que el borrador en Redis)
  rubricaId: string;              // UUID de la rúbrica usada
  estado: "COMPLETADA";           // Siempre COMPLETADA al persistirse
  notaFinal: number;              // 1.0-7.0, calculada por EvaluacionStrategy
  observaciones: string | null;
  metadata: {
    reglaAplicada: "NORMAL" | "GATEKEEPER";
    usuarioId: string | null;
    idempotencyKey: string | null;
  };
  puntajes: PuntajeDocument[];
  createdAt: Date;
  updatedAt: Date;
}
```

**Índices recomendados:**

```javascript
db.evaluaciones.createIndex({ rubricaId: 1 })
db.evaluaciones.createIndex({ "metadata.usuarioId": 1, createdAt: -1 })
db.evaluaciones.createIndex({ estado: 1 })
```

**Reglas de negocio:**
- Una evaluación `COMPLETADA` es **inmutable** (no se puede editar)
- `notaFinal` se calcula con `EvaluacionStrategy.calcular()`
- `reglaAplicada: "GATEKEEPER"` indica que un criterio excluyente falló
- `puntajes` solo incluye criterios ESTRUCTURALES calificados
- El `_id` es el mismo UUID que tenía el borrador en Redis

---

### 1.5 Subdocumento: Puntaje

```typescript
interface PuntajeDocument {
  criterioId: string;           // UUID del criterio
  notaAsignada: number;         // 1.0-7.0
  observaciones: string | null; // texto libre del evaluador
}
```

---

### 1.6 `configuraciones`

Parámetros del sistema.

```json
{
  "_id": "config-001",
  "clave": "exigencia_default",
  "valor": "0.6"
}
```

**Schema TypeScript:**

```typescript
interface ConfiguracionDocument {
  _id: string;
  clave: string;    // nombre del parámetro
  valor: string;    // valor como string (parsear según clave)
}
```

---

## 2. Estructuras Redis

### 2.1 Borradores de Evaluación

**Key pattern:** `draft:{evaluacionId}`  
**TTL:** 30 días (2,592,000 segundos)

```json
{
  "evaluacionId": "660e8400-e29b-41d4-a716-446655440001",
  "rubricaId": "550e8400-e29b-41d4-a716-446655440000",
  "usuarioId": "profesor.001",
  "estado": "EN_PROGRESO",
  "observaciones": "Evaluación en curso",
  "puntajes": [
    {
      "criterioId": "c1000000-0000-0000-0000-000000000001",
      "notaAsignada": 6.0,
      "observaciones": "Código bien estructurado"
    }
  ],
  "ultimaModificacion": "2026-06-15T03:15:00.000Z"
}
```

**Estados posibles del borrador:**

| Estado | Descripción |
|--------|-------------|
| `EN_PROGRESO` | Evaluación en curso, auto-save activo |
| `EN_REVISION` | Evaluación lista para calcular (bloquea auto-save) |

**Transición de estados:**
```
[creación] → EN_PROGRESO → EN_REVISION → [POST /calcular] → COMPLETADA (MongoDB)
                  ↑              │
                  └──────────────┘  (si el usuario vuelve a editar)
```

### 2.2 Cache L2 de Rúbricas

**Key pattern:** `rubrica:{rubricaId}`  
**TTL:** Sin TTL explícito (se invalida al actualizar/eliminar)

Cache-aside pattern:
1. Lectura: Redis → si miss, MongoDB → repoblar Redis
2. Escritura: MongoDB → invalidar Redis key
3. Eliminación: MongoDB → invalidar Redis key

---

## 3. Diagrama ER (Relaciones Conceptuales)

```
┌─────────────────────────────────────────────────────────────┐
│                        MongoDB                               │
│                                                              │
│  ┌──────────────────────────────┐                           │
│  │         rubricas             │                           │
│  │  ┌────────────────────────┐  │                           │
│  │  │ _id (UUID)             │  │                           │
│  │  │ rubricaGroupId (UUID)  │◀─┼── Agrupa versiones       │
│  │  │ version (int)          │  │                           │
│  │  │ parentRubricaId (UUID) │──┼──▶ Version anterior       │
│  │  │ titulo                 │  │                           │
│  │  │ notaAprobacion         │  │                           │
│  │  │ esActiva               │  │                           │
│  │  │ metadata               │  │                           │
│  │  │                        │  │                           │
│  │  │ criterios[]            │  │  ┌─────────────────────┐ │
│  │  │  ├─ _id (UUID)         │  │  │  descriptores[]     │ │
│  │  │  ├─ nombre             │  │  │  ├─ notaNivel (1-7) │ │
│  │  │  ├─ ponderacion        │  │  │  ├─ etiqueta        │ │
│  │  │  ├─ tipo               │  │  │  └─ bulletPoints[]  │ │
│  │  │  ├─ esExcluyente       │  │  └─────────────────────┘ │
│  │  │  ├─ notaCorte          │  │                           │
│  │  │  └─ descriptores[] ────┼──┼──┘                       │
│  │  └────────────────────────┘  │                           │
│  └──────────────┬───────────────┘                           │
│                 │ rubricaId                                  │
│                 ▼                                            │
│  ┌──────────────────────────────┐                           │
│  │       evaluaciones           │                           │
│  │  ┌────────────────────────┐  │                           │
│  │  │ _id (UUID)             │  │                           │
│  │  │ rubricaId (UUID)       │──┼──▶ Rubrica usada          │
│  │  │ estado = "COMPLETADA"  │  │                           │
│  │  │ notaFinal (1.0-7.0)    │  │                           │
│  │  │ observaciones          │  │                           │
│  │  │ metadata               │  │                           │
│  │  │  ├─ reglaAplicada      │  │                           │
│  │  │  ├─ usuarioId          │  │                           │
│  │  │  └─ idempotencyKey     │  │                           │
│  │  │                        │  │                           │
│  │  │ puntajes[]             │  │  ┌─────────────────────┐ │
│  │  │  ├─ criterioId (UUID)  │  │  │  Referencia al      │ │
│  │  │  ├─ notaAsignada       │  │  │  criterio de la     │ │
│  │  │  └─ observaciones      │  │  │  rubrica            │ │
│  │  └────────────────────────┘  │  └─────────────────────┘ │
│  └──────────────────────────────┘                           │
│                                                              │
│  ┌──────────────────────────────┐                           │
│  │      configuraciones         │                           │
│  │  ├─ clave (string)           │                           │
│  │  └─ valor (string)           │                           │
│  └──────────────────────────────┘                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        Redis                                 │
│                                                              │
│  draft:{evaluacionId}      TTL: 30 días                     │
│  ├─ evaluacionId                                            │
│  ├─ rubricaId                                               │
│  ├─ usuarioId                                               │
│  ├─ estado: "EN_PROGRESO" | "EN_REVISION"                   │
│  ├─ observaciones                                           │
│  ├─ puntajes[]                                              │
│  └─ ultimaModificacion                                      │
│                                                              │
│  rubrica:{rubricaId}        Cache L2 (sin TTL, invalidado)  │
│  └─ [Documento completo de la rúbrica]                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Fórmula de Cálculo de Nota

### Paso 1: Gatekeeper (Exclusión)

```
PARA CADA criterio DONDE esExcluyente = true:
  SI puntaje.notaAsignada < criterio.notaCorte:
    RETORNAR Nota(1.0)   ← FÓRMULA DETENIDA
```

### Paso 2: Logro Ponderado

```
logroPonderado = 0

PARA CADA criterio DONDE tipo = "ESTRUCTURAL":
  logroCriterio = (notaAsignada - 1.0) / 6.0
  logroPonderado += logroCriterio × ponderacion
```

### Paso 3: Conversión a Escala 1.0-7.0

```
E = exigencia (default 0.6)

SI logroPonderado < E:
  notaFinal = 1.0 + 3.0 × (logroPonderado / E)
  // Rango: [1.0, 4.0)

SI logroPonderado ≥ E:
  notaFinal = 4.0 + 3.0 × ((logroPonderado - E) / (1.0 - E))
  // Rango: [4.0, 7.0]
```

### Ejemplo numérico

```
Rúbrica con 2 criterios estructurales:
  - "Contenido": ponderacion 0.6, nota asignada 5.0
  - "Forma": ponderacion 0.4, nota asignada 6.0

Paso 2:
  logro_contenido = (5.0 - 1.0) / 6.0 = 0.667
  logro_forma = (6.0 - 1.0) / 6.0 = 0.833
  logroPonderado = (0.667 × 0.6) + (0.833 × 0.4) = 0.400 + 0.333 = 0.733

Paso 3:
  0.733 ≥ 0.6 (exigencia)
  notaFinal = 4.0 + 3.0 × ((0.733 - 0.6) / (1.0 - 0.6))
  notaFinal = 4.0 + 3.0 × (0.133 / 0.4)
  notaFinal = 4.0 + 3.0 × 0.333
  notaFinal = 4.0 + 1.0 = 5.0

Resultado: Nota 5.0 → APROBADA (≥ 4.0)
```

### Ejemplo con Gatekeeper

```
Misma rúbrica, pero "Contenido" es excluyente (notaCorte = 4.0)
y recibe nota asignada 3.0

Paso 1:
  "Contenido" es excluyente y 3.0 < 4.0
  → RETORNAR 1.0 (sin calcular nada más)

Resultado: Nota 1.0 → REPROBADA
```

---

## 5. Tipos TypeScript del Dominio

```typescript
// Value Objects
type RubricaId = string & { readonly __brand: "RubricaId" };
type CriterioId = string & { readonly __brand: "CriterioId" };
type EvaluacionId = string & { readonly __brand: "EvaluacionId" };

// Enums como const objects
const TipoCriterio = {
  ESTRUCTURAL: "ESTRUCTURAL",
  COMPLEMENTARIO: "COMPLEMENTARIO",
} as const;
type TipoCriterio = (typeof TipoCriterio)[keyof typeof TipoCriterio];

const EstadoEvaluacion = {
  EN_PROGRESO: "EN_PROGRESO",
  EN_REVISION: "EN_REVISION",
  COMPLETADA: "COMPLETADA",
} as const;
type EstadoEvaluacion = (typeof EstadoEvaluacion)[keyof typeof EstadoEvaluacion];

const Rol = {
  ADMINISTRADOR: "ADMINISTRADOR",
  MANTENEDOR: "MANTENEDOR",
  PROFESOR: "PROFESOR",
  ALUMNO: "ALUMNO",
} as const;
type Rol = (typeof Rol)[keyof typeof Rol];

// Nota value object
interface Nota {
  readonly valor: number; // 1.0-7.0
  esAprobatoria(): boolean; // valor >= 4.0
}
```

---

## 6. Convenciones de Datos

| Convención | Ejemplo | Notas |
|-----------|---------|-------|
| IDs | UUID v4 | `crypto.randomUUID()` |
| Fechas | ISO 8601 UTC | `2026-06-15T03:00:00.000Z` |
| Notas | float 1.0-7.0 | 2 decimales máximo |
| Ponderaciones | float 0.0-1.0 | 3 decimales máximo |
| Strings vacíos | `null` | No usar `""`, preferir `null` |
| Booleanos | `true`/`false` | No usar `0`/`1` |
| Enums | strings | `"ESTRUCTURAL"`, no `0`/`1` |