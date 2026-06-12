# Modelos de Dominio (DDD) — EvalUA v3.0 (MongoDB + Redis)

> **Capa de Dominio de EvalUA**  
> Definición formal de agregados documentales, value objects, estrategias de cálculo e interfaces de repositorios adaptados para MongoDB y Redis.

---

## 1. Glosario de Lenguaje Ubicuo (DDD)

Para asegurar la coherencia entre el dominio del negocio y el código técnico, se definen los siguientes términos:

*   **Rúbrica (Rubric):** Instrumento de evaluación compuesto por una serie de criterios estructurados jerárquicamente con sus respectivos descriptores de desempeño.
*   **Criterio (Criterion):** Dimensión individual a evaluar dentro de la rúbrica. Puede ser de tipo *Estructural* (afecta la ponderación académica) o *Complementario* (de retroalimentación), y puede marcarse como *Excluyente* (activa la regla del Gatekeeper).
*   **Descriptor (Descriptor):** Descripción detallada que define el nivel de logro esperado para una calificación específica (nota) dentro de un criterio.
*   **Evaluación (Evaluation):** Proceso de calificar el desempeño de un estudiante según una rúbrica en particular. Pasa por un ciclo de vida con estados controlados (`EN_PROGRESO`, `EN_REVISION`, `COMPLETADA`).
*   **Puntaje (Score/Rating):** Calificación y observaciones asignadas por el evaluador a un criterio específico de la rúbrica durante una evaluación.
*   **Nota (Grade):** Representación numérica del rendimiento académico en la escala estándar de **1.0 a 7.0** con dos decimales de precisión.
*   **Exigencia (Requirement Level):** Porcentaje de logro requerido para obtener la nota mínima de aprobación (**4.0**). El estándar del proyecto es 60% ($E = 0.60$).
*   **Gatekeeper (Regla de Exclusión):** Regla de negocio que dictamina que si un estudiante reprueba (obtiene menos de 4.0) en cualquier criterio definido como *Excluyente*, toda la evaluación se reprueba automáticamente con la nota mínima (1.0).

---

## 2. Tipos de Datos Opacos (Branded Types)

Para robustecer el sistema de tipos y evitar el cruce accidental de identificadores (por ejemplo, asignar un ID de rúbrica a un ID de evaluación), se definen tipos opacos en TypeScript:

```typescript
declare const __brand: unique symbol;
type Brand<T, B> = T & { readonly [__brand]: B };

export type RubricaId = Brand<string, "RubricaId">;
export type CriterioId = Brand<string, "CriterioId">;
export type EvaluacionId = Brand<string, "EvaluacionId">;
export type UsuarioId = Brand<string, "UsuarioId">;
```

---

## 3. Entidades y Agregados del Dominio

### 3.1 Agregado Rubrica (Aggregate Root)

#### Entidades de Soporte
```typescript
class Descriptor {
  constructor(
    public readonly notaNivel: number,
    public readonly etiqueta: string,
    public readonly bulletPoints: string[]
  ) {}

  clonar(): Descriptor {
    return new Descriptor(
      this.notaNivel,
      this.etiqueta,
      [...this.bulletPoints]
    );
  }
}

class Criterio {
  constructor(
    public readonly id: CriterioId,
    public rubricaId: RubricaId,
    public nombre: string,
    public ponderacion: number,
    public tipo: "ESTRUCTURAL" | "COMPLEMENTARIO",
    public esExcluyente: boolean,
    public descripcion: string | null,
    public minPalabras: number | null,
    public maxPalabras: number | null,
    public orden: number,
    public readonly descriptores: Descriptor[]
  ) {}

  clonar(nuevaRubricaId: RubricaId): Criterio {
    return new Criterio(
      crypto.randomUUID() as CriterioId,
      nuevaRubricaId,
      this.nombre,
      this.ponderacion,
      this.tipo,
      this.esExcluyente,
      this.descripcion,
      this.minPalabras,
      this.maxPalabras,
      this.orden,
      this.descriptores.map(d => d.clonar())
    );
  }
}
```

