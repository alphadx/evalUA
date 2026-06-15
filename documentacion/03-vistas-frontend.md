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
2. **Tarjetas de Descriptores Interactivas:** Cada descriptor se muestra como un botón de alto contraste con:
   - **Círculo de nota** (28px) con color semántico: verde (≥5), naranja (4), amarillo (3), rojo (≤2).
   - **Etiqueta del nivel** (ej: "Excelente") y check mark (✓) si está seleccionado.
   - **Bullet points concatenados:** Los puntos clave del descriptor se muestran como texto corrido unidos con guiones (" — "), filtrando entradas vacías. El contenedor crece naturalmente según el largo del texto.
   - Al hacer clic:
     - Se marca el nivel visualmente (borde izquierdo 4px + fondo `--color-evalUA4--`).
     - Se guarda el puntaje temporalmente en la evaluación.
     - El sistema avanza automáticamente al siguiente criterio (con delay de 400ms). Al calificar el último criterio, avanza automáticamente a la pantalla de Resumen.
3. **Barra de Cálculo Acumulado:** Franja inferior fija (`sticky bottom-0`) que muestra en tiempo real la nota final calculada basada en las selecciones actuales. Incorpora alertas semánticas si se fallan criterios de la regla Gatekeeper. La comparación de aprobación usa la `notaAprobacion` de la rúbrica (configurable, por defecto 4.0), y la detección de Gatekeeper usa el `notaCorte` de cada criterio excluyente (configurable, por defecto 4.0).
4. **Auto-save en Segundo Plano:** Cada clic de calificación o inserción de comentarios en el campo de observaciones dispara una petición asíncrona `PUT /api/evaluaciones/[id]` para evitar pérdida de progreso por desconexiones o cierres de ventana (transicionando el borrador a `EN_REVISION` cuando se entra a la pantalla de resumen).
5. **Acción Final (Visualización de Resumen):** Al calificar el último criterio, el wizard avanza automáticamente al paso de Resumen en lugar de habilitar directamente la finalización desde el criterio.
6. **Pantalla de Resumen y Confirmación:**
   - **Contenido:** Muestra la lista completa de criterios con la nota asignada y la etiqueta del descriptor seleccionado, la nota final calculada provisional (ponderada con regla Gatekeeper aplicada, usando `notaCorte` configurable por criterio excluyente), e indicadores visuales de aprobación/reprobación por criterio (comparando contra `notaAprobacion` de la rúbrica) y global.
   - **Detalle del Cálculo:** Sección que desglosa la contribución ponderada de cada criterio (nota × peso = contribución) y la nota final, más la alerta de Gatekeeper si corresponde.
   - **Botón "✏ Modificar":** Cada criterio del resumen incluye un botón para regresar al paso correspondiente y editar la calificación.
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
- **Campos configurables por rúbrica:** El formulario incluye el campo `notaAprobacion` (number, 1.0–7.0, default 4.0) que define la nota mínima para aprobar evaluaciones de esa rúbrica. A nivel de criterio, el checkbox "Excluyente (Gatekeeper)" activa un campo condicional `notaCorte` (number, 1.0–7.0, default 4.0) que define el umbral individual de gatekeeper por criterio.
- **ID de referencia visible:** Cada rúbrica exhibe su `_id` (UUID) en contenedor dashed con botón de copiar al portapapeles, para que el mantenedor pueda comunicar el identificador al equipo de integración del Host.

#### Diseño de la Vista Lista
- **Cards compactas con accent bar:** Cada rúbrica se muestra como una card con barra de acento superior de 3px (verde si activa, gris si inactiva).
- **Badges compactos:** Estado (Activa/Inactiva), versión (v{n}), y cantidad de criterios como badges inline ultra compactos.
- **Expandible:** Cada card puede expandirse para mostrar la vista previa de criterios con badges de ponderación y tipo (E/C).

#### Diseño del Formulario Crear/Editar (Accordion)
El formulario implementa un patrón de **accordion** optimizado para el viewport de 466px:

