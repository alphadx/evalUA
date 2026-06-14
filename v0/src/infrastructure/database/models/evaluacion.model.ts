/**
 * EvalUA v3.0 — Mongoose Model: Evaluación
 * Colección evaluaciones con puntajes embebidos
 */

import mongoose, { Model, Schema } from "mongoose";

// --- Puntaje Schema ---
const PuntajeSchema = new Schema(
  {
    criterioId: { type: String, required: true },
    notaAsignada: { type: Number, required: true, min: 1.0, max: 7.0 },
    observaciones: { type: String, default: null },
  },
  { _id: false }
);

// --- Evaluacion Schema ---
const EvaluacionSchema = new Schema(
  {
    _id: { type: String, required: true },
    rubricaId: { type: String, required: true, index: true },
    estado: {
      type: String,
      enum: ["COMPLETADA"],
      default: "COMPLETADA",
    },
    notaFinal: { type: Number, required: true },
    observaciones: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: null },
    puntajes: [PuntajeSchema],
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
    versionKey: "__v",
  }
);

export interface IEvaluacionDocument {
  _id: string;
  rubricaId: string;
  estado: "COMPLETADA";
  notaFinal: number;
  observaciones: string | null;
  metadata: Record<string, unknown> | null;
  puntajes: Array<{
    criterioId: string;
    notaAsignada: number;
    observaciones: string | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export const EvaluacionModel: Model<IEvaluacionDocument> =
  mongoose.models.Evaluacion ||
  mongoose.model<IEvaluacionDocument>(
    "Evaluacion",
    EvaluacionSchema,
    "evaluaciones"
  );