#### Entidad Raíz: `Rubrica`
```typescript
class Rubrica {
  private _criterios: Criterio[] = [];

  constructor(
    public readonly id: RubricaId,
    public titulo: string,
    public esActiva: boolean,
    public metadata: Record<string, unknown> | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(params: { titulo: string; metadata?: Record<string, unknown> }): Rubrica {
    return new Rubrica(
      crypto.randomUUID() as RubricaId,
      params.titulo,
      true,
      params.metadata || null,
      new Date(),
      new Date()
    );
  }

  get criterios(): Criterio[] {
    return [...this._criterios]; // Copia defensiva
  }

  establecerCriterios(criterios: Criterio[]): void {
    this._criterios = [...criterios];
    this.validarPonderaciones();
  }

  validarPonderaciones(): void {
    if (this._criterios.length === 0) return;
    
    // Filtrar solo criterios estructurales para la suma de ponderación
    const estructurales = this._criterios.filter(c => c.tipo === "ESTRUCTURAL");
    const suma = estructurales.reduce((acc, c) => acc + c.ponderacion, 0);
    
    if (Math.abs(suma - 1.0) > 0.001) {
      throw new Error(`La suma de ponderaciones de criterios estructurales debe ser exactamente 1.0, actualmente es: ${suma}`);
    }
  }

  clonarParaNuevaVersion(nuevoTitulo?: string): Rubrica {
    const clon = Rubrica.create({
      titulo: nuevoTitulo || this.titulo,
      metadata: this.metadata ? { ...this.metadata } : undefined
    });
    const nuevosCriterios = this._criterios.map(c => c.clonar(clon.id));
    clon.establecerCriterios(nuevosCriterios);
    return clon;
  }

  desactivar(): void {
    this.esActiva = false;
  }
}
```

---

### 3.2 Agregado Evaluacion (Aggregate Root)

#### Entidades de Soporte
```typescript
class Puntaje {
  private constructor(
    public readonly criterioId: CriterioId,
    public readonly notaAsignada: Nota,
    public readonly observaciones: string | null
  ) {}

  static create(params: {
    criterioId: CriterioId;
    notaAsignada: Nota;
    observaciones: string | null;
  }): Puntaje {
    return new Puntaje(params.criterioId, params.notaAsignada, params.observaciones);
  }
}
```

#### Entidad Raíz: `Evaluacion`
```typescript
class Evaluacion {
  private _puntajes: Puntaje[] = [];

  constructor(
    public readonly id: EvaluacionId, // ID provisto por Host o autogenerado
    public readonly rubricaId: RubricaId,
    public estado: "EN_PROGRESO" | "EN_REVISION" | "COMPLETADA",
    public notaFinal: Nota | null,
    public observaciones: string | null,
    public metadata: Record<string, unknown> | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(params: { id?: EvaluacionId; rubricaId: RubricaId; metadata?: Record<string, unknown> }): Evaluacion {
    return new Evaluacion(
      params.id || (crypto.randomUUID() as EvaluacionId),
      params.rubricaId,
      "EN_PROGRESO",
      null,
      null,
      params.metadata || null,
      new Date(),
      new Date()
    );
  }

  get puntajes(): Puntaje[] {
    return [...this._puntajes];
  }

  registrarPuntaje(criterioId: CriterioId, nota: Nota, observaciones?: string | null): void {
    if (this.estado === "COMPLETADA") {
      throw new Error("No se pueden registrar puntajes en una evaluación ya finalizada (inmutable)");
    }
    
    // Si la evaluación estaba en revisión y se modifica una nota, vuelve a estar en progreso
    if (this.estado === "EN_REVISION") {
      this.estado = "EN_PROGRESO";
    }
    
    const existenteIdx = this._puntajes.findIndex(p => p.criterioId === criterioId);
    const nuevoPuntaje = Puntaje.create({
      criterioId,
      notaAsignada: nota,
      observaciones: observaciones || null
    });

    if (existenteIdx !== -1) {
      this._puntajes[existenteIdx] = nuevoPuntaje;
    } else {
      this._puntajes.push(nuevoPuntaje);
    }
  }

  marcarEnRevision(): void {
    if (this.estado !== "EN_PROGRESO") {
      throw new Error("Solo se puede marcar en revisión una evaluación que está en progreso");
    }
    this.estado = "EN_REVISION";
  }

  finalizarYCalcular(strategy: IEvaluacionStrategy, criterios: Criterio[]): Nota {
    if (this.estado === "COMPLETADA") {
      throw new Error("La evaluación ya ha sido finalizada y no puede recalcularse");
    }
    
    const estructurales = criterios.filter(c => c.tipo === "ESTRUCTURAL");
    const calificadosEstructurales = this._puntajes.filter(p => 
      estructurales.some(e => e.id === p.criterioId)
    );
    
    if (calificadosEstructurales.length !== estructurales.length) {
      throw new Error("No se puede calcular la nota final: Faltan criterios estructurales por calificar.");
    }
    
    const notaCalculada = strategy.calcular(this._puntajes, criterios);
    this.notaFinal = notaCalculada;
    this.estado = "COMPLETADA";
    return notaCalculada;
  }
}
```

