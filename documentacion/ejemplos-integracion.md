# EvalUA v3.0 — Ejemplos de Integración por Framework

> **Lenguajes:** Python, PHP, Java, Node.js, C#  
> **Patrón:** Generar JWT → Embeber iframe / Consumir API REST  
> **Secret compartido:** El mismo KEY configurado en EvalUA

---

## Índice

1. [Python (Flask)](#1-python-flask)
2. [PHP (Laravel / Yii2)](#2-php-laravel--yii2)
3. [Java (Spring Boot)](#3-java-spring-boot)
4. [Node.js (Express)](#4-nodejs-express)
5. [C# (ASP.NET Core)](#5-c-aspnet-core)
6. [Ejemplo API REST directa (cualquier lenguaje)](#6-ejemplo-api-rest-directa)
7. [Generar evaluación_id desde el Host](#7-generar-evaluación_id-desde-el-host)

---

## 1. Python (Flask)

### Instalación

```bash
pip install flask PyJWT
```

### Código completo

```python
"""
evalUA Host Demo — Flask
Genera JWT y embebe el iframe de evalUA
"""

from flask import Flask, render_template_string, request, jsonify
import jwt
import time
import uuid

app = Flask(__name__)

# Configuración — debe coincidir con evalUA
EVALUA_URL = "http://localhost:3000"
JWT_SECRET = "evalua-dev-secret-key-256bits-minimum-aaaabbbbcccc"
ID_PLATAFORMA = "PLATAFORMA_demo_evalUA"


def generate_jwt(extra_claims: dict) -> str:
    """Genera un JWT HS256 para evalUA."""
    now = int(time.time())
    payload = {
        "iss": "sistema-host",
        "aud": "evalua-microservice",
        "iat": now,
        "exp": now + 300,  # 5 minutos
        "id_plataforma": ID_PLATAFORMA,
        **extra_claims,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


# ============================================================
# Vistas
# ============================================================

IFRAME_TEMPLATE = """
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>{{ title }} — evalUA Host</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .info { background: #394049; color: white; padding: 12px 20px; border-radius: 8px;
            margin-bottom: 16px; display: flex; gap: 20px; align-items: center; }
    .info .badge { background: #EA7600; padding: 4px 12px; border-radius: 20px;
                   font-size: 12px; font-weight: bold; }
    iframe { border: 0; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <div class="info">
    <span class="badge">{{ role }}</span>
    <span>{{ title }}</span>
    <span style="font-size:12px; opacity:0.7">JWT: {{ token[:50] }}...</span>
  </div>
  <iframe src="{{ iframe_url }}" width="1029" height="466" scrolling="no"></iframe>
  <script>
    window.addEventListener('message', (event) => {
      if (event.origin !== '{{ evalua_url }}') return;
      console.log('[evalUA]', event.data);
      if (event.data.type === 'EVALUA_EVALUACION_COMPLETADA') {
        alert('Nota: ' + event.data.data.notaFinal +
              (event.data.data.aprobada ? ' ✅ APROBADA' : ' ❌ REPROBADA'));
      }
    });
  </script>
</body>
</html>
"""


@app.route("/")
def index():
    """Página principal con navegación."""
    return """
    <h1>evalUA Host Demo (Flask/Python)</h1>
    <ul>
      <li><a href="/evaluar">Evaluar (PROFESOR)</a></li>
      <li><a href="/rubricas">Rúbricas (MANTENEDOR)</a></li>
      <li><a href="/dashboard">Dashboard (ADMINISTRADOR)</a></li>
      <li><a href="/resultado">Resultado (ALUMNO)</a></li>
    </ul>
    """


@app.route("/evaluar")
def evaluar():
    """Vista de evaluación — rol PROFESOR."""
    rubrica_id = request.args.get("rubrica_id", "")
    evaluacion_id = request.args.get("evaluacion_id", str(uuid.uuid4()))

    token = generate_jwt({
        "rol": "PROFESOR",
        "usuario_id": "profesor.demo",
        "rubrica_id": rubrica_id,
        "evaluacion_id": evaluacion_id,
    })

    iframe_url = f"{EVALUA_URL}/evaluar?jwt={token}"
    return render_template_string(
        IFRAME_TEMPLATE,
        title="Evaluar",
        role="PROFESOR",
        token=token,
        iframe_url=iframe_url,
        evalua_url=EVALUA_URL,
    )


@app.route("/rubricas")
def rubricas():
    """Vista de rúbricas — rol MANTENEDOR."""
    token = generate_jwt({
        "rol": "MANTENEDOR",
        "usuario_id": "mantenedor.demo",
        "rubricas_permitidas": ["*"],
    })

    iframe_url = f"{EVALUA_URL}/rubricas?jwt={token}"
    return render_template_string(
        IFRAME_TEMPLATE,
        title="Rúbricas",
        role="MANTENEDOR",
        token=token,
        iframe_url=iframe_url,
        evalua_url=EVALUA_URL,
    )


@app.route("/crear-rubrica")
def crear_rubrica():
    """Crear rúbrica directo (sin índice) — rol MANTENEDOR."""
    token = generate_jwt({
        "rol": "MANTENEDOR",
        "usuario_id": "mantenedor.demo",
        "rubricas_permitidas": ["*"],
    })

    # mode=crear abre el formulario directamente, sin pasar por la lista
    iframe_url = f"{EVALUA_URL}/rubricas?mode=crear&jwt={token}"
    return render_template_string(
        IFRAME_TEMPLATE,
        title="Crear Rúbrica",
        role="MANTENEDOR",
        token=token,
        iframe_url=iframe_url,
        evalua_url=EVALUA_URL,
    )


@app.route("/dashboard")
def dashboard():
    """Vista de dashboard — rol ADMINISTRADOR."""
    token = generate_jwt({
        "rol": "ADMINISTRADOR",
        "usuario_id": "admin.demo",
    })

    iframe_url = f"{EVALUA_URL}/dashboard?jwt={token}"
    return render_template_string(
        IFRAME_TEMPLATE,
        title="Dashboard",
        role="ADMINISTRADOR",
        token=token,
        iframe_url=iframe_url,
        evalua_url=EVALUA_URL,
    )


@app.route("/resultado")
def resultado():
    """Vista de resultado — rol ALUMNO."""
    evaluacion_id = request.args.get("evaluacion_id", "")

    token = generate_jwt({
        "rol": "ALUMNO",
        "usuario_id": "alumno.demo",
        "evaluacion_id": evaluacion_id,
    })

    iframe_url = f"{EVALUA_URL}/resultado?jwt={token}"
    return render_template_string(
        IFRAME_TEMPLATE,
        title="Resultado",
        role="ALUMNO",
        token=token,
        iframe_url=iframe_url,
        evalua_url=EVALUA_URL,
    )


# ============================================================
# API: Consumir evalUA REST directamente
# ============================================================

@app.route("/api/rubricas", methods=["GET"])
def api_listar_rubricas():
    """Proxy: listar rúbricas vía API de evalUA."""
    import requests

    token = generate_jwt({
        "rol": "MANTENEDOR",
        "usuario_id": "mantenedor.demo",
        "rubricas_permitidas": ["*"],
    })

    resp = requests.get(
        f"{EVALUA_URL}/api/rubricas",
        headers={"Authorization": f"Bearer {token}"},
        params={"esActiva": "true"},
    )
    return jsonify(resp.json())


@app.route("/api/rubricas", methods=["POST"])
def api_crear_rubrica():
    """Proxy: crear rúbrica vía API de evalUA."""
    import requests

    token = generate_jwt({
        "rol": "MANTENEDOR",
        "usuario_id": "mantenedor.demo",
        "rubricas_permitidas": ["*"],
    })

    resp = requests.post(
        f"{EVALUA_URL}/api/rubricas",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json=request.json,
    )
    return jsonify(resp.json()), resp.status_code


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
```

### Ejecución

```bash
python app.py
# Acceder a http://localhost:5000
```

---

## 2. PHP (Laravel / Yii2)

### Instalación

```bash
composer require firebase/php-jwt
```

### Helper: JwtService.php

```php
<?php
/**
 * evalUA JWT Service
 * Genera tokens HS256 para integración con evalUA
 */

namespace App\Services;

use Firebase\JWT\JWT;

class EvalUaJwtService
{
    private string $secret;
    private string $idPlataforma;
    private string $evaluaUrl;
    private string $issuer = 'sistema-host';
    private string $audience = 'evalua-microservice';
    private int $expiry = 300; // 5 minutos

    public function __construct()
    {
        $this->secret = env('EVALUA_JWT_SECRET', 'evalua-dev-secret-key-256bits-minimum-aaaabbbbcccc');
        $this->idPlataforma = env('EVALUA_ID_PLATAFORMA', 'PLATAFORMA_demo_evalUA');
        $this->evaluaUrl = env('EVALUA_URL', 'http://localhost:3000');
    }

    /**
     * Genera un JWT para evalUA
     */
    public function generateToken(array $claims): string
    {
        $now = time();

        $payload = array_merge([
            'iss' => $this->issuer,
            'aud' => $this->audience,
            'iat' => $now,
            'exp' => $now + $this->expiry,
            'id_plataforma' => $this->idPlataforma,
        ], $claims);

        return JWT::encode($payload, $this->secret, 'HS256');
    }

    /**
     * Genera URL completa para iframe
     */
    public function getIframeUrl(string $route, array $claims): string
    {
        $token = $this->generateToken($claims);
        return "{$this->evaluaUrl}{$route}?jwt={$token}";
    }

    // ============================================================
    // Métodos de conveniencia por rol
    // ============================================================

    public function profesorToken(string $usuarioId, string $rubricaId, ?string $evaluacionId = null): string
    {
        $claims = [
            'rol' => 'PROFESOR',
            'usuario_id' => $usuarioId,
            'rubrica_id' => $rubricaId,
        ];
        if ($evaluacionId) {
            $claims['evaluacion_id'] = $evaluacionId;
        }
        return $this->generateToken($claims);
    }

    public function alumnoToken(string $usuarioId, string $evaluacionId): string
    {
        return $this->generateToken([
            'rol' => 'ALUMNO',
            'usuario_id' => $usuarioId,
            'evaluacion_id' => $evaluacionId,
        ]);
    }

    public function mantenedorToken(string $usuarioId, array $rubricasPermitidas = ['*']): string
    {
        return $this->generateToken([
            'rol' => 'MANTENEDOR',
            'usuario_id' => $usuarioId,
            'rubricas_permitidas' => $rubricasPermitidas,
        ]);
    }

    public function adminToken(string $usuarioId): string
    {
        return $this->generateToken([
            'rol' => 'ADMINISTRADOR',
            'usuario_id' => $usuarioId,
        ]);
    }
}
```

### Uso en Laravel Controller

```php
<?php

namespace App\Http\Controllers;

use App\Services\EvalUaJwtService;
use Illuminate\Http\Request;

class EvalUAController extends Controller
{
    private EvalUaJwtService $evalua;

    public function __construct(EvalUaJwtService $evalua)
    {
        $this->evalua = $evalua;
    }

    /**
     * Vista de evaluación para un profesor
     */
    public function evaluar(Request $request)
    {
        $rubricaId = $request->query('rubrica_id', '');
        $evaluacionId = $request->query('evaluacion_id');

        $iframeUrl = $this->evalua->getIframeUrl('/evaluar', [
            'rol' => 'PROFESOR',
            'usuario_id' => auth()->id(),
            'rubrica_id' => $rubricaId,
            'evaluacion_id' => $evaluacionId,
        ]);

        return view('evalua.evaluar', [
            'iframeUrl' => $iframeUrl,
            'evaluaUrl' => config('evalua.url'),
        ]);
    }

    /**
     * Vista de resultado para un alumno
     */
    public function resultado(Request $request)
    {
        $evaluacionId = $request->query('evaluacion_id');

        $iframeUrl = $this->evalua->getIframeUrl('/resultado', [
            'rol' => 'ALUMNO',
            'usuario_id' => auth()->id(),
            'evaluacion_id' => $evaluacionId,
        ]);

        return view('evalua.resultado', [
            'iframeUrl' => $iframeUrl,
            'evaluaUrl' => config('evalua.url'),
        ]);
    }
}
```

### Blade Template (evalua/evaluar.blade.php)

```html
@extends('layouts.app')

@section('content')
<div class="container">
    <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
            <h5>Evaluación</h5>
            <span class="badge bg-warning">PROFESOR</span>
        </div>
        <div class="card-body p-0">
            <iframe
                src="{{ $iframeUrl }}"
                width="1029"
                height="466"
                style="width:1029px;height:466px;border:0;overflow:hidden"
                scrolling="no"
                allow="clipboard-read;clipboard-write"
            ></iframe>
        </div>
    </div>
</div>

<script>
window.addEventListener('message', (event) => {
    if (event.origin !== '{{ $evaluaUrl }}') return;
    if (event.data.type === 'EVALUA_EVALUACION_COMPLETADA') {
        console.log('Nota:', event.data.data.notaFinal);
    }
});
</script>
@endsection
```

### Consumir API REST desde PHP

```php
<?php
/**
 * Ejemplo: consumir la API de evalUA desde PHP
 */

$jwtService = new \App\Services\EvalUaJwtService();
$token = $jwtService->mantenedorToken('mantenedor.demo');

// Listar rúbricas
$ch = curl_init('http://evalua-app:3000/api/rubricas?esActiva=true');
curl_setopt_array($ch, [
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer {$token}",
        "Content-Type: application/json",
    ],
    CURLOPT_RETURNTRANSFER => true,
]);

$response = json_decode(curl_exec($ch), true);
curl_close($ch);

// Crear rúbrica
$token = $jwtService->mantenedorToken('mantenedor.demo');

$ch = curl_init('http://evalua-app:3000/api/rubricas');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer {$token}",
        "Content-Type: application/json",
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'titulo' => 'Rúbrica desde PHP',
        'notaAprobacion' => 4.0,
        'criterios' => [
            [
                'nombre' => 'Contenido',
                'ponderacion' => 0.6,
                'tipo' => 'ESTRUCTURAL',
                'descriptores' => [],
            ],
            [
                'nombre' => 'Forma',
                'ponderacion' => 0.4,
                'tipo' => 'ESTRUCTURAL',
                'descriptores' => [],
            ],
        ],
    ]),
    CURLOPT_RETURNTRANSFER => true,
]);

$response = json_decode(curl_exec($ch), true);
curl_close($ch);
```

---

## 3. Java (Spring Boot)

### Dependencias (pom.xml)

```xml
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.6</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
```

### Servicio: EvalUaJwtService.java

```java
package com.host.evalua;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class EvalUaJwtService {

    @Value("${evalua.jwt-secret}")
    private String secret;

    @Value("${evalua.id-plataforma}")
    private String idPlataforma;

    @Value("${evalua.url}")
    private String evaluaUrl;

    private static final String ISSUER = "sistema-host";
    private static final String AUDIENCE = "evalua-microservice";
    private static final int EXPIRY_SECONDS = 300;

    /**
     * Genera un JWT HS256 para evalUA
     */
    public String generateToken(Map<String, Object> claims) {
        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        Date now = new Date();
        Date expiry = new Date(now.getTime() + EXPIRY_SECONDS * 1000L);

        return Jwts.builder()
                .issuer(ISSUER)
                .audience().add(AUDIENCE).and()
                .id(idPlataforma)
                .issuedAt(now)
                .expiration(expiry)
                .claims(claims)
                .signWith(key)
                .compact();
    }

    /**
     * Genera URL completa para iframe
     */
    public String getIframeUrl(String route, Map<String, Object> claims) {
        String token = generateToken(claims);
        return evaluaUrl + route + "?jwt=" + token;
    }

    // ============================================================
    // Métodos de conveniencia
    // ============================================================

    public String profesorToken(String usuarioId, String rubricaId) {
        return generateToken(Map.of(
                "rol", "PROFESOR",
                "usuario_id", usuarioId,
                "rubrica_id", rubricaId
        ));
    }

    public String alumnoToken(String usuarioId, String evaluacionId) {
        return generateToken(Map.of(
                "rol", "ALUMNO",
                "usuario_id", usuarioId,
                "evaluacion_id", evaluacionId
        ));
    }

    public String mantenedorToken(String usuarioId) {
        return generateToken(Map.of(
                "rol", "MANTENEDOR",
                "usuario_id", usuarioId,
                "rubricas_permitidas", List.of("*")
        ));
    }

    public String adminToken(String usuarioId) {
        return generateToken(Map.of(
                "rol", "ADMINISTRADOR",
                "usuario_id", usuarioId
        ));
    }
}
```

### Controller: EvalUaController.java

```java
package com.host.evalua;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Map;
import java.util.UUID;

@Controller
public class EvalUaController {

    private final EvalUaJwtService evaluaJwt;

    public EvalUaController(EvalUaJwtService evaluaJwt) {
        this.evaluaJwt = evaluaJwt;
    }

    @GetMapping("/evaluar")
    public String evaluar(
            @RequestParam(required = false) String rubricaId,
            @RequestParam(required = false) String evaluacionId,
            Model model) {

        if (evaluacionId == null) evaluacionId = UUID.randomUUID().toString();

        Map<String, Object> claims = Map.of(
                "rol", "PROFESOR",
                "usuario_id", "profesor.demo",
                "rubrica_id", rubricaId != null ? rubricaId : "",
                "evaluacion_id", evaluacionId
        );

        model.addAttribute("iframeUrl", evaluaJwt.getIframeUrl("/evaluar", claims));
        model.addAttribute("role", "PROFESOR");
        return "evalua/iframe";
    }

    @GetMapping("/resultado")
    public String resultado(
            @RequestParam String evaluacionId,
            Model model) {

        Map<String, Object> claims = Map.of(
                "rol", "ALUMNO",
                "usuario_id", "alumno.demo",
                "evaluacion_id", evaluacionId
        );

        model.addAttribute("iframeUrl", evaluaJwt.getIframeUrl("/resultado", claims));
        model.addAttribute("role", "ALUMNO");
        return "evalua/iframe";
    }
}
```

### Thymeleaf Template (evalua/iframe.html)

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <title>evalUA — Host</title>
</head>
<body>
    <div style="background:#394049;color:white;padding:12px 20px;border-radius:8px;margin-bottom:16px">
        <span th:text="${role}" style="background:#EA7600;padding:4px 12px;border-radius:20px;font-size:12px"></span>
    </div>
    <iframe
        th:src="${iframeUrl}"
        width="1029"
        height="466"
        style="border:0;overflow:hidden"
        scrolling="no"
    ></iframe>
</body>
</html>
```

### Consumir API REST desde Java

```java
import java.net.http.*;
import java.net.URI;

// Crear rúbrica vía API
String token = evaluaJwt.mantenedorToken("mantenedor.demo");

String body = """
    {
      "titulo": "Rúbrica desde Java",
      "criterios": [
        {"nombre": "Contenido", "ponderacion": 0.6, "tipo": "ESTRUCTURAL", "descriptores": []},
        {"nombre": "Forma", "ponderacion": 0.4, "tipo": "ESTRUCTURAL", "descriptores": []}
      ]
    }
    """;

HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create("http://localhost:3000/api/rubricas"))
        .header("Authorization", "Bearer " + token)
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(body))
        .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());
```

---

## 4. Node.js (Express)

### Instalación

```bash
npm install express jsonwebtoken axios
```

### Código completo

```javascript
/**
 * evalUA Host Demo — Express/Node.js
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { randomUUID } = require('crypto');

const app = express();
app.use(express.json());

// Configuración — debe coincidir con evalUA
const EVALUA_URL = 'http://localhost:3000';
const JWT_SECRET = 'evalua-dev-secret-key-256bits-minimum-aaaabbbbcccc';
const ID_PLATAFORMA = 'PLATAFORMA_demo_evalUA';

// ============================================================
// Helpers
// ============================================================

function generateJwt(claims) {
  return jwt.sign(
    {
      iss: 'sistema-host',
      aud: 'evalua-microservice',
      id_plataforma: ID_PLATAFORMA,
      ...claims,
    },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '5m' }
  );
}

function getIframeHtml(title, role, iframeUrl, evaluaUrl) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${title} — evalUA Host</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .info { background: #394049; color: white; padding: 12px 20px; border-radius: 8px;
            margin-bottom: 16px; display: flex; gap: 20px; align-items: center; }
    .badge { background: #EA7600; padding: 4px 12px; border-radius: 20px;
             font-size: 12px; font-weight: bold; color: white; }
    iframe { border: 0; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <div class="info">
    <span class="badge">${role}</span>
    <span>${title}</span>
  </div>
  <iframe src="${iframeUrl}" width="1029" height="466" scrolling="no"
    style="border:0;overflow:hidden"></iframe>
  <script>
    window.addEventListener('message', (event) => {
      if (event.origin !== '${evaluaUrl}') return;
      console.log('[evalUA]', event.data);
    });
  </script>
</body>
</html>`;
}

// ============================================================
// Rutas — Vistas iframe
// ============================================================

app.get('/', (req, res) => {
  res.send(`
    <h1>evalUA Host Demo (Node.js/Express)</h1>
    <ul>
      <li><a href="/evaluar">Evaluar (PROFESOR)</a></li>
      <li><a href="/rubricas">Rúbricas (MANTENEDOR)</a></li>
      <li><a href="/dashboard">Dashboard (ADMINISTRADOR)</a></li>
      <li><a href="/resultado?evaluacion_id=UUID">Resultado (ALUMNO)</a></li>
    </ul>
  `);
});

app.get('/evaluar', (req, res) => {
  const evaluacionId = req.query.evaluacion_id || randomUUID();
  const rubricaId = req.query.rubrica_id || '';

  const token = generateJwt({
    rol: 'PROFESOR',
    usuario_id: 'profesor.demo',
    rubrica_id: rubricaId,
    evaluacion_id: evaluacionId,
  });

  const iframeUrl = `${EVALUA_URL}/evaluar?jwt=${token}`;
  res.send(getIframeHtml('Evaluar', 'PROFESOR', iframeUrl, EVALUA_URL));
});

app.get('/rubricas', (req, res) => {
  const token = generateJwt({
    rol: 'MANTENEDOR',
    usuario_id: 'mantenedor.demo',
    rubricas_permitidas: ['*'],
  });

  const iframeUrl = `${EVALUA_URL}/rubricas?jwt=${token}`;
  res.send(getIframeHtml('Rúbricas', 'MANTENEDOR', iframeUrl, EVALUA_URL));
});

app.get('/crear-rubrica', (req, res) => {
  const token = generateJwt({
    rol: 'MANTENEDOR',
    usuario_id: 'mantenedor.demo',
    rubricas_permitidas: ['*'],
  });

  // mode=crear abre el formulario directamente, sin pasar por la lista
  const iframeUrl = `${EVALUA_URL}/rubricas?mode=crear&jwt=${token}`;
  res.send(getIframeHtml('Crear Rúbrica', 'MANTENEDOR', iframeUrl, EVALUA_URL));
});

app.get('/dashboard', (req, res) => {
  const token = generateJwt({
    rol: 'ADMINISTRADOR',
    usuario_id: 'admin.demo',
  });

  const iframeUrl = `${EVALUA_URL}/dashboard?jwt=${token}`;
  res.send(getIframeHtml('Dashboard', 'ADMINISTRADOR', iframeUrl, EVALUA_URL));
});

app.get('/resultado', (req, res) => {
  const evaluacionId = req.query.evaluacion_id || '';

  const token = generateJwt({
    rol: 'ALUMNO',
    usuario_id: 'alumno.demo',
    evaluacion_id: evaluacionId,
  });

  const iframeUrl = `${EVALUA_URL}/resultado?jwt=${token}`;
  res.send(getIframeHtml('Resultado', 'ALUMNO', iframeUrl, EVALUA_URL));
});

// ============================================================
// Proxy API — Consumir evalUA REST
// ============================================================

app.get('/api/rubricas', async (req, res) => {
  const token = generateJwt({
    rol: 'MANTENEDOR',
    usuario_id: 'mantenedor.demo',
    rubricas_permitidas: ['*'],
  });

  const response = await axios.get(`${EVALUA_URL}/api/rubricas`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { esActiva: req.query.esActiva },
  });

  res.json(response.data);
});

app.post('/api/rubricas', async (req, res) => {
  const token = generateJwt({
    rol: 'MANTENEDOR',
    usuario_id: 'mantenedor.demo',
    rubricas_permitidas: ['*'],
  });

  try {
    const response = await axios.post(`${EVALUA_URL}/api/rubricas`, req.body, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Error' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Host demo running at http://localhost:${PORT}`);
});
```

### Ejecución

```bash
node server.js
# Acceder a http://localhost:5000
```

---

## 5. C# (ASP.NET Core)

### Paquetes NuGet

```bash
dotnet add package System.IdentityModel.Tokens.Jwt
dotnet add package Microsoft.IdentityModel.Tokens
```

### Servicio: EvalUaJwtService.cs

```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Host.Services;

public class EvalUaJwtService
{
    private readonly string _secret;
    private readonly string _idPlataforma;
    private readonly string _evaluaUrl;

    public EvalUaJwtService(IConfiguration config)
    {
        _secret = config["EvalUA:JwtSecret"]
            ?? "evalua-dev-secret-key-256bits-minimum-aaaabbbbcccc";
        _idPlataforma = config["EvalUA:IdPlataforma"]
            ?? "PLATAFORMA_demo_evalUA";
        _evaluaUrl = config["EvalUA:Url"]
            ?? "http://localhost:3000";
    }

    /// <summary>
    /// Genera un JWT HS256 para evalUA
    /// </summary>
    public string GenerateToken(Dictionary<string, string> claims)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var jwtClaims = new List<Claim>
        {
            new("iss", "sistema-host"),
            new("aud", "evalua-microservice"),
            new("id_plataforma", _idPlataforma),
        };

        foreach (var kvp in claims)
        {
            jwtClaims.Add(new Claim(kvp.Key, kvp.Value));
        }

        var token = new JwtSecurityToken(
            claims: jwtClaims,
            expires: DateTime.UtcNow.AddMinutes(5),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// Genera URL completa para iframe
    /// </summary>
    public string GetIframeUrl(string route, Dictionary<string, string> claims)
    {
        var token = GenerateToken(claims);
        return $"{_evaluaUrl}{route}?jwt={token}";
    }

    public string GetEvaluaUrl() => _evaluaUrl;

    // ============================================================
    // Métodos de conveniencia
    // ============================================================

    public string ProfesorToken(string usuarioId, string rubricaId,
        string? evaluacionId = null)
    {
        var claims = new Dictionary<string, string>
        {
            ["rol"] = "PROFESOR",
            ["usuario_id"] = usuarioId,
            ["rubrica_id"] = rubricaId,
        };
        if (evaluacionId != null)
            claims["evaluacion_id"] = evaluacionId;

        return GenerateToken(claims);
    }

    public string AlumnoToken(string usuarioId, string evaluacionId)
    {
        return GenerateToken(new Dictionary<string, string>
        {
            ["rol"] = "ALUMNO",
            ["usuario_id"] = usuarioId,
            ["evaluacion_id"] = evaluacionId,
        });
    }

    public string MantenedorToken(string usuarioId)
    {
        return GenerateToken(new Dictionary<string, string>
        {
            ["rol"] = "MANTENEDOR",
            ["usuario_id"] = usuarioId,
            ["rubricas_permitidas"] = "*",  // Nota: esto es simplificado
        });
    }

    public string AdminToken(string usuarioId)
    {
        return GenerateToken(new Dictionary<string, string>
        {
            ["rol"] = "ADMINISTRADOR",
            ["usuario_id"] = usuarioId,
        });
    }
}
```

### Controller: EvalUaController.cs

```csharp
using Host.Services;
using Microsoft.AspNetCore.Mvc;

namespace Host.Controllers;

public class EvalUaController : Controller
{
    private readonly EvalUaJwtService _evalua;

    public EvalUaController(EvalUaJwtService evalua)
    {
        _evalua = evalua;
    }

    [HttpGet("/evaluar")]
    public IActionResult Evaluar(
        [FromQuery] string? rubricaId,
        [FromQuery] string? evaluacionId)
    {
        evaluacionId ??= Guid.NewGuid().ToString();

        var claims = new Dictionary<string, string>
        {
            ["rol"] = "PROFESOR",
            ["usuario_id"] = "profesor.demo",
            ["rubrica_id"] = rubricaId ?? "",
            ["evaluacion_id"] = evaluacionId,
        };

        ViewBag.IframeUrl = _evalua.GetIframeUrl("/evaluar", claims);
        ViewBag.Role = "PROFESOR";
        ViewBag.EvaluaUrl = _evalua.GetEvaluaUrl();
        return View("Iframe");
    }

    [HttpGet("/resultado")]
    public IActionResult Resultado([FromQuery] string evaluacionId)
    {
        var claims = new Dictionary<string, string>
        {
            ["rol"] = "ALUMNO",
            ["usuario_id"] = "alumno.demo",
            ["evaluacion_id"] = evaluacionId,
        };

        ViewBag.IframeUrl = _evalua.GetIframeUrl("/resultado", claims);
        ViewBag.Role = "ALUMNO";
        ViewBag.EvaluaUrl = _evalua.GetEvaluaUrl();
        return View("Iframe");
    }
}
```

### Razor View (Views/EvalUa/Iframe.cshtml)

```html
@{
    ViewData["Title"] = "evalUA";
}

<div style="background:#394049;color:white;padding:12px 20px;border-radius:8px;margin-bottom:16px;display:flex;gap:20px;align-items:center">
    <span style="background:#EA7600;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:bold">
        @ViewBag.Role
    </span>
    <span>evalUA</span>
</div>

<iframe
    src="@ViewBag.IframeUrl"
    width="1029"
    height="466"
    style="border:0;overflow:hidden;border-radius:8px"
    scrolling="no"
    allow="clipboard-read;clipboard-write"
></iframe>

<script>
    window.addEventListener('message', (event) => {
        if (event.origin !== '@ViewBag.EvaluaUrl') return;
        console.log('[evalUA]', event.data);
    });
</script>
```

### Program.cs (registro del servicio)

```csharp
using Host.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();
builder.Services.AddSingleton<EvalUaJwtService>();

var app = builder.Build();

app.UseStaticFiles();
app.UseRouting();
app.MapControllerRoute("default", "{controller=Home}/{action=Index}/{id?}");

app.Run();
```

---

## 6. Ejemplo API REST directa

Sin iframe, consumiendo la API directamente desde cualquier lenguaje:

### Flujo completo con curl

```bash
# 1. Configuración
EVALUA="http://localhost:3000"
SECRET="evalua-dev-secret-key-256bits-minimum-aaaabbbbcccc"

# 2. Generar JWT (usando Node.js como ejemplo)
TOKEN=$(node -e "
  const jwt = require('jsonwebtoken');
  console.log(jwt.sign({
    iss: 'sistema-host',
    aud: 'evalua-microservice',
    id_plataforma: 'PLATAFORMA_demo_evalUA',
    rol: 'MANTENEDOR',
    usuario_id: 'api.demo',
    rubricas_permitidas: ['*']
  }, '$SECRET', { algorithm: 'HS256', expiresIn: '5m' }));
")

# 3. Crear rúbrica
RUBRICA=$(curl -s -X POST "$EVALUA/api/rubricas" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Rúbrica API Demo",
    "criterios": [
      {"nombre":"Contenido","ponderacion":0.6,"tipo":"ESTRUCTURAL","descriptores":[]},
      {"nombre":"Forma","ponderacion":0.4,"tipo":"ESTRUCTURAL","descriptores":[]}
    ]
  }')

echo "Rúbrica creada: $RUBRICA"

# 4. Extraer ID
RUBRICA_ID=$(echo $RUBRICA | python -c "import sys,json; print(json.load(sys.stdin)['data']['_id'])")

# 5. Listar rúbricas
curl -s -H "Authorization: Bearer $TOKEN" "$EVALUA/api/rubricas?esActiva=true" | python -m json.tool

# 6. Obtener rúbrica específica
curl -s -H "Authorization: Bearer $TOKEN" "$EVALUA/api/rubricas/$RUBRICA_ID" | python -m json.tool
```

---

## 7. Generar evaluacion_id desde el Host

El Host puede generar el `evaluacion_id` para mantener el control del ciclo de vida:

### Patrón recomendado

```python
# 1. El Host genera un UUID para la evaluación
evaluacion_id = str(uuid.uuid4())

# 2. El Host guarda en SU base de datos la relación:
#    evaluacion_id ↔ alumno_id ↔ tarea_id ↔ rubrica_id
db.save({
    "evaluacion_id": evaluacion_id,
    "alumno_id": "alum.001",
    "tarea_id": "tarea.042",
    "rubrica_id": rubrica_id,
    "estado": "en_progreso"
})

# 3. El Host genera JWT del PROFESOR con el evaluacion_id
token_profesor = generate_jwt({
    "rol": "PROFESOR",
    "usuario_id": "prof.001",
    "rubrica_id": rubrica_id,
    "evaluacion_id": evaluacion_id,
})
# El profesor evalúa usando este token

# 4. Cuando el profesor termina, el Host genera JWT del ALUMNO
token_alumno = generate_jwt({
    "rol": "ALUMNO",
    "usuario_id": "alum.001",
    "evaluacion_id": evaluacion_id,
})
# El alumno ve su resultado usando este token
```

### Con postMessage (alternativa)

```javascript
// El Host escucha cuando la evaluación se completa
window.addEventListener('message', (event) => {
  if (event.origin !== 'http://localhost:3000') return;

  if (event.data.type === 'EVALUA_EVALUACION_COMPLETADA') {
    const { evaluacionId, notaFinal, aprobada } = event.data.data;

    // Guardar en la BD del Host
    fetch('/api/evaluaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        evaluacion_id: evaluacionId,
        nota_final: notaFinal,
        aprobada: aprobada,
      }),
    });
  }
});