# Plan de Trabajo para la Mitigación de Riesgos de Diseño — EvalUA v3.0

Este plan de trabajo detalla los riesgos asociados a las decisiones de diseño del proyecto EvalUA v3.0, explicando sus causas raíz y enumerando las tareas específicas que deben realizarse para corregirlos y prevenirlos antes de la etapa de desarrollo completo.

---

## Matriz de Avance y Mitigación de Riesgos

La siguiente tabla sirve como una matriz de avance para el seguimiento de la mitigación de los riesgos del proyecto, integrando las actividades y artefactos recomendados por la literatura académica y el estado del arte de la ingeniería de software actual.

| ID | Riesgo de Diseño | Estado | Actividades Recomendadas (Literatura) | Artefactos Recomendados (Literatura) | Estado del Arte (State of the Art) |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **R-2.1** | Reglas de negocio/dominio mal implementadas (DDD) | `[x]` | • Colaboración en *Domain Storytelling* y *Event Storming*.<br>• Modelado de Agregados, Entidades y Objetos de Valor (Value Objects).<br>• Diseño de pruebas unitarias basadas en especificaciones (TDD/BDD). | • Diagrama de *Bounded Contexts* y mapa de contexto.<br>• Glosario de Lenguaje Ubicuo.<br>• Especificaciones ejecutables (.feature / Gherkin).<br>• Suite de pruebas unitarias del dominio. | • *Property-Based Testing* (ej. fast-check) para validación exhaustiva de la escala de notas 1.0-7.0.<br>• Tipos de datos opacos (Branded/Opaque Types) en TypeScript. |
| **R-3.1** | Acceso no autorizado o rechazo erróneo por JWT | `[x]` | • Modelado de Amenazas (STRIDE) sobre autenticación/autorización.<br>• Auditoría criptográfica de firmas de token.<br>• Especificación formal de matriz RBAC/ABAC. | • Matriz de Control de Acceso (Matriz de Permisos).<br>• Especificación de Claims de JWT (RFC 7519).<br>• Documento de Threat Modeling.<br>• Pruebas de integración de seguridad de la API. | • Aplicación de directrices *JWT Best Current Practices* (BCP RFC 8725).<br>• Motores de políticas desacoplados (como Open Policy Agent - OPA o Casbin). |
| **R-4.1** | Modificaciones no autorizadas o pérdida de versionamiento | `[x]` | • Diseño de patrones de persistencia inmutable.<br>• Modelado de Control de Concurrencia Optimista (OCC).<br>• Validación de ownership y alcances. | • Esquema físico MongoDB con versionado (Document Versioning Pattern).<br>• Historial de auditoría / Esquema de log de cambios.<br>• Tests unitarios de concurrencia y clonación. | • Uso de patrones NoSQL avanzados (Schema Versioning Pattern) para inmutabilidad.<br>• Hash criptográfico (SHA-256) para direccionamiento por contenido. |
| **R-4.3** | Doble consolidación o estados inconsistentes de nota | `[x]` | • Modelado del ciclo de vida del recurso mediante FSM.<br>• Implementación de llaves de idempotencia.<br>• Diseño de transacciones atómicas distribuidas. | • Diagrama de Máquina de Estados Finitos.<br>• Contrato de API de consolidación (cabecera `Idempotency-Key`).<br>• Pruebas de condiciones de carrera (Race Condition tests). | • Transacciones multi-documento nativas de MongoDB (con consistencia ACID).<br>• Bloqueos distribuidos basados en Redis (Redlock) para la fase crítica de consolidación. |
| **R-5.1** | Desajustes visuales o scrollbars dobles en el iframe | `[x]` | • Pruebas de compatibilidad responsiva en resoluciones fijas.<br>• Aislamiento de estilos (CSS Resets controlados).<br>• Automatización de pruebas de regresión visual (VRT). | • Guía de estilos e interfaz de usuario (UI Style Guide).<br>• Especificación técnica de dimensiones del iframe.<br>• Galería de capturas de referencia (Visual Baseline). | • Pruebas de regresión visual automatizadas con Playwright/Percy.<br>• Uso de la API `ResizeObserver` para comunicar dinámicamente dimensiones reales al Host. |
| **R-7.1** | Eventos incompatibles o inseguros entre Host e Iframe | `[x]` | • Definición de contratos de interfaz estrictos para IPC.<br>• Implementación de validaciones rígidas de origen (`postMessage` origin). | • Contrato de Mensajería y Esquema JSON de eventos.<br>• Implementación del listener con lista blanca parametrizada.<br>• Suite de pruebas unitarias de mensajería simulada. | • Validación en runtime con esquemas tipados (Zod / Valibot) en la recepción del mensaje.<br>• Uso de `MessageChannel` de la Web API para canales directos entre ventanas. |
| **R-8.3** | Fuga de privacidad / Incumplimiento Zero-Knowledge | `[ ]` | • Auditoría de Privacidad por Diseño (PbD ISO 31700).<br>• Minimización de datos y desidentificación.<br>• Configuración de políticas de seguridad web (cabeceras). | • Diagrama de Flujo de Datos (DFD) con límites de confianza.<br>• Inventario de datos clasificados (sin PII).<br>• Configuración de cabeceras HTTP (CSP, frame-ancestors). | • Escaneo automatizado y estático de PII en logs y base de datos.<br>• Uso de JSON Web Encryption (JWE) para proteger payloads en tránsito en el cliente. |
| **R-2.3** | Inconsistencia de caché o pérdida de borradores en Redis | `[ ]` | • Modelado de estrategias de caché consistentes.<br>• Análisis y definición de TTLs de caché L2 y borradores.<br>• Inyección de fallas en red y consistencia. | • Documento de políticas de caché y namespaces de llaves Redis.<br>• Diagrama de secuencia de fallas de caché y recuperación.<br>• Tests de integración de invalidación por hooks de base de datos. | • Implementación del patrón SingleFlight para mitigar el Cache Stampede bajo alta carga.<br>• Redis Sentinel/Cluster para alta disponibilidad y reconexión automática. |

