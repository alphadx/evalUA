/**
 * EvalUA v3.0 — JWT Service
 * Verificación y firma simétrica HS256
 */

import { JwtClaims, Rol } from "@/domain/types";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.KEY || "evalua-dev-secret-key-256bits-minimum-aaaabbbbcccc";
const ID_PLATAFORMA = process.env.ID_PLATAFORMA || "";

export function verifyToken(token: string): JwtClaims {
  // Dev mode: bypass JWT for local development
  // Uses a runtime check that cannot be optimized at build time
  const isDevToken = token === "dev-token";
  if (isDevToken) {
    const jwtKey = process.env.KEY;
    if (!jwtKey || jwtKey.includes("dev")) {
      return {
        id_plataforma: "dev",
        rol: "ADMINISTRADOR",
        usuario_id: "dev-user",
        rubricas_permitidas: ["*"],
        iss: "dev",
        aud: "evalua-microservice",
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
    }
  }

  const decoded = jwt.verify(token, JWT_SECRET, {
    algorithms: ["HS256"],
    audience: "evalua-microservice",
  }) as JwtClaims;

  return decoded;
}

export function hasRole(claims: JwtClaims, ...roles: Rol[]): boolean {
  return roles.includes(claims.rol);
}

export function canAccessRubrica(claims: JwtClaims, rubricaId: string): boolean {
  if (claims.rol === "ADMINISTRADOR") return true;
  if (!claims.rubricas_permitidas) return false;
  if (claims.rubricas_permitidas.includes("*")) return true;
  return claims.rubricas_permitidas.includes(rubricaId);
}

export function getModeFromRole(claims: JwtClaims): string[] {
  switch (claims.rol) {
    case "ADMINISTRADOR":
      return ["dashboard", "rubricas", "configurar", "evaluar", "resultado"];
    case "MANTENEDOR":
      return ["dashboard", "rubricas", "evaluar", "resultado"];
    case "PROFESOR":
      return ["evaluar", "resultado"];
    case "ALUMNO":
      return ["resultado"];
    default:
      return [];
  }
}

export function createErrorResponse(
  status: number,
  title: string,
  detail: string
) {
  return Response.json(
    {
      success: false,
      error: {
        type: "about:blank",
        title,
        status,
        detail,
      },
    },
    { status }
  );
}
