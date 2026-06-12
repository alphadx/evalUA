# Skill: Docker Compose Generator

## Propósito
Generar y mantener la configuración de Docker Compose para el stack completo de EvalUA.

## Instrucciones
Cuando el usuario solicite configurar, modificar o extender el entorno Docker:

### Stack Base (docker-compose.yml)
```yaml
version: '3.8'

services:
  evalua-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: evalua-app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://evalua-mongodb:27017/evalua
      - REDIS_URL=redis://evalua-redis:6379
      - KEY=${KEY}
      - ALLOWED_HOSTS=${ALLOWED_HOSTS:-http://localhost:3000}
    depends_on:
      evalua-mongodb:
        condition: service_healthy
      evalua-redis:
        condition: service_healthy
    volumes:
      - ./src:/app/src
      - ./public:/app/public
    networks:
      - evalua-network
    restart: unless-stopped

  evalua-mongodb:
    image: mongo:7
    container_name: evalua-mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongodb-data:/data/db
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh --quiet
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - evalua-network
    restart: unless-stopped

  evalua-redis:
    image: redis:7-alpine
    container_name: evalua-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - evalua-network
    restart: unless-stopped

volumes:
  mongodb-data:
  redis-data:

networks:
  evalua-network:
    driver: bridge
```

### Dockerfile Multi-stage (Next.js)
```dockerfile
# Stage: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### Reglas
- SIEMPRE usar healthchecks para MongoDB y Redis
- SIEMPRE usar volumes nombrados para datos persistentes
- La app DEBE esperar a que las dependencias estén healthy antes de iniciar
- En desarrollo, montar `./src` como bind mount para hot-reload
- NUNCA hardcodear secrets en docker-compose — usar `.env`
- Crear `.env.example` con todas las variables requeridas (sin valores reales)