/**
 * EvalUA v3.0 — Entidad: Puntaje
 * Calificación asignada por el evaluador a un criterio específico
 */

import { CriterioId } from "../types";
import { Nota } from "../value-objects/nota";

export class Puntaje {
  private constructor(
    public readonly criterioId: CriterioId,
    public readonly notaAsignada: Nota,
    public readonly observaciones: string | null
  ) {}

  static create(params: {
    criterioId: CriterioId;
    notaAsignada: Nota;
    observaciones?: string | null;
  }): Puntaje {
    return new Puntaje(
      params.criterioId,
      params.notaAsignada,
      params.observaciones || null
    );
  }
}
