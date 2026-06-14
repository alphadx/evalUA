/**
 * EvalUA v3.0 — API: POST /api/evaluaciones/[id]/calcular
 * Calcula nota final, persiste en MongoDB, elimina borrador de Redis
 */

import { Criterio } from "@/domain/entities/criterio";
import { Descriptor } from "@/domain/entities/descriptor";
import { Puntaje } from "@/domain/entities/puntaje";
import { EvaluacionStrategy } from "@/domain/strategies/evaluacion-strategy";
import { CriterioId } from "@/domain/types";
import { Nota } from "@/domain/value-objects/nota";
import { createErrorResponse, verifyToken } from "@/infrastructure/auth/jwt";
import { deleteDraft, getCachedRubrica, getDraft } from "@/infrastructure/cache/redis";
import { EvaluacionModel } from "@/infrastructure/database/models/evaluacion.model";
import { RubricaModel } from "@/infrastructure/database/models/rubrica.model";
import { connectMongoDB } from "@/infrastructure/database/mongodb";
import { NextRequest } from "next/server";

export async function POST(
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

    // Idempotency-Key header
    const idempotencyKey = request.headers.get("idempotency-key");

    // 1. Cargar borrador desde Redis
    const draft = await getDraft(id);
    if (!draft) {
      return createErrorResponse(400, "Solicitud inválida", "Borrador no existe en Redis");
    }

    // 2. Validar estado EN_REVISION
    if (draft.estado !== "EN_REVISION") {
      return createErrorResponse(
        400,
        "Solicitud inválida",
        "La evaluación debe estar en estado EN_REVISION para finalizar"
      );
    }

    // 3. Cargar rúbrica para obtener criterios
    const rubricaId = draft.rubricaId as string;
    let rubricaData: Record<string, unknown> | null = await getCachedRubrica(rubricaId);

    if (!rubricaData) {
      await connectMongoDB();
      const rubrica = await RubricaModel.findById(rubricaId).lean();
      if (!rubrica) {
        return createErrorResponse(404, "No encontrada", "Rúbrica asociada no existe");
      }
      rubricaData = rubrica as unknown as Record<string, unknown>;
    }

    // 4. Mapear criterios del documento a entidades de dominio
    const criteriosRaw = rubricaData.criterios as Array<Record<string, unknown>>;
    const criterios = criteriosRaw.map(
      (c) =>
        new Criterio(
          c._id as CriterioId,
          c.nombre as string,
          c.ponderacion as number,
          c.tipo as "ESTRUCTURAL" | "COMPLEMENTARIO",
          c.esExcluyente as boolean,
          (c.descripcion as string) || null,
          (c.minPalabras as number) || null,
          (c.maxPalabras as number) || null,
          (c.orden as number) || 0,
          ((c.descriptores as Array<Record<string, unknown>>) || []).map(
            (d) =>
              Descriptor.create({
                notaNivel: d.notaNivel as number,
                etiqueta: d.etiqueta as string,
                bulletPoints: (d.bulletPoints as string[]) || [],
              })
          )
        )
    );

    // 5. Validar que todos los criterios estructurales estén calificados
    const puntajesRaw = (draft.puntajes as Array<Record<string, unknown>>) || [];
    const estructurales = criterios.filter((c) => c.tipo === "ESTRUCTURAL");
    const calificadosIds = new Set(puntajesRaw.map((p) => p.criterioId));

    for (const crit of estructurales) {
      if (!calificadosIds.has(crit.id)) {
        return createErrorResponse(
          400,
          "Calificación incompleta",
          `Falta calificar el criterio estructural: ${crit.nombre}`
        );
      }
    }

    // 6. Ejecutar estrategia de cálculo
    const puntajes = puntajesRaw.map((p) =>
      Puntaje.create({
        criterioId: p.criterioId as CriterioId,
        notaAsignada: Nota.create(p.notaAsignada as number),
        observaciones: (p.observaciones as string) || null,
      })
    );

    const strategy = new EvaluacionStrategy();
    const notaFinal = strategy.calcular(puntajes, criterios);

    // 7. Persistir en MongoDB
    await connectMongoDB();

    // Verificar que no exista ya (idempotencia por OCC)
    const existing = await EvaluacionModel.findById(id);
    if (existing) {
      return createErrorResponse(
        409,
        "Conflicto",
        "Esta evaluación ya ha sido consolidada"
      );
    }

    const evaluacionFinal = new EvaluacionModel({
      _id: id,
      rubricaId: draft.rubricaId,
      estado: "COMPLETADA",
      notaFinal: notaFinal.valor,
      observaciones: draft.observaciones || null,
      metadata: {
        reglaAplicada: puntajes.some(
          (p) =>
            criterios.find((c) => c.id === p.criterioId)?.esExcluyente &&
            p.notaAsignada.valor < 4.0
        )
          ? "GATEKEEPER"
          : "NORMAL",
        usuarioId: draft.usuarioId || null,
        idempotencyKey: idempotencyKey || null,
      },
      puntajes: puntajesRaw.map((p) => ({
        criterioId: p.criterioId,
        notaAsignada: p.notaAsignada,
        observaciones: p.observaciones || null,
      })),
    });

    await evaluacionFinal.save();

    // 8. Eliminar borrador de Redis
    await deleteDraft(id);

    return Response.json({
      success: true,
      data: {
        evaluacionId: id,
        notaFinal: notaFinal.valor,
        aprobada: notaFinal.esAprobatoria(),
        estado: "COMPLETADA",
      },
    });
  } catch (error) {
    console.error("[Calcular POST] Error:", error);
    return createErrorResponse(500, "Error interno", "Error al calcular evaluación");
  }
}
