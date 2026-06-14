/**
 * EvalUA v3.0 — Entidad: Criterio
 * Dimensión individual a evaluar dentro de la rúbrica
 */

import { CriterioId, TipoCriterio } from "../types";
import { Descriptor } from "./descriptor";

export class Criterio {
  constructor(
    public readonly id: CriterioId,
    public nombre: string,
    public ponderacion: number,
    public tipo: TipoCriterio,
    public esExcluyente: boolean,
    public notaCorte: number,
    public descripcion: string | null,
    public minPalabras: number | null,
    public maxPalabras: number | null,
    public orden: number,
    public readonly descriptores: Descriptor[]
  ) {}

  clonar(): Criterio {
    return new Criterio(
      crypto.randomUUID() as CriterioId,
      this.nombre,
      this.ponderacion,
      this.tipo,
      this.esExcluyente,
      this.notaCorte,
      this.descripcion,
      this.minPalabras,
      this.maxPalabras,
      this.orden,
      this.descriptores.map((d) => d.clonar())
    );
  }

  static create(params: {
    id?: CriterioId;
    nombre: string;
    ponderacion: number;
    tipo?: TipoCriterio;
    esExcluyente?: boolean;
    notaCorte?: number;
    descripcion?: string | null;
    minPalabras?: number | null;
    maxPalabras?: number | null;
    orden?: number;
    descriptores?: Descriptor[];
  }): Criterio {
    if (params.ponderacion < 0 || params.ponderacion > 1) {
      throw new Error("La ponderación debe estar entre 0.0 y 1.0");
    }
    return new Criterio(
      params.id || (crypto.randomUUID() as CriterioId),
      params.nombre,
      params.ponderacion,
      params.tipo || "ESTRUCTURAL",
      params.esExcluyente || false,
      params.notaCorte ?? 4.0,
      params.descripcion || null,
      params.minPalabras || null,
      params.maxPalabras || null,
      params.orden || 0,
      params.descriptores || []
    );
  }
}
