# Entorno de Desarrollo LLM — EvalUA v3.0

> Este documento describe la configuración completa del entorno de desarrollo optimizado para trabajar con LLMs (Large Language Models) en el proyecto EvalUA.

---

## 1. Visión General

EvalUA v3.0 está configurado para ser desarrollado asistido por múltiples LLMs simultáneamente. El entorno incluye:

| Componente | Ubicación | Propósito |
|-----------|-----------|-----------|
| **Reglas de Cline** | `.cline/rules/` | Reglas globales que el LLM siempre sigue |
| **Skills de Cline** | `.cline/skills/` | Habilidades especializadas activables |
| **Hooks de Git** | `.cline/hooks/` | Automatización pre/post commit |
| **Agentes** | `.cline/agents/` | Perfiles especializados de LLM |
| **Cursor Rules** | `.cursor/rules/` | Compatibilidad con Cursor IDE |
| **GitHub Prompts** | `.github/prompts/` | Compatibilidad con GitHub Copilot |
| **VS Code Settings** | `.vscode/` | Configuración del editor |
| **MCP Gateway** | `.mcp.json` | Conexión a Docker MCP |

---

## 2. Reglas (`.cline/rules/`)

Las reglas son instrucciones que el LLM SIEMPRE debe seguir al generar código. Se cargan automáticamente.

### 2.1 `architecture.md`
Define la arquitectura del proyecto:
- Stack tecnológico obligatorio (Next.js 16, Mongoose 8, Redis, etc.)
- Patrón DDD documental (agregados = documentos MongoDB)
- Separación de capas (domain → application → infrastructure → presentation)
- Arquitectura Iframe-Driven (1029×466px)
- Zero-Knowledge Policy (sin colección de usuarios)
- Docker Compose (3 servicios)
- Variables de entorno requeridas

### 2.2 `coding-standards.md`
Estándares de código:
- TypeScript estricto (sin `any`)
- Enums como `as const` objects
- Naming: kebab-case (archivos), PascalCase (componentes), camelCase (variables)
- Validación con Zod en TODOS los inputs
- Errores API en formato RFC 7807
- Testing con Vitest (unit), mongodb-memory-server (integration), Playwright (E2E)

### 2.3 `security.md`
Reglas de seguridad inquebrantables:
- Zero-Knowledge: NUNCA crear colección de usuarios
- JWT HS256 con claims específicos (`rol`, `id_plataforma`, `usuario_id`, `rubricas_permitidas`)
- Middleware que intercepta TODAS las rutas `/api/embed/*` y `/api/admin/*`
- Cabeceras CSP, HSTS, X-Content-Type-Options
- Logs sanitizados (Pino.js con redact)
- RBAC estricto por rol

### 2.4 `domain.md`
Reglas de negocio del dominio:
- Suma ponderaciones rúbrica = 1.0 (±0.001)
- FSM de evaluación: EN_PROGRESO → EN_REVISION → COMPLETADA
- Gatekeeper: criterio excluyente < 4.0 → nota = 1.0
- Inmutabilidad post-cálculo (COMPLETADA es inmutable)
- Borradores en Redis (TTL 30 días), consolidados en MongoDB
- Caché L2 para rúbricas

---

## 3. Skills (`.cline/skills/`)

Las skills son habilidades especializadas que se activan bajo demanda.

### 3.1 `ddd-scaffolding.md`
**Activa cuando:** "Crear entidad", "Nuevo agregado", "Scaffolding DDD"

Genera automáticamente la estructura de 4 capas para una nueva entidad:
- Domain: entities, value-objects, errors
- Application: use-cases CRUD
- Infrastructure: Mongoose model, repository, cache
- Presentation: components, hooks
- API: routes protegidos con JWT

### 3.2 `gherkin-test-generator.md`
**Activa cuando:** "Generar tests", "Testear feature", archivo `.feature` nuevo

