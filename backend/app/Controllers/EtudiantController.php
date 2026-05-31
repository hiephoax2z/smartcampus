<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Models/EtudiantModel.php';
// Contrôleur d'étudiant, gère les actions liées à la gestion des étudiants et de leurs informations.
class EtudiantController
{
    private EtudiantModel $model;

    public function __construct()
    {
        $this->model = new EtudiantModel();
    }
// Action qui retourne la liste de tous les étudiants avec leurs informations de base et leur moyenne générale.
    public function index(): void
    {
        echo json_encode($this->model->findAll());
    }

    public function show(int $id): void
    {
        $etudiant = $this->model->findById($id);

        if (!$etudiant) {
            http_response_code(404);
            echo json_encode(['error' => 'Étudiant introuvable']);
            return;
        }

        echo json_encode($etudiant);
    }
// Action de création d'un étudiant. Exige des champs spécifiques pour l'utilisateur et l'étudiant. Retourne l'ID du nouvel étudiant ou une erreur en cas de conflit (email ou numéro étudiant déjà utilisé).
    public function store(): void
    {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $requiredUser     = ['nom', 'prenom', 'email', 'password'];
        $requiredEtudiant = ['numero_etudiant'];

        foreach ([...$requiredUser, ...$requiredEtudiant] as $field) {
            if (empty($body[$field])) {
                http_response_code(422);
                echo json_encode(['error' => "Le champ '$field' est requis"]);
                return;
            }
        }
// Validation du format de l'email
        try {
            $id = $this->model->createWithUser(
                array_intersect_key($body, array_flip([...$requiredUser, 'password'])),
                array_diff_key($body, array_flip([...$requiredUser, 'password']))
            );
            http_response_code(201);
            echo json_encode(['id' => $id]);
        } catch (\PDOException $e) {
            http_response_code(409);
            echo json_encode(['error' => 'Email ou numéro étudiant déjà utilisé']);
        }
    }
// Action de mise à jour d'un étudiant. Permet de mettre à jour les informations de l'utilisateur et de l'étudiant. Retourne un message de confirmation ou une erreur si l'étudiant n'est pas trouvé.
    public function update(int $id): void
    {
        $etudiant = $this->model->findById($id);
        if (!$etudiant) {
            http_response_code(404);
            echo json_encode(['error' => 'Étudiant introuvable']);
            return;
        }

        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $userFields     = ['nom', 'prenom', 'email', 'actif'];
        $etudiantFields = ['numero_etudiant', 'date_naissance', 'telephone',
                           'niveau', 'filiere', 'annee_academique', 'statut'];

        $userUpdate     = array_intersect_key($body, array_flip($userFields));
        $etudiantUpdate = array_intersect_key($body, array_flip($etudiantFields));

        if (!empty($userUpdate['password'])) {
            $userUpdate['mot_de_passe'] = password_hash($body['password'], PASSWORD_BCRYPT);
        }
// Validation du format de l'email si il est présent dans la mise à jour
        $this->model->update($id, $userUpdate, $etudiantUpdate);
        echo json_encode(['message' => 'Étudiant mis à jour']);
    }
// Action de suppression d'un étudiant. Retourne un message de confirmation ou une erreur si l'étudiant n'est pas trouvé.
    public function destroy(int $id): void
    {
        $etudiant = $this->model->findById($id);
        if (!$etudiant) {
            http_response_code(404);
            echo json_encode(['error' => 'Étudiant introuvable']);
            return;
        }

        $this->model->delete($id);
        echo json_encode(['message' => 'Étudiant supprimé']);
    }
}
