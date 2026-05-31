<?php
// Point d'entrée de l'application backend. Charge les configurations et les routes nécessaires pour gérer les requêtes API.
declare(strict_types=1);

define('ROOT_PATH', dirname(__DIR__));

require_once ROOT_PATH . '/config/database.php';
require_once ROOT_PATH . '/routes/api.php';
