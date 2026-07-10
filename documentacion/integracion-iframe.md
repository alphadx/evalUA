# EvalUA v3.0 — Guía de Integración por iframe

> **Dimensión del iframe:** 1029×466px  
> **Protocolo de comunicación:** postMessage  
> **Autenticación:** JWT HS256 como query parameter

---

## 1. Concepto de Integración

EvalUA es un **micro-frontend** diseñado para ser embebido dentro de un LMS Host mediante un `<iframe>`. El Host es responsable de:

1. Autenticar al usuario (su propio sistema de login)
2. Generar un JWT con los claims apropiados
3. Embeber el iframe apuntando a EvalUA con el JWT

EvalUA se encistra de:
1. Verificar el JWT
2. Mostrar la vista apropiada según el rol
3. Gestionar el estado de la evaluación (borradores en Redis)
4. Calcular la nota final

---

## 2. Estructura del iframe

### HTML mínimo

```html
<iframe
  id="evaluaIframe"
  src="http://localhost:3000/evaluar?jwt=eyJhbGciOiJIUzI1NiIs..."
  width="1029"
  height="466"
  style="width: 1029px; height: 466px; border: 0; overflow: hidden;"
  scrolling="no"
  allow="clipboard-read; clipboard-write"
></iframe>
```

### Atributos importantes

| Atributo | Valor | Razón |
|----------|-------|-------|
| `width` | `1029` | Ancho fijo del diseño |
| `height` | `466` | Alto fijo del diseño |
| `scrolling` | `no` | EvalUA maneja su propio scroll interno |
| `border` | `0` | Sin borde visible |
| `allow` | `clipboard-read; clipboard-write` | Para funciones de copiar |

### CSS recomendado del Host

```css
#iframe-evalua {
  width: 1029px;
  height: 466px;
  border: 0;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
```

---

## 3. Rutas del iframe

Cada vista de EvalUA tiene una ruta específica que se accede mediante el iframe:

| Ruta | Rol | Descripción |
|------|-----|-------------|
| `/evaluar?jwt=TOKEN` | PROFESOR | Wizard de evaluación paso a paso |
| `/rubricas?jwt=TOKEN` | MANTENEDOR, ADMINISTRADOR | Gestión de rúbricas (vista índice) |
| `/rubricas?mode=crear&jwt=TOKEN` | MANTENEDOR, ADMINISTRADOR | Crear nueva rúbrica directamente (salta el índice) |
| `/rubricas?mode=editar&id=ID&jwt=TOKEN` | MANTENEDOR, ADMINISTRADOR | Editar rúbrica existente directamente |
| `/ver-rubrica?jwt=TOKEN` | MANTENEDOR, ADMINISTRADOR | Ver rúbrica en formato matriz |
| `/dashboard?jwt=TOKEN` | ADMINISTRADOR, MANTENEDOR | Métricas y estadísticas |
| `/resultado?jwt=TOKEN` | ALUMNO | Ver resultado de evaluación |
| `/configurar?jwt=TOKEN` | ADMINISTRADOR | Configuración del sistema |

**Construcción de la URL:**

```
{EVALUA_URL}{RUTA}?jwt={TOKEN_GENERADO}
```

