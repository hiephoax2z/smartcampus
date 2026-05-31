GIT_AUTHOR_DATE="2026-05-27T16:30:00" GIT_COMMITTER_DATE="2026-05-27T16:30:00" git commit -m "feat: add students and teachers routes"
<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Controllers/AuthController.php';
require_once ROOT_PATH . '/app/Controllers/UserController.php';
require_once ROOT_PATH . '/app/Controllers/EtudiantController.php';
require_once ROOT_PATH . '/app/Controllers/EnseignantController.php';
require_once ROOT_PATH . '/app/Controllers/CoursController.php';
require_once ROOT_PATH . '/app/Controllers/InscriptionController.php';
require_once ROOT_PATH . '/app/Controllers/NoteController.php';
require_once ROOT_PATH . '/app/Controllers/EvaluationController.php';
require_once ROOT_PATH . '/app/Controllers/SeanceController.php';
require_once ROOT_PATH . '/app/Middleware/AuthMiddleware.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri    = rtrim($uri, '/');

match (true) {

    // ── Auth ──────────────────────────────────────────────────────────────
    $method === 'POST' && $uri === '/api/auth/login'
        => (new AuthController())->login(),

    $method === 'POST' && $uri === '/api/auth/logout'
        => (new AuthController())->logout(),

    $method === 'GET' && $uri === '/api/auth/me'
        => (new AuthController())->me(),

    // ── Étudiants ─────────────────────────────────────────────────────────
    $method === 'GET' && $uri === '/api/etudiants'
        => (function () {
            AuthMiddleware::hasRole('admin');
            (new EtudiantController())->index();
        })(),

    $method === 'GET' && preg_match('#^/api/etudiants/(\d+)$#', $uri, $m)
        => (function () use ($m) {
            AuthMiddleware::isAuthenticated();
            (new EtudiantController())->show((int)$m[1]);
        })(),

    $method === 'POST' && $uri === '/api/etudiants'
        => (function () {
            AuthMiddleware::hasRole('admin');
            (new EtudiantController())->store();
        })(),

    $method === 'PUT' && preg_match('#^/api/etudiants/(\d+)$#', $uri, $m)
        => (function () use ($m) {
            AuthMiddleware::hasRole('admin');
            (new EtudiantController())->update((int)$m[1]);
        })(),

    $method === 'DELETE' && preg_match('#^/api/etudiants/(\d+)$#', $uri, $m)
        => (function () use ($m) {
            AuthMiddleware::hasRole('admin');
            (new EtudiantController())->destroy((int)$m[1]);
        })(),

    // ── Enseignants ───────────────────────────────────────────────────────
    $method === 'GET' && $uri === '/api/enseignants'
        => (function () {
            AuthMiddleware::hasRole('admin');
            (new EnseignantController())->index();
        })(),

    $method === 'GET' && preg_match('#^/api/enseignants/(\d+)$#', $uri, $m)
        => (function () use ($m) {
            AuthMiddleware::isAuthenticated();
            (new EnseignantController())->show((int)$m[1]);
        })(),

    $method === 'POST' && $uri === '/api/enseignants'
        => (function () {
            AuthMiddleware::hasRole('admin');
            (new EnseignantController())->store();
        })(),

    $method === 'PUT' && preg_match('#^/api/enseignants/(\d+)$#', $uri, $m)
        => (function () use ($m) {
            AuthMiddleware::hasRole('admin');
            (new EnseignantController())->update((int)$m[1]);
        })(),

    $method === 'DELETE' && preg_match('#^/api/enseignants/(\d+)$#', $uri, $m)
        => (function () use ($m) {
            AuthMiddleware::hasRole('admin');
            (new EnseignantController())->destroy((int)$m[1]);
        })(),

    // ── Cours ─────────────────────────────────────────────────────────────
    $method === 'GET' && $uri === '/api/cours/mes-cours'
        => (function () {
            AuthMiddleware::isAuthenticated();
            (new CoursController())->mesCours();
        })(),

    $method === 'GET' && $uri === '/api/cours'
        => (function () {
            AuthMiddleware::isAuthenticated();
            (new CoursController())->index();
        })(),

    $method === 'GET' && preg_match('#^/api/cours/(\d+)$#', $uri, $m)
        => (function () use ($m) {
            AuthMiddleware::isAuthenticated();
            (new CoursController())->show((int)$m[1]);
        })(),

    $method === 'POST' && $uri === '/api/cours'
        => (function () {
            AuthMiddleware::hasRole('admin');
            (new CoursController())->store();
        })(),

    $method === 'PUT' && preg_match('#^/api/cours/(\d+)$#', $uri, $m)
        => (function () use ($m) {
            AuthMiddleware::hasRole('admin');
            (new CoursController())->update((int)$m[1]);
        })(),

    $method === 'DELETE' && preg_match('#^/api/cours/(\d+)$#', $uri, $m)
        => (function () use ($m) {
            AuthMiddleware::hasRole('admin');
            (new CoursController())->destroy((int)$m[1]);
        })(),

    // ── Inscriptions ──────────────────────────────────────────────────────
    $method === 'GET' && $uri === '/api/inscriptions'
        => (function () {
            AuthMiddleware::isAuthenticated();
            (new InscriptionController())->index();
        })(),

    $method === 'POST' && $uri === '/api/inscriptions'
        => (function () {
            AuthMiddleware::hasRole('admin');
            (new InscriptionController())->store();
        })(),

    $method === 'DELETE' && preg_match('#^/api/inscriptions/(\d+)$#', $uri, $m)
        => (function () use ($m) {
            AuthMiddleware::hasRole('admin');
            (new InscriptionController())->destroy((int)$m[1]);
        })(),

    // ── Notes ─────────────────────────────────────────────────────────────
    $method === 'GET' && $uri === '/api/notes'
        => (function () {
            AuthMiddleware::isAuthenticated();
            (new NoteController())->index();
        })(),

    $method === 'POST' && $uri === '/api/notes'
        => (function () {
            AuthMiddleware::isAuthenticated();
            (new NoteController())->store();
        })(),

    $method === 'PUT' && preg_match('#^/api/notes/(\d+)$#', $uri, $m)
        => (function () use ($m) {
            AuthMiddleware::isAuthenticated();
            (new NoteController())->update((int)$m[1]);
        })(),

    // ── Évaluations ───────────────────────────────────────────────────────
    $method === 'GET' && $uri === '/api/evaluations'
        => (function () {
            AuthMiddleware::isAuthenticated();
            (new EvaluationController())->index();
        })(),

    $method === 'POST' && $uri === '/api/evaluations'
        => (function () {
            AuthMiddleware::isAuthenticated();
            (new EvaluationController())->store();
        })(),

    $method === 'PUT' && preg_match('#^/api/evaluations/(\d+)/verrouiller$#', $uri, $m)
        => (function () use ($m) {
            AuthMiddleware::isAuthenticated();
            (new EvaluationController())->verrouiller((int)$m[1]);
        })(),

    // ── Séances ───────────────────────────────────────────────────────────
    $method === 'GET' && $uri === '/api/seances'
        => (function () {
            AuthMiddleware::isAuthenticated();
            (new SeanceController())->index();
        })(),

    $method === 'POST' && $uri === '/api/seances'
        => (function () {
            AuthMiddleware::hasRole('admin');
            (new SeanceController())->store();
        })(),

    $method === 'PUT' && preg_match('#^/api/seances/(\d+)$#', $uri, $m)
        => (function () use ($m) {
            AuthMiddleware::hasRole('admin');
            (new SeanceController())->update((int)$m[1]);
        })(),

    $method === 'DELETE' && preg_match('#^/api/seances/(\d+)$#', $uri, $m)
        => (function () use ($m) {
            AuthMiddleware::hasRole('admin');
            (new SeanceController())->destroy((int)$m[1]);
        })(),

    // ── Users ─────────────────────────────────────────────────────────────
    $method === 'GET' && $uri === '/api/users'
        => (function () {
            AuthMiddleware::isAuthenticated();
            (new UserController())->index();
        })(),

    $method === 'GET' && preg_match('#^/api/users/(\d+)$#', $uri, $m)
        => (function () use ($m) {
            AuthMiddleware::isAuthenticated();
            (new UserController())->show((int)$m[1]);
        })(),

    $method === 'POST' && $uri === '/api/users'
        => (function () {
            AuthMiddleware::hasRole('admin');
            (new UserController())->store();
        })(),

    default => (function () {
        http_response_code(404);
        echo json_encode(['error' => 'Route not found']);
    })(),
};
