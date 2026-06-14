/**
 * EvalUA v3.0 — Zod Validation Schemas
 * Validación estricta de todos los inputs
 */

import { z } from "zod";

// --- Descriptor ---
export const DescriptorSchema = z.object({
  notaNivel: z.number().int().min(1).max(7),
  etiqueta: z.string().min(1).max(200),
  bulletPoints: z.array(z.string()).default([]),
});

// --- Criterio ---
export const CriterioSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().min(1).max(200),
  ponderacion: z.number().min(0).max(1),
  tipo: z.enum(["ESTRUCTURAL", "COMPLEMENTARIO"]).default("ESTRUCTURAL"),
  esExcluyente: z.boolean().default(false),
  notaCorte: z.number().min(1.0).max(7.0).default(4.0),
  descripcion: z.string().max(500).nullable().optional(),
  minPalabras: z.number().int().min(0).nullable().optional(),
  maxPalabras: z.number().int().min(0).nullable().optional(),
  orden: z.number().int().min(0).default(0),
  descriptores: z.array(DescriptorSchema).default([]),
});

// --- Rubricas ---
export const CrearRubricaSchema = z.object({
  titulo: z.string().min(1).max(300),
  notaAprobacion: z.number().min(1.0).max(7.0).default(4.0),
  metadata: z.record(z.string(), z.unknown()).optional(),
  criterios: z.array(CriterioSchema).min(1),
});

export const ActualizarRubricaSchema = z.object({
  titulo: z.string().min(1).max(300).optional(),
  notaAprobacion: z.number().min(1.0).max(7.0).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  criterios: z.array(CriterioSchema).min(1).optional(),
  esActiva: z.boolean().optional(),
});

// --- Evaluaciones ---
export const PuntajeInputSchema = z.object({
  criterioId: z.string().uuid(),
  notaAsignada: z.number().min(1.0).max(7.0),
  observaciones: z.string().nullable().optional(),
});

export const CrearEvaluacionSchema = z.object({
  evaluacionId: z.string().uuid().optional(),
  rubricaId: z.string().uuid(),
  usuarioId: z.string().optional(),
});

export const ActualizarEvaluacionSchema = z.object({
  estado: z.enum(["EN_PROGRESO", "EN_REVISION"]).optional(),
  observaciones: z.string().nullable().optional(),
  puntajes: z.array(PuntajeInputSchema).optional(),
});

// --- Launch ---
export const LaunchSchema = z.object({
  token: z.string().min(1),
});

// --- Configuracion ---
export const ActualizarConfigSchema = z.object({
  valor: z.string().min(1),
});