**Ejemplo:**
```
http://localhost:3000/evaluar?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 4. Flujo de Integración Completo

### Flujo 1: Profesor evalúa un trabajo

```
┌─────────────────────────────────────────────────────────────────┐
│ HOST (LMS)                                                      │
│                                                                 │
│ 1. Profesor hace clic en "Evaluar tarea"                       │
│ 2. El Host genera JWT:                                          │
│    { rol: "PROFESOR", usuario_id: "prof.123",                  │
│      rubrica_id: "uuid-rubrica", evaluacion_id: "uuid-eval" } │
│ 3. El Host construye URL:                                       │
│    http://evalua:3000/evaluar?jwt=<TOKEN>                      │
│ 4. El Host embebe iframe:                                      │
│    <iframe src="URL_CONSTRUIDA" width="1029" height="466">     │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ EVALUA (iframe)                                                 │
│                                                                 │
│ 5. Recibe JWT via query param                                   │
│ 6. Verifica firma HS256 + expiración + id_plataforma            │
│ 7. Determina modo = "evaluar"                                   │
│ 8. Carga rúbrica (cache Redis → MongoDB fallback)               │
│ 9. Si existe borrador en Redis → recupera progreso              │
│ 10. Muestra wizard paso a paso                                  │
│ 11. Auto-save cada 30s a Redis                                  │
│ 12. Al finalizar → POST /api/evaluaciones/:id/calcular          │
│ 13. Muestra resultado con nota final                            │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo 2: Alumno ve su resultado

```
┌─────────────────────────────────────────────────────────────────┐
│ HOST (LMS)                                                      │
│                                                                 │
│ 1. Alumno hace clic en "Ver resultado"                         │
│ 2. El Host genera JWT:                                          │
│    { rol: "ALUMNO", usuario_id: "alum.456",                    │
│      evaluacion_id: "uuid-eval" }                              │
│ 3. El Host construye URL:                                       │
│    http://evalua:3000/resultado?jwt=<TOKEN>                    │
│ 4. El Host embebe iframe                                       │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ EVALUA (iframe)                                                 │
│                                                                 │
│ 5. Verifica JWT                                                │
│ 6. Determina modo = "resultado"                                │
│ 7. Carga evaluación desde MongoDB                              │
│ 8. Muestra nota final + desglose por criterio                  │
│ 9. Indica aprobación/reprobación                               │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo 3: Mantenedor gestiona rúbricas

```
┌─────────────────────────────────────────────────────────────────┐
│ HOST (LMS)                                                      │
│                                                                 │
│ 1. Mantenedor hace clic en "Gestionar rúbricas"                │
│ 2. El Host genera JWT:                                          │
│    { rol: "MANTENEDOR", usuario_id: "mant.789",                │
│      rubricas_permitidas: ["*"] }                              │
│ 3. El Host construye URL:                                       │
│    http://evalua:3000/rubricas?jwt=<TOKEN>                     │
│ 4. El Host embebe iframe                                       │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ EVALUA (iframe)                                                 │
│                                                                 │
│ 5. Verifica JWT                                                │
│ 6. Determina modo = "rubricas"                                 │
│ 7. Lista rúbricas activas                                      │
│ 8. Permite crear/editar rúbricas                               │
│ 9. Versionado automático si hay evaluaciones previas           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Comunicación postMessage

EvalUA puede enviar mensajes al Host mediante `window.parent.postMessage()`. El Host debe escuchar estos mensajes:

### Listener en el Host

```javascript
window.addEventListener('message', (event) => {
  // Verificar origen por seguridad
  if (event.origin !== 'http://localhost:3000') return;

  const { type, data } = event.data;

  switch (type) {
    case 'EVALUA_READY':
      // El iframe ha cargado y está listo
      console.log('EvalUA listo:', data);
      break;

    case 'EVALUA_EVALUACION_GUARDADA':
      // El borrador se guardó en Redis
      console.log('Evaluación guardada:', data.evaluacionId);
      break;

    case 'EVALUA_EVALUACION_COMPLETADA':
      // La evaluación se finalizó y calculó la nota
      console.log('Nota final:', data.notaFinal);
      console.log('Aprobada:', data.aprobada);
      break;

    case 'EVALUA_ERROR':
      // Hubo un error en el proceso
      console.error('Error EvalUA:', data.message);
      break;
  }
});
```

### Tipos de mensajes (v3.0)

| Tipo | Payload | Cuándo se envía |
|------|---------|-----------------|
| `evalua.evaluation.completed` | `{ evaluacionId, status }` | Evaluación finalizada y calculada |
| `evalua.rubrica.created` | `{ rubricaId }` | Nueva rúbrica creada |
| `evalua.rubrica.updated` | `{ rubricaId, version? }` | Rúbrica existente actualizada |

