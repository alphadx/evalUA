<?php
/**
 * evalUA Demo — Rúbricas (CRUD de Rúbricas)
 * Embeds /embed/rubricas iframe with MANTENEDOR JWT
 */

/** @var \yii\web\View $this */
/** @var string $token */
/** @var string $evaluaUrl */

$this->title = 'Rúbricas';

$iframeSrc = $evaluaUrl . '/rubricas?jwt=' . $token;
?>

<div class="embed-page">
    <div class="token-bar">
        <div class="token-info">
            <div class="token-field">
                <label>Rol</label>
                <span class="token-value"><span class="role-badge role-mantenedor">MANTENEDOR</span></span>
            </div>
            <div class="token-field">
                <label>Permisos</label>
                <span class="token-value"><code>rubricas_permitidas: ["*"]</code></span>
            </div>
            <div class="token-field">
                <label>JWT (truncado)</label>
                <span class="token-value mono"><?= substr($token, 0, 50) ?>...</span>
            </div>
        </div>
        <div class="token-actions">
            <button class="btn btn-sm btn-outline" onclick="copyToken(this)" data-token="<?= $token ?>">
                <i class="fas fa-copy"></i> Copiar JWT
            </button>
            <button class="btn btn-sm btn-outline" onclick="toggleIframeSrc()">
                <i class="fas fa-eye"></i> Ver URL
            </button>
        </div>
    </div>

    <div class="url-display" id="urlDisplay" style="display:none">
        <code><?= $iframeSrc ?></code>
    </div>

    <div class="iframe-container" id="iframeContainer">
        <iframe
            id="evaluaIframe"
            src="<?= $iframeSrc ?>"
            width="1029"
            height="466"
            style="width: 1029px; height: 466px; border: 0; overflow: hidden;"
            scrolling="no"
        ></iframe>
        <div class="iframe-overlay" id="iframeOverlay" style="display:none">
            <div class="overlay-spinner"></div>
            <span>Cargando evalUA...</span>
        </div>
    </div>

    <!-- Rubrica ID capture hint -->
    <div class="capture-hint" id="captureHint" style="display:none">
        <i class="fas fa-info-circle"></i>
        <span>Nueva rúbrica creada: <code id="capturedRubricaId"></code></span>
        <a href="#" id="goToEvaluar" class="btn btn-sm btn-primary">Ir a Evaluar →</a>
    </div>
</div>

<script>
function copyToken(btn) {
    navigator.clipboard.writeText(btn.dataset.token).then(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> Copiado';
        setTimeout(() => btn.innerHTML = '<i class="fas fa-copy"></i> Copiar JWT', 2000);
    });
}

function toggleIframeSrc() {
    const el = document.getElementById('urlDisplay');
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

// Listen for rubrica created/updated event from iframe
window.addEventListener('message', function(event) {
    try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // Handle both created and updated events
        if (data.source === 'evalua' && data.payload && data.payload.rubricaId) {
            const hint = document.getElementById('captureHint');
            const idEl = document.getElementById('capturedRubricaId');
            const link = document.getElementById('goToEvaluar');
            
            if (hint && idEl) {
                idEl.textContent = data.payload.rubricaId;
                
                // Add version info if available (updated event)
                let messageText = data.payload.rubricaId;
                if (data.payload.version) {
                    messageText += ' (v' + data.payload.version + ')';
                }
                
                // Show hint with appropriate message
                hint.querySelector('span').textContent = data.type === 'evalua.rubrica.created' 
                    ? 'Nueva rúbrica creada: ' + messageText
                    : 'Rúbrica actualizada: ' + messageText;
                
                link.href = '<?= \yii\helpers\Url::to(['site/evaluar']) ?>?rubrica_id=' + encodeURIComponent(data.payload.rubricaId);
                hint.style.display = 'flex';
            }
        }
    } catch (e) { /* ignore */ }
});
</script>