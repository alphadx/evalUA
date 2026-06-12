/**
 * EvalUA v3.0 — Value Object: Nota
 * Calificación en escala estándar [1.0 - 7.0] redondeada a 2 decimales
 */

export class Nota {
  private constructor(public readonly valor: number) {}

  static create(valor: number): Nota {
    const rounded = Math.round(valor * 100) / 100;
    if (rounded < 1.0 || rounded > 7.0) {
      throw new Error(
        `La calificación debe estar comprendida en el rango de 1.0 a 7.0, recibido: ${rounded}`
      );
    }
    return new Nota(rounded);
  }

  esAprobatoria(): boolean {
    return this.valor >= 4.0;
  }

  equals(other: Nota): boolean {
    return this.valor === other.valor;
  }

  toString(): string {
    return this.valor.toFixed(2);
  }
}