---

## 4. Value Objects

### 4.1 Nota
Calificación en escala estándar [1.0 - 7.0] redondeada a 2 decimales.
```typescript
class Nota {
  private constructor(public readonly valor: number) {}

  static create(number: number): Nota {
    const rounded = Math.round(number * 100) / 100;
    if (rounded < 1.0 || rounded > 7.0) {
      throw new Error("La calificación debe estar comprendida en el rango de 1.0 a 7.0");
    }
    return new Nota(rounded);
  }

  esAprobatoria(): boolean {
    return this.valor >= 4.0;
  }

  equals(other: Nota): boolean {
    return this.valor === other.valor;
  }
}
```

---

## 5. Algoritmo de Cálculo de Nota (Escala 1.0 - 7.0)

La fórmula matemática para la conversión del porcentaje de logro ponderado al estándar chileno de notas de 1.0 a 7.0, considerando un porcentaje de exigencia $E \in (0, 1)$ (comúnmente $60\%$ o $0.60$), se define por tramos para garantizar la proporcionalidad lineal:

Sea $P$ el porcentaje de logro ponderado de la evaluación obtenido mediante la suma ponderada del logro de cada criterio:
$$P = \sum_{i} \left( \text{Logro}_i \times \text{Ponderación}_i \right)$$
Donde el logro individual de un criterio calificado con nota $N_i \in [1.0, 7.0]$ se calcula como:
$$\text{Logro}_i = \frac{N_i - 1.0}{6.0} \in [0.0, 1.0]$$

La nota final $G$ (antes del redondeo a dos decimales) se calcula como:

1.  **Si el logro obtenido $P$ es inferior a la exigencia $E$ ($P < E$):**
    $$G = 1.0 + 3.0 \cdot \left( \frac{P}{E} \right)$$
    *Asegura una variación lineal de 1.0 a 4.0.*

2.  **Si el logro obtenido $P$ es igual o superior a la exigencia $E$ ($P \ge E$):**
    $$G = 4.0 + 3.0 \cdot \left( \frac{P - E}{1.0 - E} \right)$$
    *Asegura una variación lineal de 4.0 a 7.0.*

---

## 6. Estrategias de Cálculo (Strategies)

### IEvaluacionStrategy (Interfaz)
```typescript
interface IEvaluacionStrategy {
  calcular(puntajes: Puntaje[], criterios: Criterio[], exigencia?: number): Nota;
}
```

