# Reglas de Seguridad — EvalUA v3.0

## Zero-Knowledge Obligatorio
- NUNCA crear modelos, esquemas o colecciones de "usuarios" o "accounts"
- NUNCA almacenar contraseñas, emails, nombres reales o cualquier PII
- Toda identidad viene del JWT del Host — EvalUA solo consume claims
- El claim `usuario_id` es un identificador opaco, no un email ni RUT

## JWT (Autenticación y Autorización)
- Algoritmo: **HS256** (HMAC-SHA256) con secreto simétrico en `ENV.KEY`
- Validar SIEMPRE: firma, expiración (`exp`), audiencia (`aud`), emisor (`iss`)
- Extraer token de: cabecera `Authorization: Bearer <token>` o query param `token`
- Biblioteca recomendada: `jose` (Edge-compatible, soporta Next.js middleware)

### Claims Obligatorios
```typescript
interface JWTEvalUAClaims {
  iss: string;           // Emisor (sistema-host)
  aud: string;           // Audiencia (evalua-microservice)
  id_plataforma: string; // Tenant ID
  rol: 'ADMINISTRADOR' | 'MANTENEDOR' | 'PROFESOR' | 'ALUMNO';
  usuario_id: string;    // Identificador opaco para trazabilidad
  rubricas_permitidas?: string[]; // Solo para MANTENEDOR: ['*'] o UUIDs
  rubrica_id?: string;   // Solo para PROFESOR
  evaluacion_id?: string; // Para PROFESOR y ALUMNO
  iat: number;
  exp: number;
}
```

## Middleware de Protección
- Interceptar TODAS las rutas `/api/embed/*` y `/api/admin/*`
- Validar JWT ANTES de llegar al handler
- Rechazar con `401` si el token es inválido/expirado
- Rechazar con `403` si el rol no tiene permisos para el recurso

## Cabeceras de Seguridad HTTP
```typescript
// Siempre inyectar en middleware.ts
const securityHeaders = {
  'Content-Security-Policy': `frame-ancestors ${process.env.ALLOWED_HOSTS}; default-src 'self'; script-src 'self' 'unsafe-inline'`,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': `ALLOW-FROM ${process.env.ALLOWED_HOSTS}`,
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};
```

## Sanitización de Logs
- Usar **Pino.js** con reglas de redacción (`redact`)
- NUNCA loguear: tokens JWT, cabeceras Authorization, payloads de request/response
- SIEMPRE loguear: método HTTP, URL, status code, tiempo de respuesta
- Para trazabilidad: usar hash SHA-256 del `usuario_id`, nunca el valor plano

## Respuestas de Error (RFC 7807)
- Formato estándar: `{ type, title, status, detail, code }`
- NUNCA exponer: stack traces, rutas de archivos, nombres de colecciones MongoDB
- Códigos de error específicos: `AUTH_INVALID_TOKEN`, `AUTH_INSUFFICIENT_PERMISSIONS`, `RUBRICA_NOT_FOUND`, etc.

## RBAC por Claims del JWT
| Rol | Operaciones Permitidas |
|-----|----------------------|
| `ADMINISTRADOR` | CRUD global de rúbricas, dashboard, configuración |
| `MANTENEDOR` | CRUD limitado a `rubricas_permitidas` (o `['*']`) |
| `PROFESOR` | Lectura de rúbrica asignada, escritura en borrador propio |
| `ALUMNO` | Solo lectura de su evaluación (requiere `evaluacion_id` + `usuario_id`) |

## Inmutabilidad Post-Cálculo
- Una evaluación en estado `COMPLETADA` es **inmutable**
- El repositorio DEBE rechazar cualquier escritura posterior
- Implementar como validación en el dominio, no solo en la UI

## Validación de Tenant
- SIEMPRE filtrar consultas por `id_plataforma` del JWT
- NUNCA permitir acceso cross-tenant (un tenant no puede ver datos de otro)