# EvalUA v3.0

Sistema de Evaluación Curricular por Rúbricas — Micro-frontend iframe-driven

---

## Estructura del Proyecto

El repositorio está organizado en **cuatro directorios raíz** que representan las fases y capas del proyecto. Cada uno cumple un rol distinto dentro del ciclo de vida de desarrollo.

```
evalUA/
├── documentacion/   ← Hito base: especificaciones técnicas completas
├── mockup/          ← Maqueta interactiva: guía visual para el desarrollo
├── v0/              ← Desarrollo V0 (alpha): micro-frontend funcional
├── demo/            ← Aplicación Host demostrativa (Yii2/PHP)
└── README.md        ← Este archivo
```

---

### 📄 `documentacion/` — Especificaciones Técnicas (Hito Base)

Es el **punto de partida del proyecto**. Contiene 14 documentos que definen la totalidad del sistema, desde la base de datos hasta la planificación y mitigación de riesgos.

| # | Documento | Contenido |
|---|-----------|-----------|
| 00 | `00-indice.md` | Índice maestro, stack tecnológico, convenciones y guía de lectura por rol |
| 01 | `01-base-de-datos.md` | Esquemas NoSQL (MongoDB/Mongoose), estructura Redis y claims JWT |
| 02 | `02-controladores-api.md` | Endpoints HTTP, CRUD embebido de rúbricas, borradores en Redis |
| 03 | `03-vistas-frontend.md` | Rutas embebidas, viewport 1029×466px, wizard y componentes |
| 04 | `04-modelos-dominio.md` | Capa de dominio DDD documental: agregados Rúbrica y Evaluación |
| 05 | `05-historias-de-usuario.md` | HU-03 a HU-11: flujos funcionales y criterios de aceptación |
| 06 | `06-gobierno-de-datos.md` | Zero-knowledge, ciclo de vida de borradores TTL, clasificación de datos |
| 07 | `07-integracion-iframe.md` | Protocolo JWT de lanzamiento, eventos `postMessage`, caché Redis |
| 08 | `08-arquitectura-saas-y-estandares.md` | ADRs: Docker, MongoDB, Redis TTL, iframe-driven, paleta de colores |
| 09 | `09-planificacion.md` | Plan de desarrollo de 14 semanas (inicio 15/06/2026), Gantt y ruta crítica |
| 10 | `10-matriz-riesgo.md` | Matriz de riesgos por actividad del plan |
| 11 | `11-plan-riesgo.md` | Plan de mitigación de riesgos de diseño con tareas específicas |
| 12 | `12-seguridad-y-acceso.md` | Políticas de seguridad, JWT HS256, roles y permisos |
| 13 | `13-entorno-desarrollo-llm.md` | Configuración del entorno de desarrollo asistido por LLMs |

Adicionalmente:
- `matriz_riesgos_evalua_v3.ods` — Hoja de cálculo de riesgos
- `especificaciones/R-2.1-reglas-dominio.feature` — Especificación Gherkin de reglas de dominio

---

### 🎨 `mockup/` — Maqueta Interactiva

Prototipo visual construido para **explorar y validar la interfaz antes de codificar el sistema real**. Funciona como referencia de diseño para el desarrollo en `v0/`.

**Stack del mockup:**
- Next.js 16 + TypeScript + Tailwind CSS v4 + shadcn/ui
- Framer Motion para transiciones
- Prisma con SQLite (solo para demo, **no es el stack de producción**)
- Despliegue servido con Caddy

**Componentes de vista (`src/components/evalua/`):**

| Vista | Descripción |
|-------|-------------|
| `overview-view.tsx` | Landing page con hero, tarjetas de features y diagrama de arquitectura |
| `login-view.tsx` | Login de administrador (simulado) |
| `dashboard-view.tsx` | Métricas, tabla de evaluaciones y panel de configuración |
| `rubricas-view.tsx` | CRUD de rúbricas con constructor dinámico de criterios |
| `wizard-view.tsx` | Wizard de evaluación paso a paso (simula iframe 1029×466px) |
| `resultados-view.tsx` | Vista de resultados en solo lectura (simula iframe 1029×466px) |
| `configurar-view.tsx` | Panel de configuración del sistema |
| `usuarios-view.tsx` | Gestión de usuarios (referencia visual) |

**Características clave:**
- Simulación de roles JWT (ADMINISTRADOR, MANTENEDOR, PROFESOR, ALUMNO) con selector interactivo
- Control de acceso por rol (vistas accesibles según el rol activo)
- Navegación con tabs + dropdown móvil
- Datos mockeados en `mock-data.ts` (3 rúbricas, 8 evaluaciones)
- Paleta de colores corporativa aplicada: `#EA7600`, `#394049`, `#9DD4D3`, `#C8102E`, `#fffefd`, `#198754`
- Documentado en `worklog.md`

---

### 🚀 `v0/` — Desarrollo V0 (Alpha)

Es el **código de producción aspiracional**, implementando la arquitectura DDD documental definida en la documentación. Se encuentra en estado **WIP (en desarrollo activo)**.

**Stack real (alineado con documentación):**
- Next.js 15 (App Router) + TypeScript 5
- Mongoose 8 (MongoDB) + ioredis (Redis)
- Zustand 5 + shadcn/ui + Framer Motion
- Zod para validación de inputs
- jsonwebtoken para JWT HS256
- Docker Compose (3 servicios: app, mongodb, redis)

**Arquitectura DDD:**

