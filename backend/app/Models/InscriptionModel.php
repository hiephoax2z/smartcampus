<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Models/Model.php';

class InscriptionModel extends Model
{
    protected string $table = 'inscriptions';

    //selection d'etudiant par ID
    public function findByEtudiant(int $etudiantId): array
    {
        $stmt = $this->db->prepare(
            "SELECT i.*, c.code, c.nom AS cours_nom, c.credits, c.semestre,
                    CONCAT(u.prenom, ' ', u.nom) AS enseignant_nom
             FROM inscriptions i
             JOIN cours c ON c.id = i.cours_id
             LEFT JOIN enseignants en ON en.id = c.enseignant_id
             LEFT JOIN utilisateurs u ON u.id = en.utilisateur_id
             WHERE i.etudiant_id = ? AND i.statut = 'actif'
             ORDER BY c.code"
        );
        $stmt->execute([$etudiantId]);
        return $stmt->fetchAll();
    }

    //selection cours par ID
    public function findByCours(int $coursId): array
    {
        $stmt = $this->db->prepare(
            "SELECT i.*, u.nom, u.prenom, u.email, e.numero_etudiant, e.niveau, e.filiere
             FROM inscriptions i
             JOIN etudiants e ON e.id = i.etudiant_id
             JOIN utilisateurs u ON u.id = e.utilisateur_id
             WHERE i.cours_id = ? AND i.statut = 'actif'
             ORDER BY u.nom, u.prenom"
        );
        $stmt->execute([$coursId]);
        return $stmt->fetchAll();
    }

    //verification d'inscription
    public function isAlreadyInscrit(int $etudiantId, int $coursId): bool
    {
        $stmt = $this->db->prepare(
            "SELECT id FROM inscriptions WHERE etudiant_id = ? AND cours_id = ? AND statut = 'actif'"
        );
        $stmt->execute([$etudiantId, $coursId]);
        return (bool) $stmt->fetch();
    }

    //compte le nombre d'inscrit
    public function countInscrits(int $coursId): int
    {
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM inscriptions WHERE cours_id = ? AND statut = 'actif'"
        );
        $stmt->execute([$coursId]);
        return (int) $stmt->fetchColumn();
    }

    //obtention de la capacité max
    public function getCapaciteMax(int $coursId): int
    {
        $stmt = $this->db->prepare("SELECT capacite_max FROM cours WHERE id = ?");
        $stmt->execute([$coursId]);
        return (int) $stmt->fetchColumn();
    }

    //inscription
    public function inscrire(int $etudiantId, int $coursId): int
    {
        $stmt = $this->db->prepare(
            "INSERT INTO inscriptions (etudiant_id, cours_id) VALUES (?, ?)"
        );
        $stmt->execute([$etudiantId, $coursId]);
        return (int) $this->db->lastInsertId();
    }

    //annulation d'inscription
    public function annuler(int $id): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE inscriptions SET statut = 'annule' WHERE id = ?"
        );
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}
