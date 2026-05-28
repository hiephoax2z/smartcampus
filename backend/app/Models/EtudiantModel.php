<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Models/Model.php';

class EtudiantModel extends Model
{
    protected string $table = 'etudiants';

    public function findAll(): array
    {
        $stmt = $this->db->query(
            "SELECT e.*, u.nom, u.prenom, u.email, u.actif, r.nom AS role,
                    (SELECT ROUND(AVG(n.note), 1)
                     FROM notes n
                     JOIN evaluations ev ON ev.id = n.evaluation_id
                     JOIN inscriptions i ON i.cours_id = ev.cours_id AND i.etudiant_id = e.id
                    ) AS moyenne
             FROM etudiants e
             JOIN utilisateurs u ON u.id = e.utilisateur_id
             JOIN roles r ON r.id = u.role_id
             ORDER BY u.nom, u.prenom"
        );
        return $stmt->fetchAll();
    }

    public function findById(int $id): array|false
    {
        $stmt = $this->db->prepare(
            "SELECT e.*, u.nom, u.prenom, u.email, u.actif, r.nom AS role
             FROM etudiants e
             JOIN utilisateurs u ON u.id = e.utilisateur_id
             JOIN roles r ON r.id = u.role_id
             WHERE e.id = ?"
        );
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function createWithUser(array $user, array $etudiant): int
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
                3, // rôle étudiant
            ]);
            $utilisateurId = (int) $this->db->lastInsertId();

            $stmt = $this->db->prepare(
                "INSERT INTO etudiants
                    (utilisateur_id, numero_etudiant, date_naissance, telephone, niveau, filiere, annee_academique)
                 VALUES (?, ?, ?, ?, ?, ?, ?)"
            );
            $stmt->execute([
                $utilisateurId,
                $etudiant['numero_etudiant'],
                $etudiant['date_naissance'] ?? null,
                $etudiant['telephone']      ?? null,
                $etudiant['niveau']         ?? null,
                $etudiant['filiere']        ?? null,
                $etudiant['annee_academique'] ?? null,
            ]);
            $etudiantId = (int) $this->db->lastInsertId();

            $this->db->commit();
            return $etudiantId;
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function update(int $id, array $user, array $etudiant): bool
    {
        $this->db->beginTransaction();
        try {
            if (!empty($user)) {
                $sets = implode(', ', array_map(fn($k) => "$k = ?", array_keys($user)));
                $stmt = $this->db->prepare(
                    "UPDATE utilisateurs u
                     JOIN etudiants e ON e.utilisateur_id = u.id
                     SET $sets
                     WHERE e.id = ?"
                );
                $stmt->execute([...array_values($user), $id]);
            }

            if (!empty($etudiant)) {
                $sets = implode(', ', array_map(fn($k) => "$k = ?", array_keys($etudiant)));
                $stmt = $this->db->prepare("UPDATE etudiants SET $sets WHERE id = ?");
                $stmt->execute([...array_values($etudiant), $id]);
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
        // CASCADE supprime l'étudiant automatiquement
        $stmt = $this->db->prepare(
            "DELETE u FROM utilisateurs u
             JOIN etudiants e ON e.utilisateur_id = u.id
             WHERE e.id = ?"
        );
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}
