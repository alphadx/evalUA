# Arquitectura de Seguridad y Control de Acceso — EvalUA v3.0

> **Política Zero-Knowledge y Gestión de Identidades**
> El diseño de EvalUA se adhiere estrictamente a una política de conocimiento cero (Zero-Knowledge) respecto a los usuarios. La aplicación no almacena cuentas, correos, nombres, ni contraseñas. Toda la autorización y contexto se delega al sistema **Host**, el cual transmite permisos granulares a través del JWT de lanzamiento de forma "stateless".

---

## 1. Matriz de Control de Acceso (RBAC y Zero-Knowledge)

En lugar de verificar la "propiedad" de los registros (ej. `usuario_id`), EvalUA confía explícitamente en las directivas enviadas en el token por el Host. 

### Roles y Operaciones

| Modo de Lanzamiento (Embed) | Rol JWT | Acceso a Rúbricas (CRUD) | Acceso a Evaluaciones | Configuraciones |
| :--- | :--- | :--- | :--- | :--- |
| `/embed/configurar` | `ADMINISTRADOR` | Acceso global (`*`) | Acceso global | Todas |
| `/embed/dashboard` | `ADMINISTRADOR` | Acceso global (`*`) | Acceso global | Lectura de métricas |
| `/embed/dashboard` | `MANTENEDOR` | Restringido (Según claims JWT) | Según `rubricas_permitidas` | No |
| `/embed/rubricas` | `ADMINISTRADOR` | Creación y edición global | No aplica directamente | No |
| `/embed/rubricas` | `MANTENEDOR` | Edición solo en `rubricas_permitidas` | No aplica directamente | No |
| `/embed/evaluar` | `PROFESOR` | Lectura de rúbrica activa | Escritura en borrador propio | No |
| `/embed/evaluar` | `ADMINISTRADOR` | Lectura de rúbrica activa | Escritura en borrador propio | No |
| `/embed/evaluar` | `MANTENEDOR` | Lectura de rúbrica activa | Escritura en borrador propio | No |
| `/embed/resultado` | `ALUMNO` | Solo lectura (a través de evaluación) | Lectura estricta (`evaluacion_id`) | No |
| `/embed/resultado` | `PROFESOR` | Solo lectura | Lectura | No |

---

## 2. Esquema de Claims del JWT (Delegación del Host)

El sistema Host es el responsable exclusivo de la lógica de negocio que decide "qué profesor puede ver qué rúbrica". EvalUA solamente obedece el arreglo de UUIDs proveídos.

### 2.1 MANTENEDOR (Gestión Delegada)

El rol `MANTENEDOR` requiere un arreglo explícito de las rúbricas sobre las cuales tiene jurisdicción para editar o visualizar. Si el mantenedor intenta acceder a un UUID no listado, recibirá un `403 Forbidden`.

```json
{
  "iss": "sistema-host",
  "aud": "evalua-microservice",
  "id_plataforma": "PLATAFORMA_evalUA_XYZ",
  "rol": "MANTENEDOR",
  "usuario_id": "m.garcia",
  "rubricas_permitidas": [
    "uuid-rubrica-1",
    "uuid-rubrica-2"
  ],
  "iat": 1780000000,
  "exp": 1780000300
}
```
> [!TIP]
> **Comodín Global:** El Host puede enviar `["*"]` en el arreglo de `rubricas_permitidas` si desea otorgar al mantenedor acceso irrestricto a todas las rúbricas de la plataforma.

### 2.2 ADMINISTRADOR (Acceso Total)
El administrador no requiere el arreglo de `rubricas_permitidas`, ya que se asume que puede operar sobre cualquier entidad del tenant (`id_plataforma`).

### 2.3 PROFESOR (Evaluación)
Se autoriza con un solo `rubrica_id` específico y, opcionalmente, un `evaluacion_id`.

### 2.4 ALUMNO (Lectura)
Requerido estrictamente un `evaluacion_id` y el `usuario_id` para garantizar que la evaluación que solicita leer efectivamente le pertenece.

---

## 3. Middleware Next.js (Autenticación e Intercepción)

El `middleware.ts` en la raíz de Next.js es el encargado de proteger el perímetro antes de que las peticiones lleguen a los controladores.

