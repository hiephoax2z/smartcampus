<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Models/Model.php';

class NoteModel extends Model
{
    protected string $table = 'notes';

    public function findByEtudiant(int $etudiantId): array
    {
        $stmt = $this->db->prepare(
            "SELECT n.*, ev.nom AS evaluation_nom, ev.type AS evaluation_type,
                    ev.coefficient, ev.verrouille,
                    c.code AS cours_code, c.nom AS cours_nom
             FROM notes n
             JOIN evaluations ev ON ev.id = n.evaluation_id
             JOIN cours c ON c.id = ev.cours_id
             WHERE n.etudiant_id = ?
             ORDER BY c.code, ev.date_evaluation"
        );
        $stmt->execute([$etudiantId]);
        $notes = $stmt->fetchAll();

        $moyenne = null;
        if (!empty($notes)) {
            $somme       = 0.0;
            $coeffTotal  = 0.0;
            foreach ($notes as $n) {
                if ($n['note'] !== null) {
                    $somme      += (float)$n['note'] * (float)$n['coefficient'];
                    $coeffTotal += (float)$n['coefficient'];
                }
            }
            $moyenne = $coeffTotal > 0 ? round($somme / $coeffTotal, 2) : null;
        }

        return ['notes' => $notes, 'moyenne' => $moyenne];
    }

    public function findByEvaluation(int $evaluationId): array
    {
        $stmt = $this->db->prepare(
            "SELECT n.id, n.etudiant_id, n.evaluation_id, n.note, n.commentaire, n.saisie_par,
                    u.nom, u.prenom, e.numero_etudiant, e.niveau, e.filiere
             FROM notes n
             JOIN etudiants e ON e.id = n.etudiant_id
             JOIN utilisateurs u ON u.id = e.utilisateur_id
             WHERE n.evaluation_id = ?
             ORDER BY u.nom, u.prenom"
        );
        $stmt->execute([$evaluationId]);
        return $stmt->fetchAll();
    }

    public function findByCours(int $coursId): array
    {
        $stmt = $this->db->prepare(
            "SELECT n.*, u.nom, u.prenom, e.numero_etudiant,
                    ev.nom AS evaluation_nom, ev.type AS evaluation_type, ev.coefficient
             FROM notes n
             JOIN etudiants e ON e.id = n.etudiant_id
             JOIN utilisateurs u ON u.id = e.utilisateur_id
             JOIN evaluations ev ON ev.id = n.evaluation_id
             WHERE ev.cours_id = ?
             ORDER BY ev.date_evaluation, u.nom, u.prenom"
        );
        $stmt->execute([$coursId]);
        return $stmt->fetchAll();
    }

    public function isEvaluationVerrouillee(int $evaluationId): bool
    {
        $stmt = $this->db->prepare("SELECT verrouille FROM evaluations WHERE id = ?");
        $stmt->execute([$evaluationId]);
        return (bool) $stmt->fetchColumn();
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            "INSERT INTO notes (etudiant_id, evaluation_id, note, commentaire, saisie_par)
             VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $data['etudiant_id'],
            $data['evaluation_id'],
            $data['note'],
            $data['commentaire'] ?? null,
            $data['saisie_par'],
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE notes SET note = ?, commentaire = ? WHERE id = ?"
        );
        $stmt->execute([
            $data['note'],
            $data['commentaire'] ?? null,
            $id,
        ]);
        return $stmt->rowCount() > 0;
    }

    public function findById(int $id): array|false
    {
        $stmt = $this->db->prepare(
            "SELECT n.*, ev.verrouille
             FROM notes n
             JOIN evaluations ev ON ev.id = n.evaluation_id
             WHERE n.id = ?"
        );
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
}
