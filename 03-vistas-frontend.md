# Vistas y Componentes del Frontend — EvalUA v3.0

> **Documento de Especificación del Frontend — EvalUA**  
> **Versión:** 3.0.0  
> **Framework:** Next.js 16 (App Router) + shadcn/ui + Vanilla CSS (Variables corporativas evalUA)

---

## 1. Arquitectura General del Frontend

El frontend de EvalUA es 100% iframe-driven. No cuenta con una consola de administración independiente. Todas las vistas están contenidas en el **Route Group** `(embed)` y se adaptan a un viewport fijo.

```
src/app/
└── (embed)/
    ├── layout.tsx          <-- Layout desnudo (viewport estricto 1029x466px)
    ├── evaluar/
    │   └── page.tsx        <-- Wizard interactivo de evaluación
    ├── resultado/
    │   └── page.tsx        <-- Vista de resultados en modo lectura
    ├── rubricas/
    │   └── page.tsx        <-- CRUD de rúbricas (Mantenedor / Admin)
    ├── dashboard/
    │   └── page.tsx        <-- Métricas y estado del sistema (Mantenedor / Admin)
    └── configurar/
        └── page.tsx        <-- Panel de parámetros (solo Admin)
```

---



## 3. Interfaces Embebidas `(embed)`

### 3.1 Contrato del Viewport Embebido

El iframe cargado por el Host posee dimensiones físicas fijas. La aplicación interna optimiza su área de trabajo para ajustarse con precisión milimétrica a la superficie de visualización objetivo:

| Dimensión | Límite Externo | Viewport Interno de Visualización |
|---|---|---|
| Ancho | `1029px` | `1029px` (Max-width) |
| Alto | `466px` | `466px` (Max-height) |
| Desplazamiento raíz | Bloqueado (`overflow: hidden`) | Bloqueado (`overflow: hidden`) en el `<body>` y `<main>` |
| Desplazamiento interno | `ScrollArea` local | `ScrollArea` local (`overflow-y: auto`) solo en listas |

#### Control del Overflow y Modales Inline (Mitigación R-5.1)
Para evitar scrollbars dobles y recortes visuales indeseados:
1. **CSS Reset Estricto:** El `layout.tsx` raíz define `w-[1029px] h-[466px] overflow-hidden m-0 p-0` de forma estricta.
2. **Scroll Local:** Solo los paneles de contenido dinámico (como la lista de rúbricas o el historial de criterios) implementan contenedores con `overflow-y: auto` y scrollbars estilizados y compactos.
3. **Modales Confinados:** Se prohíbe el uso de ventanas modales (`<Dialog>`, `<Popover>`) que utilicen `React Portals` hacia el `body` sin restricciones de z-index o posicionamiento absoluto referenciado al viewport total de la pantalla. Todos los diálogos, tooltips y selectores desplegables están confinados en línea (inline) dentro de los límites del contenedor principal de 1029x466px para evitar que queden ocultos por el recorte del iframe.

#### Pruebas de Regresión Visual Automáticas
Como medida del estado del arte para garantizar la integridad de la interfaz, el pipeline de CI/CD incorpora pruebas de regresión visual (VRT) utilizando **Playwright** y **Percy**. Esto asegura que las dimensiones fijas y la visualización de los componentes no sufran desajustes accidentales (R-5.1).

---

### 3.2 Wizard de Evaluación (Iframe)
- **Ruta:** `/evaluar`
- **Propósito:** Mostrar los criterios uno a uno permitiendo al evaluador calificar interactivamente y revisar el resultado antes de la consolidación final.

#### Wizard de Calificación (Ejemplo Paso de Calificación):
```
┌────────────────────────────────────────────────────────────────────────────┐
│ Rúbrica: Proyecto de Ingeniería  [Progreso: Criterio 2 de 5 + Resumen] (Can)│
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Criterio actual: Calidad del Código (Ponderación: 20%)                    │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Nota 7: Excelente - El código es limpio y modular.                    │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ Nota 5: Aceptable - El código funciona pero falta modularidad.        │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ Nota 3: Insuficiente - Errores estructurales presentes.              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│ [Atrás] [Siguiente]                     Cálculo Acumulado: Nota 5.4 [Badge]│
└────────────────────────────────────────────────────────────────────────────┘
```

