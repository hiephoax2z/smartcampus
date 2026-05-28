<?php

declare(strict_types=1);

class AuthMiddleware
{
    public static function isAuthenticated(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (empty($_SESSION['user'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Non authentifié']);
            exit;
        }
    }

    public static function hasRole(string $role): void
    {
        self::isAuthenticated();

        if ($_SESSION['user']['role'] !== $role) {
            http_response_code(403);
            echo json_encode(['error' => 'Accès refusé']);
            exit;
        }
    }
}
