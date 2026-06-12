# Arquitectura y Estándares del Proyecto — EvalUA v3.0 (NoSQL)

> Este documento formaliza las directrices arquitectónicas de EvalUA, estableciendo las decisiones de diseño (ADRs) necesarias para operar como un micro-frontend documental, seguro e integrado por iframe.

---

## 1. Estándares de Pureza del Dominio (DDD)

El dominio de EvalUA se desacopla del modelo relacional plano mediante el uso de esquemas documentales estructurados en MongoDB.

- **Agregados como Documentos Únicos:** La frontera de consistencia transaccional del dominio se alinea de forma nativa con los límites del documento NoSQL:
  - El Agregado `Rubrica` encapsula y persiste en un único documento sus criterios y descriptores embebidos.
  - El Agregado `Evaluacion` encapsula y persiste en un único documento sus puntajes embebidos.
- **Invariante de Ponderaciones:** El agregado `Rubrica` valida de manera estricta que la suma de `ponderacion` de sus criterios sea exactamente `1.0` (tolerancia ±0.001) antes de persistirse.
- **Inmutabilidad Post-Cálculo:** Al ejecutarse el cálculo de nota final, la evaluación cambia su estado a `COMPLETADA` y se guarda en MongoDB. El repositorio de MongoDB bloquea cualquier escritura posterior para resguardar la inmutabilidad de los históricos.

---

## 2. Decisiones Arquitectónicas (ADRs)

### ADR-01: Composición de Micro-frontend y Bases de Datos NoSQL
- **Contexto:** EvalUA requiere una persistencia de datos veloz para iframes concurrentes, mapeo directo de agregados DDD y almacenamiento temporal ligero de progreso.
- **Decisión:** Desplegar el micro-frontend utilizando un stack de composición en contenedores (**Docker Compose**) estructurado en tres servicios:
  1. `evalua-app` (Servidor Next.js 16).
  2. `evalua-mongodb` (Persistencia de documentos inmutables de rúbricas y resultados consolidados).
  3. `evalua-redis` (Caché L2 de lectura y almacenamiento volátil de progreso).
- **Consecuencias Positivas:**
  - Desempeño excepcional al cargar e iniciar el wizard del iframe.
  - Desacoplamiento de las bases de datos de la aplicación Next.js, facilitando escalamiento y auditorías.
- **Consecuencias Negativas:**
  - Requiere administrar dos motores de bases de datos adicionales (MongoDB y Redis) en la infraestructura de red.

---

### ADR-02: Integración Desacoplada y Firma Simétrica (Zero-Knowledge Completo)
- **Contexto:** La integración del micro-frontend con el Host debe ser segura, no comprometer la privacidad estudiantil, y eliminar cualquier gestión de identidad dentro de EvalUA.
- **Decisión:** EvalUA no almacena ninguna identidad humana (ni de alumnos, ni de profesores, ni de administradores). No existe colección `usuarios`. Toda validación de permisos se delega a la verificación de claims del JWT firmado simétricamente (`rol`, `rubricas_permitidas`). El claim `usuario_id` se utiliza exclusivamente para trazabilidad interna (quién creó una rúbrica, quién realizó una evaluación).
- **Consecuencias Positivas:**
  - Zero-Knowledge completo: EvalUA no expone información de ninguna persona en caso de intrusiones de datos.
  - Eliminación de la gestión de usuarios, contraseñas y sesiones dentro del micro-frontend.
  - El Host mantiene control total sobre la identidad, roles y permisos.

---

### ADR-03: Persistencia Volátil de Borradores en Redis (TTL)
- **Contexto:** El guardado automático del progreso de evaluaciones (auto-save) genera múltiples operaciones de escritura. Guardar borradores incompletos en la base documental principal contamina el historial y degrada la performance de almacenamiento.
- **Decisión:** Almacenar los borradores temporales (`EN_PROGRESO`) en Redis bajo la llave `draft:{evaluacionId}` con un tiempo de vida (TTL) automático de 30 días de inactividad. El borrador se promueve a la colección `evaluaciones` de MongoDB únicamente cuando pasa al estado `COMPLETADA` ( consolidado final) y se elimina inmediatamente de Redis (`DEL`).
- **Consecuencias Positivas:**
  - Velocidad de respuesta instantánea en el wizard ante guardados asíncronos.
  - Limpieza automática nativa de borradores abandonados por inactividad.

---

### ADR-04: Caché L2 para Lecturas en Iframe
- **Contexto:** Levantar múltiples iframes con la misma rúbrica genera lecturas concurrentes redundantes a MongoDB.
- **Decisión:** Implementar una caché de lectura de segunda capa (L2) en Redis para estructuras de rúbricas detalladas (`cache:rubrica:{rubricaId}`). Ante cualquier inserción o cambio curricular en el CRUD de rúbricas, el backend invalida activamente la llave en Redis (`DEL`).
- **Consecuencias Positivas:**
  - Tiempos de carga iniciales del iframe inferiores a 5ms en HIT.

---

### ADR-05: Arquitectura 100% Iframe-Driven
- **Contexto:** EvalUA requiere exponer funcionalidades de administración (CRUD de rúbricas, dashboard, configuración) que originalmente se diseñaron como una consola independiente con login propio. Mantener dos mecanismos de acceso (sesión interna + JWT) genera complejidad operativa, contradice el principio de desacoplamiento y obliga al micro-frontend a gestionar identidades.
- **Decisión:** Todas las interfaces de EvalUA se exponen como vistas embebidas dentro de iframes de 1029×466px, accedidas exclusivamente mediante JWT firmados por el Host. No existe navegación independiente ni consola de administración autónoma. El claim `rol` del JWT determina qué vistas y operaciones están disponibles.
- **Consecuencias Positivas:**
  - Modelo de acceso uniforme: un solo mecanismo (JWT) para todas las vistas.
  - El Host controla completamente qué ve y qué hace cada usuario.
  - Simplificación operativa: sin gestión de sesiones, sin colección `usuarios`, sin login propio.
  - Consistencia visual: todas las vistas comparten el mismo viewport y diseño compacto.
- **Consecuencias Negativas:**
  - Las vistas administrativas están limitadas al viewport de 1029×466px, lo que requiere diseños más compactos.
  - El Host debe implementar la lógica de generación de JWTs para cada contexto de uso.

---

## 3. Estándares de Diseño y Paleta de Colores evalUA

El micro-frontend mantiene los estándares visuales y la identidad de marca de la evalUA:

```css
:root {
  --color-evalUA1--: #EA7600;   /* Naranja evalUA (Primario de Acciones) */
  --color-evalUA2--: #394049;   /* Gris Carbón Oscuro (Textos principales) */
  --color-evalUA4--: #9DD4D3;   /* Celeste Turquesa Suave (Descriptor seleccionado) */
  --color-evalUA8--: #C8102E;   /* Rojo / Crimson (Alertas de exclusión / Peligro) */
  --color-evalUA16--: #fffefd;  /* Blanco Cálido (Fondo de tarjetas de criterios) */
  --color-evalUA21--: #198754;  /* Verde Aprobación (Éxito / Aprobado) */
}
```

- **Dimensionamiento Rígido:** La UI del wizard embebido se compacta a una sola columna vertical adaptada a **1029x466px**, utilizando `ScrollArea` locales para evitar scrollbars externos.
