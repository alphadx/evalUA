/**
 * EvalUA v3.0 — API: PUT /api/configuracion/[clave]
 * Actualizar parámetro de configuración
 */

import { ActualizarConfigSchema } from "@/domain/schemas";
import { createErrorResponse, hasRole, verifyToken } from "@/infrastructure/auth/jwt";
import { invalidateCachedConfig } from "@/infrastructure/cache/redis";
import { ConfiguracionModel } from "@/infrastructure/database/models/configuracion.model";
import { connectMongoDB } from "@/infrastructure/database/mongodb";
import { NextRequest } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clave: string }> }
) {
  try {
    const { clave } = await params;
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
      return createErrorResponse(403, "Prohibido", "Solo administradores pueden modificar configuraciones");
    }

    const body = await request.json();
    const parsed = ActualizarConfigSchema.safeParse(body);
    if (!parsed.success) {
      return createErrorResponse(
        400,
        "Datos inválidos",
        parsed.error.issues.map((e: { message: string }) => e.message).join(", ")
      );
    }

    await connectMongoDB();

    const config = await ConfiguracionModel.findOneAndUpdate(
      { clave },
      { valor: parsed.data.valor },
      { new: true }
    );

    if (!config) {
      return createErrorResponse(404, "No encontrada", `Configuración '${clave}' no existe`);
    }

    await invalidateCachedConfig();

    return Response.json({ success: true, data: config.toObject() });
  } catch (error) {
    console.error("[Config PUT] Error:", error);
    return createErrorResponse(500, "Error interno", "Error al actualizar configuración");
  }
}
