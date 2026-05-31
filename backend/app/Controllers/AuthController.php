<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Models/UserModel.php';
// Contrôleur d'authentification, gère les actions de login, logout et récupération des informations de l'utilisateur connecté.
class AuthController
{
    private UserModel $model;
// Constructeur qui initialise le modèle utilisateur et démarre la session si elle n'est pas déjà active.
    public function __construct()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $this->model = new UserModel();
    }
// Action de login qui vérifie les informations d'identification de l'utilisateur et crée une session si elles sont valides. Retourne les informations de l'utilisateur connecté ou une erreur en cas d'échec.
    public function login(): void
    {
        $body = json_decode(file_get_contents('php://input'), true);

        if (empty($body['email']) || empty($body['password'])) {
            http_response_code(422);
            echo json_encode(['error' => 'email et password sont requis']);
            return;
        }
// Recherche de l'utilisateur par email
        $user = $this->model->findByEmail($body['email']);
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => "Je n'ai pas trouvé cet email dans la base"]);
            return;
        }

        if (!password_verify($body['password'], $user['mot_de_passe'])) {
            http_response_code(401);
            echo json_encode(['error' => "L'email est bon, mais le mot de passe est faux !"]);
            return;
        }

        session_regenerate_id(true);

        $profilId = null;
        $db = getConnection();
        if ($user['role'] === 'etudiant') {
            $stmt = $db->prepare("SELECT id FROM etudiants WHERE utilisateur_id = ?");
            $stmt->execute([$user['id']]);
            $profilId = $stmt->fetchColumn() ?: null;
        } elseif ($user['role'] === 'enseignant') {
            $stmt = $db->prepare("SELECT id FROM enseignants WHERE utilisateur_id = ?");
            $stmt->execute([$user['id']]);
            $profilId = $stmt->fetchColumn() ?: null;
        }
// Stockage des informations de l'utilisateur dans la session, y compris un champ profil_id pour faire le lien avec les tables spécifiques aux rôles (étudiant ou enseignant).
        $_SESSION['user'] = [
            'id'        => $user['id'],
            'nom'       => $user['nom'],
            'prenom'    => $user['prenom'],
            'email'     => $user['email'],
            'role'      => $user['role'],
            'profil_id' => $profilId,
        ];

        echo json_encode($_SESSION['user']);
    }
// Action de logout qui détruit la session de l'utilisateur et retourne un message de confirmation.
    public function logout(): void
    {
        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $p['path'], $p['domain'], $p['secure'], $p['httponly']
            );
        }

        session_destroy();

        echo json_encode(['message' => 'Déconnecté']);
    }
// Action qui retourne les informations de l'utilisateur actuellement connecté. Si aucune session n'est active, retourne une erreur 401.
    public function me(): void
    {
        if (empty($_SESSION['user'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Non authentifié']);
            return;
        }

        // Back-fill profil_id for sessions created before this field was added
        if (!array_key_exists('profil_id', $_SESSION['user'])) {
            $db = getConnection();
            $role = $_SESSION['user']['role'];
            $uid  = $_SESSION['user']['id'];
            $profilId = null;
            if ($role === 'etudiant') {
                $stmt = $db->prepare("SELECT id FROM etudiants WHERE utilisateur_id = ?");
                $stmt->execute([$uid]);
                $profilId = $stmt->fetchColumn() ?: null;
            } elseif ($role === 'enseignant') {
                $stmt = $db->prepare("SELECT id FROM enseignants WHERE utilisateur_id = ?");
                $stmt->execute([$uid]);
                $profilId = $stmt->fetchColumn() ?: null;
            }
            $_SESSION['user']['profil_id'] = $profilId;
        }

        echo json_encode($_SESSION['user']);
    }
}
