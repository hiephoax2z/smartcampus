<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Models/SeanceModel.php';

class SeanceController
{
    private SeanceModel $model;

    public function __construct()
    {
        $this->model = new SeanceModel();
    }

    public function index(): void
    {
        $coursId      = isset($_GET['cours_id'])      ? (int)$_GET['cours_id']      : null;
        $etudiantId   = isset($_GET['etudiant_id'])   ? (int)$_GET['etudiant_id']   : null;
        $enseignantId = isset($_GET['enseignant_id']) ? (int)$_GET['enseignant_id'] : null;

        if ($coursId) {
            echo json_encode($this->model->findByCours($coursId));
            return;
        }
        if ($etudiantId) {
            echo json_encode($this->model->findByEtudiant($etudiantId));
            return;
        }
        if ($enseignantId) {
            echo json_encode($this->model->findByEnseignant($enseignantId));
            return;
        }

        http_response_code(400);
        echo json_encode(['error' => 'Paramètre cours_id, etudiant_id ou enseignant_id requis']);
    }

    public function store(): void
    {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $required = ['cours_id', 'jour_semaine', 'heure_debut', 'heure_fin', 'date_debut', 'date_fin'];
        foreach ($required as $field) {
            if (empty($body[$field])) {
                http_response_code(422);
                echo json_encode(['error' => "Le champ '$field' est requis"]);
                return;
            }
        }

        $joursValides = ['lundi','mardi','mercredi','jeudi','vendredi','samedi'];
        if (!in_array($body['jour_semaine'], $joursValides, true)) {
            http_response_code(422);
            echo json_encode(['error' => 'Jour invalide. Valeurs : ' . implode(', ', $joursValides)]);
            return;
        }

        $id = $this->model->create($body);
        http_response_code(201);
        echo json_encode(['id' => $id]);
    }

    public function update(int $id): void
    {
        if (!$this->model->findById($id)) {
            http_response_code(404);
            echo json_encode(['error' => 'Séance introuvable']);
            return;
        }

        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $this->model->update($id, $body);
        echo json_encode(['message' => 'Séance mise à jour']);
    }

    public function destroy(int $id): void
    {
        if (!$this->model->findById($id)) {
            http_response_code(404);
            echo json_encode(['error' => 'Séance introuvable']);
            return;
        }

        $this->model->delete($id);
        echo json_encode(['message' => 'Séance supprimée']);
    }
}
