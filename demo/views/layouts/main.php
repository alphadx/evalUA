<?php
/**
 * evalUA Demo — Main Layout
 * Top navigation matching EvalUA v3.0 maqueta
 */

use yii\helpers\Html;
use yii\helpers\Url;

/** @var \yii\web\View $this */
/** @var string $content */

$currentPage = Yii::$app->controller->action->id;

$this->beginPage();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <?= Html::csrfMetaTags() ?>
    <title><?= Html::encode($this->title) ?> — EvalUA v3.0</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <?php $this->registerCssFile('@web/css/demo.css', ['depends' => []]); ?>
    <?php $this->head() ?>
</head>
<body>
<?php $this->beginBody() ?>

<div class="min-h-screen flex flex-col" style="background-color:#f9fafb">
    <!-- Main Header -->
    <header class="sticky top-0 z-40 border-b" style="background-color:#394049">
        <div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div class="flex items-center gap-3">
                <a href="<?= Url::to(['site/index']) ?>" class="flex items-center gap-3 cursor-pointer text-decoration-none">
                    <div class="flex size-8 items-center justify-center rounded-md text-sm font-bold text-white" style="background-color:#EA7600">E</div>
                    <span class="text-lg font-semibold text-white hidden sm:inline">EvalUA <span class="text-sm font-normal opacity-70">v3.0</span></span>
                </a>
                <div class="role-dropdown-wrapper" id="roleDropdown">
                    <button class="role-dropdown-btn" type="button" onclick="toggleRoleDropdown()" aria-haspopup="menu" aria-expanded="false">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#C8102E"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path></svg>
                        <span id="currentRoleLabel">Administrador</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="role-chevron" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                    </button>
                    <div class="role-dropdown-menu" id="roleDropdownMenu" role="menu">
                        <button class="role-dropdown-item role-dropdown-item-active" role="menuitem" data-role="ADMINISTRADOR" onclick="selectRole(this)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8102E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path></svg>
                            <span>Administrador</span>
                            <span class="role-check">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </span>
                        </button>
                        <button class="role-dropdown-item" role="menuitem" data-role="PROFESOR" onclick="selectRole(this)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            <span>Profesor</span>
                            <span class="role-check"></span>
                        </button>
                        <button class="role-dropdown-item" role="menuitem" data-role="ALUMNO" onclick="selectRole(this)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 6 3 6 3s3 0 6-3v-5"></path></svg>
                            <span>Alumno</span>
                            <span class="role-check"></span>
                        </button>
                        <button class="role-dropdown-item" role="menuitem" data-role="MANTENEDOR" onclick="selectRole(this)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#198754" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            <span>Mantenedor</span>
                            <span class="role-check"></span>
                        </button>
                    </div>
                </div>
            </div>
            <nav class="hidden md:flex items-center gap-1">
                <a href="<?= Url::to(['site/index']) ?>" class="nav-link <?= $currentPage === 'index' ? 'nav-link-active' : '' ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
                    <span class="hidden lg:inline">Overview</span>
                </a>
                <a href="<?= Url::to(['site/dashboard']) ?>" class="nav-link <?= $currentPage === 'dashboard' ? 'nav-link-active' : '' ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg>
                    <span class="hidden lg:inline">Dashboard</span>
                </a>
                <a href="<?= Url::to(['site/rubricas']) ?>" class="nav-link <?= $currentPage === 'rubricas' ? 'nav-link-active' : '' ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>
                    <span class="hidden lg:inline">Rúbricas</span>
                </a>
                <a href="<?= Url::to(['site/configurar']) ?>" class="nav-link <?= $currentPage === 'configurar' ? 'nav-link-active' : '' ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    <span class="hidden lg:inline">Configurar</span>
                </a>
                <a href="<?= Url::to(['site/evaluar']) ?>" class="nav-link <?= $currentPage === 'evaluar' ? 'nav-link-active' : '' ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"></path><path d="m14 7 3 3"></path><path d="M5 6v4"></path><path d="M19 14v4"></path><path d="M10 2v2"></path><path d="M7 8H3"></path><path d="M21 16h-4"></path><path d="M11 3H9"></path></svg>
                    <span class="hidden lg:inline">Wizard</span>
                </a>
                <a href="<?= Url::to(['site/resultado']) ?>" class="nav-link <?= $currentPage === 'resultado' ? 'nav-link-active' : '' ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path></svg>
                    <span class="hidden lg:inline">Resultados</span>
                </a>
                <a href="<?= Url::to(['site/ver-rubrica']) ?>" class="nav-link <?= $currentPage === 'ver-rubrica' ? 'nav-link-active' : '' ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    <span class="hidden lg:inline">Ver Rúbrica</span>
                </a>
            </nav>
            <div class="flex items-center gap-3">
                <span class="iframe-driven-badge hidden sm:flex">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    100% Iframe-Driven
                </span>
                <button class="mobile-menu-btn md:hidden" type="button" onclick="toggleMobileMenu()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
                </button>
                <span class="hidden sm:inline text-xs text-gray-500">EvalUA</span>
            </div>
        </div>
    </header>

    <!-- Sub Header / Breadcrumb -->
    <div class="border-b" style="background-color:#fffefd">
        <div class="mx-auto flex h-10 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div class="flex items-center gap-2">
                <span style="color:#EA7600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
                </span>
                <span class="text-sm font-semibold" style="color:#394049"><?= Html::encode($this->title) ?></span>
                <span class="text-xs text-gray-400">—</span>
                <span class="text-xs text-gray-500"><?php
                    $descriptions = [
                        'index' => 'Vista general del proyecto',
                        'evaluar' => 'Wizard de evaluación con rúbricas',
                        'resultado' => 'Visualización de resultados',
                        'rubricas' => 'CRUD de rúbricas con versionamiento',
                        'dashboard' => 'Métricas e historial de evaluaciones',
                        'configurar' => 'Configuración global del sistema',
                        'ver-rubrica' => 'Matriz de visualización de rúbrica',
                    ];
                    echo $descriptions[$currentPage] ?? 'Módulo evalUA';
                ?></span>
            </div>
            <div class="flex items-center gap-2">
                <span class="role-badge-header">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#C8102E"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path></svg>
                    Administrador
                </span>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <main class="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <?= $content ?>
    </main>

    <!-- Footer -->
    <footer class="mt-auto border-t px-4 py-4" style="background-color:#394049">
        <div class="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
            <p>© <?= date('Y') ?> EvalUA v3.0</p>
            <div class="flex items-center gap-4">
                <span>Yii2 Host + evalUA Micro-frontend</span>
                <span class="hidden sm:inline">|</span>
                <span class="hidden sm:inline">100% Iframe-Driven · Zero-Knowledge</span>
            </div>
        </div>
    </footer>