### EvaluacionStrategy (Implementación con Regla Gatekeeper y Conversión de Exigencia)
```typescript
class EvaluacionStrategy implements IEvaluacionStrategy {
  calcular(puntajes: Puntaje[], criterios: Criterio[], exigencia = 0.60): Nota {
    // 1. Regla de Exclusión Gatekeeper
    for (const criterio of criterios) {
      if (criterio.esExcluyente) {
        const puntaje = puntajes.find(p => p.criterioId === criterio.id);
        // Si el criterio excluyente tiene nota menor a 4.0, se reprueba inmediatamente con 1.0
        if (puntaje && puntaje.notaAsignada.valor < 4.0) {
          return Nota.create(1.0);
        }
      }
    }

    // 2. Cálculo de Logro Ponderado
    let logroPonderado = 0;
    const estructurales = criterios.filter(c => c.tipo === "ESTRUCTURAL");

    for (const criterio of estructurales) {
      const puntaje = puntajes.find(p => p.criterioId === criterio.id);
      if (puntaje) {
        // Convertir la nota del criterio (1.0 - 7.0) a su porcentaje de logro correspondiente (0.0 - 1.0)
        const logroCriterio = (puntaje.notaAsignada.valor - 1.0) / 6.0;
        logroPonderado += logroCriterio * criterio.ponderacion;
      }
    }

    // 3. Conversión de Logro Ponderado a Escala 1.0-7.0 mediante la fórmula con Exigencia
    let notaFinal: number;
    if (logroPonderado < exigencia) {
      notaFinal = 1.0 + 3.0 * (logroPonderado / exigencia);
    } else {
      notaFinal = 4.0 + 3.0 * ((logroPonderado - exigencia) / (1.0 - exigencia));
    }

    return Nota.create(notaFinal);
  }
}
```

---

## 7. Ciclo de Vida de la Evaluación (FSM)

El ciclo de vida de la entidad `Evaluacion` está regido por una Máquina de Estados Finitos estricta:

```
                  ┌──────────────────────┐
                  │     EN_PROGRESO      │◀────────────────┐
                  └──────────┬───────────┘                 │
                             │ (Todos calificados)         │ (Edición en
                             ▼                             │  resumen)
                  ┌──────────────────────┐                 │
                  │     EN_REVISION      ├─────────────────┘
                  └──────────┬───────────┘
                             │ (Finalizar)
                             ▼
                  ┌──────────────────────┐
                  │      COMPLETADA      │ (Inmutable / Solo Lectura)
                  └──────────────────────┘
```

*   **Reglas de Transición:**
    1.  **`EN_PROGRESO` $\rightarrow$ `EN_REVISION`:** Se activa automáticamente en el frontend cuando se han calificado todos los criterios. Se registra el cambio de estado en Redis.
    2.  **`EN_REVISION` $\rightarrow$ `EN_PROGRESO`:** Si el evaluador decide modificar cualquier puntaje desde la pantalla de resumen, el estado retorna a `EN_PROGRESO`.
    3.  **`EN_REVISION` $\rightarrow$ `COMPLETADA`:** Al accionar "Finalizar Evaluación", el backend calcula la nota definitiva, persiste el registro de forma inmutable en MongoDB, borra el borrador de Redis y despacha el evento al Host.
    4.  **Bloqueo de Modificación:** Toda llamada HTTP que intente mutar una evaluación con estado `COMPLETADA` es interceptada y rechazada con un código de estado `409 Conflict`.

---

## 8. Pruebas y Validación del Dominio

### 8.1 Matriz de Casos de Prueba Unitarios Teóricos

La consistencia del algoritmo y el Gatekeeper se valida mediante la siguiente matriz de prueba estándar (Exigencia = 60%):

| ID Caso | Descripción del Escenario | Notas Asignadas por Criterio (Ponderación) | Logro Ponderado ($P$) | Nota Esperada | Razón / Regla de Negocio |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **TC-01** | Desempeño mínimo absoluto (0% logro) | Crit 1: 1.0 (50%), Crit 2: 1.0 (50%) | 0.0% | **1.0** | Nota mínima del sistema. |
| **TC-02** | Logro justo al nivel de exigencia (60%) | Crit 1: 4.6 (100%) | 60.0% | **4.0** | $P = E \implies$ nota de aprobación exacta. |
| **TC-03** | Desempeño intermedio reprobatorio (30% logro) | Crit 1: 2.8 (100%) | 30.0% | **2.5** | $P < E \implies 1.0 + 3.0(0.3 / 0.6) = 2.5$. |
| **TC-04** | Desempeño intermedio aprobatorio (80% logro) | Crit 1: 5.8 (100%) | 80.0% | **5.5** | $P \ge E \implies 4.0 + 3.0(0.2 / 0.4) = 5.5$. |
| **TC-05** | Desempeño máximo absoluto (100% logro) | Crit 1: 7.0 (50%), Crit 2: 7.0 (50%) | 100.0% | **7.0** | Nota máxima del sistema. |
| **TC-06** | Excluyente reprobado (Gatekeeper) | Crit 1 (Excl): 3.0 (50%), Crit 2: 7.0 (50%) | 66.6% (si no aplica) | **1.0** | Gatekeeper activado: reprobación por criterio excluyente. |
| **TC-07** | Excluyente aprobado raspando | Crit 1 (Excl): 4.0 (50%), Crit 2: 4.0 (50%) | 50.0% | **3.5** | Excluyente aprobado (4.0 $\ge$ 4.0), pero promedio general no alcanza aprobación. |
| **TC-08** | Ponderación de decimales periódicos | Crit 1: 6.0 (33.3%), Crit 2: 6.0 (33.3%), Crit 3: 6.0 (33.4%) | 83.3% | **5.75** | Validación de precisión y redondeo con sumatoria exacta a 1.0. |