**Formato del mensaje:**
```javascript
{
  source: "evalua",
  version: "3.0",
  type: "evalua.rubrica.created",   // o "evalua.evaluation.completed"
  payload: { rubricaId: "abc123" }   // varía según el tipo
}
```

### Flujo 4: Crear rúbrica directo (sin índice)

El Host puede abrir el iframe directamente en modo creación, saltando la vista de lista. Al terminar, EvalUA muestra una pantalla de éxito y envía un `postMessage` con el ID de la rúbrica creada. **El Host controla la navegación posterior.**

**URL:**
```
http://evalua:3000/rubricas?mode=crear&jwt=<TOKEN>
```

````
┌─────────────────────────────────────────────────────────────────┐
│ HOST (LMS)                                                      │
│                                                                 │
│ 1. Mantenedor/Admin hace clic en "Nueva Rúbrica"               │
│ 2. El Host genera JWT:                                          │
│    { rol: "MANTENEDOR", usuario_id: "mant.789",                │
│      rubricas_permitidas: ["*"] }                              │
│ 3. El Host construye URL con `mode=crear`:                      │
│    http://evalua:3000/rubricas?mode=crear&jwt=<TOKEN>          │
│ 4. El Host embebe iframe (modal o página dedicada)             │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ EVALUA (iframe)                                                 │
│                                                                 │
│ 5. Detecta mode=crear → abre formulario directamente           │
│ 6. Usuario completa rúbrica y hace clic en "Guardar"           │
│ 7. POST /api/rubricas con los datos                            │
│ 8. Muestra pantalla de éxito con ID de la rúbrica              │
│ 9. Envía postMessage:                                          │
│    { type: "evalua.rubrica.created",                           │
│      payload: { rubricaId: "..." } }                           │
│ 10. NO vuelve al índice — el Host controla el cierre          │
└─────────────────────────────────────────────────────────────────┘
````

**Ejemplo de listener en el Host:**
```javascript
window.addEventListener('message', (event) => {
  if (event.origin !== 'http://localhost:3000') return;

  if (event.data.type === 'evalua.rubrica.created') {
    const { rubricaId } = event.data.payload;
    console.log('Rúbrica creada:', rubricaId);

    // El Host controla qué hacer: cerrar modal, redirigir, etc.
    cerrarModalRubrica();
    // o: refrescarListaRubricas();
  }
});
```

### Flujo 5: Editar rúbrica directo (sin índice)

El Host puede abrir el iframe directamente en modo edición, saltando la vista de lista. Al terminar, EvalUA muestra una pantalla de éxito y envía un `postMessage` con el ID de la rúbrica actualizada. **Si la rúbrica tiene evaluaciones asociadas, se crea una nueva versión automáticamente.**

**URL:**
```
http://evalua:3000/rubricas?mode=editar&id=RUBRICA_ID&jwt=<TOKEN>
```

