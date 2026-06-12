/**
 * EvalUA v3.0 — Redis Client Singleton
 * Borradores con TTL y caché L2 con resiliencia
 */

import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: true,
    });

    redisClient.on("error", (err) => {
      console.error("[Redis] Connection error:", err.message);
    });

    redisClient.on("connect", () => {
      console.log("[Redis] Connected successfully");
    });
  }
  return redisClient;
}

// --- Draft operations (Evaluaciones en curso) ---
const DRAFT_TTL = 2592000; // 30 días en segundos
const CACHE_RUBRICA_TTL = 86400; // 24 horas
const CACHE_CONFIG_TTL = 86400; // 24 horas

export async function getDraft(evaluacionId: string): Promise<Record<string, unknown> | null> {
  try {
    const client = getRedisClient();
    const data = await client.get(`draft:${evaluacionId}`);
    return data ? JSON.parse(data) : null;
  } catch {
    console.error("[Redis] Error getting draft, falling back to null");
    return null;
  }
}

export async function saveDraft(
  evaluacionId: string,
  draft: Record<string, unknown>
): Promise<void> {
  try {
    const client = getRedisClient();
    await client.set(
      `draft:${evaluacionId}`,
      JSON.stringify(draft),
      "EX",
      DRAFT_TTL
    );
  } catch {
    console.error("[Redis] Error saving draft");
  }
}

export async function deleteDraft(evaluacionId: string): Promise<void> {
  try {
    const client = getRedisClient();
    await client.del(`draft:${evaluacionId}`);
  } catch {
    console.error("[Redis] Error deleting draft");
  }
}

export async function draftExists(evaluacionId: string): Promise<boolean> {
  try {
    const client = getRedisClient();
    const result = await client.exists(`draft:${evaluacionId}`);
    return result === 1;
  } catch {
    return false;
  }
}

// --- L2 Cache operations ---
export async function getCachedRubrica(rubricaId: string): Promise<Record<string, unknown> | null> {
  try {
    const client = getRedisClient();
    const data = await client.get(`cache:rubrica:${rubricaId}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function setCachedRubrica(
  rubricaId: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const client = getRedisClient();
    await client.set(
      `cache:rubrica:${rubricaId}`,
      JSON.stringify(data),
      "EX",
      CACHE_RUBRICA_TTL
    );
  } catch {
    console.error("[Redis] Error caching rubrica");
  }
}

export async function invalidateCachedRubrica(rubricaId: string): Promise<void> {
  try {
    const client = getRedisClient();
    await client.del(`cache:rubrica:${rubricaId}`);
  } catch {
    console.error("[Redis] Error invalidating rubrica cache");
  }
}

export async function getCachedConfig(): Promise<Record<string, unknown>[] | null> {
  try {
    const client = getRedisClient();
    const data = await client.get("cache:configuracion");
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function setCachedConfig(data: Record<string, unknown>[]): Promise<void> {
  try {
    const client = getRedisClient();
    await client.set("cache:configuracion", JSON.stringify(data), "EX", CACHE_CONFIG_TTL);
  } catch {
    console.error("[Redis] Error caching configuration");
  }
}

export async function invalidateCachedConfig(): Promise<void> {
  try {
    const client = getRedisClient();
    await client.del("cache:configuracion");
  } catch {
    console.error("[Redis] Error invalidating config cache");
  }
}

// --- Draft count for dashboard ---
export async function countDrafts(): Promise<number> {
  try {
    const client = getRedisClient();
    const keys = await client.keys("draft:*");
    return keys.length;
  } catch {
    return 0;
  }
}

export async function getDraftsByRubrica(rubricaId: string): Promise<string[]> {
  try {
    const client = getRedisClient();
    const keys = await client.keys("draft:*");
    const matching: string[] = [];
    for (const key of keys) {
      const data = await client.get(key);
      if (data) {
        const draft = JSON.parse(data);
        if (draft.rubricaId === rubricaId) {
          matching.push(key.replace("draft:", ""));
        }
      }
    }
    return matching;
  } catch {
    return [];
  }
}
