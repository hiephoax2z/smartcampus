<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Models/EtudiantModel.php';

class EtudiantController
{
    private EtudiantModel $model;

    public function __construct()
    {
        $this->model = new EtudiantModel();
    }

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

        $this->model->update($id, $userUpdate, $etudiantUpdate);
        echo json_encode(['message' => 'Étudiant mis à jour']);
    }

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
