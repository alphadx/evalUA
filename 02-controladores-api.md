# Documentación de Controladores API — EvalUA v3.0 (MongoDB + Redis)

> Especificación de las APIs REST en Next.js 16 App Router. Detalla la interacción del backend con MongoDB para persistencia de colecciones y Redis para borradores transitorios con TTL y caché L2.

---

## Convenciones de Base de Datos y Caché

| Operación | Destino Principal | Comportamiento del Controlador |
|---|---|---|
| **CRUD Rúbricas (Escritura)** | MongoDB | Guarda en base documental e invalida la caché L2 `cache:rubrica:{id}` en Redis (`DEL`). |
| **CRUD Rúbricas (Lectura)** | Redis / MongoDB | Intenta leer de `cache:rubrica:{id}` (L2 Cache). Si falla, lee de MongoDB y guarda en caché con TTL de 24 horas. |
| **Borradores (Auto-save)** | Redis | `PUT /api/evaluaciones/[id]` guarda el JSON en `draft:{id}` con TTL de 30 días (soporta estados `EN_PROGRESO` y `EN_REVISION`). |
| **Consolidación (Finalizar)** | MongoDB / Redis | Ejecuta cálculo desde la pantalla de Resumen, persiste en MongoDB (`evaluaciones` col) y elimina el borrador de Redis (`DEL draft:{id}`). |

---

## 1. APIs de Mantenimiento de Rúbricas

Todas las APIs de rúbricas requieren verificación de firma JWT simétrica y están restringidas a usuarios con rol `MANTENEDOR` o `ADMINISTRADOR`.

### GET /api/rubricas
```http
GET /api/rubricas?esActiva=true
```
- **Backend:** Retorna el listado general de rúbricas consultando la colección `rubricas` de MongoDB.
- **Filtro de Seguridad:** Para el rol `MANTENEDOR`, filtra el listado internamente utilizando el arreglo proporcionado en el claim `rubricas_permitidas` (`{ _id: { $in: jwt.rubricas_permitidas } }`). Si el arreglo contiene el comodín `["*"]` o el rol es `ADMINISTRADOR`, retorna todas las rúbricas de la plataforma sin filtrado.

### GET /api/rubricas/[id]
```http
GET /api/rubricas/{id}
```
- **Flujo de Lectura:**
  1. Busca en Redis: `GET cache:rubrica:{id}`.
  2. Si hay **HIT**: Deserializa el JSON y retorna de inmediato.
  3. Si hay **MISS**: Consulta en la colección `rubricas` de MongoDB. Guarda el resultado en Redis: `SET cache:rubrica:{id} {JSON} EX 86400` (24 horas) y retorna.
- **Filtro de Seguridad:** Valida que el `{id}` solicitado se encuentre listado explícitamente en el arreglo `rubricas_permitidas` del JWT (o que el usuario posea el comodín `"*"` o rol `ADMINISTRADOR`). De lo contrario, retorna HTTP `403 Forbidden`.

### POST /api/rubricas
```http
POST /api/rubricas
Content-Type: application/json
```
- **Backend:** Valida que la suma de criterios sea exactamente 1.0. Guarda la nueva rúbrica estructurada en MongoDB, inyectando el `usuario_id` proveniente del JWT en los metadatos del documento.
- **Response 201:** Retorna la rúbrica guardada e incluye el `rubricaId` (UUID) generado en la respuesta.

### PUT /api/rubricas/[id]
```http
PUT /api/rubricas/{id}
Content-Type: application/json
```
- **Backend:** Valida que el `{id}` solicitado se encuentre en el arreglo `rubricas_permitidas` del JWT (o que el usuario posea el comodín `"*"` o rol `ADMINISTRADOR`). Guarda modificaciones en MongoDB (o crea una nueva versión de la rúbrica con UUID e incrementando el número de versión si posee evaluaciones previas en MongoDB).
- **Acción Redis:** Ejecuta `DEL cache:rubrica:{id}` para invalidar la caché L2.

### DELETE /api/rubricas/[id]
```http
DELETE /api/rubricas/{id}
```
- **Backend:** Valida que el `{id}` solicitado se encuentre en el arreglo `rubricas_permitidas` del JWT (o que posea el comodín `"*"` o rol `ADMINISTRADOR`). Elimina de MongoDB (si no tiene evaluaciones asociadas en la colección `evaluaciones`).
- **Acción Redis:** Ejecuta `DEL cache:rubrica:{id}`.

