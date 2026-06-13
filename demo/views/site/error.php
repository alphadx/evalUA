<?php
/**
 * evalUA Demo — Error Page
 */

use yii\helpers\Html;

/** @var \yii\web\View $this */
/** @var string $name */
/** @var string $message */

$this->title = 'Error';
?>

<div class="error-page">
    <div class="error-card">
        <div class="error-icon">
            <i class="fas fa-triangle-exclamation"></i>
        </div>
        <h2><?= Html::encode($name ?? 'Error') ?></h2>
        <p><?= Html::encode($message ?? 'Ha ocurrido un error inesperado.') ?></p>
        <a href="/" class="btn btn-primary">
            <i class="fas fa-home"></i> Volver al inicio
        </a>
    </div>
</div>