---

## 1. Riesgo R-2.1: Reglas de negocio/dominio mal implementadas (DDD)

*   **Descripción del riesgo:** Que las clases de dominio, cálculos de notas o lógica de negocio (Gatekeeper, ponderaciones, escala 1.0–7.0) contengan inconsistencias matemáticas o lógicas que afecten la validez del sistema de evaluación.
*   **Causa raíz:** Falta de especificación formal y pruebas previas del modelo de datos e inconsistencias en la definición de la escala de notas. La lógica de negocio distribuida o mal encapsulada en controladores en lugar de agregados DDD.
*   **Tareas de Diseño y Resolución:**
    *   [x] **Modelado de Agregados DDD:** Diseñar la estructura de los agregados `Rubrica` (como raíz, conteniendo criterios y descriptores embebidos) y `Evaluacion` (conteniendo los puntajes obtenidos, comentarios y la nota final calculada).
    *   [x] **Algoritmo de Cálculo de Nota:** Documentar y fijar la fórmula matemática exacta para la conversión de puntajes a la escala 1.0–7.0, considerando la exigencia (ej. 60%) y validando límites inferiores y superiores.
    *   [x] **Especificación de Reglas de Negocio:** Definir formalmente las reglas del `Gatekeeper` (cuándo una evaluación puede pasar de borrador a revisión, y cuándo a completada).
    *   [x] **Casos de Prueba Unitarios Teóricos:** Diseñar la matriz de casos de prueba con valores límite (0% de logro, 60% de logro, 100% de logro, ponderaciones decimales que sumen exactamente 100%) para la validación previa de los modelos.

---

## 2. Riesgo R-3.1: Acceso no autorizado o rechazo erróneo por JWT

*   **Descripción del riesgo:** Que un usuario acceda a vistas u operaciones para las cuales no tiene autorización (ej. un alumno modificando una rúbrica o viendo resultados de otros) o que usuarios válidos sufran bloqueos injustificados (401/403).
*   **Causa raíz:** Falta de claridad en la matriz de permisos cruzada entre **Modos de Acceso** (ej. evaluar, editar rúbrica, configuración) y **Roles de Usuario** (`ADMINISTRADOR`, `MANTENEDOR`, `PROFESOR`, `ALUMNO`).
*   **Tareas de Diseño y Resolución:**
    *   [x] **Matriz de Control de Acceso (Zero-Knowledge):** Crear y documentar una tabla formal de Modo de Launch vs. Rol vs. Operaciones Permitidas en el archivo `12-seguridad-y-acceso.md`, delegando la autorización de acceso al Host.
    *   [x] **Esquema de Claims de JWT:** Definir los claims obligatorios en el token JWT HS256 emitido por el Host, integrando el arreglo `rubricas_permitidas` para delegar el control de mantenedores sin guardar usuarios en base de datos.
    *   [x] **Diseño del Middleware de Next.js:** Diseñar el flujo lógico del middleware de autenticación/autorización que interceptará las rutas `/api/embed/*` y `/api/admin/*`.
    *   [x] **Contratos de Respuesta de Error:** Definir los payloads JSON estándar para respuestas HTTP `401 Unauthorized` y `403 Forbidden` que indiquen claramente la causa sin revelar información sensible.