#### Pantalla de Resumen y Confirmación (Último Paso):
```
┌────────────────────────────────────────────────────────────────────────────┐
│ Rúbrica: Proyecto de Ingeniería  [Progreso: Resumen]                (Cancelar) │
├────────────────────────────────────────────────────────────────────────────┤
│  Resumen de Calificaciones (Haga clic en un criterio para editar):         │
│  1. Calidad del Código (20%) -> Nota 5: Aceptable               [Aprobado] │
│  2. Documentación (30%)      -> Nota 7: Excelente               [Aprobado] │
│  3. Pruebas Unitarias (50%)  -> Nota 3: Insuficiente            [Reprobado]│
│  Observaciones generales:                                                  │
│  [ El proyecto cumple con la funcionalidad, pero requiere refactor...   ] │
├────────────────────────────────────────────────────────────────────────────┤
│ [Atrás] [Finalizar Evaluación]    Nota Final Provisional: 4.6 [Exclusión]  │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Elementos Clave de la Interfaz:
1. **Layout de Columna Única:** Se elimina cualquier sidebar. Toda la superficie se dedica a la visualización clara del criterio activo o de la pantalla de resumen.
2. **Tarjetas de Descriptores Interactivas:** Cada descriptor se muestra como un botón de alto contraste. Al hacer clic:
   - Se marca el nivel visualmente (usando el color `--color-evalUA4--` de selección).
   - Se guarda el puntaje temporalmente en la evaluación.
   - El sistema avanza automáticamente al siguiente criterio. Al calificar el último criterio, avanza automáticamente a la pantalla de Resumen.
3. **Barra de Cálculo Acumulado:** Franja inferior fija (`sticky bottom-0`) que muestra en tiempo real la nota final calculada basada en las selecciones actuales. Incorpora alertas semánticas si se fallan criterios de la regla Gatekeeper.
4. **Auto-save en Segundo Plano:** Cada clic de calificación o inserción de comentarios en el campo de observaciones dispara una petición asíncrona `PUT /api/evaluaciones/[id]` para evitar pérdida de progreso por desconexiones o cierres de ventana (transicionando el borrador a `EN_REVISION` cuando se entra a la pantalla de resumen).
5. **Acción Final (Visualización de Resumen):** Al calificar el último criterio, el wizard avanza automáticamente al paso de Resumen en lugar de habilitar directamente la finalización desde el criterio.
6. **Pantalla de Resumen y Confirmación:**
   - **Contenido:** Muestra la lista completa de criterios con la nota asignada y la etiqueta del descriptor seleccionado, la nota final calculada provisional (ponderada con regla Gatekeeper aplicada), e indicadores visuales de aprobación/reprobación por criterio y global.
   - **Campo de Observaciones Generales:** Campo de texto editable para comentarios globales sobre la evaluación, sincronizado con auto-save.
   - **Navegación Interactiva:** El evaluador puede hacer clic en cualquier criterio en la lista del resumen para regresar a su paso y modificar la calificación. Tras modificar, puede navegar hacia adelante libremente de nuevo hasta regresar al Resumen. El botón "Atrás" retrocede al último criterio de la rúbrica.
   - **Confirmación Definitiva ("Finalizar Evaluación"):** Este botón solo aparece en la pantalla de Resumen. Al presionarlo se ejecuta el cálculo final, se persiste en MongoDB (estado `COMPLETADA`), se elimina el borrador de Redis y se emite el postMessage de completado al host:
     ```typescript
     window.parent.postMessage({
       source: "evalua",
       version: "3.0",
       type: "evalua.evaluation.completed",
       payload: {
         evaluacionId: "id-de-evaluacion-finalizada",
         status: "completed"
       }
     }, "*");
     ```

---

### 3.3 Vista de Resultados (Iframe)
- **Ruta:** `/embed/resultado?jwt={token}`
- **Acceso:** Roles `ALUMNO`, `PROFESOR`, `MANTENEDOR` y `ADMINISTRADOR`.
- **Diferenciación por rol:**
  - `ALUMNO`: Solo ve sus propias evaluaciones. La interfaz muestra exclusivamente el desglose de la rúbrica con la nota obtenida, sin acceso a observaciones de otros alumnos ni a información de otros evaluadores.
  - `PROFESOR`: Puede ver los resultados de evaluaciones que realizó.
  - `MANTENEDOR` / `ADMINISTRADOR`: Pueden ver cualquier resultado.
- **Propósito:** Visualización de solo lectura del estado final de una evaluación. La interfaz presenta cada criterio como una fila colapsable dentro de un patrón de acordeón single-open (solo un criterio expandido a la vez):
  - **Estado colapsado (por defecto):** Cada criterio se muestra como una fila compacta que exhibe el nombre del criterio, su ponderación y la nota asignada en un badge visible. Al hacer clic sobre la fila, se expande y cualquier otro criterio previamente expandido se contrae automáticamente.
  - **Estado expandido:** Al expandir un criterio, se despliegan los 7 niveles de descriptores completos. El descriptor correspondiente a la calificación asignada se marca visualmente de forma destacada (fondo con color de selección `--color-evalUA4--` #9DD4D3 y/o borde lateral en color de éxito `--color-evalUA21--` #198754), mientras que los descriptores no seleccionados se muestran en estilo atenuado (texto secundario, fondo neutro) para establecer un contraste claro. Los bullet points del descriptor seleccionado son visibles para que el estudiante comprenda por qué recibió esa calificación.
  - **Interacción:** Todos los inputs, botones de selección y campos de observaciones están deshabilitados (solo lectura). La única interacción permitida es el click para expandir/contraer las secciones del acordeón.
  - **Nota final destacada:** La nota final de la evaluación se exhibe de forma permanente en la franja superior o inferior del viewport, independiente del estado de expansión de los criterios.
  - **Viewport:** El contenido se ajusta a los límites de 1029×466px utilizando un `ScrollArea` local solo cuando el contenido expandido exceda el área disponible.

---

### 3.4 CRUD de Rúbricas (Iframe)
- **Ruta:** `/embed/rubricas?jwt={token}`
- **Acceso:** Roles `MANTENEDOR` y `ADMINISTRADOR`.
- **Funcionalidad:** Listado de rúbricas filtrado según `usuario_id` y claim `puede_ver_rubricas_ajenas`. Creación y edición de rúbricas con formulario dinámico. Versionamiento inmutable al editar rúbricas con evaluaciones previas. Al crear una rúbrica, el evento `postMessage` `evalua.rubrica.created` retorna el `rubricaId` generado al Host.
- **ID de referencia visible:** Cada rúbrica exhibe su `_id` (UUID) con botón de copiar al portapapeles, para que el mantenedor pueda comunicar el identificador al equipo de integración del Host.
- **Viewport:** La interfaz completa del CRUD se adapta a los límites de `1029x466px` utilizando scrollareas locales.

### 3.5 Dashboard de Métricas (Iframe)
- **Ruta:** `/embed/dashboard?jwt={token}`
- **Acceso:** Roles `MANTENEDOR` y `ADMINISTRADOR`.
- **Funcionalidad:** Tarjetas de métricas (Rúbricas Creadas, Evaluaciones en Curso, Evaluaciones Completadas). Historial reciente de las últimas 10 evaluaciones. Los mantenedores solo ven métricas de sus rúbricas; los administradores ven todo.
- **Viewport:** Grid adaptada a `1029x466px` con visualización compacta y ScrollArea.

### 3.6 Configuración del Sistema (Iframe)
- **Ruta:** `/embed/configurar?jwt={token}`
- **Acceso:** Solo rol `ADMINISTRADOR`.
- **Funcionalidad:** Panel para modificar variables de configuración interna del micro-frontend (TTL de borradores, parámetros de caché, etc.). Si un JWT con rol distinto intenta acceder, se muestra pantalla de error `403 Forbidden`.
- **Viewport:** Ajustado estrictamente a `1029x466px` con ScrollArea.

---

## 4. Gestión de Estado (Zustand Store)

El estado global de la aplicación se centraliza en `src/lib/store.ts` con la siguiente estructura simplificada:

```typescript
interface AppState {
  // Estado Vistas Embebidas
  rubricas: Rubrica[];
  configuracion: Configuracion[];
  
