# EvalUA v3.0 — Manual de Usuario y Documentación Técnica

> **Versión:** 3.0  
> **Última actualización:** 2026-06-15  
> **Audiencia:** Usuarios finales, desarrolladores, integradores, LLMs asistentes  
> **Idioma:** Español (Chile)

---

## Índice General

| # | Documento | Descripción |
|---|-----------|-------------|
| 1 | [Este documento](#1-visión-general) | Visión general, conceptos clave y guía de usuario |
| 2 | [api-reference.md](./api-reference.md) | Referencia completa de la API REST (endpoints, schemas, errores) |
| 3 | [integracion-iframe.md](./integracion-iframe.md) | Cómo embeber EvalUA en un iframe (Host → EvalUA) |
| 4 | [ejemplos-integracion.md](./ejemplos-integracion.md) | Ejemplos de integración en Python, PHP, Java, Node.js, C# |
| 5 | [demo-setup.md](./demo-setup.md) | Cómo levantar el demo completo con Docker Compose |
| 6 | [modelos-datos.md](./modelos-datos.md) | Modelos de dominio, esquemas MongoDB y tipos TypeScript |
| 7 | [jwt-claims.md](./jwt-claims.md) | Especificación completa del JWT y claims por rol |

---

## 1. Visión General

### 1.1 ¿Qué es EvalUA?

EvalUA es un **micro-frontend de evaluación curricular por rúbricas** diseñado para ser embebido dentro de un sistema LMS (Learning Management System) existente mediante un `<iframe>`. Opera bajo el principio de **Zero-Knowledge**: no almacena datos personales de estudiantes ni mantiene su propia gestión de usuarios.

**Características principales:**

- **Zero-Knowledge Privacy**: Toda autenticación proviene del JWT emitido por el sistema Host
- **Rúbricas embebidas**: Criterios y descriptores viven dentro del documento rúbrica (MongoDB)
- **Gatekeeper**: Criterio excluyente con nota < 4.0 → nota final = 1.0
- **Auto-save**: Borradores en Redis con TTL de 30 días
- **Cache L2**: Rúbricas en Redis con latencia < 5ms
- **Versionado inmutable**: Si una rúbrica tiene evaluaciones, las ediciones crean nueva versión

### 1.2 Arquitectura

```
┌──────────────┐     JWT      ┌──────────────────┐    ┌─────────┐    ┌─────────┐
│   LMS Host   │──────────────▶│   EvalUA (iframe) │───▶│  Redis  │    │ MongoDB │
│  (Yii2, etc) │  iframe src   │   Next.js 16      │    │ (cache) │    │ (datos) │
└──────────────┘               └──────────────────┘    └─────────┘    └─────────┘
```

**Stack tecnológico:**
- **Frontend/API**: Next.js 16 (App Router) + TypeScript 5
- **Base de datos**: MongoDB 7 (Mongoose 8)
- **Cache**: Redis 7 (ioredis)
- **UI**: Tailwind CSS v4 + Framer Motion v12
- **Validación**: Zod v3
- **Auth**: JWT HS256 (jsonwebtoken)
- **Contenedores**: Docker Compose (3 servicios)

### 1.3 Roles de Usuario

| Rol | Descripción | Acceso API | Acceso Vistas |
|-----|-------------|------------|---------------|
| `ADMINISTRADOR` | Gestión completa del sistema | Todas las API | Dashboard, Configuración |
| `MANTENEDOR` | Creación/edición de rúbricas | Rubricas CRUD, Dashboard (propio) | Rubricas |
| `PROFESOR` | Evaluación de trabajos | Evaluaciones, Drafts | Evaluar (wizard) |
| `ALUMNO` | Consulta de resultados | Solo lectura de su evaluación | Resultado |

> **Importante**: EvalUA NO tiene login propio. El rol se determina exclusivamente por el JWT que emite el Host.

### 1.4 Escala de Notas

| Rango | Significado |
|-------|-------------|
| 1.0 - 3.9 | Reprobado |
| 4.0 - 7.0 | Aprobado |
| **4.0** | Nota de aprobación por defecto |

**Fórmula de cálculo:**

```
Logro_i = (Nota_i - 1.0) / 6.0
P = Σ (Logro_i × Ponderación_i)     // Solo criterios ESTRUCTURALES

Si P < E (exigencia):  Nota = 1.0 + 3.0 × (P / E)
Si P ≥ E (exigencia):  Nota = 4.0 + 3.0 × ((P - E) / (1.0 - E))
```

Donde `E` (exigencia) = 0.6 por defecto.

**Regla Gatekeeper:** Si un criterio marcado como `esExcluyente: true` recibe nota < `notaCorte`, la nota final se fuerza a 1.0 independiente del resto.

---

## 2. Guía de Usuario Final

### 2.1 Vista: Evaluar (Wizard)

**Rol requerido:** PROFESOR  
**URL del iframe:** `http://localhost:3000/evaluar?jwt=<TOKEN>`

El wizard de evaluación es un flujo paso-a-paso con animaciones Framer Motion:

**Paso 1 — Información de la Rúbrica**
- Se muestra el título, nota de aprobación y lista de criterios
- El profesor puede leer la descripción de cada criterio
- Cada criterio muestra sus descriptores (notas 1-7 con etiquetas y bullet points)

**Paso 2 — Calificación por Criterio**
- Para cada criterio ESTRUCTURAL, el profesor asigna una nota (1.0 a 7.0)
- Se muestran los descriptores como referencia visual
- Campo de observaciones opcional por criterio
- Si el criterio tiene `minPalabras`/`maxPalabras`, se valida el texto de observaciones

**Paso 3 — Revisión y Envío**
- Resumen de todas las notas asignadas
- Indicador visual si algún criterio excluyente está bajo la nota de corte
- Botón "Finalizar Evaluación" que cambia estado a `EN_REVISION`

**Paso 4 — Resultado**
- Nota final calculada con la fórmula de conversión
- Indicador de aprobación/reprobación
- Desglose por criterio con ponderaciones

**Auto-save:**
- Cada 30 segundos se guarda automáticamente el borrador en Redis
- Si el usuario cierra y vuelve a entrar con el mismo `evaluacion_id`, se recupera el progreso
- Los borradores tienen TTL de 30 días

### 2.2 Vista: Rúbricas

**Rol requerido:** MANTENEDOR, ADMINISTRADOR  
**URL del iframe:** `http://localhost:3000/rubricas?jwt=<TOKEN>`

- Lista todas las rúbricas activas del sistema
- Permite crear nuevas rúbricas con el formulario integrado
- Edición de rúbricas existentes (si no tienen evaluaciones asociadas → edición directa; si tienen → crea nueva versión)
- Activar/desactivar rúbricas

### 2.3 Vista: Dashboard

**Rol requerido:** ADMINISTRADOR, MANTENEDOR  
**URL del iframe:** `http://localhost:3000/dashboard?jwt=<TOKEN>`

- Métricas: rúbricas creadas, evaluaciones en curso, evaluaciones completadas
- Historial de las últimas 10 evaluaciones
- Para MANTENEDOR: solo muestra sus propias estadísticas

### 2.4 Vista: Resultado

**Rol requerido:** ALUMNO  
**URL del iframe:** `http://localhost:3000/resultado?jwt=<TOKEN>`

- Muestra la evaluación completada con nota final
- Desglose por criterio con notas asignadas y observaciones
- Indicador de aprobación/reprobación
- Si la evaluación usó Gatekeeper, se indica cuál criterio fue excluyente

### 2.5 Vista: Configuración

**Rol requerido:** ADMINISTRADOR  
**URL del iframe:** `http://localhost:3000/configurar?jwt=<TOKEN>`

- Gestión de parámetros del sistema
- Visualización de configuración actual

---

## 3. Acceso Directo (sin Host / Desarrollo)

Para probar EvalUA directamente sin un LMS Host, puedes acceder a la página raíz que ofrece enlaces de demostración:

```
http://localhost:3000/
```

Esta página muestra:
- Enlace al **Demo Wizard**: `/evaluar?rubricaId=demo` (usa rúbrica de demostración integrada)
- Enlace a **Rúbricas**: `/rubricas`
- Enlace a **Dashboard**: `/dashboard`

> **Nota**: Los endpoints de la API REST siempre requieren JWT. Solo las vistas embebidas pueden accederse con el parámetro `jwt` en la URL.

---

## 4. Flujo de Integración (Resumen)

El flujo completo desde que un usuario entra a evaluar en el LMS Host:

```
1. Usuario abre "Evaluar tarea" en el LMS Host
2. El Host genera un JWT con claims: { rol: "PROFESOR", usuario_id: "prof.123", rubrica_id: "uuid-rubrica" }
3. El Host construye la URL: http://evalua:3000/evaluar?jwt=<TOKEN>
4. El Host embebe esa URL en un <iframe> de 1029×466px
5. EvalUA recibe el JWT, lo verifica, y muestra el wizard
6. El PROFESOR evalúa paso a paso, el borrador se auto-guarda en Redis
7. Al finalizar, EvalUA calcula la nota con la fórmula y guarda en MongoDB
8. El Host puede consultar el resultado vía API o mostrar el iframe de resultado al ALUMNO
```

Para detalles completos de integración, ver:
- [integracion-iframe.md](./integracion-iframe.md) — Especificación técnica del iframe
- [ejemplos-integracion.md](./ejemplos-integracion.md) — Código en 5 lenguajes
- [jwt-claims.md](./jwt-claims.md) — Cómo generar el JWT

---

## 5. Variables de Entorno

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| `MONGODB_URI` | Sí | — | URI de conexión a MongoDB |
| `REDIS_URL` | Sí | — | URI de conexión a Redis |
| `KEY` | Sí | — | Secret para verificar JWT HS256 (mín 32 chars) |
| `ID_PLATAFORMA` | Sí | — | Identificador de la plataforma host |
| `ALLOWED_HOSTS` | Sí | — | Orígenes permitidos para CORS (separados por coma) |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | URL pública de la aplicación |
| `NODE_ENV` | No | `development` | Entorno de ejecución |

**Ejemplo de `docker-compose.yml`:**

```yaml
services:
  evalua-app:
    build: ./src
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://evalua-mongodb:27017/evalua
      - REDIS_URL=redis://evalua-redis:6379
      - KEY=evalua-dev-secret-key-256bits-minimum-aaaabbbbcccc
      - ID_PLATAFORMA=PLATAFORMA_demo_evalUA
      - ALLOWED_HOSTS=http://localhost:8080
      - NEXT_PUBLIC_APP_URL=http://localhost:3000

  evalua-mongodb:
    image: mongo:7
    volumes:
      - mongodb-data:/data/db

  evalua-redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

volumes:
  mongodb-data:
  redis-data:
```

---

## 6. Manejo de Errores

Todos los errores de la API siguen el formato **RFC 7807**:

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

**Códigos HTTP comunes:**

| Código | Significado | Causa típica |
|--------|-------------|--------------|
| 400 | Solicitud inválida | Body no cumple schema Zod |
| 401 | No autorizado | JWT ausente, inválido o expirado |
| 403 | Prohibido | Rol no tiene permiso para el recurso |
| 404 | No encontrado | Rúbrica o evaluación no existe |
| 409 | Conflicto | Evaluación ya consolidada / Rúbrica con evaluaciones |
| 500 | Error interno | Error no esperado del servidor |

---

## 7. Conceptos Clave para LLMs

Si eres un LLM que está ayudando a integrar EvalUA, estos son los puntos críticos:

1. **EvalUA NO tiene usuarios.** El `usuario_id` es un claim opaco del JWT. Nunca se crea una colección de usuarios.

2. **El JWT es la puerta de entrada.** Toda interacción con la API requiere un JWT válido. Las vistas del iframe lo reciben como query param `?jwt=TOKEN`.

3. **`id_plataforma` filtra todo.** Todas las consultas se filtran por el `id_plataforma` del JWT. Esto permite multi-tenancy.

4. **Rúbricas son documentos únicos.** Los criterios y descriptores están embebidos, no son colecciones separadas.

5. **Versionado inmutable.** Si editas una rúbrica que ya tiene evaluaciones, se crea una nueva versión (nuevo UUID, misma `rubricaGroupId`).

6. **Borradores en Redis, consolidados en MongoDB.** Las evaluaciones en progreso viven en Redis. Al finalizar, se consolidan en MongoDB y se eliminan de Redis.

7. **Gatekeeper es una regla de negocio estricta.** Si un criterio excluyente falla, la nota final = 1.0, sin importar las demás notas.

8. **iframe fijo 1029×466px.** No usar scroll global. EvalUA maneja su propio scroll interno con ScrollArea.

9. **CORS configurado vía `ALLOWED_HOSTS`.** El Host debe estar en la lista de orígenes permitidos.

10. **postMessage para comunicación iframe→Host.** EvalUA puede enviar mensajes al padre mediante `window.parent.postMessage()`.

---

## 8. Quick Start

### Opción A: Solo EvalUA (3 contenedores)

```bash
cd src/
docker compose up --build
# Disponible en http://localhost:3000
```

### Opción B: Demo Completo (4 contenedores: EvalUA + Yii2 Host)

```bash
cd demo/
docker compose up --build
# Demo Host en http://localhost:8080
# EvalUA en http://localhost:3000
```

### Opción C: Desarrollo local

```bash
cd src/
npm install
npm run dev
# Requiere MongoDB y Redis corriendo localmente
```

Para instrucciones detalladas, ver [demo-setup.md](./demo-setup.md).

---

## 9. Estructura del Proyecto

```
evalUA/
├── src/                          # Microservicio EvalUA
│   ├── docker-compose.yml        # Docker Compose (app + mongodb + redis)
│   ├── Dockerfile                # Imagen Next.js
│   ├── package.json              # Dependencias
│   └── src/
│       ├── app/
│       │   ├── api/              # API Routes (REST)
│       │   │   ├── configuracion/
│       │   │   ├── dashboard/
│       │   │   ├── embed/
│       │   │   ├── evaluaciones/
│       │   │   └── rubricas/
│       │   ├── (embed)/          # Vistas embebidas (iframe)
│       │   │   ├── configurar/
│       │   │   ├── dashboard/
│       │   │   ├── evaluar/
│       │   │   ├── resultado/
│       │   │   └── rubricas/
│       │   ├── layout.tsx
│       │   └── page.tsx          # Landing page
│       ├── domain/               # Capa de dominio
│       │   ├── entities/
│       │   ├── schemas.ts        # Zod schemas
│       │   ├── strategies/
│       │   └── value-objects/
│       └── infrastructure/       # Capa de infraestructura
│           ├── auth/
│           ├── cache/
│           └── database/
├── demo/                         # Demo Yii2 Host
│   ├── docker-compose.yml        # Demo completo (4 contenedores)
│   ├── Dockerfile
│   ├── controllers/
│   ├── views/
│   └── config/
├── documentacion/                # Documentación
│   ├── manual-usuario.md         # ← Estás aquí
│   ├── api-reference.md
│   ├── integracion-iframe.md
│   ├── ejemplos-integracion.md
│   ├── demo-setup.md
│   ├── modelos-datos.md
│   └── jwt-claims.md
└── mockup/                       # Prototipo visual (no productivo)
```

---

## 10. FAQ

**P: ¿Necesito crear usuarios en EvalUA?**  
R: No. EvalUA opera bajo Zero-Knowledge. El `usuario_id` viene en el JWT del Host.

**P: ¿Puedo usar EvalUA sin iframe?**  
R: Sí, puedes consumir la API REST directamente con cualquier cliente HTTP. Solo necesitas generar un JWT válido.

**P: ¿Qué pasa si edito una rúbrica que ya tiene evaluaciones?**  
R: Se crea automáticamente una nueva versión (nuevo UUID). La versión anterior se desactiva pero no se elimina.

**P: ¿Cómo funciona el auto-save?**  
R: Cada 30 segundos, el wizard envía los puntajes actuales al endpoint de drafts (Redis). Si el usuario cierra y regresa con el mismo `evaluacion_id`, se recupera el progreso.

**P: ¿Puedo cambiar la nota de aprobación de 4.0?**  
R: Sí, se configura por rúbrica en el campo `notaAprobacion` (rango 1.0-7.0).

**P: ¿Qué es un criterio excluyente?**  
R: Un criterio con `esExcluyente: true`. Si recibe nota < `notaCorte` (default 4.0), la nota final se fuerza a 1.0 (regla Gatekeeper).

**P: ¿EvalUA soporta multi-tenancy?**  
R: Sí, mediante el campo `id_plataforma` del JWT. Todas las consultas se filtran por este campo.