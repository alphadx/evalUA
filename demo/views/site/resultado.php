<?php
/**
 * evalUA Demo — Resultado (Visualización de Resultados)
 * Embeds /embed/resultado iframe with ALUMNO JWT
 */

/** @var \yii\web\View $this */
/** @var string $token */
/** @var string $evaluacionId */
/** @var string $evaluaUrl */

$this->title = 'Resultado';

$iframeSrc = $evaluaUrl . '/resultado?jwt=' . $token;
?>

<div class="embed-page">
    <!-- Token Info Bar -->
    <div class="token-bar">
        <div class="token-info">
            <div class="token-field">
                <label>Rol</label>
                <span class="token-value"><span class="role-badge role-alumno">ALUMNO</span></span>
            </div>
            <div class="token-field">
                <label>Evaluación ID</label>
                <span class="token-value mono"><?= $evaluacionId ?: '(no especificado)' ?></span>
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

    <?php if (empty($evaluacionId)): ?>
    <div class="iframe-placeholder" id="iframePlaceholder">
        <div class="placeholder-content">
            <i class="fas fa-circle-exclamation"></i>
            <h3>Evaluación requerida</h3>
            <p>Para ver resultados, necesitas un <code>evaluacion_id</code>. Completa una evaluación primero, o ingrésalo manualmente:</p>
            <div class="input-group">
                <input type="text" id="inputEvaluacionId" placeholder="UUID de la evaluación" class="form-input">
                <button class="btn btn-primary" onclick="loadResultado()">
                    <i class="fas fa-arrow-right"></i> Ver Resultado
                </button>
            </div>
        </div>
    </div>
    <?php else: ?>
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
    <?php endif; ?>
</div>

<script>
function loadResultado() {
    const id = document.getElementById('inputEvaluacionId').value.trim();
    if (!id) return;
    window.location.href = '<?= \yii\helpers\Url::to(['site/resultado']) ?>?evaluacion_id=' + encodeURIComponent(id);
}

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
</script>