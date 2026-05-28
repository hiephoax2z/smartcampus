<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Models/CoursModel.php';

class CoursController
{
    private CoursModel $model;

    public function __construct()
    {
        $this->model = new CoursModel();
    }

    public function index(): void
    {
        echo json_encode($this->model->findAll());
    }

    public function show(int $id): void
    {
        $cours = $this->model->findById($id);

        if (!$cours) {
            http_response_code(404);
            echo json_encode(['error' => 'Cours introuvable']);
            return;
        }

        echo json_encode($cours);
    }

    public function store(): void
    {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        foreach (['code', 'nom'] as $field) {
            if (empty($body[$field])) {
                http_response_code(422);
                echo json_encode(['error' => "Le champ '$field' est requis"]);
                return;
            }
        }

        try {
            $id = $this->model->create($body);
            http_response_code(201);
            echo json_encode(['id' => $id]);
        } catch (\PDOException $e) {
            http_response_code(409);
            echo json_encode(['error' => 'Code cours déjà utilisé']);
        }
    }

    public function update(int $id): void
    {
        $cours = $this->model->findById($id);
        if (!$cours) {
            http_response_code(404);
            echo json_encode(['error' => 'Cours introuvable']);
            return;
        }

        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $this->model->update($id, $body);
        echo json_encode(['message' => 'Cours mis à jour']);
    }

    public function destroy(int $id): void
    {
        $cours = $this->model->findById($id);
        if (!$cours) {
            http_response_code(404);
            echo json_encode(['error' => 'Cours introuvable']);
            return;
        }

        $this->model->disable($id);
        echo json_encode(['message' => 'Cours désactivé']);
    }

    /* Cours de l'étudiant connecté avec ses stats personnelles */
    public function mesCours(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        $uid = $_SESSION['user']['id'] ?? null;
        if (!$uid) { http_response_code(401); echo json_encode(['error' => 'Non authentifié']); return; }

        $db = getConnection();

        // ID étudiant
        $stmt = $db->prepare("SELECT id FROM etudiants WHERE utilisateur_id = ?");
        $stmt->execute([$uid]);
        $etudiantId = $stmt->fetchColumn();
        if (!$etudiantId) { echo json_encode(['enrolled' => [], 'catalogue' => []]); return; }

        // Cours inscrits avec stats
        $enrolled = $db->prepare("
            SELECT c.id, c.code, c.nom, c.credits, c.semestre, c.niveau, c.capacite_max, c.departement,
                   CONCAT(u.prenom,' ',u.nom) AS enseignant_nom,
                   (SELECT COUNT(*) FROM seances s WHERE s.cours_id = c.id) AS nb_seances,
                   (SELECT COUNT(*) FROM evaluations e WHERE e.cours_id = c.id) AS nb_evals,
                   (SELECT COUNT(*) FROM inscriptions i2 WHERE i2.cours_id = c.id) AS nb_inscrits,
                   (SELECT ROUND(AVG(n.note),2) FROM notes n
                    JOIN evaluations ev ON ev.id = n.evaluation_id
                    WHERE ev.cours_id = c.id AND n.etudiant_id = :eid) AS ma_moyenne,
                   (SELECT COUNT(*) FROM notes n
                    JOIN evaluations ev ON ev.id = n.evaluation_id
                    WHERE ev.cours_id = c.id AND n.etudiant_id = :eid2) AS nb_notes_saisies,
                   (SELECT MIN(CONCAT(s2.jour_semaine,' ',s2.heure_debut))
                    FROM seances s2 WHERE s2.cours_id = c.id) AS prochaine_seance_raw,
                   (SELECT s2.jour_semaine FROM seances s2 WHERE s2.cours_id = c.id
                    ORDER BY FIELD(s2.jour_semaine,'lundi','mardi','mercredi','jeudi','vendredi'), s2.heure_debut LIMIT 1) AS prochaine_jour,
                   (SELECT s2.heure_debut FROM seances s2 WHERE s2.cours_id = c.id
                    ORDER BY FIELD(s2.jour_semaine,'lundi','mardi','mercredi','jeudi','vendredi'), s2.heure_debut LIMIT 1) AS prochaine_heure
            FROM cours c
            JOIN inscriptions i ON i.cours_id = c.id AND i.etudiant_id = :eid3
            LEFT JOIN enseignants en ON en.id = c.enseignant_id
            LEFT JOIN utilisateurs u ON u.id = en.utilisateur_id
            WHERE c.actif = 1
            ORDER BY c.code
        ");
        $enrolled->execute([':eid'=>$etudiantId,':eid2'=>$etudiantId,':eid3'=>$etudiantId]);
        $enrolledData = $enrolled->fetchAll();

        // Cours non inscrits (catalogue)
        $catalogue = $db->prepare("
            SELECT c.id, c.code, c.nom, c.credits, c.semestre, c.niveau, c.capacite_max,
                   (SELECT COUNT(*) FROM inscriptions i2 WHERE i2.cours_id = c.id) AS nb_inscrits
            FROM cours c
            WHERE c.actif = 1
              AND c.id NOT IN (SELECT cours_id FROM inscriptions WHERE etudiant_id = ?)
            ORDER BY c.code
        ");
        $catalogue->execute([$etudiantId]);

        echo json_encode(['enrolled' => $enrolledData, 'catalogue' => $catalogue->fetchAll()]);
    }
}
