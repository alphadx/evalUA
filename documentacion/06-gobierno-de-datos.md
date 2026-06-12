# Gobierno de Datos — EvalUA v3.0 (MongoDB + Redis)

> **Gobernanza de Datos NoSQL y Políticas de Privacidad — EvalUA**  
> Especificación de colecciones documentales, estructuras de memoria caché/borradores en Redis, clasificación de datos y políticas de retención.

---

## 1. Filosofía de Datos Zero-Knowledge (Privacidad por Diseño)

El micro-frontend EvalUA v3.0 es **Zero-Knowledge (Cero Conocimiento)** respecto a los identificadores personales de estudiantes y contextos institucionales externos.

- **Desacoplamiento Absoluto de Identidad:** La base de datos local (MongoDB) no almacena nombres, correos o RUTs de alumnos, ni paralelos, ni códigos oficiales de cursos. 
- **Mapeo en el Host:** El sistema Host es el único que mantiene la equivalencia entre el `evaluacionId` consolidado y la identidad real del estudiante.
- **Minimización de Riesgos:** Ante fugas de información o intrusiones de datos, la base de datos de EvalUA solo expondrá identificadores lógicos anónimos y rúbricas genéricas de evaluación.

---

## 2. Clasificación de Datos por Sensibilidad

Las estructuras NoSQL (colecciones de MongoDB y llaves en Redis) se organizan en los siguientes niveles de seguridad:

| Nivel de Sensibilidad | Ubicación física | Entidad / Campos | Amenazas Principales | Controles de Mitigación |
|---|---|---|---|---|
| **MEDIA** | Redis / MongoDB | `draft:{id}` (Redis), `evaluaciones` (MongoDB) | Fuga de notas parciales o retroalimentación privada. | Acceso controlado por firma JWT (`KEY`), cifrado en tránsito HTTPS, y aislamiento de red para la base MongoDB/Redis. |
| **BAJA** | MongoDB / Redis | `rubricas` (MongoDB), `cache:rubrica:{id}` (Redis), `configuraciones` (MongoDB) | Modificación no autorizada de criterios. | Permisos CRUD exclusivos validados mediante token JWT (roles `MANTENEDOR` o `ADMINISTRADOR`). |

---

## 3. Diccionario NoSQL y Estructuras en Memoria

### 3.1 Colecciones en MongoDB (Mongoose Schema)

#### Colección `rubricas`
- `_id` (ObjectId): Identificador de rúbrica.
- `titulo` (String): Título.
- `esActiva` (Boolean): Estado activo.
- `metadata` (Mixed, Nullable): JSON flexible.
- `criterios` (Array Embebido):
  - `_id` (ObjectId): ID de criterio.
  - `nombre` (String): Nombre.
  - `ponderacion` (Number): Peso relativo [0.0 - 1.0].
  - `tipo` (String): `ESTRUCTURAL` o `COMPLEMENTARIO`.
  - `esExcluyente` (Boolean): Flag de regla Gatekeeper.
  - `descripcion` (String, Nullable): Guía de evaluación.
  - `minPalabras` / `maxPalabras` (Number, Nullable).
  - `orden` (Number): Índice de visualización.
  - `descriptores` (Array Embebido):
    - `notaNivel` (Number): Nivel (1-7).
    - `etiqueta` (String): Etiqueta descriptiva (ej. "Excelente").
    - `bulletPoints` (Array de Strings): Puntos descriptivos de desempeño.

#### Colección `evaluaciones`
- `_id` (String, PK): ID provisto por el host o autogenerado.
- `rubricaId` (ObjectId, Ref): Referencia a la rúbrica.
- `estado` (String): Estado de consolidación (`COMPLETADA`).
- `notaFinal` (Number): Nota global calculada.
- `observaciones` (String, Nullable): Retroalimentación de la evaluación.
- `metadata` (Mixed, Nullable): JSON flexible de auditoría.
- `puntajes` (Array Embebido):
  - `criterioId` (String): ID del criterio evaluado.
  - `notaAsignada` (Number): Nota (1.0 - 7.0).
  - `observaciones` (String, Nullable): Comentarios específicos del criterio.

#### Colección `configuraciones`
- `_id` (ObjectId): ID.
- `clave` (String, unique): Clave de configuración (ej: `GRACE_PERIOD_MINUTES`).
- `valor` (String): Valor del parámetro.
- `descripcion` (String): Explicación del parámetro.

---

### 3.2 Estructura de Llaves en Redis

- **Borrador Activo (`draft:{evaluacionId}`):**
  - *Estructura:* JSON string conteniendo el borrador intermedio de los puntajes ingresados por el evaluador en el iframe.
  - *TTL:* 30 días de inactividad.
- **Caché Rúbrica L2 (`cache:rubrica:{rubricaId}`):**
  - *Estructura:* JSON stringificado de la rúbrica detallada con criterios y descriptores para optimizar la carga del iframe.
  - *TTL:* 24 horas.

---

## 4. Políticas de Retención de Datos y Ciclo de Vida NoSQL

### 4.1 Borradores Temporales (`EN_PROGRESO` / `EN_REVISION`) en Redis
- **Política de Retención:** 30 días de inactividad.
- **Mecanismo:** Redis purga de forma nativa la llave `draft:{evaluacionId}` si transcurren 30 días desde la última operación de escritura (`PUT /api/evaluaciones/[id]`), la cual extiende el TTL automáticamente. Los borradores en estado `EN_REVISION` siguen sujetos a esta misma política y su TTL se restablece de igual manera con cada actualización. Esto mantiene la memoria de Redis libre de borradores abandonados.

### 4.2 Evaluaciones Consolidadas (`COMPLETADA`) en MongoDB
- **Política de Retención:** Permanente.
- **Mecanismo:** Constituyen evidencia de acreditación institucional inmutable. Se resguardan permanentemente en la colección `evaluaciones` de MongoDB.

### 4.3 Rúbricas Inactivas (`esActiva = false`) en MongoDB
- **Política de Retención:** Permanente si poseen evaluaciones en MongoDB.
- **Mecanismo:** Debido a que las evaluaciones consolidan una referencia lógica a la rúbrica aplicada, las rúbricas inactivas no se eliminan físicamente para resguardar la consistencia e integridad referencial histórica.
