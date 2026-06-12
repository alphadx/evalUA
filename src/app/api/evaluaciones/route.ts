/**
 * EvalUA v3.0 — API: /api/evaluaciones
 * POST: Crear nueva evaluación (borrador en Redis)
 */

import { CrearEvaluacionSchema } from "@/domain/schemas";
import { createErrorResponse, hasRole, verifyToken } from "@/infrastructure/auth/jwt";
import { saveDraft } from "@/infrastructure/cache/redis";
import crypto from "crypto";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return createErrorResponse(401, "No autorizado", "Token JWT requerido");
    }

    let claims;
    try {
      claims = verifyToken(authHeader.substring(7));
    } catch {
      return createErrorResponse(401, "No autorizado", "Token JWT inválido");
    }

    if (!hasRole(claims, "ADMINISTRADOR", "MANTENEDOR", "PROFESOR")) {
      return createErrorResponse(403, "Prohibido", "Rol no autorizado para evaluar");
    }

    const body = await request.json();
    const parsed = CrearEvaluacionSchema.safeParse(body);
    if (!parsed.success) {
      return createErrorResponse(
        400,
        "Datos inválidos",
        parsed.error.issues.map((e: { message: string }) => e.message).join(", ")
      );
    }

    const evaluacionId = parsed.data.evaluacionId || crypto.randomUUID();

    const draft = {
      evaluacionId,
      rubricaId: parsed.data.rubricaId,
      estado: "EN_PROGRESO",
      usuarioId: parsed.data.usuarioId || claims.usuario_id || null,
      observaciones: null,
      puntajes: [],
      updatedAt: new Date().toISOString(),
    };

    await saveDraft(evaluacionId, draft);

    return Response.json({ success: true, data: draft }, { status: 201 });
  } catch (error) {
    console.error("[Evaluaciones POST] Error:", error);
    return createErrorResponse(500, "Error interno", "Error al crear evaluación");
  }
}