  // Estado Wizard y Resultados
  evaluacionActiva: Evaluacion | null;
  rubricaDetallada: Rubrica | null;
  criterioIndiceActivo: number;
  loadingCalculo: boolean;

  // Acciones
  setRubricas: (rubricas: Rubrica[]) => void;
  setEvaluacionActiva: (evaluacion: Evaluacion | null) => void;
  setCriterioIndiceActivo: (index: number) => void;
  guardarPuntajeLocal: (criterioId: string, nota: number, obs?: string) => void;
}
```

---

## 5. Paleta de Colores Corporativos evalUA

El diseño visual de las vistas utiliza de forma estricta las variables CSS institucionales:

- **Primario (`--color-evalUA1--` - `#EA7600`):** Botones de acción, wizard stepper activo.
- **Fondo de Selección (`--color-evalUA4--` - `#9DD4D3`):** Criterio/descriptor seleccionado en hover o activo.
- **Éxito (`--color-evalUA21--` - `#198754`):** Notas aprobatorias (≥ 4.0), estados completados.
- **Peligro (`--color-evalUA8--` - `#C8102E`):** Notas reprobatorias (< 4.0), fallos de exclusión Gatekeeper.
- **Neutro Oscuro (`--color-evalUA2--` - `#394049`):** Texto principal e interfaces tipográficas.
- **Fondo Tarjetas (`--color-evalUA16--` - `#fffefd`):** Contenedores de descriptores del wizard.
