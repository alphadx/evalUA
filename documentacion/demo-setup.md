# EvalUA v3.0 — Guía de Configuración del Demo

> **Opciones de despliegue:** Solo EvalUA (3 contenedores) / Demo completo (4 contenedores) / Desarrollo local  
> **Requisitos:** Docker 20+, Docker Compose v2+

---

## 1. Opción A: Solo EvalUA (Recomendado para producción)

3 contenedores: `evalua-app` (Next.js), `evalua-mongodb` (MongoDB 7), `evalua-redis` (Redis 7)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/alphadx/evalUA.git
cd evalUA/src

# 2. Levantar los servicios
docker compose up --build

# 3. Verificar que los servicios estén corriendo
docker compose ps
```

### Servicios expuestos

| Servicio | Puerto | URL |
|----------|--------|-----|
| evalua-app (Next.js) | 3000 | http://localhost:3000 |
| evalua-mongodb | 27017 | mongodb://localhost:27017 |
| evalua-redis | 6379 | redis://localhost:6379 |

### Variables de entorno (docker-compose.yml)

```yaml
services:
  evalua-app:
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://evalua-mongodb:27017/evalua
      - REDIS_URL=redis://evalua-redis:6379
      - KEY=evalua-dev-secret-key-256bits-minimum-aaaabbbbcccc
      - ID_PLATAFORMA=PLATAFORMA_demo_evalUA
      - ALLOWED_HOSTS=http://localhost:3000
      - NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Verificación

```bash
# Health check - página raíz
curl http://localhost:3000/

# Debe retornar el HTML de la landing page
```

---

## 2. Opción B: Demo Completo (EvalUA + Yii2 Host)

4 contenedores: evalua-app, evalua-mongodb, evalua-redis, demo-app (Yii2/PHP)

Este demo incluye una aplicación Host completa en Yii2 que demuestra cómo integrar EvalUA en un LMS.

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/alphadx/evalUA.git
cd evalUA/demo

# 2. Levantar todos los servicios
docker compose up --build

# 3. Verificar
docker compose ps
```

### Servicios expuestos

| Servicio | Puerto | URL | Descripción |
|----------|--------|-----|-------------|
| demo-app (Yii2) | 8080 | http://localhost:8080 | Host demo |
| evalua-app (Next.js) | 3000 | http://localhost:3000 | EvalUA |
| evalua-mongodb | 27017 | — | Base de datos |
| evalua-redis | 6379 | — | Cache |

### Navegación del Demo

Al acceder a `http://localhost:8080` verás la página principal del demo con:

| Sección | URL | Rol | Descripción |
|---------|-----|-----|-------------|
| Overview | `/` | — | Landing page con arquitectura y características |
| Evaluar | `/evaluar` | PROFESOR | Wizard de evaluación embebido |
| Rúbricas | `/rubricas` | MANTENEDOR | Gestión de rúbricas embebida |
| Dashboard | `/dashboard` | ADMINISTRADOR | Métricas embebidas |
| Resultado | `/resultado?evaluacion_id=UUID` | ALUMNO | Ver resultado embebido |
| Configurar | `/configurar` | ADMINISTRADOR | Configuración embebida |

### Flujo de prueba recomendado

```
1. Ir a http://localhost:8080/rubricas
   → Crear una rúbrica con al menos 2 criterios estructurales
   → Las ponderaciones deben sumar 1.0
   → Copiar el UUID de la rúbrica creada

2. Ir a http://localhost:8080/evaluar?rubrica_id=UUID_COPIADO
   → Evaluar cada criterio asignando notas
   → Agregar observaciones
   → Finalizar evaluación
   → Ver la nota final

3. Ir a http://localhost:8080/dashboard
   → Ver las métricas actualizadas
   → Ver la evaluación en el historial

4. Ir a http://localhost:8080/resultado?evaluacion_id=UUID_EVALUACION
   → Ver el resultado desde la perspectiva del alumno
```

### Variables de entorno del demo (demo/docker-compose.yml)

```yaml
# Variables del Host (demo-app)
environment:
  - EVALUA_URL=http://evalua-app:3000        # URL interna Docker
  - EVALUA_BROWSER_URL=http://localhost:3000  # URL alcanzable desde el navegador
  - JWT_SECRET=evalua-dev-secret-key-256bits-minimum-aaaabbbbcccc
  - ID_PLATAFORMA=PLATAFORMA_demo_evalUA

# Variables de EvalUA (evalua-app)
environment:
  - NODE_ENV=development
  - MONGODB_URI=mongodb://evalua-mongodb:27017/evalua
  - REDIS_URL=redis://evalua-redis:6379
  - KEY=evalua-dev-secret-key-256bits-minimum-aaaabbbbcccc
  - ID_PLATAFORMA=PLATAFORMA_demo_evalUA
  - ALLOWED_HOSTS=http://localhost:8080
  - NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Nota importante:** `JWT_SECRET` del Host y `KEY` de EvalUA deben ser **idénticos**.

### Diagrama de red Docker

```
┌──────────────────────────────────────────────────────────┐
│ evalua-network (bridge)                                  │
│                                                          │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│ │ evalua-app   │  │ evalua-mongo │  │ evalua-redis │    │
│ │ :3000        │──│ :27017       │  │ :6379        │    │
│ └──────────────┘  └──────────────┘  └──────────────┘    │
│        │                                                │
│ ┌──────────────┐                                        │
│ │ demo-app     │                                        │
│ │ :8080→:80    │                                        │
│ └──────────────┘                                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
         │
         ▼ Browser: localhost:8080 (Host) y localhost:3000 (EvalUA iframe)