Transforma archivos `.feature` (Gherkin) en tests ejecutables con Vitest:
- Lee escenarios Given/When/Then
- Genera step definitions
- Genera tests de dominio puro
- Genera tests de integración

### 3.3 `api-route-generator.md`
**Activa cuando:** "Crear endpoint", "Nueva API route", "CRUD endpoint"

Genera API routes protegidas para Next.js App Router:
- JWT verification obligatorio
- Validación Zod de inputs
- RBAC por rol del JWT
- Respuestas RFC 7807
- Filtro por `id_plataforma`

### 3.4 `iframe-component-generator.md`
**Activa cuando:** "Crear vista iframe", "Componente embed", "Wizard step"

Genera componentes React optimizados para 1029×466px:
- Contenedor con dimensiones fijas
- ScrollArea de shadcn/ui
- Framer Motion transitions
- Layout compacto (una columna)
- Paleta de colores corporativa

### 3.5 `docker-compose-generator.md`
**Activa cuando:** "Configurar Docker", "Docker Compose", "Container setup"

Genera y mantiene la configuración de Docker:
- 3 servicios (app, mongodb, redis)
- Healthchecks obligatorios
- Volumes nombrados
- Dockerfile multi-stage para Next.js

---

## 4. Hooks (`.cline/hooks/`)

### 4.1 `pre-commit-lint.md`
**Ejecuta ANTES de cada commit:**
1. TypeScript type check (`tsc --noEmit`)
2. ESLint con fix (`eslint . --fix --max-warnings=0`)
3. Prettier format check
4. Detección de secrets hardcodeados (`secretlint`)

**Bloquea el commit si** hay errores de TS, warnings de ESLint, o secrets detectados.

### 4.2 `post-commit-test.md`
**Ejecuta DESPUÉS de cada commit:**
1. Tests de dominio con Vitest (rápidos, sin dependencias externas)

**No bloquea** — es informativo para detectar regresiones tempranas.

---

## 5. Agentes (`.cline/agents/`)

Los agentes son perfiles especializados que definen cómo debe comportarse el LLM en contextos específicos.

### 5.1 `domain-architect.md`
**Rol:** Arquitecto de dominio DDD

Responsabilidades:
- Revisar diseños de agregados
- Validar invariantes de negocio
- Proteger la pureza del dominio (sin dependencias de framework)
- Definir Value Objects
- Supervisar separación de capas

### 5.2 `security-guardian.md`
**Rol:** Ingeniero de seguridad

Responsabilidades:
- Auditar JWT en cada endpoint
- Proteger contra XSS, Clickjacking
- Sanitizar logs
- Validar RBAC
- Verificar Zero-Knowledge compliance

### 5.3 `test-engineer.md`
**Rol:** Ingeniero de testing BDD/TDD

Responsabilidades:
- Generar tests desde archivos `.feature`
- Proteger invariantes de dominio con tests
- Mantener cobertura ≥ 80%
- Mockear infraestructura en tests de dominio
- Documentar escenarios como tests legibles

---

## 6. Compatibilidad Multi-Editor

### 6.1 Cursor IDE (`.cursor/rules/`)
Archivo `evalua.mdc` con reglas globales comprimidas para Cursor.
- Se aplica a `**/*.ts` y `**/*.tsx`
- Contiene las reglas esenciales del proyecto

### 6.2 GitHub Copilot (`.github/prompts/`)
Prompts reutilizables para GitHub Copilot Chat:
- `crear-entidad-ddd.prompt.md` — Scaffolding de entidad DDD
- `crear-vista-iframe.prompt.md` — Generación de vista iframe

### 6.3 VS Code (`.vscode/`)
- `settings.json` — Formateo, ESLint, rulers, etc.
- `extensions.json` — Extensiones recomendadas

---

## 7. MCP Gateway (Docker)

### Configuración
```json
// .mcp.json
{
  "mcpServers": {
    "docker": {
      "transport": "sse",
      "url": "http://localhost:8089"
    }
  }
}
```

