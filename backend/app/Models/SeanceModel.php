<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Models/Model.php';

class SeanceModel extends Model
{
    protected string $table = 'seances';

    public function findByCours(int $coursId): array
    {
        $stmt = $this->db->prepare(
            "SELECT s.*, c.code AS cours_code, c.nom AS cours_nom,
                    sa.nom AS salle_nom, sa.batiment
             FROM seances s
             JOIN cours c ON c.id = s.cours_id
             LEFT JOIN salles sa ON sa.id = s.salle_id
             WHERE s.cours_id = ?
             ORDER BY FIELD(s.jour_semaine,'lundi','mardi','mercredi','jeudi','vendredi','samedi'),
                      s.heure_debut"
        );
        $stmt->execute([$coursId]);
        return $stmt->fetchAll();
    }

    public function findByEtudiant(int $etudiantId): array
    {
        $stmt = $this->db->prepare(
            "SELECT s.*, c.code AS cours_code, c.nom AS cours_nom,
                    sa.nom AS salle_nom, sa.batiment,
                    CONCAT(u.prenom, ' ', u.nom) AS enseignant_nom
             FROM seances s
             JOIN cours c ON c.id = s.cours_id
             JOIN inscriptions i ON i.cours_id = c.id
             LEFT JOIN salles sa ON sa.id = s.salle_id
             LEFT JOIN enseignants en ON en.id = c.enseignant_id
             LEFT JOIN utilisateurs u ON u.id = en.utilisateur_id
             WHERE i.etudiant_id = ? AND i.statut = 'actif'
             ORDER BY FIELD(s.jour_semaine,'lundi','mardi','mercredi','jeudi','vendredi','samedi'),
                      s.heure_debut"
        );
        $stmt->execute([$etudiantId]);
        return $stmt->fetchAll();
    }

    public function findByEnseignant(int $enseignantId): array
    {
        $stmt = $this->db->prepare(
            "SELECT s.*, c.code AS cours_code, c.nom AS cours_nom,
                    sa.nom AS salle_nom, sa.batiment,
                    COUNT(i.id) AS nb_inscrits
             FROM seances s
             JOIN cours c ON c.id = s.cours_id
             LEFT JOIN salles sa ON sa.id = s.salle_id
             LEFT JOIN inscriptions i ON i.cours_id = c.id AND i.statut = 'actif'
             WHERE c.enseignant_id = ?
             GROUP BY s.id
             ORDER BY FIELD(s.jour_semaine,'lundi','mardi','mercredi','jeudi','vendredi','samedi'),
                      s.heure_debut"
        );
        $stmt->execute([$enseignantId]);
        return $stmt->fetchAll();
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            "INSERT INTO seances
                (cours_id, salle_id, jour_semaine, heure_debut, heure_fin, date_debut, date_fin, type)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $data['cours_id'],
            $data['salle_id']    ?? null,
            $data['jour_semaine'],
            $data['heure_debut'],
            $data['heure_fin'],
            $data['date_debut'],
            $data['date_fin'],
            $data['type']        ?? 'cours',
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $allowed  = ['cours_id','salle_id','jour_semaine','heure_debut','heure_fin',
                     'date_debut','date_fin','type'];
        $filtered = array_filter($data, fn($k) => in_array($k, $allowed, true), ARRAY_FILTER_USE_KEY);

        if (empty($filtered)) {
            return false;
        }

        $sets = implode(', ', array_map(fn($k) => "$k = ?", array_keys($filtered)));
        $stmt = $this->db->prepare("UPDATE seances SET $sets WHERE id = ?");
        $stmt->execute([...array_values($filtered), $id]);
        return $stmt->rowCount() > 0;
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM seances WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }

    public function findById(int $id): array|false
    {
        $stmt = $this->db->prepare("SELECT * FROM seances WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
}