---

## 3. Riesgo R-4.1: Modificaciones no autorizadas o pérdida de versionamiento en rúbricas

*   **Descripción del riesgo:** Que un profesor o mantenedor modifique una rúbrica que está siendo usada activamente en evaluaciones en curso, alterando retroactivamente las calificaciones históricas.
*   **Causa raíz:** Estrategia de persistencia mutable sobre las rúbricas, donde las actualizaciones sobreescriben los documentos existentes en MongoDB en lugar de versionarlos.
*   **Tareas de Diseño y Resolución:**
    *   [x] **Diseño de Rúbricas Inmutables:** Definir un modelo de datos donde las rúbricas publicadas sean inmutables. Cualquier modificación debe generar un nuevo documento con un incremento de versión (`version: 2`) o un nuevo UUID de rúbrica.
    *   [x] **Esquema de Asociación:** Diseñar el esquema de `Evaluacion` para que apunte al UUID y versión específicos de la `Rubrica` con la que se creó, o embeber una copia congelada de la rúbrica al iniciar la evaluación.
    *   [x] **Control de Ownership:** Diseñar en la capa de datos la validación de propiedad de las rúbricas para asegurar que un usuario solo pueda crear o clonar versiones en los contextos de plataforma autorizados (`id_plataforma`).

---

## 4. Riesgo R-4.3: Doble consolidación o estados inconsistentes de nota

*   **Descripción del riesgo:** Que una evaluación completada sea modificada posteriormente, o que peticiones simultáneas dupliquen los registros o alteren los estados lógicos de la evaluación.
*   **Causa raíz:** Falta de un control transaccional adecuado y la ausencia de bloqueos por concurrencia durante la transición de estado al finalizar la evaluación.
*   **Tareas de Diseño y Resolución:**
    *   [x] **Máquina de Estados de la Evaluación:** Diseñar la máquina de estados lógica para el modelo `Evaluacion` (`EN_PROGRESO` -> `EN_REVISION` -> `COMPLETADA`).
    *   [x] **Mecanismo de Bloqueo Post-Finalización:** Diseñar la lógica del backend para que una vez que el estado sea `COMPLETADA`, cualquier petición de modificación retorne inmediatamente un HTTP `409 Conflict`.
    *   [x] **Estrategia de Transición Atómica (Mongoose):** Diseñar el flujo de consolidación que realice de manera atómica:
        1. Leer el borrador de Redis.
        2. Validar con el Gatekeeper.
        3. Persistir la evaluación final en MongoDB (con OCC y cabecera `Idempotency-Key`).
        4. Eliminar de forma segura el borrador en Redis.

---

## 5. Riesgo R-5.1: Desajustes visuales o scrollbars dobles en el iframe

*   **Descripción del riesgo:** Degradación de la experiencia de usuario debido a elementos recortados, fuentes ilegibles o la aparición de scrollbars horizontales/verticales que arruinen el diseño embebido.
*   **Causa raíz:** La interfaz de EvalUA excede el viewport fijo definido de `1029×466` píxeles, o carece de control explícito del desbordamiento CSS.
*   **Tareas de Diseño y Resolución:**
    *   [x] **Guía de Estilos y Viewport Fijo:** Definir en `index.css` y las variables de Tailwind/CSS un contenedor raíz estricto con dimensiones máximas de `1029px` de ancho y `466px` de alto.
    *   [x] **Control del Overflow CSS:** Configurar el body y el contenedor principal con `overflow: hidden` para evitar scrollbars externos, implementando scroll local (`overflow-y: auto`) únicamente en paneles de contenido dinámico (como el listado de criterios).
    *   [x] **Diseño UX Compacto:** Diseñar los layouts del Wizard de Evaluación, CRUD de Rúbricas y Resultados optimizando los espaciados (*paddings*, *margins*) para pantallas de bajo alto vertical.
    *   [x] **Maquetación sin Modales Flotantes Externos:** Diseñar elementos de diálogo y alertas integrados en la UI (inline) o modales que se autolimiaten al contenedor del iframe, evitando que sobresalgan del viewport.

