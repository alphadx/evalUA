# EvalUA v3.0 — All-in-One

Imagen Docker que contiene **Next.js + MongoDB + Redis** en un solo contenedor.

La compilación de Next.js se realiza **al iniciar el contenedor**, lo que permite configurar el subpath (`basePath`) en runtime mediante la variable de entorno `NEXT_PUBLIC_BASE_PATH`. La primera vez tarda ~30s en compilar, las siguientes se inicia instantáneamente gracias al cache.

## Construir la imagen

### Linux/macOS (Bash)
```bash
./all-in-one/build.sh

# Con nombre personalizado
./all-in-one/build.sh mi-imagen:latest mi-imagen.tar
```

### Windows (PowerShell)
```powershell
.\all-in-one\build.ps1

# Con nombre personalizado
.\all-in-one\build.ps1 -ImageName "mi-imagen:latest" -TarOutput "mi-imagen.tar"
```

### Docker directo
```bash
docker build -f all-in-one/Dockerfile -t evalua-allinone:latest .
```

## Ejemplo de uso en docker-compose.yml

### En la raíz del dominio (sin subpath)

```yaml
services:
  evalua:
    image: evalua-allinone:latest
    ports:
      - ${evalUA_PORT}:3000
    environment:
      TZ: America/Santiago
      KEY: "tu-clave-secreta-jwt-hs256-minimo-32-caracteres"
      ID_PLATAFORMA: "evalua-sistemas-dev"
      ALLOWED_HOSTS: "http://localhost:${evalUA_PORT},http://localhost:${YII2_PORT_TESIS}"
    volumes:
      - evalua-mongo:/data/db
      - evalua-redis:/data/redis
    networks:
      vpcbr:
        ipv4_address: 10.5.0.20

volumes:
  evalua-mongo:
  evalua-redis:

networks:
  vpcbr:
    external: true
```

### Con subpath /evalua/ (detrás de nginx)

La variable `NEXT_PUBLIC_BASE_PATH` se define como entorno al iniciar el contenedor. El entrypoint detecta el cambio y recompila Next.js automáticamente.

Nginx:
```nginx
location /evalua/ {
    proxy_pass http://evalua:3000/evalua;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
}
```

> **Importante:** El `proxy_pass` debe incluir `/evalua` como destino para que nginx reescriba correctamente las rutas. Next.js con `basePath: "/evalua"` espera recibir las rutas con ese prefijo.

Docker Compose:
```yaml
services:
  evalua:
    image: evalua-allinone:latest
    ports:
      - ${evalUA_PORT}:3000
    environment:
      TZ: America/Santiago
      KEY: "dev-clave-secreta-evalua-2024-al-menos-32"
      ID_PLATAFORMA: "evalua-sistemas-dev"
      ALLOWED_HOSTS: "http://localhost:${evalUA_PORT},http://localhost:${YII2_PORT_TESIS}"
      NEXT_PUBLIC_BASE_PATH: "/evalua"
    volumes:
      - evalua-mongo:/data/db
      - evalua-redis:/data/redis
    networks:
      vpcbr:
        ipv4_address: 10.5.0.20
```

> **Nota:** Al cambiar `NEXT_PUBLIC_BASE_PATH`, el contenedor recompilará automáticamente al reiniciarse. La primera compilación toma ~30s; las siguientes se sirven desde cache.

## Variables de entorno

### Variables de runtime

| Variable | Default | Descripción |
|---|---|---|
| `NEXT_PUBLIC_BASE_PATH` | `""` (raíz) | Subpath donde se sirve la app. Ej: `/evalua`. Se recompila al cambiar. |
| `KEY` | `evalua-dev-secret-key-256bits-minimum-aaaabbbbcccc` | Clave JWT HS256. **Mínimo 32 caracteres.** |
| `ALLOWED_HOSTS` | `http://localhost:3000` | Hosts permitidos para CORS (separados por coma). |
| `ID_PLATAFORMA` | `""` | Identificador de la plataforma (claim del JWT). |
| `TZ` | `UTC` | Zona horaria del contenedor. |
| `PORT` | `3000` | Puerto interno de Next.js. |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/evalua` | URI de MongoDB (preconfigurada para el mongo interno). |
| `REDIS_URL` | `redis://127.0.0.1:6379` | URI de Redis (preconfigurada para el redis interno). |

## Volúmenes

| Ruta | Contenido |
|---|---|
| `/data/db` | Datos de MongoDB |
| `/data/redis` | Datos de Redis (persistencia RDB) |

## Puerto

| Puerto | Servicio |
|---|---|
| `3000` | Next.js (App + API) |

## Primera ejecución

La primera vez que el contenedor inicia, compila Next.js. Esto toma ~30 segundos. Las siguientes ejecuciones usan el cache y son instantáneas.