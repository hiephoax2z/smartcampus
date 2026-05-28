<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Models/NoteModel.php';

class NoteController
{
    private NoteModel $model;

    public function __construct()
    {
        $this->model = new NoteModel();
    }

    public function index(): void
    {
        $etudiantId   = isset($_GET['etudiant_id'])   ? (int)$_GET['etudiant_id']   : null;
        $coursId      = isset($_GET['cours_id'])       ? (int)$_GET['cours_id']       : null;
        $evaluationId = isset($_GET['evaluation_id']) ? (int)$_GET['evaluation_id'] : null;

        if ($etudiantId) {
            echo json_encode($this->model->findByEtudiant($etudiantId));
            return;
        }

        if ($evaluationId) {
            echo json_encode($this->model->findByEvaluation($evaluationId));
            return;
        }

        if ($coursId) {
            echo json_encode($this->model->findByCours($coursId));
            return;
        }

        http_response_code(400);
        echo json_encode(['error' => 'Paramètre etudiant_id, evaluation_id ou cours_id requis']);
    }

    public function store(): void
    {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        foreach (['etudiant_id', 'evaluation_id', 'note', 'saisie_par'] as $field) {
            if (!isset($body[$field])) {
                http_response_code(422);
                echo json_encode(['error' => "Le champ '$field' est requis"]);
                return;
            }
        }

        $note = (float)$body['note'];
        if ($note < 0 || $note > 20) {
            http_response_code(422);
            echo json_encode(['error' => 'La note doit être comprise entre 0 et 20']);
            return;
        }

        if ($this->model->isEvaluationVerrouillee((int)$body['evaluation_id'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Cette évaluation est verrouillée']);
            return;
        }

        try {
            $id = $this->model->create([
                'etudiant_id'   => (int)$body['etudiant_id'],
                'evaluation_id' => (int)$body['evaluation_id'],
                'note'          => $note,
                'commentaire'   => $body['commentaire'] ?? null,
                'saisie_par'    => (int)$body['saisie_par'],
            ]);
            http_response_code(201);
            echo json_encode(['id' => $id]);
        } catch (\PDOException $e) {
            http_response_code(409);
            echo json_encode(['error' => 'Une note existe déjà pour cet étudiant et cette évaluation']);
        }
    }

    public function update(int $id): void
    {
        $note = $this->model->findById($id);

        if (!$note) {
            http_response_code(404);
            echo json_encode(['error' => 'Note introuvable']);
            return;
        }

        if ($note['verrouille']) {
            http_response_code(403);
            echo json_encode(['error' => 'Cette évaluation est verrouillée']);
            return;
        }

        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        if (!isset($body['note'])) {
            http_response_code(422);
            echo json_encode(['error' => "Le champ 'note' est requis"]);
            return;
        }

        $valeur = (float)$body['note'];
        if ($valeur < 0 || $valeur > 20) {
            http_response_code(422);
            echo json_encode(['error' => 'La note doit être comprise entre 0 et 20']);
            return;
        }

        $this->model->update($id, [
            'note'        => $valeur,
            'commentaire' => $body['commentaire'] ?? null,
        ]);

        echo json_encode(['message' => 'Note mise à jour']);
    }
}
