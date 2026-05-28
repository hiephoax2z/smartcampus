<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Models/Model.php';

class EvaluationModel extends Model
{
    protected string $table = 'evaluations';

    public function findByCours(int $coursId): array
    {
        $stmt = $this->db->prepare(
            "SELECT ev.*,
                    COUNT(n.id) AS nombre_notes,
                    ROUND(AVG(n.note), 2) AS moyenne_classe
             FROM evaluations ev
             LEFT JOIN notes n ON n.evaluation_id = ev.id
             WHERE ev.cours_id = ?
             GROUP BY ev.id
             ORDER BY ev.date_evaluation"
        );
        $stmt->execute([$coursId]);
        return $stmt->fetchAll();
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            "INSERT INTO evaluations (cours_id, nom, type, coefficient, date_evaluation)
             VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $data['cours_id'],
            $data['nom'],
            $data['type']             ?? 'controle_continu',
            $data['coefficient']      ?? 1.0,
            $data['date_evaluation']  ?? null,
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function verrouiller(int $id): bool
    {
        $stmt = $this->db->prepare("UPDATE evaluations SET verrouille = 1 WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}
