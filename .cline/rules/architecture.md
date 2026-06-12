# Reglas de Arquitectura — EvalUA v3.0

## Stack Obligatorio
- **Framework:** Next.js 16 (App Router) con TypeScript 5
- **Base de Datos Principal:** MongoDB 7+ via Mongoose 8 (esquemas documentales embebidos)
- **Caché / Estado Volátil:** Redis (ioredis) para borradores TTL y caché L2
- **Estado Frontend:** Zustand 5
- **Componentes UI:** shadcn/ui + Vanilla CSS con variables corporativas
- **Animaciones:** Framer Motion
- **Empaquetamiento:** Docker Compose (3 servicios: app, mongodb, redis)

## Patrón DDD Documental
- Los **agregados** se representan como documentos MongoDB únicos (no como colecciones relacionales)
- `Rubrica`: documento raíz con criterios y descriptores **embebidos**
- `Evaluacion`: documento raíz con puntajes **embebidos**
- NO usar referencias ObjectId entre agregados. Todo lo que pertenece al agregado vive dentro del documento

## Reglas de Separación de Capas
```
src/
├── domain/          # Entidades de dominio puras (sin dependencias de framework)
│   ├── entities/    # Rubrica, Evaluacion (clases o interfaces puras)
│   ├── value-objects/ # Ponderacion, NotaFinal, EstadoEvaluacion
│   └── errors/      # Errores de dominio específicos
├── application/     # Casos de uso / servicios de aplicación
│   ├── use-cases/   # CrearRubrica, CalcularEvaluacion, etc.
│   └── services/    # Servicios de orquestación
├── infrastructure/  # Implementaciones concretas
│   ├── persistence/ # Repositorios Mongoose, modelos de datos
│   ├── cache/       # Repositorio Redis, manejador de caché L2
│   └── auth/        # JWT verification, middleware
├── presentation/    # UI Components (Next.js App Router)
│   ├── components/  # Componentes React reutilizables
│   ├── hooks/       # Custom hooks de React
│   └── stores/      # Stores de Zustand
└── app/             # Next.js App Router (rutas, layouts, API routes)
    ├── embed/       # Route Group para vistas embebidas (iframe)
    └── api/         # API Routes
```

## Iframe-Driven Architecture
- TODAS las vistas se embeben en iframes de **1029×466px**
- NO existe navegación independiente ni consola de administración autónoma
- El viewport es FIJO: toda la UI debe caber en esa superficie sin scrollbars globales
- Usar `ScrollArea` locales de shadcn/ui para contenido que exceda el viewport

## Zero-Knowledge Policy
- NO existe colección `usuarios`
- NO se almacenan identidades humanas (nombres, emails, contraseñas)
- Toda autorización se delega al JWT del Host
- El claim `usuario_id` se usa SOLO para trazabilidad interna
- Logs sanitizados: nunca loguear tokens, payloads ni PII

## Docker Compose Services
```yaml
services:
  evalua-app:      # Next.js 16 server (puerto 3000)
  evalua-mongodb:  # MongoDB 7 (puerto 27017)
  evalua-redis:    # Redis 7 (puerto 6379)
```

## Variables de Entorno Obligatorias
- `KEY`: Secreto simétrico HS256 (256 bits) para JWT
- `MONGODB_URI`: Connection string de MongoDB
- `REDIS_URL`: URL de conexión a Redis
- `ALLOWED_HOSTS`: Dominios permitidos para frame-ancestors CSP
- `NODE_ENV`: development | production