`````
┌─────────────────────────────────────────────────────────────────┐
│ HOST (LMS)                                                      │
│                                                                 │
│ 1. Mantenedor/Admin hace clic en "Editar Rúbrica"             │
│ 2. El Host genera JWT:                                          │
│    { rol: "MANTENEDOR", usuario_id: "mant.789",                │
│      rubricas_permitidas: ["*"] }                              │
│ 3. El Host construye URL con `mode=editar&id=ID`:              │
│    http://evalua:3000/rubricas?mode=editar&id=RUBRICA_ID      │
│    &jwt=<TOKEN>                                                 │
│ 4. El Host embebe iframe (modal o página dedicada)             │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ EVALUA (iframe)                                                 │
│                                                                 │
│ 5. Detecta mode=editar&id=ID → GET /api/rubricas/ID            │
│ 6. Valida JWT + permisos + acceso a la rúbrica                 │
│ 7. Abre formulario pre-cargado con datos actuales              │
│ 8. Usuario modifica rúbrica y hace clic en "Guardar"           │
│ 9. PUT /api/rubricas/ID con los datos actualizados             │
│10. Si hay evaluaciones → crea nueva versión (nuevo _id)        │
│11. Muestra pantalla de éxito con ID de la rúbrica actualizada  │
│12. Envía postMessage:                                          │
│    { type: "evalua.rubrica.updated",                           │
│      payload: { rubricaId: "...", version: N } }               │
│13. NO vuelve al índice — el Host controla el cierre          │
└─────────────────────────────────────────────────────────────────┘
````

**Importante sobre versionamiento:**
- Si la rúbrica NO tiene evaluaciones asociadas → se actualiza en lugar (mismo `_id`)
- Si la rúbrica TIENE evaluaciones asociadas → se crea nueva versión (nuevo `_id`)
- El `postMessage` siempre incluye el `_id` que quedó en uso después de la edición
- El `version` en el payload indica el número de versión (si aplica)

**Ejemplo de listener en el Host para edición:**
```javascript
window.addEventListener('message', (event) => {
  if (event.origin !== 'http://localhost:3000') return;

  if (event.data.type === 'evalua.rubrica.updated') {
    const { rubricaId, version } = event.data.payload;
    console.log('Rúbrica actualizada:', rubricaId, 'v' + (version || '?'));

    // Si se creó nueva versión, actualizar la referencia en el Host
    actualizarReferenciaRubrica(rubricaId);
    
    // El Host controla qué hacer: cerrar modal, redirigir, etc.
    cerrarModalRubrica();
    // o: refrescarListaRubricas();
  }
});
```

**Listener combinado (crear + editar):**
```javascript
window.addEventListener('message', (event) => {
  if (event.origin !== 'http://localhost:3000') return;

  const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
  
  if (data.source === 'evalua') {
    switch (data.type) {
      case 'evalua.rubrica.created':
        console.log('Nueva rúbrica:', data.payload.rubricaId);
        break;
      
      case 'evalua.rubrica.updated':
        console.log('Rúbrica actualizada:', data.payload.rubricaId, 
                    'v' + (data.payload.version || '?'));
        break;
    }
  }
});
```

---

## 6. Obtener el evaluacion_id

El Host necesita el `evaluacion_id` para:
- Generar el JWT del ALUMNO para ver el resultado
- Consultar la evaluación vía API REST

**Estrategias:**

### Opción A: El Host genera el evaluacion_id

```python
import uuid

evaluacion_id = str(uuid.uuid4())  # El Host genera el UUID

# Lo incluye en el JWT del PROFESOR
token_profesor = generate_jwt({
    "rol": "PROFESOR",
    "usuario_id": "prof.001",
    "rubrica_id": rubrica_id,
    "evaluacion_id": evaluacion_id,  # ← El Host conoce el ID
})

# Guarda en su BD local: evaluacion_id ↔ alumno ↔ tarea

# Luego genera JWT del ALUMNO con el mismo evaluacion_id
token_alumno = generate_jwt({
    "rol": "ALUMNO",
    "usuario_id": "alum.001",
    "evaluacion_id": evaluacion_id,
})
```

### Opción B: Escuchar postMessage

```javascript
window.addEventListener('message', (event) => {
  if (event.data.type === 'EVALUA_EVALUACION_COMPLETADA') {
    const evaluacionId = event.data.data.evaluacionId;
    // Guardar evaluacionId en la BD del Host
    saveToDatabase(evaluacionId);
  }
});
```

---

## 7. Seguridad del iframe

### Content Security Policy

Si el Host tiene CSP, necesita agregar a EvalUA como origen permitido:

```
frame-src http://localhost:3000 http://evalua.dominio.cl;
```

### CORS

EvalUA valida el origen contra la variable `ALLOWED_HOSTS`. Asegúrate de incluir el origen del Host:

```yaml
# docker-compose.yml
environment:
  - ALLOWED_HOSTS=http://localhost:8080,https://lms.universidad.cl