---

## 6. Riesgo R-7.1: Eventos incompatibles o inseguros entre Host e Iframe

*   **Descripción del riesgo:** Que el Host no reciba las notificaciones de EvalUA (ej. evaluación finalizada) o que atacantes inyecten mensajes maliciosos en los listeners de `postMessage`.
*   **Causa raíz:** Falta de un contrato de interfaz común estricto para la API de eventos de mensajería y la ausencia de validación de dominios de origen.
*   **Tareas de Diseño y Resolución:**
    *   [x] **Contrato de Mensajería en TypeScript:** Crear un archivo de tipos común (`types/events.ts`) que defina la estructura de los payloads para todos los eventos del ciclo de vida (`evalua.ready`, `evalua.evaluation.completed`, etc.).
    *   [x] **Esquema de Validaciones de Origen:** Diseñar la función receptora en el iframe y en el Host para comprobar rigurosamente el origen del mensaje (`event.origin === hostUrl`).
    *   [x] **Estrategia de Handshake:** Diseñar el flujo de inicialización del iframe para que envíe un evento `evalua.ready` y espere la respuesta de confirmación del Host antes de habilitar la interacción.

---

## 7. Riesgo R-8.3: Fuga de privacidad / Incumplimiento Zero-Knowledge

*   **Descripción del riesgo:** Exposición de datos personales de estudiantes o profesores ante brechas de seguridad o logs en el servidor EvalUA.
*   **Causa raíz:** Diseño de base de datos que incluye campos como nombres, correos electrónicos, identificadores nacionales (RUT) o datos demográficos de las personas evaluadas.
*   **Tareas de Diseño y Resolución:**
    *   [ ] **Arquitectura de Datos Sin PII:** Auditar y diseñar el esquema físico de MongoDB para asegurar que no existan colecciones ni campos que almacenen datos personales.
    *   [ ] **Mapeo de Identificadores Opacos:** Diseñar el flujo para que EvalUA solo procese identificadores sintéticos y anónimos (`usuario_id`, `evaluacion_id`), delegando la resolución de nombres e identidades al Host.
    *   [ ] **Hardening de Cabeceras de Seguridad:** Diseñar la configuración de cabeceras HTTP (`Content-Security-Policy: frame-ancestors`, `X-Frame-Options`, `X-Content-Type-Options`) para limitar qué dominios pueden embeber a EvalUA.
    *   [ ] **Estrategia de Sanitización de Logs:** Diseñar interceptores de logs para prevenir la escritura accidental de tokens JWT o payloads completos que pudieran contener datos en archivos de registro.

---

## 8. Riesgo R-2.3: Inconsistencia de caché o pérdida de borradores en Redis

*   **Descripción del riesgo:** Que el evaluador pierda el avance de su trabajo al expirar el borrador antes de tiempo, o que el sistema muestre rúbricas obsoletas debido a una mala invalidación de caché L2.
*   **Causa raíz:** Asignación arbitraria de tiempos de vida (TTL) a las llaves de Redis y falta de un mecanismo de sincronización e invalidación ante actualizaciones de bases de datos.
*   **Tareas de Diseño y Resolución:**
    *   [ ] **Estrategia de Nombres de Llaves y TTL:** Definir formalmente las llaves:
        *   `draft:{evaluacionId}` con un TTL estricto de 30 días para borradores de evaluaciones.
        *   `cache:rubrica:{rubricaId}` con un TTL de 24 horas para la caché L2 de rúbricas.
    *   [ ] **Lógica de Invalidación de Caché:** Diseñar ganchos (*hooks* o *subscribers*) en Mongoose para que ante cualquier actualización de una rúbrica, se elimine de inmediato la correspondiente llave `cache:rubrica:{rubricaId}` en Redis.
    *   [ ] **Diseño de Fallback de Lectura (Cache-Aside):** Diseñar el flujo de lectura para que ante un Redis descoyuntado o un caché MISS, la aplicación consulte de forma transparente a MongoDB y repueble la caché de Redis.
