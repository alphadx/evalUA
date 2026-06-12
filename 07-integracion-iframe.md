# Integración Host/Iframe y Protocolo de Seguridad — EvalUA v3.0 (MongoDB + Redis)

> Documento de integración para embeber el micro-frontend EvalUA como un iframe.
> EvalUA se carga dentro de una aplicación host, autentica el contexto mediante un JWT simétrico y notifica eventos mediante `Window.postMessage`.

---

## 1. Flujo de Integración General

El sistema Host controla la experiencia del usuario y la navegación, embebiendo a EvalUA únicamente para realizar la acción específica de calificación (wizard) o visualización de resultados de una rúbrica.

```
  ┌──────────┐                                      ┌──────────┐
  │  Host    │ ── (1) Lanza Iframe según contexto ─>│  EvalUA  │
  │  System  │   - /embed/evaluar                   │  Iframe  │
  │          │   - /embed/resultado                 │  (1029  │
  │          │   - /embed/rubricas                  │   x466px)│
  │          │   - /embed/dashboard                 │          │
  │          │   - /embed/configurar                │          │
  │          │                                      │          │
  │          │ <── (2) Notifica 'evalua.ready' ───  │          │
  │          │                                      │          │
  │          │ <── (3) Envía 'completed' o status ──│          │
  └──────────┘                                      └──────────┘
```

1. El Host genera un **JWT de Lanzamiento** y carga a EvalUA en un iframe de **1029x466px** apuntando a la ruta embebida correspondiente (`/embed/evaluar`, `/embed/resultado`, `/embed/rubricas`, `/embed/dashboard` o `/embed/configurar`).
2. EvalUA valida el JWT en su backend utilizando el secreto simétrico de la variable de entorno `KEY` y el `ID_PLATAFORMA`.
3. Para optimizar la velocidad de inicialización en la evaluación o edición de rúbricas, EvalUA intenta recuperar la rúbrica desde la **Caché L2 de Redis** antes de realizar consultas a la base de datos MongoDB.
4. Al inicializar correctamente, EvalUA notifica al Host mediante `postMessage` (`evalua.ready`).
5. En el modo de evaluación, el evaluador califica interactivamente criterio por criterio. Se autoguardan borradores en la memoria de Redis local (`draft:{evaluacionId}`). Al calificar el último criterio, el borrador pasa a estado `EN_REVISION`, se muestra la pantalla de Resumen y se notifica al Host (`evalua.evaluation.reviewing`).
6. Al confirmar la finalización desde la pantalla de Resumen, EvalUA ejecuta el cálculo final de la nota, persiste el registro definitivo en MongoDB, limpia el borrador de Redis y notifica al Host mediante `postMessage` (`evalua.evaluation.completed`). En el caso de mantenimiento de rúbricas, se emiten eventos de creación o actualización correspondientes.

---

## 2. Dimensiones Fijas de Visualización

El Host debe renderizar el iframe con un viewport rígido de **1029 px de ancho por 466 px de alto**. El frontend de EvalUA está optimizado estructuralmente para asegurar que no se generen scrollbars en el documento raíz del iframe.

```html
<iframe
  src="https://evalua.microservice.local/embed/evaluar?jwt=JWT_LANZAMIENTO_FIRMA"
  width="1029"
  height="466"
  style="width: 1029px; height: 466px; border: 0; overflow: hidden;"
  scrolling="no"
></iframe>
```

---

## 3. URL de Lanzamiento y Esquema JWT

### 3.1 URL de Wizard de Evaluación
```text
GET /embed/evaluar?jwt={launchToken}
```

#### Claims del `launchToken` (JWT firmado con HS256 mediante clave `KEY`):
```json
{
  "iss": "sistema-host",
  "aud": "evalua-microservice",
  "id_plataforma": "PLATAFORMA_evalUA_XYZ", // Debe coincidir con ENV.ID_PLATAFORMA
  "rol": "PROFESOR",                     // Rol del usuario que evalúa
  "rubrica_id": "uuid-rubrica-activa",
  "evaluacion_id": "eval-host-id-456", // Opcional. Si es nulo, EvalUA genera un UUID y lo retorna.
  "usuario_id": "profesor.perez",       // Opcional (Trazabilidad)
  "iat": 1780000000,
  "exp": 1780000300                     // Expiración corta (5 minutos recomendados)
}
```

