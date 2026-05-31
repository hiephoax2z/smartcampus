GIT_AUTHOR_DATE="2026-05-27T10:15:00" GIT_COMMITTER_DATE="2026-03-27T10:15:00" git commit -m "feat: setup API router with auth routes"
<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Controllers/AuthController.php';
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

    default => (function () {
        http_response_code(404);
        echo json_encode(['error' => 'Route not found']);
    })(),
};