</div>

<!-- Mobile Menu -->
<div id="mobileMenu" class="mobile-menu" style="display:none">
    <nav class="mobile-nav">
        <a href="<?= Url::to(['site/index']) ?>" class="mobile-nav-item <?= $currentPage === 'index' ? 'active' : '' ?>">Overview</a>
        <a href="<?= Url::to(['site/dashboard']) ?>" class="mobile-nav-item <?= $currentPage === 'dashboard' ? 'active' : '' ?>">Dashboard</a>
        <a href="<?= Url::to(['site/rubricas']) ?>" class="mobile-nav-item <?= $currentPage === 'rubricas' ? 'active' : '' ?>">Rúbricas</a>
        <a href="<?= Url::to(['site/configurar']) ?>" class="mobile-nav-item <?= $currentPage === 'configurar' ? 'active' : '' ?>">Configurar</a>
        <a href="<?= Url::to(['site/evaluar']) ?>" class="mobile-nav-item <?= $currentPage === 'evaluar' ? 'active' : '' ?>">Wizard</a>
        <a href="<?= Url::to(['site/resultado']) ?>" class="mobile-nav-item <?= $currentPage === 'resultado' ? 'active' : '' ?>">Resultados</a>
        <a href="<?= Url::to(['site/ver-rubrica']) ?>" class="mobile-nav-item <?= $currentPage === 'ver-rubrica' ? 'active' : '' ?>">Ver Rúbrica</a>
    </nav>
</div>

<!-- Toast Container -->
<div id="toastContainer" class="toast-container"></div>

<script src="<?= Yii::$app->request->baseUrl ?>/js/evalua-bridge.js"></script>
<script>
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

// Role configuration: maps role -> { label, color, defaultPage, badgeClass, navHighlights }
var ROLE_CONFIG = {
    'ADMINISTRADOR': {
        label: 'Administrador',
        color: '#C8102E',
        defaultPage: 'dashboard',
        badgeClass: 'role-badge-header-admin',
        pages: ['index', 'dashboard', 'configurar', 'rubricas', 'evaluar', 'resultado']
    },
    'PROFESOR': {
        label: 'Profesor',
        color: '#3b82f6',
        defaultPage: 'evaluar',
        badgeClass: 'role-badge-header-profesor',
        pages: ['index', 'evaluar']
    },
    'ALUMNO': {
        label: 'Alumno',
        color: '#8b5cf6',
        defaultPage: 'resultado',
        badgeClass: 'role-badge-header-alumno',
        pages: ['index', 'resultado', 'ver-rubrica']
    },
    'MANTENEDOR': {
        label: 'Mantenedor',
        color: '#198754',
        defaultPage: 'rubricas',
        badgeClass: 'role-badge-header-mantenedor',
        pages: ['index', 'rubricas', 'evaluar']
    }
};

