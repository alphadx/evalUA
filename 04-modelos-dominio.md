# Modelos de Dominio (DDD) — EvalUA v3.0 (MongoDB + Redis)

> **Capa de Dominio de EvalUA**  
> Definición formal de agregados documentales, value objects, estrategias de cálculo e interfaces de repositorios adaptados para MongoDB y Redis.

---

## 1. Mapeo de Agregados a Documentos NoSQL

El dominio de EvalUA v3.0 aprovecha la naturaleza NoSQL de **MongoDB** para mapear agregados completos a documentos únicos, eliminando la necesidad de mapeadores relacionales complejos (como ORMs SQL clásicos) y garantizando la inmutabilidad de los límites de agregación.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AGREGADO RÚBRICA                                │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Documento Raíz: Rubrica (id, titulo, esActiva)                  │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │ Criterio 1 (id, nombre, ponderacion, tipo, excluyente)     │  │  │
│  │  │                                                            │  │  │
│  │  │   [Descriptor 7, Descriptor 5, Descriptor 3]               │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

- **Límite del Agregado Rúbrica:** El documento de MongoDB `Rubrica` representa todo el agregado. Al cargar una rúbrica, se deserializa el documento con todos sus criterios y descriptores embebidos. El repositorio reconstruye el árbol completo de objetos de dominio.
- **Límite del Agregado Evaluación:** La evaluación comienza como una estructura JSON volátil en **Redis** (borrador en estado `EN_PROGRESO` o `EN_REVISION`). Al consolidarse, se mapea a un documento definitivo e inmutable en la colección `evaluaciones` de **MongoDB**, borrando la copia en Redis.

---

## 2. Entidades y Agregados del Dominio

### 2.1 Agregado Rubrica (Aggregate Root)

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
    public readonly id: string,
    public rubricaId: string,
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

  clonar(nuevaRubricaId: string): Criterio {
    return new Criterio(
      crypto.randomUUID(),
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
    public readonly id: string,
    public titulo: string,
    public esActiva: boolean,
    public metadata: Record<string, unknown> | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(params: { titulo: string; metadata?: Record<string, unknown> }): Rubrica {
    return new Rubrica(
      crypto.randomUUID(),
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
    const suma = this._criterios.reduce((acc, c) => acc + c.ponderacion, 0);
    if (Math.abs(suma - 1.0) > 0.001) {
      throw new Error(`La suma de ponderaciones debe ser exactamente 1.0, actualmente es: ${suma}`);
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

### 2.2 Agregado Evaluacion (Aggregate Root)

#### Entidades de Soporte
```typescript
class Puntaje {
  private constructor(
    public readonly criterioId: string,
    public readonly notaAsignada: Nota,
    public readonly observaciones: string | null
  ) {}

  static create(params: {
    criterioId: string;
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
    public readonly id: string, // ID provisto por Host o autogenerado
    public readonly rubricaId: string,
    public estado: "EN_PROGRESO" | "EN_REVISION" | "COMPLETADA",
    public notaFinal: Nota | null,
    public observaciones: string | null,
    public metadata: Record<string, unknown> | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(params: { id?: string; rubricaId: string; metadata?: Record<string, unknown> }): Evaluacion {
    return new Evaluacion(
      params.id || crypto.randomUUID(),
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

  registrarPuntaje(criterioId: string, nota: Nota, observaciones?: string | null): void {
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

  calcularNotaFinal(strategy: IEvaluacionStrategy, criterios: Criterio[]): Nota {
    if (this._puntajes.length !== criterios.length) {
      throw new Error("No se puede calcular la nota final: Faltan criterios por calificar.");
    }
    const notaCalculada = strategy.calcular(this._puntajes, criterios);
    this.notaFinal = notaCalculada;
    this.estado = "COMPLETADA";
    return notaCalculada;
  }
}
```

---

## 3. Value Objects

### 3.1 Nota
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

## 4. Estrategias de Cálculo (Strategies)

### IEvaluacionStrategy (Interfaz)
```typescript
interface IEvaluacionStrategy {
  calcular(puntajes: Puntaje[], criterios: Criterio[]): Nota;
}
```

### EvaluacionStrategy (Implementación con Regla Gatekeeper)
```typescript
class EvaluacionStrategy implements IEvaluacionStrategy {
  calcular(puntajes: Puntaje[], criterios: Criterio[]): Nota {
    // 1. Regla de Exclusión Gatekeeper
    for (const criterio of criterios) {
      if (criterio.esExcluyente) {
        const puntaje = puntajes.find(p => p.criterioId === criterio.id);
        if (puntaje && puntaje.notaAsignada.valor < 4.0) {
          return Nota.create(1.0); // Reprobación automática
        }
      }
    }

    // 2. Promedio Ponderado Estructural
    let sumaPonderada = 0;
    for (const criterio of criterios) {
      if (criterio.tipo === "ESTRUCTURAL") {
        const puntaje = puntajes.find(p => p.criterioId === criterio.id);
        if (puntaje) {
          sumaPonderada += puntaje.notaAsignada.valor * criterio.ponderacion;
        }
      }
    }
    
    return Nota.create(sumaPonderada);
  }
}
```

---

## 5. Interfaces de Repositorios de Infraestructura

El diseño de las interfaces de repositorios refleja la separación física de los borradores volátiles en Redis y los consolidados finales persistentes en MongoDB.

```typescript
interface IRubricaRepository {
  findById(id: string): Promise<Rubrica | null>;
  save(rubrica: Rubrica): Promise<void>;
  update(rubrica: Rubrica): Promise<void>;
}

interface IEvaluacionRepository {
  // Manejo de borradores en curso en Redis
  findDraftById(id: string): Promise<Evaluacion | null>;
  saveDraft(evaluacion: Evaluacion): Promise<void>;
  deleteDraft(id: string): Promise<void>;

  // Manejo de evaluaciones finales completadas en MongoDB
  findCompletedById(id: string): Promise<Evaluacion | null>;
  saveCompleted(evaluacion: Evaluacion): Promise<void>;
}
```
