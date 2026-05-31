<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Models/EnseignantModel.php';
// Contrôleur d'enseignant, gère les actions liées à la gestion des enseignants.
class EnseignantController
{
    private EnseignantModel $model;

    public function __construct()
    {
        $this->model = new EnseignantModel();
    }

    public function index(): void
    {
        echo json_encode($this->model->findAll());
    }

    public function show(int $id): void
    {
        $enseignant = $this->model->findById($id);

        if (!$enseignant) {
            http_response_code(404);
            echo json_encode(['error' => 'Enseignant introuvable']);
            return;
        }

        echo json_encode($enseignant);
    }
// Action de création d'un enseignant. Exige des champs spécifiques pour l'utilisateur et l'enseignant. Retourne l'ID du nouvel enseignant ou une erreur en cas de conflit (email ou numéro enseignant déjà utilisé).
    public function store(): void
    {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $requiredUser       = ['nom', 'prenom', 'email', 'password'];
        $requiredEnseignant = ['numero_enseignant'];

        foreach ([...$requiredUser, ...$requiredEnseignant] as $field) {
            if (empty($body[$field])) {
                http_response_code(422);
                echo json_encode(['error' => "Le champ '$field' est requis"]);
                return;
            }
        }

        try {
            $id = $this->model->createWithUser(
                array_intersect_key($body, array_flip([...$requiredUser, 'password'])),
                array_diff_key($body, array_flip([...$requiredUser, 'password']))
            );
            http_response_code(201);
            echo json_encode(['id' => $id]);
        } catch (\PDOException $e) {
            http_response_code(409);
            echo json_encode(['error' => 'Email ou numéro enseignant déjà utilisé']);
        }
    }
// Action de mise à jour d'un enseignant. Permet de mettre à jour les informations de l'utilisateur et de l'enseignant. Retourne un message de confirmation ou une erreur si l'enseignant n'est pas trouvé.
    public function update(int $id): void
    {
        $enseignant = $this->model->findById($id);
        if (!$enseignant) {
            http_response_code(404);
            echo json_encode(['error' => 'Enseignant introuvable']);
            return;
        }

        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $userFields       = ['nom', 'prenom', 'email', 'actif'];
        $enseignantFields = ['numero_enseignant', 'telephone', 'departement', 'grade'];

        $userUpdate       = array_intersect_key($body, array_flip($userFields));
        $enseignantUpdate = array_intersect_key($body, array_flip($enseignantFields));

        if (!empty($body['password'])) {
            $userUpdate['mot_de_passe'] = password_hash($body['password'], PASSWORD_BCRYPT);
        }

        $this->model->update($id, $userUpdate, $enseignantUpdate);
        echo json_encode(['message' => 'Enseignant mis à jour']);
    }
// Action de suppression d'un enseignant. Retourne un message de confirmation ou une erreur si l'enseignant n'est pas trouvé.
    public function destroy(int $id): void
    {
        $enseignant = $this->model->findById($id);
        if (!$enseignant) {
            http_response_code(404);
            echo json_encode(['error' => 'Enseignant introuvable']);
            return;
        }

        $this->model->delete($id);
        echo json_encode(['message' => 'Enseignant supprimé']);
    }
}