1. **Datos Generales Colapsables:** La sección de título y nota de aprobación puede colapsarse. Cuando está colapsada, muestra el título como preview inline.
2. **Accordion de Criterios (un solo criterio expandido a la vez):**
   - Los criterios colapsados muestran un resumen compacto: número, nombre, badges de tipo/ponderación/gatekeeper.
   - Solo un criterio puede estar expandido a la vez (`criterioActivoIdx`).
   - El criterio activo tiene borde naranja y sombra sutil como indicador visual.
   - Al expandir, se muestra "Criterio X de N" como indicador de progreso.
3. **Scroll-into-view:** Al expandir un criterio o agregar uno nuevo, el contenedor hace scroll suave (`scrollIntoView({ behavior: 'smooth', block: 'start' })`) para mantener el criterio activo visible.
4. **Inputs compactos:** Clases CSS `embed-input-compact` (h-7, text-xs) e `embed-input-xs` (h-6, text-[11px]) para minimizar la altura ocupada.
5. **Switch toggle y nota de corte:** El toggle de "Excluyente (Gatekeeper)" usa un switch CSS personalizado en vez de checkbox nativo. Al activarse, muestra un campo condicional "Nota de corte" para definir el umbral individual del gatekeeper (default 4.0). La badge del criterio excluyente muestra "Excluyente (corte: X.X)".
6. **Descriptores visibles en modo activo:** Al expandir un criterio, los 7 niveles de descriptores se muestran directamente con cards coloreadas (verde ≥5, amarillo 4, rojo <4) y badges de nota.
7. **Botón "Siguiente criterio →":** Navegación rápida al siguiente criterio con dashed border.
8. **Header de criterios sticky:** El encabezado de la sección de criterios (título "Criterios", badge de cantidad, badge Σ de ponderaciones, y botón "+ Criterio") permanece fijo en la parte superior del área scrolleable (`position: sticky; top: 0; z-index: 5`) con fondo sólido del color de fondo (`--embed-bg`), borde inferior de separación y márgenes compensados para extenderse a todo el ancho. Esto garantiza que el botón de agregar criterio y el resumen de ponderaciones sean siempre accesibles sin importar cuántos criterios existan en la lista.
9. **Footer sticky:** El panel de Cancelar/Guardar permanece fijo en la parte inferior (`position: sticky; bottom: 0`) con `z-index: 10`.

#### Consideraciones de Diseño para Elementos Sticky en Viewports Embebidos
El formulario crear/editar utiliza **dos zonas sticky** (header criterios + footer acciones) dentro de un contenedor con `overflow-y: auto`. Esto requiere atención a los siguientes puntos:

1. **Stacking de sticky elements:** En un contenedor con `overflow-y: auto`, múltiples elementos con `position: sticky` se apilan correctamente siempre que cada uno tenga un `top` o `bottom` diferente. El header de criterios usa `top: 0` y el footer usa `bottom: 0; z-index: 10` (mayor para estar encima del contenido que scrollea).
2. **Fondo sólido obligatorio:** Un elemento sticky sin `backgroundColor` se vuelve translúcido, permitiendo que el contenido que scrollea por debajo sea visible y genere confusión visual. El header de criterios aplica `backgroundColor: var(--embed-bg)` para cubrir completamente el contenido subyacente.
3. **Márgenes compensados:** El contenedor padre del scroll tiene `px-3` (padding horizontal). Para que el header sticky ocupe todo el ancho sin dejar bordes visibles, se aplica `margin: 0 -0.75rem` + `paddingLeft/Right: 0.75rem`, anulando efectivamente el padding del padre solo en ese elemento.
4. **"Datos Generales" fuera del sticky:** La sección de datos generales queda **por encima** del header sticky y scrollea normalmente. Esto es intencional: en modo "editar" viene colapsada por defecto (ocupa ~28px), y en modo "crear" el usuario la completa primero y luego scrollea hacia abajo. Si esta sección fuera sticky también, consumiría espacio vertical fijo reduciendo el área visible de criterios.
5. **Consideración para futuros desarrollos:** Si en el viewport embebido se necesitan más de dos zonas sticky simultáneas, evaluar migrar a un layout con CSS Grid de filas fijas (`grid-template-rows: auto 1fr auto`) en lugar de sticky, ya que el stacking de sticky elements tiene limitaciones en navegadores más antiguos y puede generar comportamiento inesperado con `border-radius` o `box-shadow`.
6. **Pruebas recomendadas:** Verificar que el sticky funcione correctamente tanto con 1 criterio como con 15+ criterios, y que el `scrollIntoView` al expandir/colapsar criterios no entre en conflicto con la posición sticky (el criterio activo debe quedar visible **debajo** del header sticky, no debajo de él).

