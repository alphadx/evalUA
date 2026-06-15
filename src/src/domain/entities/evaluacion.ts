/**
 * EvalUA v3.0 — Aggregate Root: Evaluación
 * Proceso de calificación con ciclo de vida controlado
 */

import { IEvaluacionStrategy } from "../strategies/evaluacion-strategy";
import { CriterioId, EstadoEvaluacion, EvaluacionId, RubricaId } from "../types";
import { Nota } from "../value-objects/nota";
import { Criterio } from "./criterio";
import { Puntaje } from "./puntaje";

export class Evaluacion {
  private _puntajes: Puntaje[] = [];

  constructor(
    public readonly id: EvaluacionId,
    public readonly rubricaId: RubricaId,
    public estado: EstadoEvaluacion,
    public notaFinal: Nota | null,
    public observaciones: string | null,
    public metadata: Record<string, unknown> | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(params: {
    id?: EvaluacionId;
    rubricaId: RubricaId;
    metadata?: Record<string, unknown>;
  }): Evaluacion {
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

  setPuntajes(puntajes: Puntaje[]): void {
    this._puntajes = [...puntajes];
  }

  registrarPuntaje(
    criterioId: CriterioId,
    nota: Nota,
    observaciones?: string | null
  ): void {
    if (this.estado === "COMPLETADA") {
      throw new Error(
        "No se pueden registrar puntajes en una evaluación ya finalizada (inmutable)"
      );
    }

    if (this.estado === "EN_REVISION") {
      this.estado = "EN_PROGRESO";
    }

    const existenteIdx = this._puntajes.findIndex(
      (p) => p.criterioId === criterioId
    );
    const nuevoPuntaje = Puntaje.create({
      criterioId,
      notaAsignada: nota,
      observaciones: observaciones || null,
    });

    if (existenteIdx !== -1) {
      this._puntajes[existenteIdx] = nuevoPuntaje;
    } else {
      this._puntajes.push(nuevoPuntaje);
    }
  }

  marcarEnRevision(): void {
    if (this.estado !== "EN_PROGRESO") {
      throw new Error(
        "Solo se puede marcar en revisión una evaluación que está en progreso"
      );
    }
    this.estado = "EN_REVISION";
  }

  finalizarYCalcular(
    strategy: IEvaluacionStrategy,
    criterios: Criterio[],
    exigencia?: number
  ): Nota {
    if (this.estado === "COMPLETADA") {
      throw new Error(
        "La evaluación ya ha sido finalizada y no puede recalcularse"
      );
    }

    const estructurales = criterios.filter((c) => c.tipo === "ESTRUCTURAL");
    const calificadosEstructurales = this._puntajes.filter((p) =>
      estructurales.some((e) => e.id === p.criterioId)
    );

    if (calificadosEstructurales.length !== estructurales.length) {
      throw new Error(
        "No se puede calcular la nota final: Faltan criterios estructurales por calificar."
      );
    }

    const notaCalculada = strategy.calcular(
      this._puntajes,
      criterios,
      exigencia
    );
    this.notaFinal = notaCalculada;
    this.estado = "COMPLETADA";
    return notaCalculada;
  }
}