---

## 2. API de Lanzamiento Embebido (Launch)

### POST /api/embed/launch
```http
POST /api/embed/launch
Content-Type: application/json

{
  "token": "eyJhbGciOi..."
}
```
- **Backend:** Extrae el token JWT del cuerpo, valida la firma simétrica usando la variable de entorno `KEY` (HS256) y verifica que el claim `id_plataforma` coincida con `ENV.ID_PLATAFORMA`.
- **Validación de Roles y Modos:**
  EvalUA determina qué vistas y operaciones están autorizadas en base al claim `rol` presente en el JWT:

| `rol` en JWT | Modos permitidos | Descripción |
|---|---|---|
| `ADMINISTRADOR` | `dashboard`, `rubricas`, `configurar`, `evaluar`, `resultado` | Acceso total: métricas, CRUD de rúbricas, configuración del sistema, evaluación y visualización de resultados. |
| `MANTENEDOR` | `dashboard`, `rubricas`, `evaluar`, `resultado` | Acceso a métricas, CRUD de rúbricas según el arreglo de UUIDs proveído en `rubricas_permitidas`, evaluación y resultados. |
| `PROFESOR` | `evaluar`, `resultado` | Puede evaluar con una rúbrica y ver resultados de evaluaciones. |
| `ALUMNO` | `resultado` | Solo puede ver el resultado de sus propias evaluaciones en modo lectura. |

- **Flujo de Inicialización según modo solicitado:**
  1. Extrae los claims del token, incluyendo `rol`, `evaluacion_id` y `rubrica_id`.
  2. Valida que el `rol` tenga permitido el modo correspondiente. Si no, retorna `403 Forbidden`.
  3. Si es modo `evaluar`:
     - Verifica en Redis: `EXISTS draft:{evaluacionId}`.
     - Si existe, retorna `{ authorized: true, modo: "evaluar", evaluacionId, recuperado: true }`.
     - Si no existe, verifica en MongoDB si existe una evaluación consolidada en la colección `evaluaciones`. Si existe, retorna `{ authorized: true, modo: "ver_resultado", evaluacionId }` (modo lectura).
     - Si es una nueva evaluación, retorna `{ authorized: true, modo: "evaluar", evaluacionId, recuperado: false }`.
  4. Si es modo `resultado`:
     - Valida acceso al recurso (si es `ALUMNO`, valida que sea dueño de la evaluación a través de `usuario_id`).
     - Retorna `{ authorized: true, modo: "ver_resultado", evaluacionId }`.
  5. Para modos de administración (`dashboard`, `rubricas`, `configurar`):
     - Retorna `{ authorized: true, modo: requestedMode }`.

---

## 3. APIs de Evaluación (Iframe / Host)

### POST /api/evaluaciones
Inicializa una evaluación en curso.
```http
POST /api/evaluaciones
Content-Type: application/json
```
- **Backend:** Crea un borrador vacío en Redis:
  ```typescript
  const draft = {
    evaluacionId: body.evaluacionId,
    rubricaId: body.rubricaId,
    estado: "EN_PROGRESO",
    usuarioId: body.usuarioId || null,
    observaciones: null,
    puntajes: []
  };
  await redis.set(`draft:${body.evaluacionId}`, JSON.stringify(draft), "EX", 2592000); // 30 días
  ```
- **Response 201:** Retorna el objeto del borrador creado.

---

### GET /api/evaluaciones/[id]
Recupera el progreso o resultado de una evaluación.
```http
GET /api/evaluaciones/{id}
```
- **Flujo de Lectura:**
  1. Busca en Redis: `GET draft:{id}`. Si hay **HIT**, retorna el borrador en progreso.
  2. Si hay **MISS**, busca en MongoDB en la colección `evaluaciones`. Si existe, retorna el documento final.
  3. Si no existe en ninguno, retorna `404 Not Found`.

---

