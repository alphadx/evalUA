/**
 * EvalUA v3.0 — Entidad: Descriptor
 * Descripción detallada del nivel de logro esperado para una calificación
 */

export class Descriptor {
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

  static create(params: {
    notaNivel: number;
    etiqueta: string;
    bulletPoints?: string[];
  }): Descriptor {
    if (params.notaNivel < 1 || params.notaNivel > 7) {
      throw new Error("El nivel de nota debe estar entre 1 y 7");
    }
    return new Descriptor(
      params.notaNivel,
      params.etiqueta,
      params.bulletPoints || []
    );
  }
}