```

### Verificación de origen en postMessage

El Host SIEMPRE debe verificar `event.origin` antes de procesar mensajes:

```javascript
window.addEventListener('message', (event) => {
  if (event.origin !== 'http://localhost:3000') return; // ← CRÍTICO
  // ... procesar mensaje
});
```

---

## 8. Responsive y Adaptación

El iframe tiene dimensión fija de **1029×466px**. Para pantallas más pequeñas:

### Escalado CSS del Host

```css
.iframe-wrapper {
  width: 100%;
  max-width: 1029px;
  overflow: hidden;
}

.iframe-wrapper iframe {
  width: 1029px;
  height: 466px;
  border: 0;
  transform-origin: top left;
}

/* Escalar en pantallas pequeñas */
@media (max-width: 1100px) {
  .iframe-wrapper {
    height: calc(466px * 0.85);
  }
  .iframe-wrapper iframe {
    transform: scale(0.85);
  }
}

@media (max-width: 900px) {
  .iframe-wrapper {
    height: calc(466px * 0.7);
  }
  .iframe-wrapper iframe {
    transform: scale(0.7);
  }
}
```

---

## 9. Debugging

### Ver el JWT generado

En el demo Yii2, cada vista muestra una barra superior con:
- El rol usado
- El JWT truncado (primeros 50 caracteres)
- Botón "Copiar JWT" para obtener el token completo
- Botón "Ver URL" para ver la URL completa del iframe

### Inspeccionar el iframe

1. Abrir DevTools del navegador (F12)
2. En la pestaña Elements, buscar el `<iframe>`
3. Hacer clic derecho sobre el iframe → "Inspect" para ver su DOM
4. Para ver las peticiones de red del iframe, usar la consola con `$('iframe').contentWindow`

### Errores comunes

| Síntoma | Causa | Solución |
|---------|-------|----------|
| iframe en blanco | JWT inválido o expirado | Regenerar JWT con exp futuro |
| "No autorizado" | `id_plataforma` no coincide | Verificar variable `ID_PLATAFORMA` |
| CORS error | Host no en `ALLOWED_HOSTS` | Agregar origen a la variable |
| iframe no carga | `ALLOWED_HOSTS` mal configurado | Verificar que incluya el puerto |
| Contenido cortado | Dimensiones incorrectas | Usar exactamente 1029×466 |

---

## 10. Ejemplo HTML Completo del Host

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Evaluación - Mi LMS</title>
  <style>
    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1029px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    .header {
      padding: 16px 24px;
      background: #394049;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h2 { margin: 0; font-size: 18px; }
    .badge {
      background: #EA7600;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .iframe-wrapper {
      width: 1029px;
      height: 466px;
    }
    iframe {
      width: 1029px;
      height: 466px;
      border: 0;
      display: block;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Evaluación: Proyecto Final</h2>
      <span class="badge">PROFESOR</span>
    </div>
    <div class="iframe-wrapper">
      <iframe
        id="evaluaIframe"
        src="http://localhost:3000/evaluar?jwt=TOKEN_AQUI"
        scrolling="no"
        allow="clipboard-read; clipboard-write"
      ></iframe>
    </div>
  </div>

  <script>
    // Escuchar mensajes de EvalUA
    window.addEventListener('message', (event) => {
      if (event.origin !== 'http://localhost:3000') return;

      console.log('[EvalUA]', event.data.type, event.data.data);

      if (event.data.type === 'EVALUA_EVALUACION_COMPLETADA') {
        const { evaluacionId, notaFinal, aprobada } = event.data.data;
        alert(`Evaluación completada!\nNota: ${notaFinal}\n${
          aprobada ? '✅ APROBADA' : '❌ REPROBADA'
        }`);
      }
    });
  </script>
</body>
</html>