/**
 * EvalUA v3.0 — API: POST /api/embed/launch
 * Endpoint de lanzamiento embebido (verificación JWT y determinación de modo)
 */

import { LaunchSchema } from "@/domain/schemas";
import { createErrorResponse, getModeFromRole, verifyToken } from "@/infrastructure/auth/jwt";
import { draftExists } from "@/infrastructure/cache/redis";
import { EvaluacionModel } from "@/infrastructure/database/models/evaluacion.model";
import { connectMongoDB } from "@/infrastructure/database/mongodb";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = LaunchSchema.safeParse(body);

    if (!parsed.success) {
      return createErrorResponse(400, "Solicitud inválida", "Token JWT requerido");
    }

    let claims;
    try {
      claims = verifyToken(parsed.data.token);
    } catch {
      return createErrorResponse(401, "No autorizado", "Token JWT inválido o expirado");
    }

    // Determinar modo de operación basado en el rol y el path solicitado
    const allowedModes = getModeFromRole(claims);

    // Modo evaluar
    if (claims.rubrica_id || claims.evaluacion_id) {
      if (!allowedModes.includes("evaluar") && !allowedModes.includes("resultado")) {
        return createErrorResponse(403, "Prohibido", `El rol ${claims.rol} no tiene acceso a este modo`);
      }

      const evaluacionId = claims.evaluacion_id;

      if (evaluacionId) {
        // Verificar si existe borrador en Redis
        const existsInRedis = await draftExists(evaluacionId);
        if (existsInRedis) {
          return Response.json({
            success: true,
            data: {
              authorized: true,
              modo: "evaluar",
              evaluacionId,
              recuperado: true,
              rol: claims.rol,
              allowedModes,
            },
          });
        }

        // Verificar si existe evaluación completada en MongoDB
        await connectMongoDB();
        const completed = await EvaluacionModel.findById(evaluacionId).lean();
        if (completed) {
          return Response.json({
            success: true,
            data: {
              authorized: true,
              modo: "ver_resultado",
              evaluacionId,
              recuperado: false,
              rol: claims.rol,
              allowedModes,
            },
          });
        }

        // Nueva evaluación
        return Response.json({
          success: true,
          data: {
            authorized: true,
            modo: "evaluar",
            evaluacionId,
            rubricaId: claims.rubrica_id,
            recuperado: false,
            rol: claims.rol,
            allowedModes,
          },
        });
      }

      // Sin evaluación_id: nueva evaluación
      return Response.json({
        success: true,
        data: {
          authorized: true,
          modo: "evaluar",
          rubricaId: claims.rubrica_id,
          recuperado: false,
          rol: claims.rol,
          allowedModes,
        },
      });
    }

    // Modos de administración
    return Response.json({
      success: true,
      data: {
        authorized: true,
        rol: claims.rol,
        allowedModes,
        usuarioId: claims.usuario_id,
      },
    });
  } catch (error) {
    console.error("[Launch API] Error:", error);
    return createErrorResponse(500, "Error interno", "Error procesando el lanzamiento");
  }
}
