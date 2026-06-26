#!/bin/bash
set -e

echo "=========================================="
echo " EvalUA v3.0 — All-in-One"
echo "=========================================="

# --- Build dinámico de Next.js ---
NEXT_PUBLIC_BASE_PATH="${NEXT_PUBLIC_BASE_PATH:-}"
CURRENT_HASH=$(echo "$NEXT_PUBLIC_BASE_PATH" | md5sum | cut -d' ' -f1)
CACHE_FILE="/app/.build-cache/base-path.hash"

NEED_BUILD="true"
if [ -f "$CACHE_FILE" ]; then
  CACHED_HASH=$(cat "$CACHE_FILE")
  if [ "$CURRENT_HASH" = "$CACHED_HASH" ] && [ -d "/app/.next/standalone" ]; then
    NEED_BUILD="false"
    echo "[init] Build cacheado válido (basePath='$NEXT_PUBLIC_BASE_PATH')"
  fi
fi

if [ "$NEED_BUILD" = "true" ]; then
  # Limpiar build anterior
  rm -rf /app/.next

  echo "[init] Compilando Next.js (basePath='${NEXT_PUBLIC_BASE_PATH:-/}')..."
  NODE_ENV=production NEXT_PUBLIC_BASE_PATH="$NEXT_PUBLIC_BASE_PATH" npm run build

  # Next.js standalone no incluye public ni static, copiarlos manualmente
  cp -r /app/public /app/.next/standalone/public 2>/dev/null || true
  mkdir -p /app/.next/standalone/.next
  cp -r /app/.next/static /app/.next/standalone/.next/static 2>/dev/null || true

  echo "$CURRENT_HASH" > "$CACHE_FILE"
  echo "[init] Build completado."
fi

# --- MongoDB ---
echo "[init] Iniciando MongoDB..."
mkdir -p /data/db /var/log
mongod --dbpath /data/db --fork --logpath /var/log/mongod.log \
  --bind_ip 127.0.0.1 --quiet

# Esperar a que MongoDB esté listo
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:27017 > /dev/null 2>&1; then
    echo "[init] MongoDB listo."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "[init] ERROR: MongoDB no respondió en 30s"
    exit 1
  fi
  sleep 1
done

# --- Seed de configuración ---
echo "[init] Sembrando configuración por defecto..."
mongosh --quiet --eval '
  use evalua;
  db.configuraciones.updateOne(
    { clave: "exigencia_default" },
    {
      $setOnInsert: {
        clave: "exigencia_default",
        valor: "0.5",
        descripcion: "Porcentaje de exigencia por defecto para nuevas rúbricas (50%)"
      }
    },
    { upsert: true }
  );
' 2>/dev/null || echo "[init] Aviso: No se pudo sembrar configuración (mongosh no disponible o DB no lista)"

# --- Redis ---
echo "[init] Iniciando Redis..."
mkdir -p /data/redis
redis-server --daemonize yes \
  --dir /data/redis \
  --bind 127.0.0.1 \
  --save 60 1 \
  --loglevel warning

# Esperar a que Redis esté listo
for i in $(seq 1 10); do
  if redis-cli ping 2>/dev/null | grep -q PONG; then
    echo "[init] Redis listo."
    break
  fi
  if [ "$i" -eq 10 ]; then
    echo "[init] ERROR: Redis no respondió en 10s"
    exit 1
  fi
  sleep 1
done

# --- Next.js ---
echo "[init] Iniciando Next.js (puerto ${PORT:-3000})..."
echo "=========================================="
exec node /app/.next/standalone/server.js