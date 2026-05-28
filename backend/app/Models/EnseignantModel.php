<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Models/Model.php';

class EnseignantModel extends Model
{
    protected string $table = 'enseignants';

    public function findAll(): array
    {
        $stmt = $this->db->query(
            "SELECT en.*, u.nom, u.prenom, u.email, u.actif, r.nom AS role,
                    (SELECT COUNT(*) FROM cours c WHERE c.enseignant_id = en.id AND c.actif = 1) AS nb_cours
             FROM enseignants en
             JOIN utilisateurs u ON u.id = en.utilisateur_id
             JOIN roles r ON r.id = u.role_id
             ORDER BY u.nom, u.prenom"
        );
        return $stmt->fetchAll();
    }

    public function findById(int $id): array|false
    {
        $stmt = $this->db->prepare(
            "SELECT en.*, u.nom, u.prenom, u.email, u.actif, r.nom AS role
             FROM enseignants en
             JOIN utilisateurs u ON u.id = en.utilisateur_id
             JOIN roles r ON r.id = u.role_id
             WHERE en.id = ?"
        );
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function createWithUser(array $user, array $enseignant): int
    {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role_id)
                 VALUES (?, ?, ?, ?, ?)"
            );
            $stmt->execute([
                $user['nom'],
                $user['prenom'],
                $user['email'],
                password_hash($user['password'], PASSWORD_BCRYPT),
                2, // rôle enseignant
            ]);
            $utilisateurId = (int) $this->db->lastInsertId();

            $stmt = $this->db->prepare(
                "INSERT INTO enseignants
                    (utilisateur_id, numero_enseignant, telephone, departement, grade)
                 VALUES (?, ?, ?, ?, ?)"
            );
            $stmt->execute([
                $utilisateurId,
                $enseignant['numero_enseignant'],
                $enseignant['telephone']   ?? null,
                $enseignant['departement'] ?? null,
                $enseignant['grade']       ?? null,
            ]);
            $enseignantId = (int) $this->db->lastInsertId();

            $this->db->commit();
            return $enseignantId;
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function update(int $id, array $user, array $enseignant): bool
    {
        $this->db->beginTransaction();
        try {
            if (!empty($user)) {
                $sets = implode(', ', array_map(fn($k) => "$k = ?", array_keys($user)));
                $stmt = $this->db->prepare(
                    "UPDATE utilisateurs u
                     JOIN enseignants en ON en.utilisateur_id = u.id
                     SET $sets
                     WHERE en.id = ?"
                );
                $stmt->execute([...array_values($user), $id]);
            }

            if (!empty($enseignant)) {
                $sets = implode(', ', array_map(fn($k) => "$k = ?", array_keys($enseignant)));
                $stmt = $this->db->prepare("UPDATE enseignants SET $sets WHERE id = ?");
                $stmt->execute([...array_values($enseignant), $id]);
            }

            $this->db->commit();
            return true;
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare(
            "DELETE u FROM utilisateurs u
             JOIN enseignants en ON en.utilisateur_id = u.id
             WHERE en.id = ?"
        );
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}