> [!NOTE]
> **Nota sobre `rubrica_id`:** El valor de `rubrica_id` corresponde al campo `_id` (UUID) de la colección `rubricas`, el cual es visible y copiable desde el CRUD embebido de Rúbricas. El administrador o mantenedor debe proporcionar este ID al equipo del Host para que pueda construir el JWT de lanzamiento correctamente.

---

### 3.2 URL de Lectura de Resultados
Para mostrar a un estudiante, profesor o administrador el desglose final de una rúbrica en modo de solo lectura.
```text
GET /embed/resultado?jwt={resultToken}
```

#### Claims del `resultToken` (JWT firmado con HS256 mediante clave `KEY`):
```json
{
  "iss": "sistema-host",
  "aud": "evalua-microservice",
  "id_plataforma": "PLATAFORMA_evalUA_XYZ",
  "rol": "ALUMNO",                       // Rol: ALUMNO, PROFESOR, MANTENEDOR, ADMINISTRADOR
  "evaluacion_id": "eval-host-id-456", // Requerido para buscar la evaluación completada.
  "usuario_id": "alumno.soto",           // Requerido para verificar propiedad en rol ALUMNO
  "iat": 1780000000,
  "exp": 1780000300
}
```

> [!NOTE]
> **Nota sobre el rol ALUMNO:** El rol `ALUMNO` solo tiene acceso a la vista de resultados `/embed/resultado`. Si un JWT con `rol: ALUMNO` se envía a cualquier otro endpoint o ruta, se retornará un error `403 Forbidden`.

---

### 3.3 URL de Mantenimiento de Rúbricas (Iframe)
Para permitir que un mantenedor o administrador gestione las rúbricas de la plataforma.
```text
GET /embed/rubricas?jwt={rubricaToken}
```

#### Claims del `rubricaToken` (JWT firmado con HS256 mediante clave `KEY`):
```json
{
  "iss": "sistema-host",
  "aud": "evalua-microservice",
  "id_plataforma": "PLATAFORMA_evalUA_XYZ",
  "rol": "MANTENEDOR",                   // Rol: MANTENEDOR o ADMINISTRADOR
  "usuario_id": "mantenedor.garcia",     // Opcional para trazabilidad
  "rubricas_permitidas": [               // Arreglo de UUIDs que el mantenedor puede ver/editar
    "uuid-rubrica-1",
    "uuid-rubrica-2"
  ],
  "iat": 1780000000,
  "exp": 1780000300
}
```

> [!NOTE]
> **Comodín Global:** El Host puede enviar `["*"]` en el arreglo de `rubricas_permitidas` si desea otorgar al mantenedor acceso irrestricto a todas las rúbricas de la plataforma. El rol `ADMINISTRADOR` no requiere este claim, pues tiene acceso total por defecto.

---

### 3.4 URL de Dashboard (Iframe)
Para visualizar métricas e historial de evaluaciones.
```text
GET /embed/dashboard?jwt={dashboardToken}
```

#### Claims del `dashboardToken` (JWT firmado con HS256 mediante clave `KEY`):
```json
{
  "iss": "sistema-host",
  "aud": "evalua-microservice",
  "id_plataforma": "PLATAFORMA_evalUA_XYZ",
  "rol": "ADMINISTRADOR",                 // Rol: ADMINISTRADOR o MANTENEDOR
  "usuario_id": "admin.evalua",
  "iat": 1780000000,
  "exp": 1780000300
}
```

---

### 3.5 URL de Configuración (Iframe)
Para permitir que el administrador modifique variables globales de configuración.
```text
GET /embed/configurar?jwt={configToken}
```

#### Claims del `configToken` (JWT firmado con HS256 mediante clave `KEY`):
```json
{
  "iss": "sistema-host",
  "aud": "evalua-microservice",
  "id_plataforma": "PLATAFORMA_evalUA_XYZ",
  "rol": "ADMINISTRADOR",                 // Requiere estrictamente rol ADMINISTRADOR
  "iat": 1780000000,
  "exp": 1780000300
}
```

---

## 4. Flujo de Inicialización Optimizado por Caché Redis L2

