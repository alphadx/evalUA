# Historias de Usuario — EvalUA v3.0

> **Especificación Funcional — EvalUA**  
> Definición de historias de usuario (HU) y sus criterios de aceptación para el micro-frontend de evaluación.

---

## 1. Mantenimiento de Rúbricas y Configuración Embebida

### HU-03: Mantenimiento de Rúbricas (Iframe)
**Como** Mantenedor o Administrador (rol definido por el Host mediante JWT)
**Quiero** crear, editar y estructurar los criterios y descriptores de una rúbrica dentro del iframe embebido
**Para** definir los estándares bajo los cuales se evaluará.

**Criterios de Aceptación:**
- El Host lanza el iframe apuntando a `/embed/rubricas?jwt={token}` donde el token contiene `rol: MANTENEDOR` o `rol: ADMINISTRADOR`.
- La interfaz permite agregar criterios ingresando: Nombre, Ponderación, Tipo y si es Excluyente.
- El sistema valida que la suma de ponderaciones sea exactamente 1.0 antes de permitir guardar.
- Cada criterio expone campos para rellenar los 7 niveles de descriptores.
- Al crear una rúbrica exitosamente, EvalUA emite `postMessage` con tipo `evalua.rubrica.created` incluyendo el `rubricaId` generado, para que el Host lo almacene.
- La interfaz muestra el `_id` (UUID) de cada rúbrica de forma visible y copiable.
- Si el claim `puede_ver_rubricas_ajenas` es `false`, el mantenedor solo ve las rúbricas donde `usuario_id` coincide con el creador. Si es `true`, ve todas.
- Si el token no contiene `rol: MANTENEDOR` o `rol: ADMINISTRADOR`, se muestra error `403 Forbidden`.

---

### HU-04: Versionamiento Inmutable de Rúbricas
**Como** Mantenedor  
**Quiero** editar una rúbrica en uso sin alterar el histórico de evaluaciones del pasado  
**Para** resguardar la validez de los registros históricos.

**Criterios de Aceptación:**
- Si el mantenedor edita una rúbrica que no tiene evaluaciones asociadas, los cambios se guardan directamente.
- Si la rúbrica ya tiene al menos una evaluación guardada, el sistema bloquea la mutación directa y fuerza la clonación: crea una rúbrica idéntica con versión `N+1`, desactiva la original (`esActiva = false`), y abre el editor sobre la versión nueva.

---

## 2. Flujo de Evaluación Embebido (Iframe)

### HU-05: Validación Segura de Lanzamiento
**Como** Desarrollador de Integración (Host)  
**Quiero** enviar al evaluador a EvalUA mediante un token firmado y seguro  
**Para** garantizar que la solicitud proviene de una plataforma autorizada.

**Criterios de Aceptación:**
- El Host levanta el iframe apuntando a `/embed/evaluar?jwt={token}`.
- El backend de EvalUA intercepta la petición, verifica que el token esté firmado con la clave `KEY` simétrica y que contenga el `id_plataforma` correcto.
- Si el token es válido, se inicializa el wizard. Si es inválido, muestra pantalla de error `401 Unauthorized` con el código de error correspondiente.

---

### HU-06: Wizard Interactivo Paso a Paso
**Como** Profesor Evaluador  
**Quiero** calificar los criterios de manera interactiva botón-a-botón dentro de un viewport compacto  
**Para** agilizar el proceso de corrección sin distracciones.

**Criterios de Aceptación:**
- El wizard muestra los criterios uno a uno. Se deshabilita la grilla de escritorio, unificando todo en una sola columna vertical.
- Los 7 descriptores de desempeño se renderizan como botones/cajas interactivas. Al hacer clic en un nivel, se selecciona el puntaje y se pasa al siguiente criterio automáticamente. Al calificar el último criterio, el wizard avanza automáticamente a la pantalla de Resumen en lugar de habilitar directamente la opción de finalizar.
- El wizard completo (título, progreso, descriptores y botones) cabe estrictamente dentro de **1029x466px** sin activar barras de scroll en el host.

---

### HU-07: Guardado Automático de Borradores (Auto-save)
**Como** Profesor Evaluador  
**Quiero** que mis selecciones se guarden automáticamente en segundo plano  
**Para** no perder mi avance en caso de cortes de red o cierres accidentales.

