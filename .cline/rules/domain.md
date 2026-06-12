# Reglas de Dominio — EvalUA v3.0

## Reglas de Negocio Inquebrantables

### Rúbrica
1. **Suma de ponderaciones = 1.0** (tolerancia ±0.001). Si no cumple, rechazar la persistencia con error `RUBRICA_PONDERACION_INVALIDA`.
2. Cada criterio tiene una escala de descriptores (1.0 a 7.0).
3. Un criterio puede ser marcado como `esExcluyente` (activa Gatekeeper).
4. La rúbrica pertenece a un `id_plataforma` (tenant).

### Evaluación
5. **Estados (FSM):** `EN_PROGRESO` → `EN_REVISION` → `COMPLETADA`
   - De `EN_PROGRESO` a `EN_REVISION`: cuando todos los criterios tienen nota asignada
   - De `EN_REVISION` a `EN_PROGRESO`: cuando se modifica una calificación existente
   - De `EN_REVISION` a `COMPLETADA`: cuando el evaluador finaliza explícitamente
   - De `COMPLETADA`: **NINGUNA TRANSICIÓN** (inmutable)

### Cálculo de Nota
6. **Fórmula Normal:** `notaFinal = Σ(notaCriterio_i × ponderacion_i)` redondeado a 2 decimales
7. **Escala:** 1.0 a 7.0, aprobación en 4.0
8. **Exigencia:** Porcentaje configurable (default 60%). La nota se calcula como: `notaCalculada = 1.0 + (notaPromedio - 1.0) × (exigencia / 100)`... o según la fórmula definida en el feature file
9. **Gatekeeper:** Si un criterio marcado como `esExcluyente` tiene nota < 4.0, la nota final se establece en **1.0** automáticamente, independiente del promedio

### Borradores (Redis)
10. Los borradores se almacenan en Redis como `draft:{evaluacionId}`
11. **TTL:** 30 días de inactividad
12. Al completar la evaluación, se promueve a MongoDB y se elimina de Redis (`DEL`)

### Caché L2 (Redis)
13. Rúbricas se cachean como `cache:rubrica:{rubricaId}`
14. Cualquier CRUD de rúbrica **invalida** la caché activamente
15. HIT de caché: < 5ms de respuesta

## Value Objects del Dominio

```typescript
// Estados de evaluación
type EstadoEvaluacion = 'EN_PROGRESO' | 'EN_REVISION' | 'COMPLETADA';

// Escala de notas
type Nota = number; // 1.0 a 7.0 (2 decimales)

// Ponderación
type Ponderacion = number; // 0.0 a 1.0 (3 decimales)
```

## Invariantes de Agregado

### Agregado Rubrica
- Al menos 1 criterio
- Suma de ponderaciones = 1.0 (±0.001)
- Cada criterio tiene al menos 1 descriptor
- Los descriptores cubren la escala completa (1.0 a 7.0)

### Agregado Evaluacion
- Referencia válida a una rúbrica existente
- Todas las notas dentro del rango 1.0 - 7.0
- No se puede modificar una evaluación COMPLETADA
- El `evaluacion_id` puede ser provisto por el Host o generado como UUID

## Gherkin Features
Los archivos `.feature` en `documentacion/especificaciones/` son la fuente de verdad para el comportamiento esperado. Cada escenario Gherkin debe tener su implementación correspondiente como test.