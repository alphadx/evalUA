# EvalUA v3.0 — Especificación del JWT

> **Algoritmo:** HS256 (HMAC-SHA256)  
> **Librería servidor:** jsonwebtoken (Node.js)  
> **Librería Host:** Cualquier librería JWT compatible (firebase/php-jwt, jjwt, etc.)

---

## Estructura del Payload

### Claims Estándar (siempre presentes)

| Claim | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `iss` | string | Emisor del token | `"sistema-host"` |
| `aud` | string | Audiencia (destinatario) | `"evalua-microservice"` |
| `iat` | number | Timestamp de emisión (Unix) | `1718419200` |
| `exp` | number | Timestamp de expiración (Unix) | `1718419500` |
| `id_plataforma` | string | Identificador de la plataforma host | `"PLATAFORMA_demo_evalUA"` |

### Claims de Negocio (varían por rol)

| Claim | Tipo | Requerido | Descripción |
|-------|------|:---------:|-------------|
| `rol` | string | Sí | Rol del usuario: `ADMINISTRADOR`, `MANTENEDOR`, `PROFESOR`, `ALUMNO` |
| `usuario_id` | string | Sí | Identificador opaco del usuario (no es email) |
| `rubrica_id` | string | No* | UUID de la rúbrica a evaluar (requerido para PROFESOR evaluando) |
| `evaluacion_id` | string | No* | UUID de la evaluación existente (para recuperar borrador o ver resultado) |
| `rubricas_permitidas` | string[] | No | Lista de UUIDs de rúbricas permitidas, o `["*"]` para todas (requerido para MANTENEDOR) |

> *`rubrica_id` y/o `evaluacion_id` determinan el modo de operación del launch endpoint.

---

## Claims por Rol

### ADMINISTRADOR

```json
{
  "iss": "sistema-host",
  "aud": "evalua-microservice",
  "iat": 1718419200,
  "exp": 1718419500,
  "id_plataforma": "PLATAFORMA_demo_evalUA",
  "rol": "ADMINISTRADOR",
  "usuario_id": "admin.001"
}
```

**Acceso:** Dashboard, Configuración, todas las API  
**Modos permitidos:** `rubricas`, `dashboard`, `configurar`

### MANTENEDOR

```json
{
  "iss": "sistema-host",
  "aud": "evalua-microservice",
  "iat": 1718419200,
  "exp": 1718419500,
  "id_plataforma": "PLATAFORMA_demo_evalUA",
  "rol": "MANTENEDOR",
  "usuario_id": "mantenedor.001",
  "rubricas_permitidas": ["*"]
}
```

**Acceso:** CRUD Rúbricas, Dashboard propio  
**Modos permitidos:** `rubricas`, `dashboard`

**Con restricción de rúbricas:**
```json
{
  "rubricas_permitidas": ["550e8400-...", "660e8400-..."]
}
```
Solo puede ver/editar las rúbricas cuyo UUID esté en la lista.

### PROFESOR