**Criterios de Aceptación:**
- Cada vez que el evaluador selecciona una nota en un criterio o edita las observaciones, el frontend envía un `PUT` en segundo plano con el estado actual del borrador.
- El guardado automático muestra un indicador discreto de "Guardando borrador..." y "Borrador guardado".

---

### HU-08: Cierre y Envío de Señales de Finalización
**Como** Profesor Evaluador  
**Quiero** dar por finalizada la evaluación una vez calificados todos los criterios obligatorios  
**Para** consolidar la nota definitiva e informar al Host.

**Criterios de Aceptación:**
- El botón "Finalizar Evaluación" solo aparece en la pantalla de Resumen y solo se activa cuando todos los criterios de la rúbrica tienen una calificación asignada.
- El evaluador puede hacer clic en cualquier criterio desde la pantalla de Resumen para volver a ese paso y modificar su calificación. Al modificar y guardar, el wizard permite navegar hacia adelante hasta regresar al Resumen nuevamente.
- Presionar "Atrás" en la pantalla de Resumen permite retroceder al último criterio calificado.
- Al confirmar la finalización presionando "Finalizar Evaluación", el backend ejecuta el cálculo definitivo (aplicando la regla Gatekeeper si aplica), persiste el documento en MongoDB (estado `COMPLETADA`), elimina el borrador de Redis y el frontend emite un mensaje `postMessage` con tipo `evalua.evaluation.completed` y el `evaluacionId` al Host.

---

### HU-09: Vista de Resultados en Modo Lectura (Iframe)
**Como** Alumno, Profesor, Mantenedor o Administrador (rol definido por el Host mediante JWT)
**Quiero** ver la rúbrica de una evaluación finalizada en modo de solo lectura
**Para** revisar la retroalimentación sin posibilidad de alterar las notas.

**Criterios de Aceptación:**
- El Host abre el iframe apuntando a `/embed/resultado?jwt={token}` donde el token contiene `evaluacion_id` y `rol`.
- La interfaz carga la evaluación completada y la rúbrica, mostrando cada criterio como una fila colapsable (patrón acordeón single-open).
- Al expandir un criterio, se despliegan los 7 descriptores con el seleccionado resaltado visualmente.
- Todos los inputs y campos de observaciones están deshabilitados.
- Los alumnos ven exclusivamente sus propias evaluaciones, sin información de otros evaluados.
- Los profesores ven los resultados de evaluaciones que ellos realizaron.
- Los roles `MANTENEDOR` y `ADMINISTRADOR` pueden ver cualquier resultado.
- La nota final de la evaluación es visible de forma permanente, independientemente del criterio que esté expandido.

---

### HU-10: Dashboard de Métricas (Iframe)
**Como** Mantenedor o Administrador
**Quiero** ver métricas y estado del sistema de evaluación dentro del iframe embebido
**Para** monitorear la actividad y el uso de las rúbricas.

**Criterios de Aceptación:**
- El Host lanza el iframe apuntando a `/embed/dashboard?jwt={token}` donde el token contiene `rol: MANTENEDOR` o `rol: ADMINISTRADOR`.
- Se muestran tarjetas de métricas: Rúbricas Creadas, Evaluaciones en Curso, Evaluaciones Completadas.
- Se muestra un historial reciente de las últimas evaluaciones.
- Los mantenedores solo ven métricas asociadas a sus rúbricas (filtrado por `usuario_id`).
- Los administradores ven métricas globales del sistema.

---

### HU-11: Configuración del Sistema (Iframe)
**Como** Administrador (rol definido por el Host mediante JWT)
**Quiero** modificar los parámetros de configuración del micro-frontend dentro del iframe embebido
**Para** ajustar el comportamiento del sistema sin acceso directo a la infraestructura.

**Criterios de Aceptación:**
- El Host lanza el iframe apuntando a `/embed/configurar?jwt={token}` donde el token contiene `rol: ADMINISTRADOR`.
- La interfaz permite leer y modificar las variables de la colección `configuraciones`.
- Si el JWT no contiene `rol: ADMINISTRADOR`, se muestra error `403 Forbidden`.
