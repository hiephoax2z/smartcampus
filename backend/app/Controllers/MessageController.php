<?php

declare(strict_types=1);

class MessageController
{
    private PDO $db;
    private int $uid;

    public function __construct()
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        $this->db  = getConnection();
        $this->uid = $_SESSION['user']['id'] ?? 0;
    }

    /* Liste des conversations (une ligne par interlocuteur) */
    public function conversations(): void
    {
        $stmt = $this->db->prepare("
            SELECT
                other_id,
                MAX(last_msg)     AS last_msg,
                MAX(last_date)    AS last_date,
                SUM(unread)       AS unread,
                MAX(sujet)        AS sujet,
                MAX(nom)          AS nom,
                MAX(prenom)       AS prenom,
                MAX(role_nom)     AS role
            FROM (
                SELECT
                    CASE WHEN m.expediteur_id = :uid THEN m.destinataire_id ELSE m.expediteur_id END AS other_id,
                    SUBSTRING(m.corps, 1, 80)   AS last_msg,
                    m.created_at                AS last_date,
                    (m.destinataire_id = :uid2 AND m.lu = 0) AS unread,
                    m.sujet,
                    u.nom, u.prenom,
                    r.nom AS role_nom
                FROM messages m
                JOIN utilisateurs u ON u.id = CASE WHEN m.expediteur_id = :uid3 THEN m.destinataire_id ELSE m.expediteur_id END
                JOIN roles r ON r.id = u.role_id
                WHERE m.expediteur_id = :uid4 OR m.destinataire_id = :uid5
            ) sub
            GROUP BY other_id
            ORDER BY last_date DESC
        ");
        $stmt->execute([
            ':uid'=>$this->uid,':uid2'=>$this->uid,':uid3'=>$this->uid,
            ':uid4'=>$this->uid,':uid5'=>$this->uid,
        ]);
        echo json_encode($stmt->fetchAll());
    }

    /* Messages d'une conversation avec un utilisateur */
    public function conversation(int $otherId): void
    {
        $stmt = $this->db->prepare("
            SELECT m.id, m.expediteur_id, m.destinataire_id, m.sujet, m.corps, m.lu, m.created_at,
                   u.nom AS exp_nom, u.prenom AS exp_prenom,
                   r.nom AS exp_role
            FROM messages m
            JOIN utilisateurs u ON u.id = m.expediteur_id
            JOIN roles r ON r.id = u.role_id
            WHERE (m.expediteur_id = :uid AND m.destinataire_id = :other)
               OR (m.expediteur_id = :other2 AND m.destinataire_id = :uid2)
            ORDER BY m.created_at ASC
        ");
        $stmt->execute([':uid'=>$this->uid,':other'=>$otherId,':other2'=>$otherId,':uid2'=>$this->uid]);
        $messages = $stmt->fetchAll();

        // Marquer comme lus
        $this->db->prepare("
            UPDATE messages SET lu = 1
            WHERE destinataire_id = ? AND expediteur_id = ? AND lu = 0
        ")->execute([$this->uid, $otherId]);

        echo json_encode($messages);
    }

    /* Envoyer un message */
    public function send(): void
    {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        if (empty($body['destinataire_id']) || empty($body['corps'])) {
            http_response_code(422);
            echo json_encode(['error' => 'destinataire_id et corps requis']);
            return;
        }

        $stmt = $this->db->prepare("
            INSERT INTO messages (expediteur_id, destinataire_id, sujet, corps)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([
            $this->uid,
            (int)$body['destinataire_id'],
            $body['sujet'] ?? '',
            $body['corps'],
        ]);
        $id = (int)$this->db->lastInsertId();

        $msg = $this->db->prepare("
            SELECT m.*, u.nom AS exp_nom, u.prenom AS exp_prenom, r.nom AS exp_role
            FROM messages m
            JOIN utilisateurs u ON u.id = m.expediteur_id
            JOIN roles r ON r.id = u.role_id
            WHERE m.id = ?
        ");
        $msg->execute([$id]);
        http_response_code(201);
        echo json_encode($msg->fetch());
    }

    /* Liste des utilisateurs contactables */
    public function contacts(): void
    {
        $stmt = $this->db->prepare("
            SELECT u.id, u.nom, u.prenom, r.nom AS role
            FROM utilisateurs u
            JOIN roles r ON r.id = u.role_id
            WHERE u.id != ? AND u.actif = 1
            ORDER BY r.nom, u.nom, u.prenom
        ");
        $stmt->execute([$this->uid]);
        echo json_encode($stmt->fetchAll());
    }
}
