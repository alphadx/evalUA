/**
 * EvalUA v3.0 — API: /api/rubricas/[id]
 * GET: Obtener rúbrica / PUT: Actualizar / DELETE: Eliminar
 */

import { ActualizarRubricaSchema } from "@/domain/schemas";
import {
  canAccessRubrica,
  createErrorResponse,
  hasRole,
  verifyToken,
} from "@/infrastructure/auth/jwt";
import {
  getCachedRubrica,
  invalidateCachedRubrica,
  setCachedRubrica,
} from "@/infrastructure/cache/redis";
import { EvaluacionModel } from "@/infrastructure/database/models/evaluacion.model";
import { RubricaModel } from "@/infrastructure/database/models/rubrica.model";
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

    let claims;
    try {
      claims = verifyToken(authHeader.substring(7));
    } catch {
      return createErrorResponse(401, "No autorizado", "Token JWT inválido");
    }

    if (!hasRole(claims, "MANTENEDOR", "ADMINISTRADOR", "PROFESOR", "ALUMNO")) {
      return createErrorResponse(403, "Prohibido", "Rol no autorizado");
    }

    // Cache-Aside: Intentar leer de Redis primero
    const cached = await getCachedRubrica(id);
    if (cached) {
      return Response.json({ success: true, data: cached });
    }

    await connectMongoDB();
    const rubrica = await RubricaModel.findById(id).lean();
    if (!rubrica) {
      return createErrorResponse(404, "No encontrada", "Rúbrica no existe");
    }

    // Repoblar caché en segundo plano
    setCachedRubrica(id, rubrica as unknown as Record<string, unknown>);

    return Response.json({ success: true, data: rubrica });
  } catch (error) {
    console.error("[Rubrica GET] Error:", error);
    return createErrorResponse(500, "Error interno", "Error al obtener rúbrica");
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

    let claims;
    try {
      claims = verifyToken(authHeader.substring(7));
    } catch {
      return createErrorResponse(401, "No autorizado", "Token JWT inválido");
    }

    if (!hasRole(claims, "MANTENEDOR", "ADMINISTRADOR")) {
      return createErrorResponse(403, "Prohibido", "Rol no autorizado");
    }

    if (!canAccessRubrica(claims, id)) {
      return createErrorResponse(403, "Prohibido", "No tiene acceso a esta rúbrica");
    }

    const body = await request.json();
    const parsed = ActualizarRubricaSchema.safeParse(body);
    if (!parsed.success) {
      return createErrorResponse(
        400,
        "Datos inválidos",
        parsed.error.issues.map((e: { message: string }) => e.message).join(", ")
      );
    }

    await connectMongoDB();

    const rubrica = await RubricaModel.findById(id);
    if (!rubrica) {
      return createErrorResponse(404, "No encontrada", "Rúbrica no existe");
    }

    // Verificar si tiene evaluaciones asociadas → crear nueva versión
    const evaluacionesCount = await EvaluacionModel.countDocuments({
      rubricaId: id,
    });

    if (evaluacionesCount > 0 && parsed.data.criterios) {
      // Crear nueva versión (versionamiento inmutable)
      const crypto = await import("crypto");
      const nuevoId = crypto.randomUUID();
      const nuevaVersion = new RubricaModel({
        _id: nuevoId,
        rubricaGroupId: rubrica.rubricaGroupId,
        version: rubrica.version + 1,
        parentRubricaId: id,
        titulo: parsed.data.titulo || rubrica.titulo,
        esActiva: true,
        metadata: parsed.data.metadata || rubrica.metadata,
        criterios: parsed.data.criterios.map((c, idx) => ({
          _id: c.id || crypto.randomUUID(),
          nombre: c.nombre,
          ponderacion: c.ponderacion,
          tipo: c.tipo,
          esExcluyente: c.esExcluyente,
          descripcion: c.descripcion || null,
          minPalabras: c.minPalabras || null,
          maxPalabras: c.maxPalabras || null,
          orden: c.orden ?? idx,
          descriptores: c.descriptores || [],
        })),
      });

      await nuevaVersion.save();
      // Desactivar la versión anterior
      rubrica.esActiva = false;
      await rubrica.save();

      await invalidateCachedRubrica(id);

      return Response.json({ success: true, data: nuevaVersion.toObject() });
    }

    // Actualización directa (sin evaluaciones previas)
    if (parsed.data.titulo) rubrica.titulo = parsed.data.titulo;
    if (parsed.data.metadata !== undefined) rubrica.metadata = parsed.data.metadata || null;
    if (parsed.data.esActiva !== undefined) rubrica.esActiva = parsed.data.esActiva;
    if (parsed.data.criterios) {
      const crypto = await import("crypto");
      rubrica.criterios = parsed.data.criterios.map((c, idx) => ({
        _id: c.id || crypto.randomUUID(),
        nombre: c.nombre,
        ponderacion: c.ponderacion,
        tipo: c.tipo,
        esExcluyente: c.esExcluyente,
        descripcion: c.descripcion || null,
        minPalabras: c.minPalabras || null,
        maxPalabras: c.maxPalabras || null,
        orden: c.orden ?? idx,
        descriptores: c.descriptores || [],
      }));
    }

    await rubrica.save();
    await invalidateCachedRubrica(id);

    return Response.json({ success: true, data: rubrica.toObject() });
  } catch (error) {
    console.error("[Rubrica PUT] Error:", error);
    return createErrorResponse(500, "Error interno", "Error al actualizar rúbrica");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    if (!hasRole(claims, "MANTENEDOR", "ADMINISTRADOR")) {
      return createErrorResponse(403, "Prohibido", "Rol no autorizado");
    }

    if (!canAccessRubrica(claims, id)) {
      return createErrorResponse(403, "Prohibido", "No tiene acceso a esta rúbrica");
    }

    await connectMongoDB();

    // Verificar que no tenga evaluaciones asociadas
    const evaluacionesCount = await EvaluacionModel.countDocuments({
      rubricaId: id,
    });
    if (evaluacionesCount > 0) {
      return createErrorResponse(
        409,
        "Conflicto",
        "No se puede eliminar una rúbrica con evaluaciones asociadas"
      );
    }

    await RubricaModel.findByIdAndDelete(id);
    await invalidateCachedRubrica(id);

    return Response.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error("[Rubrica DELETE] Error:", error);
    return createErrorResponse(500, "Error interno", "Error al eliminar rúbrica");
  }
}