Cuando se levanta el micro-frontend en el iframe, el backend realiza una estrategia de caché de dos niveles para asegurar tiempos de respuesta mínimos (< 5ms en HIT):

```
                   Petición GET /embed/evaluar
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Carga desde Redis  │ ── (HIT < 5ms) ──> [Retornar Rúbrica]
                    │  cache:rubrica:{id} │
                    └──────────┬──────────┘
                               │ (MISS)
                               ▼
                    ┌─────────────────────┐
                    │  Consulta MongoDB   │
                    │  colección rubricas │
                    └──────────┬──────────┘
                               │ (30-50ms)
                               ▼
                    ┌─────────────────────┐
                    │  Escribir en Redis  │
                    │   con TTL 24 horas  │
                    └─────────────────────┘
```

Esta optimización protege la base documental de MongoDB de sobrecargas de lecturas simultáneas cuando múltiples comisiones evalúan asignaturas paralelas en los mismos rangos horarios.

---

## 5. Contrato postMessage (Eventos Iframe -> Host)

Todos los mensajes transmitidos desde el iframe hacia el Host utilizan el canal estándar `Window.parent.postMessage`.

### Envelope Base
```typescript
interface EvaluaHostMessage {
  source: "evalua";
  version: "3.0";
  type: 
    | "evalua.ready" 
    | "evalua.evaluation.reviewing" 
    | "evalua.evaluation.completed" 
    | "evalua.rubrica.created"
    | "evalua.config.updated"
    | "evalua.error";
  payload: Record<string, unknown>;
}
```

### Eventos Emitidos por EvalUA

#### 1. Listo para operar (`evalua.ready`)
Emitido cuando EvalUA termina de autenticar el token de lanzamiento e inicializar la vista.
- **Payload:**
  ```json
  {
    "rubricaId": "uuid-rubrica-activa",
    "evaluacionId": "uuid-evaluacion-activa"
  }
  ```

#### 2. Evaluación en Revisión (`evalua.evaluation.reviewing`)
Emitido cuando el evaluador avanza a la pantalla de Resumen y Confirmación tras calificar todos los criterios.
- **Payload:**
  ```json
  {
    "evaluacionId": "uuid-evaluacion-activa",
    "notaProvisional": 5.4,
    "estado": "EN_REVISION"
  }
  ```

#### 3. Evaluación Finalizada (`evalua.evaluation.completed`)
Emitido cuando el evaluador hace clic en "Finalizar Evaluación" desde la pantalla de Resumen y el cálculo definitivo se guarda con éxito en MongoDB.
- **Payload:**
  ```json
  {
    "evaluacionId": "uuid-evaluacion-finalizada",
    "status": "completed"
  }
  ```

#### 4. Rúbrica Creada (`evalua.rubrica.created`)
Emitido cuando un mantenedor o administrador crea exitosamente una nueva rúbrica.
- **Payload:**
  ```json
  {
    "rubricaId": "uuid-rubrica-nueva",
    "titulo": "Proyecto de Ingeniería de Software",
    "status": "created"
  }
  ```
- **Nota:** Este evento es fundamental para que el Host almacene el `rubricaId` generado y pueda utilizarlo posteriormente en el claim `rubrica_id` de los JWT de evaluación.

#### 5. Configuración Actualizada (`evalua.config.updated`)
Emitido cuando un administrador modifica un parámetro de configuración.
- **Payload:**
  ```json
  {
    "clave": "ttl_borradores",
    "valor": "2592000",
    "status": "updated"
  }
  ```

#### 6. Error Fatal (`evalua.error`)
Emitido si el token JWT es inválido, expira durante el proceso, o ocurre un error irrecuperable en la base de datos MongoDB o Redis.
- **Payload:**
  ```json
  {
    "code": "INVALID_PLATFORM_KEY",
    "message": "Firma del token inválida o ID de plataforma incorrecto"
  }
  ```

---

## 6. Parámetros de Seguridad del Iframe

Para resguardar el contenedor frente a ataques de inyección, secuestro de clics (Clickjacking) y mantener un aislamiento óptimo, el servidor web de EvalUA debe despachar de forma mandatoria las siguientes cabeceras HTTP:

```http
Content-Security-Policy: frame-ancestors 'self' https://*.evalUA.cl;
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```
