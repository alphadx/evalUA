/**
 * EvalUA v3.0 — Strategy: Evaluación
 * Estrategia de cálculo con Gatekeeper y conversión por exigencia
 */

import { Criterio } from "../entities/criterio";
import { Puntaje } from "../entities/puntaje";
import { Nota } from "../value-objects/nota";

export interface IEvaluacionStrategy {
  calcular(
    puntajes: Puntaje[],
    criterios: Criterio[],
    exigencia?: number
  ): Nota;
}

/**
 * Implementación con Regla Gatekeeper y Conversión de Exigencia.
 *
 * Fórmula:
 * - Logro_i = (N_i - 1.0) / 6.0
 * - P = Σ (Logro_i × Ponderación_i)
 * - Si P < E: G = 1.0 + 3.0 × (P / E)
 * - Si P ≥ E: G = 4.0 + 3.0 × ((P - E) / (1.0 - E))
 *
 * Gatekeeper: Si un criterio excluyente tiene nota < notaCorte → nota = 1.0
 */
export class EvaluacionStrategy implements IEvaluacionStrategy {
  calcular(
    puntajes: Puntaje[],
    criterios: Criterio[],
    exigencia = 0.6
  ): Nota {
    // 1. Regla de Exclusión Gatekeeper
    for (const criterio of criterios) {
      if (criterio.esExcluyente) {
        const puntaje = puntajes.find((p) => p.criterioId === criterio.id);
        if (puntaje && puntaje.notaAsignada.valor < criterio.notaCorte) {
          return Nota.create(1.0);
        }
      }
    }

    // 2. Cálculo de Logro Ponderado (solo criterios estructurales)
    let logroPonderado = 0;
    const estructurales = criterios.filter((c) => c.tipo === "ESTRUCTURAL");

    for (const criterio of estructurales) {
      const puntaje = puntajes.find((p) => p.criterioId === criterio.id);
      if (puntaje) {
        const logroCriterio = (puntaje.notaAsignada.valor - 1.0) / 6.0;
        logroPonderado += logroCriterio * criterio.ponderacion;
      }
    }

    // 3. Conversión de Logro Ponderado a Escala 1.0-7.0
    let notaFinal: number;
    if (logroPonderado < exigencia) {
      notaFinal = 1.0 + 3.0 * (logroPonderado / exigencia);
    } else {
      notaFinal =
        4.0 + 3.0 * ((logroPonderado - exigencia) / (1.0 - exigencia));
    }

    return Nota.create(notaFinal);
  }
}
