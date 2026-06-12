/**
 * EvalUA v3.0 — Mongoose Model: Configuración
 * Colección configuraciones (parámetros del sistema)
 */

import mongoose, { Model, Schema } from "mongoose";

const ConfiguracionSchema = new Schema(
  {
    clave: { type: String, required: true, unique: true, index: true },
    valor: { type: String, required: true },
    descripcion: { type: String, required: true },
  },
  { timestamps: true }
);

export interface IConfiguracionDocument {
  _id: mongoose.Types.ObjectId;
  clave: string;
  valor: string;
  descripcion: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ConfiguracionModel: Model<IConfiguracionDocument> =
  mongoose.models.Configuracion ||
  mongoose.model<IConfiguracionDocument>(
    "Configuracion",
    ConfiguracionSchema,
    "configuraciones"
  );
