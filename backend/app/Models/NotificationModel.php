<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Models/Model.php';

class NotificationModel extends Model
{
    protected string $table = 'notifications';

    public function findByUser(int $userId): array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM notifications WHERE utilisateur_id = ?
             ORDER BY created_at DESC LIMIT 30"
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function countUnread(int $userId): int
    {
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM notifications WHERE utilisateur_id = ? AND lu = 0"
        );
        $stmt->execute([$userId]);
        return (int) $stmt->fetchColumn();
    }

    public function markRead(int $id, int $userId): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE notifications SET lu = 1 WHERE id = ? AND utilisateur_id = ?"
        );
        $stmt->execute([$id, $userId]);
        return $stmt->rowCount() > 0;
    }

    public function markAllRead(int $userId): void
    {
        $stmt = $this->db->prepare(
            "UPDATE notifications SET lu = 1 WHERE utilisateur_id = ?"
        );
        $stmt->execute([$userId]);
    }
}