var PAGE_URLS = {
    'index': '<?= Url::to(["site/index"]) ?>',
    'dashboard': '<?= Url::to(["site/dashboard"]) ?>',
    'configurar': '<?= Url::to(["site/configurar"]) ?>',
    'rubricas': '<?= Url::to(["site/rubricas"]) ?>',
    'evaluar': '<?= Url::to(["site/evaluar"]) ?>',
    'resultado': '<?= Url::to(["site/resultado"]) ?>',
    'ver-rubrica': '<?= Url::to(["site/ver-rubrica"]) ?>'
};

var currentRole = sessionStorage.getItem('evalua_role') || 'ADMINISTRADOR';

// Role Dropdown
function toggleRoleDropdown() {
    var wrapper = document.getElementById('roleDropdown');
    var menu = document.getElementById('roleDropdownMenu');
    var btn = wrapper.querySelector('.role-dropdown-btn');
    var isOpen = wrapper.classList.contains('role-dropdown-open');
    
    if (isOpen) {
        closeRoleDropdown();
    } else {
        wrapper.classList.add('role-dropdown-open');
        menu.style.display = 'block';
        btn.setAttribute('aria-expanded', 'true');
    }
}

function closeRoleDropdown() {
    var wrapper = document.getElementById('roleDropdown');
    var menu = document.getElementById('roleDropdownMenu');
    var btn = wrapper.querySelector('.role-dropdown-btn');
    wrapper.classList.remove('role-dropdown-open');
    menu.style.display = 'none';
    btn.setAttribute('aria-expanded', 'false');
}

function selectRole(item) {
    var role = item.getAttribute('data-role');
    var label = item.querySelector('span:not(.role-check)').textContent;
    var config = ROLE_CONFIG[role];
    
    if (!config) return;
    
    // Store selected role
    currentRole = role;
    sessionStorage.setItem('evalua_role', role);
    
    // Update button label
    document.getElementById('currentRoleLabel').textContent = label;
    
    // Update shield icon color in button
    var shieldSvg = document.querySelector('.role-dropdown-btn svg[style*="color"]');
    if (shieldSvg) shieldSvg.style.color = config.color;
    
    // Update active states in dropdown
    document.querySelectorAll('.role-dropdown-item').forEach(function(el) {
        el.classList.remove('role-dropdown-item-active');
        el.querySelector('.role-check').innerHTML = '';
    });
    item.classList.add('role-dropdown-item-active');
    item.querySelector('.role-check').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    
    // Update sub-header role badge
    var headerBadge = document.querySelector('.role-badge-header');
    if (headerBadge) {
        headerBadge.style.background = config.color + '20';
        headerBadge.style.color = config.color;
        var headerShield = headerBadge.querySelector('svg');
        if (headerShield) headerShield.style.color = config.color;
        // Update text
        var badgeText = headerBadge.childNodes;
        for (var i = 0; i < badgeText.length; i++) {
            if (badgeText[i].nodeType === 3 && badgeText[i].textContent.trim()) {
                badgeText[i].textContent = '\n                    ' + label + '\n                ';
            }
        }
    }
    
    // Update nav link visibility based on role
    updateNavForRole(role, config);
    
    // Close dropdown
    closeRoleDropdown();
    
    // Show toast notification
    var toastFn = (typeof showToast === 'function') ? showToast : null;
    
    // Navigate to the default page for this role
    var currentPage = '<?= $currentPage ?>';
    var targetPage = config.defaultPage;
    
    if (config.pages.indexOf(currentPage) === -1) {
        // Current page not accessible for this role, navigate to default
        if (toastFn) {
            toastFn('warning', 'Rol cambiado a ' + label, 'Navegando a: ' + targetPage);
        }
        setTimeout(function() {
            window.location.href = PAGE_URLS[targetPage];
        }, 500);
    } else {
        // Current page is accessible, just update visuals
        if (toastFn) {
            toastFn('info', 'Rol cambiado a ' + label, 'Página actual accesible para este rol');
        }
        // Re-highlight current page nav link
        highlightCurrentNav(currentPage, config);
    }
}

