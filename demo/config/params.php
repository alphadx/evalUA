<?php
/**
 * evalUA Demo — Application Parameters
 */

return [
    // evalUA Microservice URL (internal Docker network — for server-side API calls)
    'evalua.url' => getenv('EVALUA_URL') ?: 'http://evalua-app:3000',

    // evalUA Browser URL (reachable from the user's browser — for iframe src)
    'evalua.browser_url' => getenv('EVALUA_BROWSER_URL') ?: 'http://localhost:3000',

    // JWT Configuration
    'jwt.secret' => getenv('JWT_SECRET') ?: 'evalua-dev-secret-key-256bits-minimum-aaaabbbbcccc',
    'jwt.algorithm' => 'HS256',
    'jwt.issuer' => 'sistema-host',
    'jwt.audience' => 'evalua-microservice',
    'jwt.expiry' => 300, // 5 minutes

    // Platform identifier (must match evalUA's ID_PLATAFORMA env)
    'id_plataforma' => getenv('ID_PLATAFORMA') ?: 'PLATAFORMA_demo_evalUA',

    // Default demo rubrica ID (will be set after first rubric creation)
    'demo.rubrica_id' => '',
    'demo.evaluacion_id' => '',
    'demo.usuario_profesor' => 'profesor.demo',
    'demo.usuario_alumno' => 'alumno.demo',
    'demo.usuario_mantenedor' => 'mantenedor.demo',
    'demo.usuario_admin' => 'admin.demo',
];