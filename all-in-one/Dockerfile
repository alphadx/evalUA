# ============================================
# EvalUA v3.0 — All-in-One Image
# Next.js + MongoDB + Redis en un solo contenedor
# Build dinámico al iniciar (permite basePath runtime)
# ============================================

# Obtener binario de MongoDB desde imagen oficial
FROM mongo:7.0 AS mongo-bin

FROM node:20-slim

# Copiar mongod desde la imagen oficial
COPY --from=mongo-bin /usr/bin/mongod /usr/local/bin/mongod

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    libssl3 \
    redis-server \
    tini \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar código fuente completo (necesario para build en runtime)
COPY src/package.json src/package-lock.json ./
RUN npm install --ignore-scripts

COPY src/ .

# Crear directorios de datos y logs
RUN mkdir -p /data/db /data/redis /var/log /app/.build-cache

# Copiar entrypoint
COPY all-in-one/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Variables por defecto (pueden ser sobreescritas en docker-compose)
ENV MONGODB_URI="mongodb://127.0.0.1:27017/evalua"
ENV REDIS_URL="redis://127.0.0.1:6379"
ENV KEY="evalua-dev-secret-key-256bits-minimum-aaaabbbbcccc"
ENV ALLOWED_HOSTS="http://localhost:3000"
ENV ID_PLATAFORMA=""

VOLUME ["/data/db", "/data/redis"]

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["/entrypoint.sh"]