---

### 8.2 Diseño de Pruebas Basadas en Propiedades (Property-Based Testing)

Para garantizar la fiabilidad del algoritmo en runtime bajo cualquier combinación matemática, se diseñan las siguientes aserciones con `fast-check`:

```typescript
import * as fc from 'fast-check';

// 1. Aserción de Rango: Para cualquier entrada, la nota siempre está entre 1.0 y 7.0
fc.assert(
  fc.property(
    fc.array(fc.record({
      criterioId: fc.uuid() as fc.Arbitrary<CriterioId>,
      notaAsignada: fc.double({ min: 1.0, max: 7.0 }),
      tipo: fc.constant("ESTRUCTURAL"),
      esExcluyente: fc.boolean()
    }), { minLength: 1, maxLength: 20 }),
    fc.double({ min: 0.1, max: 1.0 }), // Exigencia
    (datos, exigencia) => {
      // Ajustar ponderaciones para que sumen exactamente 1.0
      const total = datos.length;
      const criterios = datos.map((d, idx) => {
        const ponderacion = idx === total - 1 ? (1.0 - (total - 1) * (1 / total)) : (1 / total);
        return new Criterio(
          d.criterioId,
          "rub-1" as RubricaId,
          "Crit",
          ponderacion,
          "ESTRUCTURAL",
          d.esExcluyente,
          null, null, null, idx, []
        );
      });
      const puntajes = datos.map(d => Puntaje.create({
        criterioId: d.criterioId,
        notaAsignada: Nota.create(d.notaAsignada),
        observaciones: null
      }));

      const strategy = new EvaluacionStrategy();
      const notaFinal = strategy.calcular(puntajes, criterios, exigencia);

      return notaFinal.valor >= 1.0 && notaFinal.valor <= 7.0;
    }
  )
);
```

---
```

---

## 5. Interfaces de Repositorios de Infraestructura

El diseño de las interfaces de repositorios refleja la separación física de los borradores volátiles en Redis y los consolidados finales persistentes en MongoDB.

```typescript
interface IRubricaRepository {
  findById(id: RubricaId): Promise<Rubrica | null>;
  save(rubrica: Rubrica): Promise<void>;
  update(rubrica: Rubrica): Promise<void>;
}

interface IEvaluacionRepository {
  // Manejo de borradores en curso en Redis
  findDraftById(id: EvaluacionId): Promise<Evaluacion | null>;
  saveDraft(evaluacion: Evaluacion): Promise<void>;
  deleteDraft(id: EvaluacionId): Promise<void>;

  // Manejo de evaluaciones finales completadas en MongoDB
  findCompletedById(id: EvaluacionId): Promise<Evaluacion | null>;
  saveCompleted(evaluacion: Evaluacion): Promise<void>;
}

> **Nota Arquitectónica sobre Persistencia:** Debido a que MongoDB (Mongoose) y Redis operan con tipos primitivos (`String`, `Number`) y nuestra capa de dominio utiliza `Branded Types` (ej. `RubricaId`) y *Value Objects* (ej. `Nota`), es obligatorio implementar un patrón **Data Mapper**. El Mapper se encargará de hidratar las entidades desde Mongoose/Redis (convirtiendo `_id` a `RubricaId` y numéricos a instancias de `Nota`) y de serializar las entidades de dominio hacia los esquemas primitivos de persistencia antes de guardar.
```
