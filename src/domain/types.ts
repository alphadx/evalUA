/**
 * EvalUA v3.0 — Branded Types (Tipos Opacos)
 * Evita el cruce accidental de identificadores
 */

declare const __brand: unique symbol;
type Brand<T, B> = T & { readonly [__brand]: B };

export type RubricaId = Brand<string, "RubricaId">;
export type CriterioId = Brand<string, "CriterioId">;
export type EvaluacionId = Brand<string, "EvaluacionId">;
export type UsuarioId = Brand<string, "UsuarioId">;

export const ROLES = ["ADMINISTRADOR", "MANTENEDOR", "PROFESOR", "ALUMNO"] as const;
export type Rol = (typeof ROLES)[number];

export const ESTADOS_EVALUACION = ["EN_PROGRESO", "EN_REVISION", "COMPLETADA"] as const;
export type EstadoEvaluacion = (typeof ESTADOS_EVALUACION)[number];

export const TIPOS_CRITERIO = ["ESTRUCTURAL", "COMPLEMENTARIO"] as const;
export type TipoCriterio = (typeof TIPOS_CRITERIO)[number];

export interface JwtClaims {
  id_plataforma: string;
  rol: Rol;
  usuario_id?: string;
  rubrica_id?: string;
  evaluacion_id?: string;
  rubricas_permitidas?: string[];
  iss: string;
  aud: string;
  exp: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    type: string;
    title: string;
    status: number;
    detail: string;
  };
}
