# Skill: DDD Scaffolding Generator

## Propósito
Generar la estructura completa de una nueva entidad siguiendo el patrón DDD documental de EvalUA.

## Instrucciones
Cuando el usuario solicite crear una nueva entidad o agregar un nuevo módulo al dominio, genera automáticamente los archivos correspondientes en las 4 capas:

### Plantilla de Generación

Para una entidad llamada `[NOMBRE]`:

**1. Domain Layer (`src/domain/`)**
```
src/domain/entities/[nombre].ts          # Entidad pura (interface o clase)
src/domain/value-objects/[nombre]-*.ts    # Value objects asociados
src/domain/errors/[nombre]-errors.ts     # Errores de dominio específicos
```

**2. Application Layer (`src/application/`)**
```
src/application/use-cases/crear-[nombre].ts
src/application/use-cases/obtener-[nombre].ts
src/application/use-cases/actualizar-[nombre].ts
src/application/use-cases/eliminar-[nombre].ts
```

**3. Infrastructure Layer (`src/infrastructure/`)**
```
src/infrastructure/persistence/[nombre].model.ts      # Mongoose model
src/infrastructure/persistence/[nombre].repository.ts  # Repository pattern
src/infrastructure/cache/[nombre].cache.ts             # Cache L2 (si aplica)
```

**4. Presentation Layer (`src/presentation/`)**
```
src/presentation/components/[nombre]-card.tsx
src/presentation/components/[nombre]-form.tsx
src/presentation/hooks/use-[nombre].ts
```

**5. API Routes (`src/app/api/`)**
```
src/app/api/embed/[nombre]/route.ts     # CRUD endpoints
```

### Reglas de Generación
- TODOS los archivos usan `kebab-case`
- Las entidades de dominio NO tienen dependencias de Mongoose ni de ningún framework
- Los repositorios implementan interfaces definidas en `domain/`
- Los use-cases reciben el repositorio como dependencia (inyección de dependencias)
- Los modelos Mongoose reflejan la estructura documental embebida
- Incluir schemas de Zod para validación de inputs en los API routes
- Si la entidad es un agregado, incluir validación de invariantes en el constructor/método factory

### Ejemplo de Uso
Usuario: "Crear entidad Rúbrica con sus criterios embebidos"
→ Generar todos los archivos de las 4 capas con la estructura documental embebida