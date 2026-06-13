<?php
/**
 * evalUA Demo — Site Controller
 * Generates JWT tokens for evalUA iframe embedding
 */

namespace app\controllers;

use Firebase\JWT\JWT;
use Yii;
use yii\web\Controller;
use yii\web\Response;

class SiteController extends Controller
{
    /**
     * @inheritdoc
     */
    public $layout = 'main';

    /**
     * Home page — dashboard with navigation
     */
    public function actionIndex()
    {
        return $this->render('index', [
            'evaluaUrl' => Yii::$app->params['evalua.browser_url'],
            'idPlataforma' => Yii::$app->params['id_plataforma'],
        ]);
    }

    /**
     * Evaluation wizard — PROFESOR role
     * Requires rubrica_id (query param or stored from rubricas page)
     */
    public function actionEvaluar()
    {
        $rubricaId = Yii::$app->request->get('rubrica_id', Yii::$app->session->get('last_rubrica_id', ''));

        $token = $this->generateJwt([
            'rol' => 'PROFESOR',
            'usuario_id' => Yii::$app->params['demo.usuario_profesor'],
            'rubrica_id' => $rubricaId,
        ]);

        return $this->render('evaluar', [
            'token' => $token,
            'rubricaId' => $rubricaId,
            'evaluaUrl' => Yii::$app->params['evalua.browser_url'],
        ]);
    }

    /**
     * Result view — ALUMNO role
     * Requires evaluacion_id
     */
    public function actionResultado()
    {
        $evaluacionId = Yii::$app->request->get('evaluacion_id', Yii::$app->session->get('last_evaluacion_id', ''));

        $token = $this->generateJwt([
            'rol' => 'ALUMNO',
            'usuario_id' => Yii::$app->params['demo.usuario_alumno'],
            'evaluacion_id' => $evaluacionId,
        ]);

        return $this->render('resultado', [
            'token' => $token,
            'evaluacionId' => $evaluacionId,
            'evaluaUrl' => Yii::$app->params['evalua.browser_url'],
        ]);
    }

    /**
     * Rubric management — MANTENEDOR role
     */
    public function actionRubricas()
    {
        $token = $this->generateJwt([
            'rol' => 'MANTENEDOR',
            'usuario_id' => Yii::$app->params['demo.usuario_mantenedor'],
            'rubricas_permitidas' => ['*'],
        ]);

        return $this->render('rubricas', [
            'token' => $token,
            'evaluaUrl' => Yii::$app->params['evalua.browser_url'],
        ]);
    }

    /**
     * Dashboard — ADMINISTRADOR role
     */
    public function actionDashboard()
    {
        $token = $this->generateJwt([
            'rol' => 'ADMINISTRADOR',
            'usuario_id' => Yii::$app->params['demo.usuario_admin'],
        ]);

        return $this->render('dashboard', [
            'token' => $token,
            'evaluaUrl' => Yii::$app->params['evalua.browser_url'],
        ]);
    }

    /**
     * Configuration — ADMINISTRADOR role
     */
    public function actionConfigurar()
    {
        $token = $this->generateJwt([
            'rol' => 'ADMINISTRADOR',
            'usuario_id' => Yii::$app->params['demo.usuario_admin'],
        ]);

        return $this->render('configurar', [
            'token' => $token,
            'evaluaUrl' => Yii::$app->params['evalua.browser_url'],
        ]);
    }

    /**
     * API endpoint to generate tokens dynamically via AJAX
     */
    public function actionApiGenerateToken()
    {
        Yii::$app->response->format = Response::FORMAT_JSON;

        $role = Yii::$app->request->post('role', 'PROFESOR');
        $rubricaId = Yii::$app->request->post('rubrica_id', '');
        $evaluacionId = Yii::$app->request->post('evaluacion_id', '');

        $claims = [
            'rol' => $role,
            'usuario_id' => Yii::$app->params['demo.usuario_' . strtolower($role)] ?? 'demo.user',
        ];

        if ($rubricaId) {
            $claims['rubrica_id'] = $rubricaId;
        }
        if ($evaluacionId) {
            $claims['evaluacion_id'] = $evaluacionId;
        }
        if ($role === 'MANTENEDOR') {
            $claims['rubricas_permitidas'] = ['*'];
        }

        $token = $this->generateJwt($claims);

        return [
            'success' => true,
            'token' => $token,
            'claims' => $claims,
        ];
    }

    /**
     * Error page
     */
    public function actionError()
    {
        return $this->render('error');
    }

    /**
     * Generate a JWT token for evalUA iframe embedding
     */
    private function generateJwt(array $extraClaims): string
    {
        $now = time();
        $params = Yii::$app->params;

        $payload = array_merge([
            'iss' => $params['jwt.issuer'],
            'aud' => $params['jwt.audience'],
            'id_plataforma' => $params['id_plataforma'],
            'iat' => $now,
            'exp' => $now + $params['jwt.expiry'],
        ], $extraClaims);

        return JWT::encode($payload, $params['jwt.secret'], $params['jwt.algorithm']);
    }
}