```
v0/src/
├── app/
│   ├── layout.tsx              ← Layout raíz
│   ├── page.tsx                ← Página principal
│   ├── (embed)/                ← Route Group para vistas embebidas
│   │   ├── layout.tsx          ← Layout embebido (viewport 466px mínimo)
│   │   ├── evaluar/            ← Wizard de evaluación
│   │   ├── resultado/          ← Vista de resultados (solo lectura)
│   │   ├── rubricas/           ← CRUD de rúbricas
│   │   ├── dashboard/          ← Dashboard de métricas
│   │   └── configurar/         ← Configuración del sistema
│   └── api/                    ← Endpoints REST
│       ├── configuracion/
│       ├── dashboard/
│       ├── embed/              ← Launch endpoint (validación JWT)
│       ├── evaluaciones/
│       └── rubricas/
├── domain/                     ← Capa de dominio puro
│   ├── entities/
│   │   ├── rubrica.ts          ← Agregado Rúbrica
│   │   ├── evaluacion.ts       ← Agregado Evaluación (FSM)
│   │   ├── criterio.ts         ← Entidad Criterio
│   │   ├── descriptor.ts       ← Entidad Descriptor
│   │   └── puntaje.ts          ← Entidad Puntaje
│   ├── strategies/
│   │   └── evaluacion-strategy.ts  ← Estrategias Gatekeeper/Normal
│   ├── value-objects/
│   │   └── nota.ts             ← Value Object Nota (1.0–7.0)
│   ├── schemas.ts              ← Esquemas Zod de validación
│   ├── types.ts                ← Tipos TypeScript del dominio
│   └── index.ts                ← Barrel exports
├── infrastructure/             ← Capa de infraestructura
│   ├── auth/
│   │   └── jwt.ts              ← Verificación JWT HS256
│   ├── cache/
│   │   └── redis.ts            ← Cliente Redis (borradores + caché L2)
│   └── database/
│       ├── mongodb.ts          ← Conexión Mongoose
│       └── models/             ← Modelos Mongoose
└── lib/
    └── store.ts                ← Store Zustand
```

**Variables de entorno (`.env.example`):**
- `MONGODB_URI`, `REDIS_URL`, `KEY` (JWT), `ALLOWED_HOSTS`, `NEXT_PUBLIC_APP_URL`

**Docker Compose** levanta 3 servicios: `evalua-app`, `evalua-mongodb` (mongo:7), `evalua-redis` (redis:7-alpine).

---

### 🏠 `demo/` — Aplicación Host Demostrativa

Una aplicación Yii2 (PHP) que actúa como **plataforma Host simulada**, demostrando cómo un LMS o portal educativo integraría evalUA mediante iframes.

**Stack:**
- PHP 8.1 + Yii2 + firebase/php-jwt

**Funcionalidad:**
- Genera JWT de lanzamiento para cada rol y vista de evalUA
- Renderiza iframes apuntando al micro-servicio evalUA
- Endpoints por rol:
  - `actionEvaluar()` → PROFESOR (wizard de evaluación)
  - `actionResultado()` → ALUMNO (solo lectura)
  - `actionRubricas()` → MANTENEDOR (CRUD rúbricas)
  - `actionDashboard()` → ADMINISTRADOR (métricas)
  - `actionConfigurar()` → ADMINISTRADOR (configuración)
- API endpoint `actionApiGenerateToken()` para generación dinámica de tokens vía AJAX

**Docker Compose** integra ambos sistemas:
- `evalua-app` (construido desde `v0/`)
- `evalua-mongodb` + `evalua-redis`
- `demo-app` (Yii2, construido desde `demo/`)
- Red compartida `evalua-network`

---

## Relación entre secciones

```
┌─────────────────────────────────────────────────────────┐
│                    documentacion/                         │
│          (Especificaciones y planificación)               │
│                   HITO BASE                              │
└──────────────────┬──────────────────┬───────────────────┘
                   │                  │
         ┌─────────▼──────┐  ┌───────▼────────┐
         │   mockup/      │  │     v0/         │
         │  (Prototipo    │  │  (Desarrollo    │
         │   visual)      │  │   real Alpha)   │
         └────────────────┘  └───────┬─────────┘
                                     │
                           ┌─────────▼─────────┐
                           │     demo/          │
                           │  (Host Yii2 que    │
                           │   integra v0/      │
                           │   vía iframe)      │
                           └────────────────────┘
```

1. **documentacion/** define el "qué" y el "cómo" — es la fuente de verdad.
2. **mockup/** explora visualmente las soluciones antes de implementarlas — sirve como referencia de UX.
3. **v0/** implementa la especificación real con el stack de producción — es el micro-servicio.
4. **demo/** prueba la integración end-to-end Host↔evalUA — valida el contrato JWT + iframe + postMessage.

---

## Stack Tecnológico Resumen

| Componente | Tecnología |
|------------|-----------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript 5 |
| Base de datos | MongoDB (Mongoose 8) |
| Caché / Borradores | Redis (ioredis) |
| Autenticación | JWT HS256 (clave simétrica) |
| Estado frontend | Zustand 5 |
| UI | shadcn/ui + Tailwind CSS |
| Animaciones | Framer Motion |
| Validación | Zod |
| Contenedorización | Docker / Docker Compose |
| Arquitectura | DDD documental, iframe-driven, zero-knowledge |

---

## Inicio rápido

### Solo evalUA (v0)
```bash
cd v0
docker compose up --build
# → http://localhost:3000
```

### evalUA + Demo Host
```bash
cd demo
docker compose up --build
# → http://localhost:8080 (Host Yii2)
# → http://localhost:3000 (evalUA micro-servicio)
```

### Mockup (desarrollo local)
```bash
cd mockup
bun install
bun run dev
# → http://localhost:3000
```

---

## Licencia

Derechos reservados a ID3.cl