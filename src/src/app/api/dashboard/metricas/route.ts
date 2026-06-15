/**
 * EvalUA v3.0 — API: GET /api/dashboard/metricas
 * Métricas del sistema (Rúbricas, Evaluaciones en curso, Completadas)
 */

import { createErrorResponse, hasRole, verifyToken } from "@/infrastructure/auth/jwt";
import { countDrafts } from "@/infrastructure/cache/redis";
import { EvaluacionModel } from "@/infrastructure/database/models/evaluacion.model";
import { RubricaModel } from "@/infrastructure/database/models/rubrica.model";
import { connectMongoDB } from "@/infrastructure/database/mongodb";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
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

    if (!hasRole(claims, "ADMINISTRADOR", "MANTENEDOR")) {
      return createErrorResponse(403, "Prohibido", "Rol no autorizado");
    }

    await connectMongoDB();

    // Filtro base según rol
    const rubricaFilter: Record<string, unknown> = {};
    const evalFilter: Record<string, unknown> = {};

    if (claims.rol === "MANTENEDOR" && claims.usuario_id) {
      rubricaFilter["metadata.usuarioId"] = claims.usuario_id;
    }

    // Contar métricas
    const [totalRubricas, totalCompletadas, borradoresActivos] = await Promise.all([
      RubricaModel.countDocuments(rubricaFilter),
      EvaluacionModel.countDocuments(evalFilter),
      countDrafts(),
    ]);

    // Últimas 10 evaluaciones
    const ultimasEvaluaciones = await EvaluacionModel.find(evalFilter)
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return Response.json({
      success: true,
      data: {
        metricas: {
          rubricasCreadas: totalRubricas,
          evaluacionesEnCurso: borradoresActivos,
          evaluacionesCompletadas: totalCompletadas,
        },
        historial: ultimasEvaluaciones,
      },
    });
  } catch (error) {
    console.error("[Dashboard GET] Error:", error);
    return createErrorResponse(500, "Error interno", "Error al obtener métricas");
  }
}
