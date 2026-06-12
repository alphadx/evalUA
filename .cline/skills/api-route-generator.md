# Skill: API Route Generator

## Propósito
Generar API routes protegidas para Next.js App Router siguiendo los estándares de seguridad y RBAC de EvalUA.

## Instrucciones
Cuando el usuario solicite crear un endpoint API nuevo:

### Plantilla Base
```typescript
// src/app/api/embed/[recurso]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAuth } from '@/infrastructure/auth/jwt-verify';
import { createProblemResponse } from '@/infrastructure/errors/problem-json';

// Schema de validación con Zod
const requestSchema = z.object({
  // Definir campos según el recurso
});

export async function GET(request: NextRequest) {
  // 1. Verificar JWT
  const auth = await verifyAuth(request);
  if (!auth.success) {
    return createProblemResponse(401, 'AUTH_INVALID_TOKEN', auth.error);
  }

  // 2. Verificar permisos RBAC
  if (!hasPermission(auth.claims, 'recurso:read')) {
    return createProblemResponse(403, 'AUTH_INSUFFICIENT_PERMISSIONS');
  }

  // 3. Ejecutar lógica de negocio
  try {
    const useCase = new ObtenerRecursoUseCase(repository);
    const result = await useCase.execute(auth.claims);
    return NextResponse.json(result);
  } catch (error) {
    return handleDomainError(error);
  }
}

export async function POST(request: NextRequest) {
  // 1. Verificar JWT
  const auth = await verifyAuth(request);
  if (!auth.success) {
    return createProblemResponse(401, 'AUTH_INVALID_TOKEN', auth.error);
  }

  // 2. Validar body con Zod
  const body = await request.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return createProblemResponse(400, 'VALIDATION_ERROR', parsed.error.message);
  }

  // 3. Verificar permisos RBAC
  // 4. Ejecutar use-case
  // 5. Retornar respuesta
}
```

### Reglas
- TODAS las rutas `/api/embed/*` y `/api/admin/*` DEBEN verificar JWT
- Usar Zod para validación de TODOS los inputs
- Respuestas de error en formato RFC 7807
- Filtrar SIEMPRE por `id_plataforma` del JWT
- Para MANTENEDOR: verificar que el `rubrica_id` esté en `rubricas_permitidas`
- Usar `GET` para lecturas, `POST` para creaciones, `PUT` para actualizaciones, `DELETE` para eliminaciones
- NUNCA exponer información interna del sistema en errores

### Helpers Requeridos
```typescript
// infrastructure/auth/jwt-verify.ts
export async function verifyAuth(request: NextRequest): Promise<AuthResult>

// infrastructure/errors/problem-json.ts
export function createProblemResponse(
  status: number, 
  code: string, 
  detail?: string
): NextResponse