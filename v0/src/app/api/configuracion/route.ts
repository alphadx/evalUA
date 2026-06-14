/**
 * EvalUA v3.0 — API: /api/configuracion
 * GET: Listar configuraciones / Solo ADMINISTRADOR
 */

import { createErrorResponse, hasRole, verifyToken } from "@/infrastructure/auth/jwt";
import { getCachedConfig, setCachedConfig } from "@/infrastructure/cache/redis";
import { ConfiguracionModel } from "@/infrastructure/database/models/configuracion.model";
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

    if (!hasRole(claims, "ADMINISTRADOR")) {
      return createErrorResponse(403, "Prohibido", "Solo administradores pueden ver configuraciones");
    }

    // Intentar caché L2
    const cached = await getCachedConfig();
    if (cached) {
      return Response.json({ success: true, data: cached });
    }

    await connectMongoDB();
    const configs = await ConfiguracionModel.find().lean();

    // Repoblar caché
    setCachedConfig(configs as unknown as Record<string, unknown>[]);

    return Response.json({ success: true, data: configs });
  } catch (error) {
    console.error("[Config GET] Error:", error);
    return createErrorResponse(500, "Error interno", "Error al obtener configuraciones");
  }
}
