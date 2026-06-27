/**
 * EvalUA v3.0 — API: /api/rubricas
 * GET: Listar rúbricas / POST: Crear rúbrica
 */

import { CrearRubricaSchema } from "@/domain/schemas";
import { createErrorResponse, hasRole, verifyToken } from "@/infrastructure/auth/jwt";
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

    if (!hasRole(claims, "MANTENEDOR", "ADMINISTRADOR")) {
      return createErrorResponse(403, "Prohibido", "Rol no autorizado");
    }

    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const esActiva = searchParams.get("esActiva");

    const filter: Record<string, unknown> = {};
    if (esActiva === "true") filter.esActiva = true;
    if (esActiva === "false") filter.esActiva = false;

    // Filtro de seguridad para MANTENEDOR
    if (claims.rol === "MANTENEDOR" && claims.rubricas_permitidas) {
      if (!claims.rubricas_permitidas.includes("*")) {
        filter._id = { $in: claims.rubricas_permitidas };
      }
    }

    const rubricas = await RubricaModel.find(filter)
      .sort({ updatedAt: -1 })
      .lean();

    return Response.json({ success: true, data: rubricas });
  } catch (error) {
    console.error("[Rubricas GET] Error:", error);
    return createErrorResponse(500, "Error interno", "Error al listar rúbricas");
  }
}

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

    if (!hasRole(claims, "MANTENEDOR", "ADMINISTRADOR")) {
      return createErrorResponse(403, "Prohibido", "Rol no autorizado");
    }

    const body = await request.json();
    const parsed = CrearRubricaSchema.safeParse(body);
    if (!parsed.success) {
      return createErrorResponse(
        400,
        "Datos inválidos",
        parsed.error.issues.map((e: { message: string }) => e.message).join(", ")
      );
    }

    await connectMongoDB();

    const { titulo, notaAprobacion, exigencia, metadata, criterios } = parsed.data;

    // Validar que la suma de ponderaciones = 1.0
    const estructurales = criterios.filter((c) => c.tipo === "ESTRUCTURAL");
    const suma = estructurales.reduce((acc, c) => acc + c.ponderacion, 0);
    if (Math.abs(suma - 1.0) > 0.001) {
      return createErrorResponse(
        400,
        "Ponderaciones inválidas",
        `La suma de ponderaciones de criterios estructurales debe ser 1.0, actualmente es ${suma.toFixed(3)}`
      );
    }

    const crypto = await import("crypto");
    const rubricaId = crypto.randomUUID();

    const nuevaRubrica = new RubricaModel({
      _id: rubricaId,
      rubricaGroupId: rubricaId,
      version: 1,
      parentRubricaId: null,
      titulo,
      notaAprobacion: notaAprobacion ?? 4.0,
      exigencia: exigencia ?? 0.5,
      esActiva: true,
      expuesta: false,
      metadata: metadata || null,
      criterios: criterios.map((c, idx) => ({
        _id: c.id || crypto.randomUUID(),
        nombre: c.nombre,
        ponderacion: c.ponderacion,
        tipo: c.tipo,
        esExcluyente: c.esExcluyente,
        notaCorte: c.notaCorte ?? 4.0,
        descripcion: c.descripcion || null,
        minPalabras: c.minPalabras || null,
        maxPalabras: c.maxPalabras || null,
        orden: c.orden ?? idx,
        descriptores: c.descriptores || [],
      })),
    });

    await nuevaRubrica.save();

    return Response.json(
      { success: true, data: nuevaRubrica.toObject() },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Rubricas POST] Error:", error);
    return createErrorResponse(500, "Error interno", "Error al crear rúbrica");
  }
}
