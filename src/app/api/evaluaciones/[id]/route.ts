/**
 * EvalUA v3.0 — API: /api/evaluaciones/[id]
 * GET: Recupera borrador o evaluación completada
 * PUT: Auto-save del borrador
 */

import { ActualizarEvaluacionSchema } from "@/domain/schemas";
import { createErrorResponse, verifyToken } from "@/infrastructure/auth/jwt";
import { getDraft, saveDraft } from "@/infrastructure/cache/redis";
import { EvaluacionModel } from "@/infrastructure/database/models/evaluacion.model";
import { connectMongoDB } from "@/infrastructure/database/mongodb";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return createErrorResponse(401, "No autorizado", "Token JWT requerido");
    }

    try {
      verifyToken(authHeader.substring(7));
    } catch {
      return createErrorResponse(401, "No autorizado", "Token JWT inválido");
    }

    // 1. Intentar Redis (borrador)
    const draft = await getDraft(id);
    if (draft) {
      return Response.json({ success: true, data: draft });
    }

    // 2. Intentar MongoDB (completada)
    await connectMongoDB();
    const evaluacion = await EvaluacionModel.findById(id).lean();
    if (evaluacion) {
      return Response.json({ success: true, data: evaluacion });
    }

    return createErrorResponse(404, "No encontrada", "Evaluación no existe");
  } catch (error) {
    console.error("[Evaluacion GET] Error:", error);
    return createErrorResponse(500, "Error interno", "Error al obtener evaluación");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return createErrorResponse(401, "No autorizado", "Token JWT requerido");
    }

    try {
      verifyToken(authHeader.substring(7));
    } catch {
      return createErrorResponse(401, "No autorizado", "Token JWT inválido");
    }

    const body = await request.json();
    const parsed = ActualizarEvaluacionSchema.safeParse(body);
    if (!parsed.success) {
      return createErrorResponse(
        400,
        "Datos inválidos",
        parsed.error.issues.map((e: { message: string }) => e.message).join(", ")
      );
    }

    // Cargar borrador existente
    const existing = await getDraft(id);
    if (!existing) {
      return createErrorResponse(404, "No encontrada", "Borrador no existe en Redis");
    }

    // Actualizar campos
    const updated = { ...existing } as Record<string, unknown>;
    if (parsed.data.estado) {
      updated.estado = parsed.data.estado;
    }
    if (parsed.data.observaciones !== undefined) {
      updated.observaciones = parsed.data.observaciones;
    }
    if (parsed.data.puntajes) {
      const existingPuntajes = (existing.puntajes as Array<Record<string, unknown>>) || [];
      const newPuntajes = [...existingPuntajes];

      for (const newP of parsed.data.puntajes) {
        const idx = newPuntajes.findIndex((p) => p.criterioId === newP.criterioId);
        const puntaje = {
          criterioId: newP.criterioId,
          notaAsignada: newP.notaAsignada,
          observaciones: newP.observaciones || null,
        };
        if (idx !== -1) {
          newPuntajes[idx] = puntaje;
        } else {
          newPuntajes.push(puntaje);
        }
      }
      updated.puntajes = newPuntajes;
    }
    updated.updatedAt = new Date().toISOString();

    await saveDraft(id, updated);

    return Response.json({ success: true, data: updated });
  } catch (error) {
    console.error("[Evaluacion PUT] Error:", error);
    return createErrorResponse(500, "Error interno", "Error al actualizar evaluación");
  }
}
