# EvalUA v3.0 — Referencia de la API REST

> **Base URL:** `http://localhost:3000/api`  
> **Autenticación:** Bearer JWT HS256 en header `Authorization` (excepto `/api/embed/launch`)  
> **Content-Type:** `application/json`  
> **Formato de errores:** RFC 7807

---

## Tabla de Contenidos

- [Autenticación](#autenticación)
- [Embed / Launch](#1-post-embedlaunch)
- [Rúbricas](#2-get-rubricas)
- [Evaluaciones](#5-post-evaluacionesidcalcular)
- [Dashboard](#6-get-dashboardmetricas)
- [Configuración](#7-get-configuracion)
- [Schemas Zod](#schemas-zod-de-validación)
- [Errores RFC 7807](#formato-de-errores)

---

## Autenticación

Todos los endpoints (excepto `POST /api/embed/launch`) requieren:

```
Authorization: Bearer <JWT_TOKEN>
```

El JWT debe ser válido, no expirado, y contener los claims requeridos. Ver [jwt-claims.md](./jwt-claims.md) para la especificación completa.

**Roles y permisos:**

| Endpoint | ADMINISTRADOR | MANTENEDOR | PROFESOR | ALUMNO |
|----------|:---:|:---:|:---:|:---:|
| `POST /api/embed/launch` | ✅ | ✅ | ✅ | ✅ |
| `GET /api/rubricas` | ✅ | ✅ | ❌ | ❌ |
| `POST /api/rubricas` | ✅ | ✅ | ❌ | ❌ |
| `GET /api/rubricas/:id` | ✅ | ✅ | ✅ | ✅ |
| `PUT /api/rubricas/:id` | ✅ | ✅ | ❌ | ❌ |
| `DELETE /api/rubricas/:id` | ✅ | ✅ | ❌ | ❌ |
| `POST /api/evaluaciones/:id/calcular` | ✅ | ✅ | ✅ | ❌ |
| `GET /api/dashboard/metricas` | ✅ | ✅ | ❌ | ❌ |
| `GET /api/configuracion` | ✅ | ❌ | ❌ | ❌ |
| `PUT /api/configuracion/:clave` | ✅ | ❌ | ❌ | ❌ |

---

## Endpoints

### 1. `POST /api/embed/launch`

Punto de entrada para el iframe. Verifica el JWT del body y determina el modo de operación.

**Autenticación:** JWT en el body (no en header)  
**Rol:** Cualquiera

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response 200 — Nueva evaluación:**
```json
{
  "success": true,
  "data": {
    "authorized": true,
    "modo": "evaluar",
    "rubricaId": "550e8400-e29b-41d4-a716-446655440000",
    "recuperado": false,
    "rol": "PROFESOR",
    "allowedModes": ["evaluar"]
  }
}
```

**Response 200 — Borrador recuperado de Redis:**
```json
{
  "success": true,
  "data": {
    "authorized": true,
    "modo": "evaluar",
    "evaluacionId": "660e8400-e29b-41d4-a716-446655440001",
    "rubricaId": "550e8400-e29b-41d4-a716-446655440000",
    "recuperado": true,
    "rol": "PROFESOR",
    "allowedModes": ["evaluar"]
  }
}
```

**Response 200 — Evaluación ya completada:**
```json
{
  "success": true,
  "data": {
    "authorized": true,
    "modo": "ver_resultado",
    "evaluacionId": "660e8400-e29b-41d4-a716-446655440001",
    "recuperado": false,
    "rol": "ALUMNO",
    "allowedModes": ["resultado"]
  }
}
```

**Response 200 — Modo administración (sin rubrica_id ni evaluacion_id):**
```json
{
  "success": true,
  "data": {
    "authorized": true,
    "rol": "MANTENEDOR",
    "allowedModes": ["rubricas", "dashboard"],
    "usuarioId": "mantenedor.demo"
  }
}
```

**Response 401:**
```json
{
  "success": false,
  "error": {
    "type": "https://evalua.cl/errors/no-autorizado",
    "title": "No autorizado",
    "status": 401,
    "detail": "Token JWT inválido o expirado"
  }
}
```

---

### 2. `GET /api/rubricas`

Lista todas las rúbricas accesibles para el rol autenticado.

**Rol:** MANTENEDOR, ADMINISTRADOR

**Query Parameters:**

| Param | Tipo | Descripción |
|-------|------|-------------|
| `esActiva` | `boolean` | Filtrar por estado activo (`"true"` o `"false"`) |

**Request:**
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3000/api/rubricas?esActiva=true"
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "550e8400-e29b-41d4-a716-446655440000",
      "rubricaGroupId": "550e8400-e29b-41d4-a716-446655440000",
      "version": 1,
      "parentRubricaId": null,
      "titulo": "Rúbrica Proyecto Final",
      "notaAprobacion": 4.0,
      "esActiva": true,
      "metadata": { "asignatura": "INF101" },
      "criterios": [ ... ],
      "createdAt": "2026-01-15T10:30:00.000Z",
      "updatedAt": "2026-01-15T10:30:00.000Z"
    }
  ]
}
```

**Notas para MANTENEDOR:** Si el JWT contiene `rubricas_permitidas: ["*"]`, ve todas. Si contiene una lista de UUIDs, solo ve esas.

---

### 3. `POST /api/rubricas`

Crea una nueva rúbrica.

**Rol:** MANTENEDOR, ADMINISTRADOR

**Request Body:**
```json
{
  "titulo": "Rúbrica Proyecto Final",
  "notaAprobacion": 4.0,
  "metadata": {
    "asignatura": "INF101",
    "semestre": "2026-1"
  },
  "criterios": [
    {
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
          "bulletPoints": ["Código limpio", "Buenas prácticas básicas"]
        },
        {
          "notaNivel": 7,
          "etiqueta": "Excelente",
          "bulletPoints": ["Código ejemplar", "Patrones de diseño", "Tests completos"]
        }
      ]
    },
    {
      "nombre": "Documentación",
      "ponderacion": 0.35,
      "tipo": "ESTRUCTURAL",
      "esExcluyente": false,
      "descriptores": []
    },
    {
      "nombre": "Originalidad",
      "ponderacion": 0.25,
      "tipo": "ESTRUCTURAL",
      "esExcluyente": true,
      "notaCorte": 3.0,
      "descriptores": []
    }
  ]
}
```

**Validaciones:**
- `titulo`: requerido, 1-300 caracteres
- `notaAprobacion`: 1.0-7.0, default 4.0
- `criterios`: mínimo 1 criterio
- `ponderacion` por criterio: 0.0-1.0
- **Suma de ponderaciones de criterios ESTRUCTURALES debe ser exactamente 1.0 (±0.001)**
- `tipo`: `"ESTRUCTURAL"` o `"COMPLEMENTARIO"`
- `notaNivel` de descriptores: entero 1-7
- `esExcluyente` + `notaCorte`: para regla Gatekeeper

**Response 201:**
```json
{
  "success": true,
  "data": {
    "_id": "550e8400-e29b-41d4-a716-446655440000",
    "rubricaGroupId": "550e8400-e29b-41d4-a716-446655440000",
    "version": 1,
    "parentRubricaId": null,
    "titulo": "Rúbrica Proyecto Final",
    "notaAprobacion": 4.0,
    "esActiva": true,
    "metadata": { "asignatura": "INF101", "semestre": "2026-1" },
    "criterios": [ ... ],
    "createdAt": "2026-06-15T03:00:00.000Z",
    "updatedAt": "2026-06-15T03:00:00.000Z"
  }
}
```

**Response 400 — Ponderaciones inválidas:**
```json
{
  "success": false,
  "error": {
    "type": "https://evalua.cl/errors/ponderaciones-invalidas",
    "title": "Ponderaciones inválidas",
    "status": 400,
    "detail": "La suma de ponderaciones de criterios estructurales debe ser 1.0, actualmente es 0.750"
  }
}
```

---

### 4. `GET /api/rubricas/:id`

Obtiene una rúbrica por ID. Utiliza cache L2 Redis (cache-aside).

**Rol:** MANTENEDOR, ADMINISTRADOR, PROFESOR, ALUMNO

**Request:**
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3000/api/rubricas/550e8400-e29b-41d4-a716-446655440000"
```

**Response 200:** (mismo formato que un elemento del array de `GET /api/rubricas`)

**Response 404:**
```json
{
  "success": false,
  "error": {
    "type": "https://evalua.cl/errors/no-encontrada",
    "title": "No encontrada",
    "status": 404,
    "detail": "Rúbrica no existe"
  }
}
```

---

### 5. `PUT /api/rubricas/:id`

Actualiza una rúbrica. Si tiene evaluaciones asociadas y se modifican criterios, crea nueva versión automáticamente.

**Rol:** MANTENEDOR, ADMINISTRADOR

**Request Body:** (todos los campos opcionales)
```json
{
  "titulo": "Rúbrica Proyecto Final v2",
  "notaAprobacion": 4.5,
  "metadata": { "asignatura": "INF101" },
  "esActiva": true,
  "criterios": [ ... ]
}
```

**Comportamiento de versionado:**
- Si la rúbrica NO tiene evaluaciones → actualización directa (mismo UUID)
- Si la rúbrica SÍ tiene evaluaciones y se envían `criterios` → crea nueva versión:
  - Nuevo UUID
  - Misma `rubricaGroupId`
  - `version` incrementada en 1
  - `parentRubricaId` apunta a la versión anterior
  - Versión anterior se desactiva (`esActiva: false`)

**Response 200:** Rúbrica actualizada o nueva versión

---

### 6. `DELETE /api/rubricas/:id`

Elimina una rúbrica (solo si no tiene evaluaciones asociadas).

**Rol:** MANTENEDOR, ADMINISTRADOR

**Response 200:**
```json
{
  "success": true,
  "data": { "deleted": true }
}
```

**Response 409 — Tiene evaluaciones:**
```json
{
  "success": false,
  "error": {
    "type": "https://evalua.cl/errors/conflicto",
    "title": "Conflicto",
    "status": 409,
    "detail": "No se puede eliminar una rúbrica con evaluaciones asociadas"
  }
}
```

---

### 7. `POST /api/evaluaciones/:id/calcular`

Calcula la nota final de una evaluación, la persiste en MongoDB y elimina el borrador de Redis.

**Rol:** ADMINISTRADOR, MANTENEDOR, PROFESOR

**Headers:**
```
Authorization: Bearer <TOKEN>
Idempotency-Key: <opcional-uuid>   # Para evitar duplicados
```

**Precondiciones:**
- El borrador debe existir en Redis con estado `EN_REVISION`
- Todos los criterios ESTRUCTURALES deben estar calificados

**Request:** No requiere body (usa el borrador de Redis)

**Request:**
```bash
curl -X POST \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Idempotency-Key: uuid-optional" \
  "http://localhost:3000/api/evaluaciones/660e8400-e29b-41d4-a716-446655440001/calcular"
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "evaluacionId": "660e8400-e29b-41d4-a716-446655440001",
    "notaFinal": 5.67,
    "aprobada": true,
    "estado": "COMPLETADA"
  }
}
```

**Response 200 — Gatekeeper activado:**
```json
{
  "success": true,
  "data": {
    "evaluacionId": "660e8400-e29b-41d4-a716-446655440001",
    "notaFinal": 1.0,
    "aprobada": false,
    "estado": "COMPLETADA"
  }
}
```

**Response 400 — Calificación incompleta:**
```json
{
  "success": false,
  "error": {
    "type": "https://evalua.cl/errors/calificacion-incompleta",
    "title": "Calificación incompleta",
    "status": 400,
    "detail": "Falta calificar el criterio estructural: Calidad del código"
  }
}
```

**Response 400 — Borrador no existe:**
```json
{
  "success": false,
  "error": {
    "type": "https://evalua.cl/errors/solicitud-invalida",
    "title": "Solicitud inválida",
    "status": 400,
    "detail": "Borrador no existe en Redis"
  }
}
```

**Response 409 — Ya consolidada:**
```json
{
  "success": false,
  "error": {
    "type": "https://evalua.cl/errors/conflicto",
    "title": "Conflicto",
    "status": 409,
    "detail": "Esta evaluación ya ha sido consolidada"
  }
}
```

---

### 8. `GET /api/dashboard/metricas`

Obtiene métricas del dashboard.

**Rol:** ADMINISTRADOR, MANTENEDOR

**Request:**
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3000/api/dashboard/metricas"
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "metricas": {
      "rubricasCreadas": 12,
      "evaluacionesEnCurso": 5,
      "evaluacionesCompletadas": 47
    },
    "historial": [
      {
        "_id": "660e8400-...",
        "rubricaId": "550e8400-...",
        "estado": "COMPLETADA",
        "notaFinal": 5.67,
        "createdAt": "2026-06-14T15:30:00.000Z"
      }
    ]
  }
}
```

**Notas:**
- MANTENEDOR solo ve sus propias métricas (filtrado por `usuario_id` del JWT)
- `historial` contiene las últimas 10 evaluaciones ordenadas por fecha descendente

---

### 9. `GET /api/configuracion`

Lista toda la configuración del sistema.

**Rol:** ADMINISTRADOR

**Request:**
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3000/api/configuracion"
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "clave": "exigencia_default", "valor": "0.6" },
    { "clave": "ttl_borradores_dias", "valor": "30" }
  ]
}
```

---

### 10. `PUT /api/configuracion/:clave`

Actualiza un parámetro de configuración.

**Rol:** ADMINISTRADOR

**Request Body:**
```json
{
  "valor": "0.65"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "clave": "exigencia_default",
    "valor": "0.65"
  }
}
```

---

## Schemas Zod de Validación

### DescriptorSchema

```typescript
{
  notaNivel: number    // int, 1-7
  etiqueta: string     // 1-200 chars
  bulletPoints: string[]  // default []
}
```

### CriterioSchema

```typescript
{
  id?: string           // UUID, opcional (auto-generado)
  nombre: string        // 1-200 chars, requerido
  ponderacion: number   // 0.0-1.0, requerido
  tipo: "ESTRUCTURAL" | "COMPLEMENTARIO"  // default "ESTRUCTURAL"
  esExcluyente: boolean // default false
  notaCorte: number     // 1.0-7.0, default 4.0
  descripcion?: string | null  // max 500 chars
  minPalabras?: number | null  // int, min 0
  maxPalabras?: number | null  // int, min 0
  orden: number         // int, min 0, default 0
  descriptores: DescriptorSchema[]  // default []
}
```

### CrearRubricaSchema

```typescript
{
  titulo: string        // 1-300 chars, requerido
  notaAprobacion: number // 1.0-7.0, default 4.0
  metadata?: Record<string, unknown>
  criterios: CriterioSchema[]  // min 1, requerido
}
```

### ActualizarRubricaSchema

```typescript
{
  titulo?: string
  notaAprobacion?: number
  metadata?: Record<string, unknown>
  criterios?: CriterioSchema[]  // min 1 si se envía
  esActiva?: boolean
}
```

### PuntajeInputSchema

```typescript
{
  criterioId: string    // UUID, requerido
  notaAsignada: number  // 1.0-7.0, requerido
  observaciones?: string | null
}
```

### CrearEvaluacionSchema

```typescript
{
  evaluacionId?: string  // UUID, opcional
  rubricaId: string      // UUID, requerido
  usuarioId?: string     // opcional
}
```

### ActualizarEvaluacionSchema

```typescript
{
  estado?: "EN_PROGRESO" | "EN_REVISION"
  observaciones?: string | null
  puntajes?: PuntajeInputSchema[]
}
```

### LaunchSchema

```typescript
{
  token: string  // JWT, requerido, min 1 char
}
```

### ActualizarConfigSchema

```typescript
{
  valor: string  // min 1 char, requerido
}
```

---

## Formato de Errores

Todos los errores siguen RFC 7807:

```json
{
  "success": false,
  "error": {
    "type": "https://evalua.cl/errors/<tipo>",
    "title": "Título legible",
    "status": 400,
    "detail": "Descripción específica del error"
  }
}
```

**Códigos de error:**

| HTTP | `title` típico | Causa |
|------|----------------|-------|
| 400 | Solicitud inválida | Body no cumple schema Zod |
| 400 | Ponderaciones inválidas | Suma ≠ 1.0 |
| 400 | Calificación incompleta | Faltan criterios estructurales |
| 401 | No autorizado | JWT ausente/inválido/expirado |
| 403 | Prohibido | Rol sin permisos |
| 404 | No encontrada | Recurso no existe |
| 409 | Conflicto | Operación duplicada |
| 500 | Error interno | Error no controlado |

---

## Ejemplo: Flujo Completo vía curl

### 1. Crear una rúbrica

```bash
# Generar JWT (requiere la misma KEY del servidor)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Crear rúbrica
curl -X POST http://localhost:3000/api/rubricas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Rúbrica Ensayo",
    "notaAprobacion": 4.0,
    "criterios": [
      {
        "nombre": "Contenido",
        "ponderacion": 0.6,
        "tipo": "ESTRUCTURAL",
        "esExcluyente": true,
        "notaCorte": 4.0,
        "descriptores": [
          {"notaNivel": 1, "etiqueta": "Insuficiente", "bulletPoints": ["Sin argumentos"]},
          {"notaNivel": 4, "etiqueta": "Adecuado", "bulletPoints": ["Argumentos claros"]},
          {"notaNivel": 7, "etiqueta": "Excelente", "bulletPoints": ["Argumentos excepcionales"]}
        ]
      },
      {
        "nombre": "Forma",
        "ponderacion": 0.4,
        "tipo": "ESTRUCTURAL",
        "descriptores": []
      }
    ]
  }'
```

### 2. Listar rúbricas

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/rubricas?esActiva=true"
```

### 3. Obtener rúbrica específica

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/rubricas/550e8400-e29b-41d4-a716-446655440000"
```

### 4. Calcular evaluación (después de que el wizard guardó el borrador en Redis)

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  "http://localhost:3000/api/evaluaciones/660e8400-e29b-41d4-a716-446655440001/calcular"
```

### 5. Ver métricas del dashboard

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/dashboard/metricas"