### Flujo Lógico:
1. **Intercepción de Rutas:** Intercepta toda petición hacia `/api/embed/*` y `/api/admin/*`.
2. **Extracción y Validación de Firma:** Extrae el token (ya sea desde la cabecera `Authorization: Bearer` o cookie de sesión) y valida la firma matemática usando `jose` y el secreto HS256 (`ENV.KEY`).
3. **Validación de Plataforma:** Verifica que `id_plataforma` del JWT coincida con el entorno.
4. **Validación de Dominio Cruzado:** Emite cabeceras de seguridad CSP (Content-Security-Policy) para prevenir iframe hijacking.

---

## 4. Contratos de Respuesta de Error (RFC 7807 Standard)

EvalUA estandariza las respuestas de error para que el cliente frontend y el Host puedan entender por qué una operación falló, sin revelar rutas de base de datos o stacktraces de Node.js.

### 401 Unauthorized (Error de Autenticación / Token Invalido)
```json
{
  "type": "https://evalua.local/errors/unauthorized",
  "title": "Token Inválido o Expirado",
  "status": 401,
  "detail": "La firma del token JWT no coincide o el tiempo de vida (exp) ha caducado.",
  "code": "AUTH_INVALID_TOKEN"
}
```

### 403 Forbidden (Error de Autorización / Zero-Knowledge)
```json
{
  "type": "https://evalua.local/errors/forbidden",
  "title": "Acceso Denegado a Recurso",
  "status": 403,
  "detail": "El rol 'MANTENEDOR' no posee los permisos necesarios en 'rubricas_permitidas' para este UUID.",
  "code": "AUTH_INSUFFICIENT_PERMISSIONS",
}
}

---

## 5. Consultas de Listado y Paginación (Zero-Knowledge)

Debido a que el microservicio no conoce la relación de pertenencia entre "Usuarios" y "Rúbricas" en la base de datos (no existe un campo `usuario_id` en el esquema de la rúbrica), las consultas de listado (por ejemplo, para renderizar la tabla principal de administración en `/embed/rubricas`) se filtran dinámicamente utilizando exclusivamente los claims del JWT.

### 5.1 Regla del Comodín Global (`["*"]`)

Si el JWT del `MANTENEDOR` o `ADMINISTRADOR` contiene `["*"]` en el claim `rubricas_permitidas` (o si el rol de Administrador asume acceso total por defecto), el repositorio del backend ejecutará una consulta sin filtro de IDs, devolviendo todas las rúbricas activas correspondientes al tenant:

```typescript
// Ejemplo conceptual de consulta en Mongoose/MongoDB
const query = { id_plataforma: jwt.id_plataforma, esActiva: true };
const rubricas = await RubricaModel.find(query);
```

### 5.2 Regla de Arreglo de IDs Específicos

Si el JWT especifica un arreglo de UUIDs, la consulta de listado utilizará el operador `$in` de MongoDB en la capa del repositorio para limitar los resultados únicamente a las rúbricas sobre las que el mantenedor tiene jurisdicción explícita. El Host es quien tiene el conocimiento de negocio y define este arreglo al generar y firmar el JWT.

```typescript
// Ejemplo conceptual de consulta en Mongoose/MongoDB
const query = { 
  id_plataforma: jwt.id_plataforma, 
  esActiva: true,
  _id: { $in: jwt.rubricas_permitidas } // Filtrado inyectado directo desde el JWT
};
const rubricas = await RubricaModel.find(query);
```

> [!WARNING]
> **Límites de Tamaño del Token JWT:** Los tokens JWT tienen un límite práctico de tamaño en los navegadores y cabeceras HTTP (se recomienda no superar los 4KB a 8KB). Si un mantenedor tiene acceso a *miles* de rúbricas específicas, el Host no debe enviar miles de UUIDs en el payload del token. En ese escenario, el Host debe utilizar una política de acceso global (`["*"]`) para el micro-frontend y realizar el filtrado de negocio exhaustivo en su propia plataforma padre. Otra alternativa es que el Host solo lance a EvalUA para visualizar métricas generales o evaluar/editar rúbricas de forma individualizada (1 a 1), evitando que el iframe sea el responsable de listar miles de rúbricas con permisos granulares extensos.
```