### PUT /api/evaluaciones/[id]
Guarda de forma asíncrona el progreso del evaluador (Auto-save).
```http
PUT /api/evaluaciones/{id}
Content-Type: application/json
```
- **Request Body:**
  ```json
  {
    "estado": "EN_REVISION", // Opcional. Transiciona el borrador a "EN_REVISION" al entrar al Resumen o de vuelta a "EN_PROGRESO" si se modifica
    "observaciones": "El estudiante demuestra dominio...",
    "puntajes": [
      { "criterioId": "uuid-crit-1", "notaAsignada": 6.5, "observaciones": "Buen código" }
    ]
  }
  ```
- **Backend:**
  1. Carga el borrador existente de Redis: `GET draft:{id}`.
  2. Actualiza el `estado` (si viene especificado en la petición), actualiza las `observaciones` y mezcla/reemplaza el arreglo de `puntajes` según `criterioId`.
  3. Guarda en Redis extendiendo el TTL: `SET draft:{id} {JSON_ACTUALIZADO} EX 2592000` (30 días).
- **Response 200:** Retorna el borrador actualizado.

---

### POST /api/evaluaciones/[id]/calcular
Calcula la nota definitiva, persiste en MongoDB y elimina el borrador transitorio de Redis. Solo se puede invocar desde la pantalla de Resumen y Confirmación (con la evaluación en estado `EN_REVISION`).
```http
POST /api/evaluaciones/{id}/calcular
```
- **Backend (Flujo de Consolidación):**
  1. Lee el borrador desde Redis: `GET draft:{id}`. Si no existe, retorna `400 Bad Request`.
  2. Valida que el borrador esté en estado `EN_REVISION`. Si está en `EN_PROGRESO` y faltan criterios por calificar, retorna `400 Bad Request`.
  3. Carga la rúbrica asociada para obtener los criterios (intenta leer de `cache:rubrica:{rubricaId}`, si falla va a MongoDB).
  4. Valida que el borrador tenga todos los criterios calificados.
  5. Ejecuta la estrategia del dominio (`EvaluacionStrategy` con reglas Gatekeeper y ponderación).
  6. Crea el documento definitivo de evaluación:
     ```json
     {
       "_id": id,
       "rubricaId": borrador.rubricaId,
       "estado": "COMPLETADA",
       "notaFinal": notaCalculada,
       "observaciones": borrador.observaciones,
       "metadata": { "reglaAplicada": "GATEKEEPER", "usuarioId": borrador.usuarioId },
       "puntajes": borrador.puntajes
     }
     ```
  7. Escribe el documento en la colección `evaluaciones` de MongoDB.
  8. Elimina el borrador en memoria: `DEL draft:{id}`.
- **Response 200:** Retorna el resultado del cálculo y el estado consolidado.
- **Response 409 (Conflicto):** Si el documento de evaluación ya existía en la colección `evaluaciones` de MongoDB (evita doble consolidación).

---

## 4. APIs de Administración Embebida (Dashboard y Configuración)

Estas APIs soportan las nuevas pantallas embebidas y validan que el token JWT del contexto tenga los roles apropiados.

### GET /api/dashboard/metricas
```http
GET /api/dashboard/metricas
```
- **Acceso:** Roles `ADMINISTRADOR` o `MANTENEDOR`.
- **Backend:**
  - Si es `ADMINISTRADOR`, realiza un conteo global de todas las rúbricas y evaluaciones (borradores en Redis y completadas en MongoDB).
  - Si es `MANTENEDOR`, filtra las métricas y el historial para incluir únicamente las rúbricas asociadas a su `usuario_id`.
- **Response 200:** Retorna las tarjetas de métricas e historial reciente de las últimas 10 evaluaciones correspondientes.

### GET /api/configuracion
```http
GET /api/configuracion
```
- **Acceso:** Solo rol `ADMINISTRADOR`.
- **Backend:** Consulta la colección `configuraciones` en MongoDB.
- **Response 200:** Retorna la lista de configuraciones activas.

### PUT /api/configuracion/[clave]
```http
PUT /api/configuracion/{clave}
Content-Type: application/json

{
  "valor": "2592000"
}
```
- **Acceso:** Solo rol `ADMINISTRADOR`.
- **Backend:** Actualiza el parámetro en la colección `configuraciones` de MongoDB e invalida la caché correspondiente en Redis (`DEL cache:configuracion`).
- **Response 200:** Retorna el estado actualizado.
