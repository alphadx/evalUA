<?php
/**
 * evalUA Demo — Yii2 Application Configuration
 */

$params = require __DIR__ . '/params.php';

$config = [
    'id' => 'evalua-demo',
    'basePath' => dirname(__DIR__),
    'bootstrap' => ['log'],
    'aliases' => [
        '@bower' => '@vendor/bower-asset',
        '@npm'   => '@vendor/npm-asset',
    ],
    'components' => [
        'request' => [
            'cookieValidationKey' => 'evalua-demo-cookie-key-change-in-prod',
            'baseUrl' => '',
        ],
        'cache' => [
            'class' => 'yii\caching\FileCache',
        ],
        'errorHandler' => [
            'errorAction' => 'site/error',
        ],
        'log' => [
            'traceLevel' => YII_DEBUG ? 3 : 0,
            'targets' => [
                [
                    'class' => 'yii\log\FileTarget',
                    'levels' => ['error', 'warning'],
                ],
            ],
        ],
        'urlManager' => [
            'enablePrettyUrl' => true,
            'showScriptName' => false,
            'rules' => [
                '' => 'site/index',
                'evaluar' => 'site/evaluar',
                'resultado' => 'site/resultado',
                'rubricas' => 'site/rubricas',
                'dashboard' => 'site/dashboard',
                'configurar' => 'site/configurar',
                'api/generate-token' => 'site/api-generate-token',
            ],
        ],
        'view' => [
            'theme' => [
                'basePath' => '@app/views',
                'baseUrl' => '@web',
            ],
        ],
    ],
    'params' => $params,
];

// Dev modules (debug/gii) intentionally excluded for Docker deployment
// To enable, add yiisoft/yii2-debug and yiisoft/yii2-gii to composer.json

return $config;