```json
{
  "iss": "sistema-host",
  "aud": "evalua-microservice",
  "iat": 1718419200,
  "exp": 1718419500,
  "id_plataforma": "PLATAFORMA_demo_evalUA",
  "rol": "PROFESOR",
  "usuario_id": "profesor.001",
  "rubrica_id": "550e8400-e29b-41d4-a716-446655440000",
  "evaluacion_id": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Acceso:** Wizard de evaluación  
**Modos permitidos:** `evaluar`

**Variantes:**
- Con `rubrica_id` solamente → nueva evaluación
- Con `evaluacion_id` solamente → recupera borrador o ve resultado
- Con ambos → evaluar una rúbrica específica en una evaluación existente

### ALUMNO

```json
{
  "iss": "sistema-host",
  "aud": "evalua-microservice",
  "iat": 1718419200,
  "exp": 1718419500,
  "id_plataforma": "PLATAFORMA_demo_evalUA",
  "rol": "ALUMNO",
  "usuario_id": "alumno.001",
  "evaluacion_id": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Acceso:** Ver resultado de su evaluación  
**Modos permitidos:** `resultado`

---

## Generación del JWT

### Ejemplo en Node.js

```javascript
const jwt = require('jsonwebtoken');

const SECRET = 'evalua-dev-secret-key-256bits-minimum-aaaabbbbcccc';

const token = jwt.sign(
  {
    iss: 'sistema-host',
    aud: 'evalua-microservice',
    id_plataforma: 'PLATAFORMA_demo_evalUA',
    rol: 'PROFESOR',
    usuario_id: 'profesor.001',
    rubrica_id: '550e8400-e29b-41d4-a716-446655440000',
  },
  SECRET,
  {
    algorithm: 'HS256',
    expiresIn: 300, // 5 minutos
  }
);

console.log(token);
```

### Ejemplo en PHP

```php
use Firebase\JWT\JWT;

$secret = 'evalua-dev-secret-key-256bits-minimum-aaaabbbbcccc';
$now = time();

$payload = [
    'iss' => 'sistema-host',
    'aud' => 'evalua-microservice',
    'iat' => $now,
    'exp' => $now + 300,
    'id_plataforma' => 'PLATAFORMA_demo_evalUA',
    'rol' => 'PROFESOR',
    'usuario_id' => 'profesor.001',
    'rubrica_id' => '550e8400-e29b-41d4-a716-446655440000',
];

$token = JWT::encode($payload, $secret, 'HS256');
```

### Ejemplo en Python

```python
import jwt
import time

SECRET = "evalua-dev-secret-key-256bits-minimum-aaaabbbbcccc"

payload = {
    "iss": "sistema-host",
    "aud": "evalua-microservice",
    "iat": int(time.time()),
    "exp": int(time.time()) + 300,
    "id_plataforma": "PLATAFORMA_demo_evalUA",
    "rol": "PROFESOR",
    "usuario_id": "profesor.001",
    "rubrica_id": "550e8400-e29b-41d4-a716-446655440000",
}

token = jwt.encode(payload, SECRET, algorithm="HS256")
```

### Ejemplo en Java

```java
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;
import java.util.Date;

String secret = "evalua-dev-secret-key-256bits-minimum-aaaabbbbcccc";
SecretKey key = Keys.hmacShaKeyFor(secret.getBytes());

String token = Jwts.builder()
    .issuer("sistema-host")
    .audience().add("evalua-microservice").and()
    .id("PLATAFORMA_demo_evalUA")
    .claim("rol", "PROFESOR")
    .claim("usuario_id", "profesor.001")
    .claim("rubrica_id", "550e8400-e29b-41d4-a716-446655440000")
    .issuedAt(new Date())
    .expiration(new Date(System.currentTimeMillis() + 300_000))
    .signWith(key)
    .compact();
```

### Ejemplo en C#

```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;

var secret = "evalua-dev-secret-key-256bits-minimum-aaaabbbbcccc";
var key = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(secret));

var claims = new[]
{
    new Claim("iss", "sistema-host"),
    new Claim("aud", "evalua-microservice"),
    new Claim("id_plataforma", "PLATAFORMA_demo_evalUA"),
    new Claim("rol", "PROFESOR"),
    new Claim("usuario_id", "profesor.001"),
    new Claim("rubrica_id", "550e8400-e29b-41d4-a716-446655440000"),
};

var token = new JwtSecurityToken(
    claims: claims,
    expires: DateTime.UtcNow.AddMinutes(5),
    signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
);

var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
```

---

## Determinación de Modo

El endpoint `POST /api/embed/launch` determina el modo de operación basándose en los claims:

```
Si tiene rubrica_id o evaluacion_id:
  → Modo "evaluar" (PROFESOR)
  → Modo "resultado" (ALUMNO con evaluacion_id)

Si NO tiene rubrica_id ni evaluacion_id:
  → Modo administración (MANTENEDOR/ADMINISTRADOR)
```

**Mapa de modos por rol:**

| Rol | Modos permitidos |
|-----|-----------------|
| `ADMINISTRADOR` | `rubricas`, `dashboard`, `configurar` |
| `MANTENEDOR` | `rubricas`, `dashboard` |
| `PROFESOR` | `evaluar` |
| `ALUMNO` | `resultado` |

---

## Seguridad

### Requisitos del Secret

- **Mínimo 32 caracteres** para HS256
- El mismo secret debe estar configurado en:
  - El Host que genera el JWT (variable `JWT_SECRET`)
  - EvalUA que verifica el JWT (variable `KEY`)
- En producción: usar un secret aleatorio generado con `openssl rand -base64 48`

### Expiración

- **Recomendado:** 5 minutos (300 segundos)
- El JWT es de corta vida porque solo se usa para el lanzamiento inicial
- EvalUA mantiene la sesión del usuario vía borradores en Redis (TTL 30 días)

### Validación que realiza EvalUA

1. Verifica la firma HS256 con el secret configurado
2. Verifica que `exp` no haya pasado
3. Verifica que `id_plataforma` coincida con el configurado en la variable de entorno
4. Verifica que el `rol` sea válido
5. Verifica que el rol tenga permiso para el endpoint/modo solicitado

### `id_plataforma` como aislamiento multi-tenant

El campo `id_plataforma` del JWT DEBE coincidir con la variable de entorno `ID_PLATAFORMA` de EvalUA. Esto garantiza que un JWT emitido para una plataforma no sea válido en otra.

---

## Ejemplo: JWT Decodificado Completo

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzaXN0ZW1hLWhvc3QiLCJhdWQiOiJldmFsdWEtbWljcm9zZXJ2aWNlIiwiaWF0IjoxNzE4NDE5MjAwLCJleHAiOjE3MTg0MTk1MDAsImlkX3BsYXRhZm9ybWEiOiJQTEFUQUZPUk1BX2RlbW9fZXZhbFVBIiwicm9sIjoiUFJPRkVTT1IiLCJ1c3VhcmlvX2lkIjoicHJvZmVzb3IuMDAxIiwicnVicmljYV9pZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCJ9.signature
```

**Decodificado:**
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "iss": "sistema-host",
    "aud": "evalua-microservice",
    "iat": 1718419200,
    "exp": 1718419500,
    "id_plataforma": "PLATAFORMA_demo_evalUA",
    "rol": "PROFESOR",
    "usuario_id": "profesor.001",
    "rubrica_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}