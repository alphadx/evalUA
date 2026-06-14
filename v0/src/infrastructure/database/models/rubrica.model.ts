/**
 * EvalUA v3.0 — Mongoose Model: Rúbrica
 * Colección rubricas con criterios y descriptores embebidos
 */

import mongoose, { Model, Schema } from "mongoose";

// --- Descriptor Schema ---
const DescriptorSchema = new Schema(
  {
    notaNivel: { type: Number, required: true, min: 1, max: 7 },
    etiqueta: { type: String, required: true },
    bulletPoints: [{ type: String }],
  },
  { _id: false }
);

// --- Criterio Schema ---
const CriterioSchema = new Schema(
  {
    _id: { type: String, required: true },
    nombre: { type: String, required: true },
    ponderacion: { type: Number, required: true, min: 0, max: 1 },
    tipo: {
      type: String,
      enum: ["ESTRUCTURAL", "COMPLEMENTARIO"],
      default: "ESTRUCTURAL",
    },
    esExcluyente: { type: Boolean, default: false },
    notaCorte: { type: Number, default: 4.0, min: 1.0, max: 7.0 },
    descripcion: { type: String, default: null },
    minPalabras: { type: Number, default: null },
    maxPalabras: { type: Number, default: null },
    orden: { type: Number, default: 0 },
    descriptores: [DescriptorSchema],
  },
  { _id: false }
);

// --- Rubrica Schema ---
const RubricaSchema = new Schema(
  {
    _id: { type: String, required: true },
    rubricaGroupId: { type: String, required: true, index: true },
    version: { type: Number, default: 1, required: true },
    parentRubricaId: { type: String, default: null },
    titulo: { type: String, required: true },
    notaAprobacion: { type: Number, default: 4.0, min: 1.0, max: 7.0 },
    esActiva: { type: Boolean, default: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: null },
    criterios: [CriterioSchema],
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
    versionKey: "__v",
  }
);

export interface IRubricaDocument {
  _id: string;
  rubricaGroupId: string;
  version: number;
  parentRubricaId: string | null;
  titulo: string;
  notaAprobacion: number;
  esActiva: boolean;
  metadata: Record<string, unknown> | null;
  criterios: Array<{
    _id: string;
    nombre: string;
    ponderacion: number;
    tipo: "ESTRUCTURAL" | "COMPLEMENTARIO";
    esExcluyente: boolean;
    notaCorte: number;
    descripcion: string | null;
    minPalabras: number | null;
    maxPalabras: number | null;
    orden: number;
    descriptores: Array<{
      notaNivel: number;
      etiqueta: string;
      bulletPoints: string[];
    }>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export const RubricaModel: Model<IRubricaDocument> =
  mongoose.models.Rubrica ||
  mongoose.model<IRubricaDocument>("Rubrica", RubricaSchema, "rubricas");