### Iniciar el Gateway
```bash
docker mcp gateway run --transport sse --port 8089
```

### Capacidades del Gateway Docker
- Gestionar contenedores Docker
- Construir y ejecutar imágenes
- Administrar redes y volúmenes
- Ver logs de contenedores
- Ejecutar comandos dentro de contenedores

---

## 8. Flujo de Trabajo Recomendado

### 8.1 Inicio del Día
```bash
# 1. Iniciar Docker MCP Gateway
docker mcp gateway run --transport sse --port 8089

# 2. Levantar el stack de EvalUA
docker compose up -d

# 3. Verificar salud de servicios
docker compose ps
```

### 8.2 Desarrollo de Nueva Funcionalidad
1. **Leer documentación** relevante en `documentacion/`
2. **Leer feature files** en `documentacion/especificaciones/`
3. **Activar skill** apropiada (DDD scaffolding, API route, etc.)
4. **Generar código** siguiendo las reglas de `.cline/rules/`
5. **Ejecutar tests** con `vitest`
6. **Commit** (hooks automáticos verifican calidad)

### 8.3 Revisión de Código
1. Activar agente **Domain Architect** para revisar diseño de agregados
2. Activar agente **Security Guardian** para auditar seguridad
3. Activar agente **Test Engineer** para verificar cobertura de tests

### 8.4 Despliegue
```bash
# Build de producción
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# Deploy
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 9. Estructura de Directorios Completa

```
evalUA/
├── .cline/
│   ├── rules/
│   │   ├── architecture.md      # Reglas de arquitectura
│   │   ├── coding-standards.md  # Estándares de código
│   │   ├── domain.md            # Reglas de dominio
│   │   └── security.md          # Reglas de seguridad
│   ├── skills/
│   │   ├── api-route-generator.md
│   │   ├── ddd-scaffolding.md
│   │   ├── docker-compose-generator.md
│   │   ├── gherkin-test-generator.md
│   │   └── iframe-component-generator.md
│   ├── hooks/
│   │   ├── pre-commit-lint.md
│   │   └── post-commit-test.md
│   └── agents/
│       ├── domain-architect.md
│       ├── security-guardian.md
│       └── test-engineer.md
├── .cursor/
│   └── rules/
│       └── evalua.mdc
├── .github/
│   └── prompts/
│       ├── crear-entidad-ddd.prompt.md
│       └── crear-vista-iframe.prompt.md
├── .vscode/
│   ├── settings.json
│   └── extensions.json
├── .mcp.json
├── .env.example
├── .gitignore
├── documentacion/
│   ├── 00-indice.md
│   ├── 01-base-de-datos.md
│   ├── 02-controladores-api.md
│   ├── 03-vistas-frontend.md
│   ├── 04-modelos-dominio.md
│   ├── 05-historias-de-usuario.md
│   ├── 06-gobierno-de-datos.md
│   ├── 07-integracion-iframe.md
│   ├── 08-arquitectura-saas-y-estandares.md
│   ├── 09-planificacion.md
│   ├── 10-matriz-riesgo.md
│   ├── 11-plan-riesgo.md
│   ├── 12-seguridad-y-acceso.md
│   ├── 13-entorno-desarrollo-llm.md  ← ESTE DOCUMENTO
│   └── especificaciones/
│       └── R-2.1-reglas-dominio.feature
└── README.md
```

---

## 10. Resumen de Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `docker compose up -d` | Levantar stack completo |
| `docker compose down` | Detener stack |
| `docker compose logs -f` | Ver logs en tiempo real |
| `npm run dev` | Iniciar Next.js en desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | Ejecutar ESLint |
| `npm run type-check` | Verificar tipos TypeScript |
| `npm run format` | Formatear con Prettier |
| `npm run test` | Ejecutar tests con Vitest |
| `npm run test:coverage` | Tests con reporte de cobertura |
| `npm run test:e2e` | Tests E2E con Playwright |
