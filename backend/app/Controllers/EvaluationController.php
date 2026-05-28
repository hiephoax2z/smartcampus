<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Models/EvaluationModel.php';

class EvaluationController
{
    private EvaluationModel $model;

    public function __construct()
    {
        $this->model = new EvaluationModel();
    }

    public function index(): void
    {
        $coursId = isset($_GET['cours_id']) ? (int)$_GET['cours_id'] : null;

        if (!$coursId) {
            http_response_code(400);
            echo json_encode(['error' => 'Paramètre cours_id requis']);
            return;
        }

        echo json_encode($this->model->findByCours($coursId));
    }

    public function store(): void
    {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        foreach (['cours_id', 'nom'] as $field) {
            if (empty($body[$field])) {
                http_response_code(422);
                echo json_encode(['error' => "Le champ '$field' est requis"]);
                return;
            }
        }

        $typesValides = ['controle_continu', 'examen', 'tp', 'projet'];
        if (isset($body['type']) && !in_array($body['type'], $typesValides, true)) {
            http_response_code(422);
            echo json_encode(['error' => 'Type invalide. Valeurs : ' . implode(', ', $typesValides)]);
            return;
        }

        $id = $this->model->create($body);
        http_response_code(201);
        echo json_encode(['id' => $id]);
    }

    public function verrouiller(int $id): void
    {
        $verrouille = $this->model->verrouiller($id);

        if (!$verrouille) {
            http_response_code(404);
            echo json_encode(['error' => 'Évaluation introuvable']);
            return;
        }

        echo json_encode(['message' => 'Évaluation verrouillée']);
    }
}
