# evalUA

Sistema de evaluación por rúbricas embebible (micro‑frontend iframe‑fronted)

Estado: WIP (en desarrollo)

## Resumen

evalUA es un micro‑frontend diseñado para integrarse dentro de plataformas Host (LMS, portales educativos, intranets). Se ofrece como una interfaz embebida en un iframe de tamaño fijo que permite crear, mantener y usar rúbricas para evaluar actividades mediante un wizard interactivo con auto‑guardado. El servicio separa la experiencia del Host (navegación, identidad) de la experiencia de evaluación, delegando la presentación y la lógica de evaluación al iframe.

Principales puntos:
- Presentación: iframe fijo 1029 × 466 px (sin scroll). Vistas embebidas para evaluar, ver resultados, administrar rúbricas, dashboard y configuración.
- Persistencia: MongoDB (Mongoose) para datos definitivos; Redis para borradores y caché L2.
- Integración: lanzamiento mediante JWT simétrico (HS256); comunicación con Host por Window.postMessage.

## Características principales

- Wizard interactivo de evaluación, paso a paso por criterio.
- Auto‑guardado de borradores en Redis (TTL configurable, por defecto 30 días).
- Persistencia inmutable de evaluaciones completadas en MongoDB.
- CRUD de rúbricas con criterios y descriptores embebidos (agregado documental DDD).
- Vistas embebidas:
  - /embed/evaluar  — wizard de evaluación
  - /embed/resultado — vista de solo lectura del resultado
  - /embed/rubricas — mantenimiento de rúbricas
  - /embed/dashboard — métricas e historial
  - /embed/configurar — configuración global
- Contrato de eventos postMessage para notificar al Host (ej.: evalua.ready, evalua.evaluation.completed, evalua.rubrica.created, evalua.error).
- Filosofía Zero‑Knowledge: no almacenar identidades; el Host provee trazabilidad mediante claims del JWT.

## Stack tecnológico

- Framework / UI: Next.js 16 (App Router)
- Lenguaje: TypeScript 5
- Base de datos principal: MongoDB (Mongoose)
- Caché / almacén en memoria: Redis (ioredis recomendado)
- Estado frontend: Zustand
- Componentes / estilos: shadcn/ui, CSS variables corporativas
- Animaciones: Framer Motion
- Contenerización: Docker / Docker Compose
- Autenticación/Integración: JWT simétrico (HS256)

(Ver archivos de documentación del repo para confirmación de versiones exactas.)

## Integración con Host (cómo usar el iframe)

1. El Host genera un JWT de lanzamiento firmado con la clave simétrica (algoritmo HS256). El token debe incluir claims requeridos (ver sección JWT).
2. El Host inserta un iframe apuntando a la ruta embebida adecuada, añadiendo el token como query param: `/embed/evaluar?jwt={launchToken}`.
3. EvalUA valida el JWT en backend y, si es correcto, inicializa la vista y emite `postMessage` al parent (`evalua.ready`).
4. Durante la evaluación el iframe guarda borradores en Redis y, al finalizar, persiste en MongoDB y emite `evalua.evaluation.completed`.

Ejemplo HTML mínimo:

```html
<iframe
  src="https://evalua.microservice.local/embed/evaluar?jwt=JWT_LANZAMIENTO"
  width="1029"
  height="466"
  style="width:1029px;height:466px;border:0;overflow:hidden;"
  scrolling="no"
></iframe>
```

Importante: El Host debe respetar las dimensiones y no permitir scroll; de lo contrario la UX puede romperse.

## Contrato JWT (claims importantes)

El JWT de lanzamiento debe incluir, como mínimo:

- iss: emisor (sistema Host)
- aud: "evalua-microservice"
- id_plataforma: identificador de la plataforma Host (debe coincidir con ENV.ID_PLATAFORMA en el servicio)
- rol: uno de ADMINISTRADOR, MANTENEDOR, PROFESOR, ALUMNO
- rubrica_id: (cuando aplica) UUID de la rúbrica a usar
- evaluacion_id: (opcional) id proporcionado por el Host para la evaluación
- usuario_id: identificador del usuario (trazabilidad, no almacenado como identidad local)
- iat, exp: tiempos de emisión/expiración (se recomienda exp corta — p. ej. 5 minutos)

Políticas adicionales:
- El rol ALUMNO sólo puede pedir `/embed/resultado`.
- El servicio valida que `id_plataforma` coincida con la configuración del micro‑servicio.

## Contrato postMessage (eventos relevantes)

Eventos emitidos por EvalUA al Host (payloads resumidos):

- evalua.ready — notifica rubricaId y evaluacionId existentes.
- evalua.evaluation.reviewing — cuando el evaluador llega a la pantalla de resumen (notaProvisional, estado).
- evalua.evaluation.completed — cuando la evaluación se guarda finalmente (evaluacionId, status).
- evalua.rubrica.created — cuando se crea una nueva rúbrica (rubricaId, titulo).
- evalua.config.updated — cambios en configuración (clave, valor).
- evalua.error — errores críticos (códigos y mensajes).

Utiliza Window.postMessage y sigue el envelope JSON definido por el micro‑servicio.

## Modelo de datos y comportamiento (high level)

- Rubricas: documentos con criterios y descriptores embebidos.
- Evaluaciones: documentos inmutables con puntajes embebidos.
- Redis: llave `draft:{evaluacionId}` para borradores (JSON) con TTL por defecto 30 días; cache L2 `cache:rubrica:{rubricaId}` con TTL 24h.
- Ciclo típico: al abrir el iframe se busca la rúbrica en Redis (HIT rápido), si no existe se consulta MongoDB y se refresca la caché en Redis. Al finalizar una evaluación se persiste en MongoDB y se elimina el borrador de Redis.

## Variables de entorno recomendadas

- NODE_ENV=production|development
- PORT=3000
- DATABASE_URL (MongoDB connection string)
- REDIS_URL (Redis connection)
- KEY (clave simétrica para firmar/verificar JWT; 256‑bit recomendado)
- ID_PLATAFORMA (identificador que el Host debe enviar en el JWT)
- IFRAME_ALLOWED_ORIGINS (lista blanca opcional para comprobación adicional)

## Docker

Este proyecto está pensado para ejecutarse en contenedores. Ejemplo básico:

- Construir imagen: `docker build -t evalua-service .`
- Levantar con docker‑compose: `docker-compose up -d --build` (si existe docker-compose.yml en el repo)

## Seguridad

- Validar siempre el JWT de lanzamiento y `id_plataforma`.
- Configurar cabeceras CSP (frame-ancestors) y X-Content-Type-Options, Referrer-Policy.
- Restringir origenes permitidos para cargar el iframe; valida `postMessage` origen y origen esperado en el Host.
- No almacenar identidades locales. Registrar sólo los identificadores y trazas necesarias.

## Tests

- Ejecutar la suite de tests si existe (p. ej. `npm test` o `pnpm test`).
- Recomendar pruebas de integración sobre el flujo iframe ⇄ Host y la persistencia Redis→Mongo.

## Cómo contribuir

1. Haz fork y crea una rama descriptiva: `git checkout -b feat/mi-cambio`.
2. Implementa cambios y añade tests.
3. Abre un Pull Request describiendo el cambio y su motivación.

## Licencia

Revisa el archivo LICENSE incluido en el repositorio. Añade la licencia correcta si procede.

---

README generado y añadido al repositorio por `alphadx` (asistente). Ajusta secciones específicas (dependencias y versiones) si quieres que extraiga y liste package.json y lockfiles.
