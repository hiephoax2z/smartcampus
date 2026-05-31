<?php

declare(strict_types=1);
// Configuration de la base de données pour l'application Smart Campus. Définit les constantes de connexion et une fonction pour obtenir une instance PDO.
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'smartcampus');
define('DB_USER', 'root');
define('DB_PASS', '');
// Fonction pour obtenir une connexion PDO à la base de données. Utilise un singleton pour réutiliser la même connexion.
function getConnection(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_PORT, DB_NAME);
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }

    return $pdo;
}