#### Contadores y Validación Visual
- **Ponderaciones Σ:** Badge inline que muestra la suma actual y ✓/✗ según validez (debe ser 1.0 ±0.001).
- **Error display:** Alerta roja con fondo rojo pastel para errores de validación.

- **Viewport:** La interfaz completa del CRUD se adapta a los límites de `1029x466px` con scroll local y footer sticky.

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

---

## 6. Clases CSS Utilitarias (`globals.css`)

### 6.1 Clases Base (Existentes)

| Clase | Uso | Dimensión |
|---|---|---|
| `.embed-frame` | Contenedor raíz del viewport embebido | `w-full min-h-[466px]` |
| `.embed-header` | Barra superior con título y badge | `padding: 0.85rem 1.25rem` |
| `.embed-content` | Área de scroll local | `flex: 1; overflow: hidden` |
| `.embed-panel` | Card con borde y sombra | `border-radius: 1.25rem` |
| `.embed-input` / `.embed-textarea` | Inputs estándar | `padding: 0.65rem 0.75rem` |
| `.embed-button-primary` | Botón acción principal | bg: `--color-evalUA1` |
| `.embed-button-outline` | Botón secundario | border: `rgba(57,64,73,0.2)` |

### 6.2 Clases Compactas (Nuevas v3.1)

Optimizadas para el viewport de 466px donde el espacio vertical es crítico:

| Clase | Uso | Dimensión |
|---|---|---|
| `.embed-input-compact` | Inputs compactos para formularios | `padding: 0.35rem 0.55rem; font-size: 0.75rem` |
| `.embed-input-xs` | Inputs extra compactos (descriptores) | `padding: 0.25rem 0.45rem; font-size: 0.6875rem` |
| `.embed-card-compact` | Card con accent bar superior | `border-radius: 1rem; overflow: hidden` |
| `.embed-card-accent` | Barra de acento 3px (success/muted) | `height: 3px; position: absolute` |
| `.embed-criterion-card` | Card de criterio en accordion | `padding: 0.65rem 0.75rem; border-radius: 0.75rem` |
| `.embed-descriptor-card` | Card de descriptor (level-high/mid/low) | `padding: 0.4rem 0.55rem; border-radius: 0.5rem` |
| `.embed-switch` | Toggle switch CSS puro | `width: 2rem; height: 1rem` |
| `.embed-badge-sm` | Badge ultra compacto | `font-size: 0.5625rem; padding: 0.1rem 0.4rem` |

#### Variantes de `.embed-badge-sm`:
- `.success` — verde (activo, aprobado)
- `.warning` — amarillo (pendiente)
- `.danger` — rojo (gatekeeper, error)
- `.primary` — naranja (tipo estructural, seleccionado)
- `.neutral` — gris (tipo complementario, versión)

#### Variantes de `.embed-descriptor-card`:
- `.level-high` — fondo verde pastel (`#f0fdf4`) para notas ≥ 5
- `.level-mid` — fondo amarillo pastel (`#fefce8`) para nota 4
- `.level-low` — fondo rojo pastel (`#fef2f2`) para notas ≤ 3