```

---

## 3. Opción C: Desarrollo Local (sin Docker)

Para desarrollo con hot-reload.

### Requisitos previos

- Node.js 20+
- MongoDB 7 corriendo localmente (o Docker)
- Redis 7 corriendo localmente (o Docker)

### Pasos

```bash
# 1. Solo MongoDB y Redis en Docker
docker run -d --name evalua-mongodb -p 27017:27017 mongo:7
docker run -d --name evalua-redis -p 6379:6379 redis:7-alpine

# 2. Instalar dependencias
cd src
npm install

# 3. Configurar variables de entorno
# Crear archivo .env.local en src/
cat > .env.local << 'EOF'
MONGODB_URI=mongodb://localhost:27017/evalua
REDIS_URL=redis://localhost:6379
KEY=evalua-dev-secret-key-256bits-minimum-aaaabbbbcccc
ID_PLATAFORMA=PLATAFORMA_demo_evalUA
ALLOWED_HOSTS=http://localhost:3000,http://localhost:5000,http://localhost:8080
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

# 4. Iniciar en modo desarrollo
npm run dev
# Disponible en http://localhost:3000
```

---

## 4. Personalización para Producción

### Generar un secret seguro

```bash
openssl rand -base64 48
# Ejemplo salida: K7gNU3sdo+OL0wNhqoVWhr3g6sS1qP0mLpJkR6tX2Yc9BdEfGhIjKlMnO
```

### Variables de entorno para producción

```yaml
# docker-compose.prod.yml
services:
  evalua-app:
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo-user:mongo-pass@mongodb:27017/evalua?authSource=admin
      - REDIS_URL=redis://:redis-pass@redis:6379
      - KEY=<SECRET_GENERADO_CON_OPENSSL>
      - ID_PLATAFORMA=<TU_ID_PLATAFORMA>
      - ALLOWED_HOSTS=https://lms.universidad.cl,https://otro-dominio.cl
      - NEXT_PUBLIC_APP_URL=https://evalua.universidad.cl
```

### Checklist de producción

- [ ] Secret JWT generado aleatoriamente (mín 32 chars)
- [ ] `NODE_ENV=production`
- [ ] MongoDB con autenticación habilitada
- [ ] Redis con contraseña
- [ ] `ALLOWED_HOSTS` incluye solo los orígenes del Host
- [ ] `ID_PLATAFORMA` es único por instancia
- [ ] HTTPS habilitado (reverse proxy Nginx/Caddy)
- [ ] Volúmenes persistentes para MongoDB y Redis
- [ ] Logs centralizados
- [ ] Monitoreo de salud (healthcheck en docker-compose)

### Reverse Proxy con Nginx

```nginx
server {
    listen 443 ssl;
    server_name evalua.universidad.cl;

    ssl_certificate /etc/ssl/certs/evalua.crt;
    ssl_certificate_key /etc/ssl/private/evalua.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Reverse Proxy con Caddy

```
evalua.universidad.cl {
    reverse_proxy localhost:3000
}
```

---

## 5. Troubleshooting

### MongoDB no conecta

```bash
# Verificar que el contenedor está corriendo
docker compose ps

# Ver logs de MongoDB
docker compose logs evalua-mongodb

# Verificar conectividad desde la app
docker compose exec evalua-app sh -c "nc -zv evalua-mongodb 27017"
```

### Redis no conecta

```bash
# Verificar Redis
docker compose exec evalua-redis redis-cli ping
# Debe retornar: PONG

# Verificar desde la app
docker compose exec evalua-app sh -c "nc -zv evalua-redis 6379"
```

### JWT no se verifica

```bash
# Verificar que el secret es idéntico en Host y EvalUA
# En el Host:
echo $JWT_SECRET

# En EvalUA:
docker compose exec evalua-app printenv KEY

# Deben ser exactamente iguales
```

### CORS error

```bash
# Verificar ALLOWED_HOSTS incluye el origen del Host
docker compose exec evalua-app printenv ALLOWED_HOSTS

# Si el Host corre en http://localhost:8080, debe estar en la lista
```

### Puerto ya en uso

```bash
# Windows
netstat -ano | findstr :3000
# Matar el proceso con el PID encontrado

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

### Reset completo

```bash
# Detener y eliminar todo (incluyendo datos)
docker compose down -v

# Reconstruir desde cero
docker compose up --build
```

---

## 6. Scripts de Verificación

### test-connectivity.ps1 (Windows PowerShell)

Incluido en `demo/test-connectivity.ps1`:

```powershell
# Verifica que todos los servicios del demo estén accesibles
$services = @(
    @{ Name = "EvalUA App"; Url = "http://localhost:3000" },
    @{ Name = "Demo Host"; Url = "http://localhost:8080" }
)

foreach ($svc in $services) {
    try {
        $response = Invoke-WebRequest -Uri $svc.Url -UseBasicParsing -TimeoutSec 5
        Write-Host "✅ $($svc.Name): HTTP $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($svc.Name): No accesible" -ForegroundColor Red
    }
}
```

### Verificación manual con curl

```bash
# EvalUA landing page
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
# Debe retornar: 200

# Demo host landing page
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/
# Debe retornar: 200