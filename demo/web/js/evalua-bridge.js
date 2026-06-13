/**
 * evalUA Demo — PostMessage Bridge
 * Handles communication between evalUA iframe and host application
 */

(function () {
    'use strict';

    // --- Event Log Panel ---
    const eventLog = document.getElementById('eventLog');
    const btnClearLog = document.getElementById('btnClearLog');
    const toastContainer = document.getElementById('toastContainer');

    if (btnClearLog) {
        btnClearLog.addEventListener('click', function () {
            eventLog.innerHTML = '';
            addLogEntry('info', 'Log limpiado');
        });
    }

    function getTimeStr() {
        const now = new Date();
        return now.toLocaleTimeString('es-CL', { hour12: false });
    }

    function addLogEntry(level, message, data) {
        if (!eventLog) return;

        const entry = document.createElement('div');
        entry.className = 'log-entry log-' + level;

        const badgeClass = {
            ready: 'badge-ready',
            completed: 'badge-completed',
            reviewing: 'badge-reviewing',
            created: 'badge-created',
            updated: 'badge-updated',
            error: 'badge-error',
            info: 'badge-info',
        }[level] || 'badge-info';

        let html = '<span class="log-time">' + getTimeStr() + '</span>';
        html += '<span class="log-badge ' + badgeClass + '">' + level.toUpperCase() + '</span>';
        html += '<span class="log-msg">' + escapeHtml(message) + '</span>';

        if (data) {
            html += '<pre class="log-data">' + escapeHtml(JSON.stringify(data, null, 2)) + '</pre>';
        }

        entry.innerHTML = html;
        eventLog.appendChild(entry);
        eventLog.scrollTop = eventLog.scrollHeight;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    // --- Toast Notifications ---
    function showToast(type, title, message) {
        if (!toastContainer) return;

        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-times-circle',
            info: 'fas fa-info-circle',
            warning: 'fas fa-exclamation-triangle',
        };

        const toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.innerHTML =
            '<div class="toast-icon"><i class="' + (iconMap[type] || iconMap.info) + '"></i></div>' +
            '<div class="toast-body">' +
            '<strong>' + escapeHtml(title) + '</strong>' +
            '<p>' + escapeHtml(message) + '</p>' +
            '</div>' +
            '<button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>';

        toastContainer.appendChild(toast);

        // Auto-remove after 5s
        setTimeout(function () {
            if (toast.parentElement) {
                toast.classList.add('toast-fade-out');
                setTimeout(function () {
                    if (toast.parentElement) toast.remove();
                }, 300);
            }
        }, 5000);
    }

    // --- PostMessage Handler ---
    const EXPECTED_ORIGIN = window.location.origin;
    const EVALUA_EVENT_TYPES = [
        'evalua.ready',
        'evalua.evaluation.reviewing',
        'evalua.evaluation.completed',
        'evalua.rubrica.created',
        'evalua.config.updated',
        'evalua.error',
    ];

    window.addEventListener('message', function (event) {
        // Parse message data
        let data;
        try {
            data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        } catch (e) {
            // Not a JSON message, ignore
            return;
        }

        // Validate source
        if (!data || data.source !== 'evalua') return;

        // Validate type
        if (!EVALUA_EVENT_TYPES.includes(data.type)) return;

        // Process event by type
        switch (data.type) {
            case 'evalua.ready':
                handleReady(data.payload);
                break;
            case 'evalua.evaluation.reviewing':
                handleReviewing(data.payload);
                break;
            case 'evalua.evaluation.completed':
                handleCompleted(data.payload);
                break;
            case 'evalua.rubrica.created':
                handleRubricaCreated(data.payload);
                break;
            case 'evalua.config.updated':
                handleConfigUpdated(data.payload);
                break;
            case 'evalua.error':
                handleError(data.payload);
                break;
        }
    });

    // --- Event Handlers ---
    function handleReady(payload) {
        addLogEntry('ready', 'evalUA listo para operar', payload);
        showToast('success', 'evalUA Listo', 'El iframe se ha inicializado correctamente');

        // Hide loading overlay
        const overlay = document.getElementById('iframeOverlay');
        if (overlay) overlay.style.display = 'none';

        // Update status dot
        const statusDot = document.querySelector('.status-dot');
        if (statusDot) statusDot.classList.add('connected');
    }

    function handleReviewing(payload) {
        const nota = payload.notaProvisional || '?';
        addLogEntry('reviewing', 'Evaluación en revisión — Nota provisional: ' + nota, payload);
        showToast('info', 'En Revisión', 'Nota provisional: ' + nota + ' — Estado: ' + (payload.estado || 'EN_REVISION'));
    }

    function handleCompleted(payload) {
        addLogEntry('completed', 'Evaluación finalizada: ' + (payload.evaluacionId || ''), payload);
        showToast('success', 'Evaluación Completada', 'ID: ' + (payload.evaluacionId || 'N/A'));

        // Store evaluacion ID for potential result viewing
        if (payload.evaluacionId) {
            sessionStorage.setItem('last_evaluacion_id', payload.evaluacionId);
        }
    }

    function handleRubricaCreated(payload) {
        addLogEntry('created', 'Rúbrica creada: ' + (payload.titulo || payload.rubricaId || ''), payload);
        showToast('success', 'Rúbrica Creada', '"' + (payload.titulo || 'N/A') + '" — ID: ' + (payload.rubricaId || 'N/A'));

        // Store rubrica ID for evaluation use
        if (payload.rubricaId) {
            sessionStorage.setItem('last_rubrica_id', payload.rubricaId);
        }
    }

    function handleConfigUpdated(payload) {
        addLogEntry('updated', 'Config actualizada: ' + (payload.clave || ''), payload);
        showToast('info', 'Configuración Actualizada', (payload.clave || '') + ' = ' + (payload.valor || ''));
    }

    function handleError(payload) {
        addLogEntry('error', 'Error: ' + (payload.message || payload.code || 'Desconocido'), payload);
        showToast('error', 'Error evalUA', payload.message || payload.code || 'Error desconocido');
    }

    // Initialize
    addLogEntry('info', 'Bridge postMessage inicializado — esperando iframe...');
})();