<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Models/PresenceModel.php';

class PresenceController
{
    private PresenceModel $model;

    public function __construct()
    {
        $this->model = new PresenceModel();
    }

    public function index(): void
    {
        $seanceId   = isset($_GET['seance_id'])   ? (int)$_GET['seance_id']   : null;
        $etudiantId = isset($_GET['etudiant_id']) ? (int)$_GET['etudiant_id'] : null;

        if ($seanceId) {
            echo json_encode($this->model->findBySeance($seanceId));
            return;
        }
        if ($etudiantId) {
            echo json_encode($this->model->findByEtudiant($etudiantId));
            return;
        }

        http_response_code(400);
        echo json_encode(['error' => 'Paramètre seance_id ou etudiant_id requis']);
    }

    public function init(int $seanceId): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();

        // Récupère l'enseignant_id depuis le session user_id
        $db = getConnection();
        $stmt = $db->prepare("SELECT id FROM enseignants WHERE utilisateur_id = ?");
        $stmt->execute([$_SESSION['user']['id']]);
        $enseignant = $stmt->fetch();

        if (!$enseignant) {
            http_response_code(403);
            echo json_encode(['error' => 'Profil enseignant requis']);
            return;
        }

        $count = $this->model->initSeance($seanceId, $enseignant['id']);
        echo json_encode(['message' => "Feuille de présence initialisée", 'created' => $count]);
    }

    /* Bilan de présence pour l'étudiant connecté */
    public function bilanEtudiant(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        $uid = $_SESSION['user']['id'] ?? null;
        if (!$uid) { http_response_code(401); echo json_encode(['error' => 'Non authentifié']); return; }

        $db = getConnection();
        $stmt = $db->prepare("SELECT id FROM etudiants WHERE utilisateur_id = ?");
        $stmt->execute([$uid]);
        $etudiantId = $stmt->fetchColumn();
        if (!$etudiantId) { echo json_encode(['taux_global'=>0,'nb_presences'=>0,'nb_absences'=>0,'nb_retards'=>0,'nb_excuses'=>0,'heatmap'=>[],'par_cours'=>[],'historique'=>[]]); return; }

        // Statistiques globales
        $stats = $db->prepare("
            SELECT
              COUNT(*) AS total,
              SUM(statut='present') AS nb_presences,
              SUM(statut='absent')  AS nb_absences,
              SUM(statut='retard')  AS nb_retards,
              SUM(statut='excuse')  AS nb_excuses
            FROM presences WHERE etudiant_id = ?
        ");
        $stats->execute([$etudiantId]);
        $s = $stats->fetch();
        $total = (int)$s['total'];
        $taux  = $total > 0 ? round(((int)$s['nb_presences'] + (int)$s['nb_retards']) / $total * 100) : 0;

        // Heatmap — 90 derniers jours
        $heatmap = $db->prepare("
            SELECT date_seance AS date, statut
            FROM presences
            WHERE etudiant_id = ? AND date_seance >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
            ORDER BY date_seance
        ");
        $heatmap->execute([$etudiantId]);

        // Par cours
        $parCours = $db->prepare("
            SELECT c.code, c.nom,
                   COUNT(*) AS total,
                   SUM(p.statut IN ('present','retard')) AS nb_ok
            FROM presences p
            JOIN seances s ON s.id = p.seance_id
            JOIN cours c ON c.id = s.cours_id
            WHERE p.etudiant_id = ?
            GROUP BY c.id ORDER BY c.code
        ");
        $parCours->execute([$etudiantId]);
        $parCoursData = array_map(function($r) {
            return [
                'code'  => $r['code'],
                'nom'   => $r['nom'],
                'taux'  => $r['total'] > 0 ? round(((int)$r['nb_ok']) / (int)$r['total'] * 100) : 0,
                'total' => (int)$r['total'],
            ];
        }, $parCours->fetchAll());

        // Historique récent
        $historique = $db->prepare("
            SELECT p.id, p.date_seance, p.statut, p.commentaire,
                   s.heure_debut, s.heure_fin, s.type AS seance_type,
                   c.code AS cours_code, c.nom AS cours_nom
            FROM presences p
            JOIN seances s ON s.id = p.seance_id
            JOIN cours c ON c.id = s.cours_id
            WHERE p.etudiant_id = ?
            ORDER BY p.date_seance DESC, s.heure_debut DESC
            LIMIT 30
        ");
        $historique->execute([$etudiantId]);

        echo json_encode([
            'taux_global'  => $taux,
            'nb_presences' => (int)$s['nb_presences'],
            'nb_absences'  => (int)$s['nb_absences'],
            'nb_retards'   => (int)$s['nb_retards'],
            'nb_excuses'   => (int)$s['nb_excuses'],
            'heatmap'      => $heatmap->fetchAll(),
            'par_cours'    => $parCoursData,
            'historique'   => $historique->fetchAll(),
        ]);
    }

    public function upsert(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();

        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        foreach (['etudiant_id', 'seance_id', 'statut'] as $f) {
            if (empty($body[$f])) {
                http_response_code(422);
                echo json_encode(['error' => "Champ '$f' requis"]);
                return;
            }
        }

        $statutsValides = ['present', 'absent', 'retard', 'excuse'];
        if (!in_array($body['statut'], $statutsValides, true)) {
            http_response_code(422);
            echo json_encode(['error' => 'Statut invalide']);
            return;
        }

        $db = getConnection();
        $stmt = $db->prepare("SELECT id FROM enseignants WHERE utilisateur_id = ?");
        $stmt->execute([$_SESSION['user']['id']]);
        $enseignant = $stmt->fetch();
        $enseignantId = $enseignant ? $enseignant['id'] : 1;

        $this->model->upsert(
            (int)$body['etudiant_id'],
            (int)$body['seance_id'],
            $body['statut'],
            $body['commentaire'] ?? null,
            $enseignantId
        );

        echo json_encode(['message' => 'Présence enregistrée']);
    }
}
