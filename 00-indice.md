# Documentación Técnica — EvalUA

## Sistema de Evaluación Curricular por Rúbricas Autocontenido (Micro-frontend NoSQL)

**Versión:** 3.0  
**Fecha:** Junio 2026  
**Arquitectura:** DDD (Domain-Driven Design) con Next.js 16 + Mongoose + MongoDB + Redis + Contenedor Docker + Modo Iframe Embebido (Zero-Knowledge)

---

## Índice de Documentos

| # | Documento | Descripción |
|---|-----------|-------------|
| 01 | [Base de Datos](./01-base-de-datos.md) | Estructura NoSQL (MongoDB), jerarquía de esquemas embebidos de Mongoose, estructura de llaves/caching en Redis y claims de JWT. |
| 02 | [Controladores API](./02-controladores-api.md) | Endpoints HTTP del micro-frontend, incluyendo validación de roles en endpoint de lanzamiento, CRUD embebido de rúbricas y almacenamiento de borradores en Redis. |
| 03 | [Vistas Frontend](./03-vistas-frontend.md) | Rutas embebidas bajo el Route Group (embed) con viewport estricto de 1029x466px: wizard interactivo, resultados single-open, CRUD de rúbricas, dashboard y configuración. |
| 04 | [Modelos de Dominio](./04-modelos-dominio.md) | Capa de dominio puro (DDD) documental: Agregados de Rúbrica y Evaluación representados directamente como documentos estructurados NoSQL. |
| 05 | [Historias de Usuario](./05-historias-de-usuario.md) | Historias de usuario funcionales que definen el comportamiento de la creación de rúbricas, lanzamiento, visualización por rol e interacción con iframes. |
| 06 | [Gobierno de Datos](./06-gobierno-de-datos.md) | Políticas de privacidad "zero-knowledge", ciclo de vida de borradores por TTL en Redis y clasificación de datos por sensibilidad. |
| 07 | [Integración Host/Iframe y APIs](./07-integracion-iframe.md) | Protocolo de integración mediante JWT de lanzamiento simétrico (`KEY`), eventos de UI por `postMessage` e inyección/consulta de resultados optimizados por caché Redis. |
| 08 | [Arquitectura SaaS y Estándares](./08-arquitectura-saas-y-estandares.md) | ADRs de empaquetamiento Docker, base de datos documental MongoDB, persistencia de borradores en Redis (TTL), arquitectura iframe-driven y paleta de colores corporativos. |
| 09 | [Planificación](./09-planificacion.md) | Plan de desarrollo detallado para EvalUA v3.0, roles de proyecto y ruta crítica. |
| 10 | [Matriz de Riesgo](./10-matriz-riesgo.md) | Matriz de riesgo detallada por actividad del plan Gantt. |
| 11 | [Plan de Mitigación de Riesgos de Diseño](./11-plan-riesgo.md) | Definición de riesgos de diseño, causas raíz y plan de trabajo con tareas específicas para su resolución. |

---

## Guía de Lectura por Rol

### Arquitecto de Software
- `08-arquitectura-saas-y-estandares.md` — ADRs de base de datos documental MongoDB, Redis TTL y topologías de contenedor.
- `07-integracion-iframe.md` — Arquitectura de lanzamiento por JWT y eventos `postMessage` con optimización en caché.
- `04-modelos-dominio.md` — Estructura del dominio DDD documental (agregados mapeados a documentos).

### Desarrollador Backend
- `07-integracion-iframe.md` — Verificación de firmas JWT simétricas y contratos de integración.
- `02-controladores-api.md` — Especificación de rutas de API REST (borradores en Redis, consolidación en MongoDB).
- `01-base-de-datos.md` — Esquemas de Mongoose y llaves/expiraciones de Redis.

### Desarrollador Frontend
- `03-vistas-frontend.md` — Layouts de administración/embebido, Wizard de 1029x466px y componentes interactivos.
- `07-integracion-iframe.md` — Envío de eventos por `postMessage` y control del flujo del iframe.
- `05-historias-de-usuario.md` — Flujos y criterios de aceptación.

### DBA / Administrador de Infraestructura
- `01-base-de-datos.md` — Colecciones MongoDB, índices, llaves y estructuras de almacenamiento.
- `08-arquitectura-saas-y-estandares.md` — Configuración de Docker Stack / Docker Compose y variables de entorno.
- `06-gobierno-de-datos.md` — Gobierno de datos NoSQL y retención por TTL.

### PM / Jefe de Proyecto / Tech Lead
- `09-planificacion.md` — Plan de desarrollo detallado, carta Gantt resumida y ruta crítica.
- `10-matriz-riesgo.md` — Matriz de riesgos detallada para las actividades del plan.
- `11-plan-riesgo.md` — Plan de trabajo y tareas específicas para mitigar riesgos de diseño.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Empaquetamiento** | Docker / Docker Compose (Next.js, MongoDB y Redis) |
| **Framework** | Next.js 16 (App Router) |
| **Lenguaje** | TypeScript 5 |
| **ORM / Base de Datos Principal** | Mongoose 8 (MongoDB) |
| **Almacén Temporal / Caché** | Redis (ioredis / Redis Server) |
| **Autenticación Host** | JWT simétrico (Algoritmo HS256 mediante clave `KEY` de 256 bits) |
| **Estado Frontend** | Zustand 5 |
| **Componentes / CSS** | shadcn/ui + Vanilla CSS (Variables corporativas evalUA) |
| **Interacciones** | Framer Motion (Transiciones de wizard paso a paso) |

---

## Convenciones del Proyecto

- **Filosofía Zero-Knowledge:** EvalUA no almacena identidades humanas (ni de alumnos, profesores, mantenedores o administradores). No existe base de datos de usuarios locales. Todo el mapeo de contexto e identidades recae en el Host.
- **Identificación de Evaluación:** Las evaluaciones son identificadas por un ID único en formato `String` provisto por el Host en el JWT. Si el Host no lo provee (es nulo), EvalUA genera un UUID y lo devuelve en el evento de completado.
- **Estructura Jerárquica Documental:** Los criterios y descriptores se guardan embebidos en el documento de Rúbrica. Los puntajes calificados se guardan embebidos en el documento de Evaluación.
- **Escala de Notas:** 1.0 a 7.0 con aprobación en 4.0.
- **Estrategias de Cálculo:** `Gatekeeper` (si un ítem excluyente reprueba, la evaluación se reprueba automáticamente) y `Normal` (promedio ponderado).
- **Dimensión Iframe:** Fijo de **1029 px de ancho x 466 px de alto**. Toda la interacción del wizard de evaluación debe caber y ser totalmente responsiva dentro de esta superficie sin activar scrollbars globales en el documento raíz.
- **Firmado del Token:** Toda comunicación cruzada (lanzamiento, resultados y administración embebida) requiere un JWT firmado con un secreto simétrico HMAC-SHA256 configurado en la variable de entorno `KEY`.
- **Expiración de Borradores:** Los borradores inactivos son purgados automáticamente de Redis por su tiempo de vida nativo (TTL).
