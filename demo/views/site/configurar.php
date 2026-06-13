<?php
/**
 * evalUA Demo — Configurar (Configuración del Sistema)
 * Embeds /embed/configurar iframe with ADMINISTRADOR JWT
 */

/** @var \yii\web\View $this */
/** @var string $token */
/** @var string $evaluaUrl */

$this->title = 'Configurar';

$iframeSrc = $evaluaUrl . '/configurar?jwt=' . $token;
?>

<div class="embed-page">
    <div class="token-bar">
        <div class="token-info">
            <div class="token-field">
                <label>Rol</label>
                <span class="token-value"><span class="role-badge role-admin">ADMINISTRADOR</span></span>
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
</script>