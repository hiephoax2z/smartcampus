<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Models/Model.php';

class PresenceModel extends Model
{
    protected string $table = 'presences';

    public function findBySeance(int $seanceId): array
    {
        $stmt = $this->db->prepare(
            "SELECT p.*, u.nom, u.prenom, e.numero_etudiant
             FROM presences p
             JOIN etudiants e ON e.id = p.etudiant_id
             JOIN utilisateurs u ON u.id = e.utilisateur_id
             WHERE p.seance_id = ?
             ORDER BY u.nom, u.prenom"
        );
        $stmt->execute([$seanceId]);
        return $stmt->fetchAll();
    }

    public function findByEtudiant(int $etudiantId): array
    {
        $stmt = $this->db->prepare(
            "SELECT p.*, s.jour_semaine, s.heure_debut, s.heure_fin,
                    c.code AS cours_code, c.nom AS cours_nom
             FROM presences p
             JOIN seances s ON s.id = p.seance_id
             JOIN cours c ON c.id = s.cours_id
             WHERE p.etudiant_id = ?
             ORDER BY p.created_at DESC"
        );
        $stmt->execute([$etudiantId]);
        return $stmt->fetchAll();
    }

    public function initSeance(int $seanceId, int $enseignantId): int
    {
        // Récupère tous les inscrits au cours de cette séance
        $stmt = $this->db->prepare(
            "SELECT i.etudiant_id FROM inscriptions i
             JOIN seances s ON s.cours_id = i.cours_id
             WHERE s.id = ? AND i.statut = 'actif'"
        );
        $stmt->execute([$seanceId]);
        $etudiants = $stmt->fetchAll();

        $count = 0;
        foreach ($etudiants as $e) {
            $check = $this->db->prepare(
                "SELECT id FROM presences WHERE etudiant_id = ? AND seance_id = ?"
            );
            $check->execute([$e['etudiant_id'], $seanceId]);
            if (!$check->fetch()) {
                $ins = $this->db->prepare(
                    "INSERT INTO presences (etudiant_id, seance_id, statut, enregistre_par)
                     VALUES (?, ?, 'absent', ?)"
                );
                $ins->execute([$e['etudiant_id'], $seanceId, $enseignantId]);
                $count++;
            }
        }
        return $count;
    }

    public function updateStatut(int $id, string $statut, ?string $commentaire, int $enseignantId): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE presences SET statut = ?, commentaire = ?, enregistre_par = ? WHERE id = ?"
        );
        $stmt->execute([$statut, $commentaire, $enseignantId, $id]);
        return $stmt->rowCount() > 0;
    }

    public function upsert(int $etudiantId, int $seanceId, string $statut, ?string $commentaire, int $enseignantId): void
    {
        $stmt = $this->db->prepare(
            "INSERT INTO presences (etudiant_id, seance_id, statut, commentaire, enregistre_par)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE statut = VALUES(statut), commentaire = VALUES(commentaire),
             enregistre_par = VALUES(enregistre_par)"
        );
        $stmt->execute([$etudiantId, $seanceId, $statut, $commentaire, $enseignantId]);
    }
}
