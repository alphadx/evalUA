---
mode: agent
description: "Crear una nueva entidad siguiendo DDD documental"
---

# Prompt: Crear Entidad DDD Documental

Crea una nueva entidad para el proyecto EvalUA siguiendo el patrón DDD documental con MongoDB.

## Contexto del Proyecto
- Stack: Next.js 16 + TypeScript 5 + Mongoose 8 + Redis
- Patrón: DDD Documental (agregados = documentos MongoDB únicos)
- Las entidades puras viven en `src/domain/` sin dependencias de framework
- Los repositorios implementan interfaces del dominio
- Los use-cases reciben repositorios por inyección de dependencias

## Instrucciones
1. Generar la entidad pura en `src/domain/entities/[nombre].ts`
2. Generar value objects asociados en `src/domain/value-objects/`
3. Generar errores de dominio en `src/domain/errors/`
4. Generar la interfaz del repositorio en `src/domain/repositories/`
5. Generar el modelo Mongoose en `src/infrastructure/persistence/[nombre].model.ts`
6. Generar la implementación del repositorio en `src/infrastructure/persistence/[nombre].repository.ts`
7. Generar use-cases CRUD en `src/application/use-cases/`
8. Generar el API route en `src/app/api/embed/[nombre]/route.ts` con JWT verification y Zod validation

## Reglas
- Archivos en kebab-case
- Componentes en PascalCase
- NO usar `any` — usar `unknown` y type narrowing
- Validar inputs con Zod
- Errores en formato RFC 7807
- Filtrar SIEMPRE por `id_plataforma` del JWT
- Documentar con JSDoc en español
