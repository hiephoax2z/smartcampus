<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Models/InscriptionModel.php';

class InscriptionController
{
    private InscriptionModel $model;

    public function __construct()
    {
        $this->model = new InscriptionModel();
    }

    public function index(): void
    {
        $etudiantId = isset($_GET['etudiant_id']) ? (int)$_GET['etudiant_id'] : null;
        $coursId    = isset($_GET['cours_id'])    ? (int)$_GET['cours_id']    : null;

        if ($etudiantId) {
            echo json_encode($this->model->findByEtudiant($etudiantId));
            return;
        }

        if ($coursId) {
            echo json_encode($this->model->findByCours($coursId));
            return;
        }

        http_response_code(400);
        echo json_encode(['error' => 'Paramètre etudiant_id ou cours_id requis']);
    }

    public function store(): void
    {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        foreach (['etudiant_id', 'cours_id'] as $field) {
            if (empty($body[$field])) {
                http_response_code(422);
                echo json_encode(['error' => "Le champ '$field' est requis"]);
                return;
            }
        }

        $etudiantId = (int)$body['etudiant_id'];
        $coursId    = (int)$body['cours_id'];

        if ($this->model->isAlreadyInscrit($etudiantId, $coursId)) {
            http_response_code(409);
            echo json_encode(['error' => 'Étudiant déjà inscrit à ce cours']);
            return;
        }

        $inscrits    = $this->model->countInscrits($coursId);
        $capaciteMax = $this->model->getCapaciteMax($coursId);

        if ($inscrits >= $capaciteMax) {
            http_response_code(400);
            echo json_encode([
                'error'       => 'Capacité maximale du cours atteinte',
                'capacite_max' => $capaciteMax,
                'inscrits'    => $inscrits,
            ]);
            return;
        }

        $id = $this->model->inscrire($etudiantId, $coursId);
        http_response_code(201);
        echo json_encode(['id' => $id]);
    }

    public function destroy(int $id): void
    {
        $annule = $this->model->annuler($id);

        if (!$annule) {
            http_response_code(404);
            echo json_encode(['error' => 'Inscription introuvable']);
            return;
        }

        echo json_encode(['message' => 'Inscription annulée']);
    }
}
