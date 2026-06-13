<?php
/**
 * evalUA Demo — Home Page (Overview)
 * Matches EvalUA v3.0 maqueta design
 */

use yii\helpers\Url;

/** @var \yii\web\View $this */
/** @var string $evaluaUrl */
/** @var string $idPlataforma */

$this->title = 'Overview';
?>

<div class="min-h-screen flex flex-col">
    <!-- Hero Section -->
    <section class="hero-section">
        <div class="hero-orb hero-orb-1"></div>
        <div class="hero-orb hero-orb-2"></div>
        <div class="relative mx-auto max-w-5xl text-center">
            <span class="hero-pill">Sistema de Evaluación Curricular</span>
            <h1 class="hero-title">EvalUA <span class="hero-title-light">v3.0</span></h1>
            <p class="hero-subtitle">Sistema de Evaluación Curricular por Rúbricas</p>
            <p class="hero-description">Micro-frontend autocontenido que permite evaluar proyectos curriculares mediante rúbricas estructuradas, con privacidad zero-knowledge, reglas Gatekeeper de exclusión automática y caché L2 en Redis.</p>
        </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
        <div class="mx-auto max-w-6xl">
            <h2 class="section-title">Características Principales</h2>
            <p class="section-subtitle">Diseñado para la rigurosidad académica con la mejor experiencia de usuario</p>
            <div class="features-grid">
                <!-- Zero-Knowledge -->
                <div class="feature-card">
                    <div class="feature-icon" style="background-color:#EA760018">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EA7600" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path></svg>
                    </div>
                    <h3 class="feature-title">Zero-Knowledge Privacy</h3>
                    <p class="feature-desc">No se almacena ningún dato personal del estudiante. La evaluación es anónima y segura por diseño.</p>
                </div>

                <!-- Wizard -->
                <div class="feature-card">
                    <div class="feature-icon" style="background-color:#9DD4D318">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9DD4D3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4.1 12 6"></path><path d="m5.1 8-2.9-.8"></path><path d="m6 12-1.9 2"></path><path d="M7.2 2.2 8 5.1"></path><path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z"></path></svg>
                    </div>
                    <h3 class="feature-title">Wizard Interactivo</h3>
                    <p class="feature-desc">Flujo guiado paso a paso para evaluar cada criterio con descriptores claros y observaciones.</p>
                </div>

                <!-- Gatekeeper -->
                <div class="feature-card">
                    <div class="feature-icon" style="background-color:#C8102E18">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8102E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
                    </div>
                    <h3 class="feature-title">Gatekeeper</h3>
                    <p class="feature-desc">Regla de exclusión automática: si un criterio excluyente reprobado, la nota final es 1.0.</p>
                </div>

                <!-- Auto-save -->
                <div class="feature-card">
                    <div class="feature-icon" style="background-color:#19875418">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#198754" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path><path d="M7 3v4a1 1 0 0 0 1 1h7"></path></svg>
                    </div>
                    <h3 class="feature-title">Auto-save</h3>
                    <p class="feature-desc">Borradores guardados automáticamente en Redis cada 30 segundos. Nunca pierdes tu progreso.</p>
                </div>

                <!-- Caché L2 -->
                <div class="feature-card">
                    <div class="feature-icon" style="background-color:#EA760018">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EA7600" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg>
                    </div>
                    <h3 class="feature-title">Caché L2 Redis</h3>
                    <p class="feature-desc">Rúbricas y descriptores en caché con hit latency < 5 ms. Respuesta instantánea.</p>
                </div>

                <!-- Versión Inmutable -->
                <div class="feature-card">
                    <div class="feature-icon" style="background-color:#39404918">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#394049" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" x2="6" y1="3" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>
                    </div>
                    <h3 class="feature-title">Versión Inmutable</h3>
                    <p class="feature-desc">Cada rúbrica tiene versionado inmutable. Las evaluaciones referencian una versión específica.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Architecture Section -->
    <section class="architecture-section">
        <div class="mx-auto max-w-5xl">
            <h2 class="section-title">Arquitectura del Sistema</h2>
            <p class="section-subtitle">Flujo de datos desde el LMS host hasta la persistencia</p>
            <div class="arch-flow">
                <div class="arch-node">
                    <div class="arch-icon" style="background-color:#394049">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>
                    </div>
                    <span class="arch-label">Host (Yii2)</span>
                </div>
                <div class="arch-arrow">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </div>
                <div class="arch-node">
                    <div class="arch-icon" style="background-color:#EA7600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    </div>
                    <span class="arch-label">JWT</span>
                </div>
                <div class="arch-arrow">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </div>
                <div class="arch-node">
                    <div class="arch-icon" style="background-color:#EA7600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M3 9h18"></path><path d="M9 21V9"></path></svg>
                    </div>
                    <span class="arch-label">EvalUA Iframe</span>
                </div>
                <div class="arch-arrow">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </div>
                <div class="arch-node">
                    <div class="arch-icon" style="background-color:#C8102E">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg>
                    </div>
                    <span class="arch-label">Redis</span>
                </div>
                <div class="arch-arrow">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </div>
                <div class="arch-node">
                    <div class="arch-icon" style="background-color:#198754">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5V19A9 3 0 0 0 21 19V5"></path><path d="M3 12A9 3 0 0 0 21 12"></path></svg>
                    </div>
                    <span class="arch-label">MongoDB</span>
                </div>
            </div>
            <div class="arch-legend">
                <div class="legend-item">
                    <span class="legend-dot" style="background-color:#394049"></span>
                    Autenticación
                </div>
                <div class="legend-item">
                    <span class="legend-dot" style="background-color:#EA7600"></span>
                    Aplicación
                </div>
                <div class="legend-item">
                    <span class="legend-dot" style="background-color:#C8102E"></span>
                    Caché
                </div>
                <div class="legend-item">
                    <span class="legend-dot" style="background-color:#198754"></span>
                    Persistencia
                </div>
            </div>
        </div>
    </section>

    <!-- Tech Stack Section -->
    <section class="tech-section">
        <div class="mx-auto max-w-4xl text-center">
            <h2 class="section-title">Stack Tecnológico</h2>
            <p class="section-subtitle">Construido con tecnologías modernas y probadas en producción</p>
            <div class="tech-badges">
                <span class="tech-badge" style="background-color:#394049">Yii2 PHP</span>
                <span class="tech-badge" style="background-color:#EA7600">JWT HS256</span>
                <span class="tech-badge" style="background-color:#C8102E">postMessage</span>
                <span class="tech-badge" style="background-color:#2496ED">Docker</span>
                <span class="tech-badge" style="background-color:#EA7600">DDD</span>
                <span class="tech-badge" style="background-color:#3178C6">TypeScript</span>
                <span class="tech-badge" style="background-color:#47A248">MongoDB</span>
                <span class="tech-badge" style="background-color:#DC382D">Redis</span>
            </div>
        </div>
    </section>

    <!-- Info Bar -->
    <div class="info-bar-section">
        <div class="info-bar">
            <div class="info-item">
                <i class="fas fa-server"></i>
                <span>evalUA: <code><?= $evaluaUrl ?></code></span>
            </div>
            <div class="info-item">
                <i class="fas fa-fingerprint"></i>
                <span>ID Plataforma: <code><?= $idPlataforma ?></code></span>
            </div>
        </div>
    </div>
</div>