/**
 * EvalUA v3.0 — Aggregate Root: Rúbrica
 * Instrumento de evaluación con criterios embebidos
 */

import { RubricaId } from "../types";
import { Criterio } from "./criterio";

export class Rubrica {
  private _criterios: Criterio[] = [];

  constructor(
    public readonly id: RubricaId,
    public readonly rubricaGroupId: string,
    public readonly version: number,
    public readonly parentRubricaId: RubricaId | null,
    public titulo: string,
    public notaAprobacion: number,
    public exigencia: number,
    public esActiva: boolean,
    public expuesta: boolean,
    public metadata: Record<string, unknown> | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(params: {
    titulo: string;
    notaAprobacion?: number;
    exigencia?: number;
    metadata?: Record<string, unknown>;
  }): Rubrica {
    const id = crypto.randomUUID() as RubricaId;
    return new Rubrica(
      id,
      id, // rubricaGroupId inicial es igual a su propio id
      1,
      null,
      params.titulo,
      params.notaAprobacion ?? 4.0,
      params.exigencia ?? 0.5,
      true,
      false, // nueva rúbrica no expuesta por defecto
      params.metadata || null,
      new Date(),
      new Date()
    );
  }

  get criterios(): Criterio[] {
    return [...this._criterios];
  }

  establecerCriterios(criterios: Criterio[]): void {
    this._criterios = [...criterios];
    this.validarPonderaciones();
  }

  validarPonderaciones(): void {
    if (this._criterios.length === 0) return;

    const estructurales = this._criterios.filter(
      (c) => c.tipo === "ESTRUCTURAL"
    );
    const suma = estructurales.reduce((acc, c) => acc + c.ponderacion, 0);

    if (Math.abs(suma - 1.0) > 0.001) {
      throw new Error(
        `La suma de ponderaciones de criterios estructurales debe ser exactamente 1.0, actualmente es: ${suma.toFixed(3)}`
      );
    }
  }

  clonarParaNuevaVersion(nuevoTitulo?: string): Rubrica {
    const nuevoId = crypto.randomUUID() as RubricaId;
    const clon = new Rubrica(
      nuevoId,
      this.rubricaGroupId,
      this.version + 1,
      this.id,
      nuevoTitulo || this.titulo,
      this.notaAprobacion,
      this.exigencia,
      true,
      false, // nueva versión no expuesta por defecto
      this.metadata ? { ...this.metadata } : null,
      new Date(),
      new Date()
    );
    const nuevosCriterios = this._criterios.map((c) => c.clonar());
    clon.establecerCriterios(nuevosCriterios);
    return clon;
  }

  desactivar(): void {
    this.esActiva = false;
  }
}
