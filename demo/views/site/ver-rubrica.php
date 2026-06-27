<?php
/**
 * evalUA Demo — Ver Rúbrica (Matriz de solo lectura)
 * Embeds /embed/ver-rubrica iframe with ALUMNO JWT
 */

/** @var \yii\web\View $this */
/** @var string $token */
/** @var string $rubricaId */
/** @var string $evaluaUrl */

$this->title = 'Ver Rúbrica';

$iframeSrc = $evaluaUrl . '/ver-rubrica?jwt=' . $token;
if ($rubricaId) {
    $iframeSrc .= '&rubrica_id=' . urlencode($rubricaId);
}
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
                <label>Rúbrica ID</label>
                <span class="token-value mono"><?= $rubricaId ?: '(demo — sin ID)' ?></span>
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

    <!-- URL display (hidden by default) -->
    <div class="url-display" id="urlDisplay" style="display:none">
        <code><?= $iframeSrc ?></code>
    </div>

    <?php if (empty($rubricaId)): ?>
    <!-- No rubrica ID — show info + input -->
    <div class="info-banner">
        <i class="fas fa-info-circle"></i>
        <span>Mostrando rúbrica de demostración. Ingrese un ID para ver una rúbrica específica:</span>
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
    </div>
    <div class="input-group" style="margin-top: 1rem;">
        <input type="text" id="inputRubricaId" placeholder="UUID de la rúbrica" class="form-input">
        <button class="btn btn-primary" onclick="loadRubrica()">
            <i class="fas fa-arrow-right"></i> Ver Rúbrica
        </button>
    </div>
    <?php else: ?>
    <!-- Iframe Container with rubrica ID -->
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
function loadRubrica() {
    const id = document.getElementById('inputRubricaId').value.trim();
    if (!id) return;
    window.location.href = '<?= \yii\helpers\Url::to(['site/ver-rubrica']) ?>?rubrica_id=' + encodeURIComponent(id);
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