function updateNavForRole(role, config) {
    // Map nav links to their pages
    var navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(function(link) {
        var href = link.getAttribute('href') || '';
        var pageName = '';
        
        // Extract page name from href
        if (href.indexOf('/index') !== -1 || href.endsWith('/') || href === '') {
            pageName = 'index';
        } else if (href.indexOf('/dashboard') !== -1) pageName = 'dashboard';
        else if (href.indexOf('/rubricas') !== -1) pageName = 'rubricas';
        else if (href.indexOf('/configurar') !== -1) pageName = 'configurar';
        else if (href.indexOf('/evaluar') !== -1) pageName = 'evaluar';
        else if (href.indexOf('/resultado') !== -1) pageName = 'resultado';
        else if (href.indexOf('/ver-rubrica') !== -1) pageName = 'ver-rubrica';
        
        if (config.pages.indexOf(pageName) !== -1) {
            // Page is accessible for this role
            link.style.opacity = '1';
            link.style.pointerEvents = 'auto';
        } else {
            // Page is not accessible
            link.style.opacity = '0.35';
            link.style.pointerEvents = 'none';
            link.classList.remove('nav-link-active');
        }
    });
    
    // Also update mobile nav
    document.querySelectorAll('.mobile-nav-item').forEach(function(item) {
        var href = item.getAttribute('href') || '';
        var pageName = '';
        if (href.indexOf('/index') !== -1 || href.endsWith('/')) pageName = 'index';
        else if (href.indexOf('/dashboard') !== -1) pageName = 'dashboard';
        else if (href.indexOf('/rubricas') !== -1) pageName = 'rubricas';
        else if (href.indexOf('/configurar') !== -1) pageName = 'configurar';
        else if (href.indexOf('/evaluar') !== -1) pageName = 'evaluar';
        else if (href.indexOf('/resultado') !== -1) pageName = 'resultado';
        else if (href.indexOf('/ver-rubrica') !== -1) pageName = 'ver-rubrica';
        
        if (config.pages.indexOf(pageName) !== -1) {
            item.style.opacity = '1';
            item.style.pointerEvents = 'auto';
        } else {
            item.style.opacity = '0.35';
            item.style.pointerEvents = 'none';
        }
    });
}

function highlightCurrentNav(currentPage, config) {
    document.querySelectorAll('.nav-link').forEach(function(link) {
        link.classList.remove('nav-link-active');
        var href = link.getAttribute('href') || '';
        var isActive = false;
        
        if (currentPage === 'index' && (href.endsWith('/') || href.indexOf('/index') !== -1)) isActive = true;
        else if (href.indexOf('/' + currentPage) !== -1) isActive = true;
        
        if (isActive) link.classList.add('nav-link-active');
    });
}

// Apply stored role on page load
document.addEventListener('DOMContentLoaded', function() {
    var config = ROLE_CONFIG[currentRole];
    if (config && currentRole !== 'ADMINISTRADOR') {
        // Update button label
        var labelEl = document.getElementById('currentRoleLabel');
        if (labelEl) labelEl.textContent = config.label;
        
        // Update dropdown active states
        document.querySelectorAll('.role-dropdown-item').forEach(function(el) {
            el.classList.remove('role-dropdown-item-active');
            var check = el.querySelector('.role-check');
            if (check) check.innerHTML = '';
            if (el.getAttribute('data-role') === currentRole) {
                el.classList.add('role-dropdown-item-active');
                if (check) check.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            }
        });
        
        // Update shield color
        var shieldSvg = document.querySelector('.role-dropdown-btn svg[style*="color"]');
        if (shieldSvg) shieldSvg.style.color = config.color;
        
        // Update sub-header badge
        var headerBadge = document.querySelector('.role-badge-header');
        if (headerBadge) {
            headerBadge.style.background = config.color + '20';
            headerBadge.style.color = config.color;
            var headerShield = headerBadge.querySelector('svg');
            if (headerShield) headerShield.style.color = config.color;
            var badgeText = headerBadge.childNodes;
            for (var i = 0; i < badgeText.length; i++) {
                if (badgeText[i].nodeType === 3 && badgeText[i].textContent.trim()) {
                    badgeText[i].textContent = '\n                    ' + config.label + '\n                ';
                }
            }
        }
        
        // Update nav visibility
        updateNavForRole(currentRole, config);
    }
});

// Close dropdown on outside click
document.addEventListener('click', function(e) {
    var wrapper = document.getElementById('roleDropdown');
    if (wrapper && !wrapper.contains(e.target) && wrapper.classList.contains('role-dropdown-open')) {
        closeRoleDropdown();
    }
});
</script>
<?php $this->endBody() ?>
</body>
</html>
<?php $this->endPage() ?>