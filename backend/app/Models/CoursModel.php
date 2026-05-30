<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Models/Model.php';

class CoursModel extends Model
{
    protected string $table = 'cours';

    //selection de tout les cours
    public function findAll(): array
    {
        $stmt = $this->db->query(
            "SELECT c.*, CONCAT(u.prenom, ' ', u.nom) AS enseignant_nom
             FROM cours c
             LEFT JOIN enseignants en ON en.id = c.enseignant_id
             LEFT JOIN utilisateurs u ON u.id = en.utilisateur_id
             WHERE c.actif = 1
             ORDER BY c.code"
        );
        return $stmt->fetchAll();
    }

    //selection d'un cour par ID
    public function findById(int $id): array|false
    {
        $stmt = $this->db->prepare(
            "SELECT c.*, CONCAT(u.prenom, ' ', u.nom) AS enseignant_nom,
                    en.departement AS enseignant_departement
             FROM cours c
             LEFT JOIN enseignants en ON en.id = c.enseignant_id
             LEFT JOIN utilisateurs u ON u.id = en.utilisateur_id
             WHERE c.id = ?"
        );
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    //creation d'un cours
    public function create(array $data): int
    {
        $fields = ['code','nom','description','credits','coefficient',
                   'capacite_max','niveau','semestre','annee_academique',
                   'departement','enseignant_id'];
        $values = [];
        $params = [];
        foreach ($fields as $f) {
            $values[] = $f . ' = ?';
            $params[]  = $data[$f] ?? null;
        }
        $stmt = $this->db->prepare(
            "INSERT INTO cours SET " . implode(', ', $values)
        );
        $stmt->execute($params);
        return (int) $this->db->lastInsertId();
    }

    //maj d'un cour
    public function update(int $id, array $data): bool
    {
        $allowed = ['code','nom','description','credits','coefficient',
                    'capacite_max','niveau','semestre','annee_academique',
                    'departement','enseignant_id'];
        $filtered = array_filter(
            $data,
            fn($k) => in_array($k, $allowed, true),
            ARRAY_FILTER_USE_KEY
        );

        if (empty($filtered)) {
            return false;
        }

        $sets = implode(', ', array_map(fn($k) => "$k = ?", array_keys($filtered)));
        $stmt = $this->db->prepare("UPDATE cours SET $sets WHERE id = ?");
        $stmt->execute([...array_values($filtered), $id]);
        return $stmt->rowCount() > 0;
    }

    //desactivation d'un cour
    public function disable(int $id): bool
    {
        $stmt = $this->db->prepare("UPDATE cours SET actif = 0 WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}
