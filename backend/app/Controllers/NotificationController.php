<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Models/NotificationModel.php';

class NotificationController
{
    private NotificationModel $model;

    public function __construct()
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        $this->model = new NotificationModel();
    }

    public function index(): void
    {
        $userId = $_SESSION['user']['id'];
        $notifs = $this->model->findByUser($userId);
        $unread = $this->model->countUnread($userId);
        echo json_encode(['notifications' => $notifs, 'unread' => $unread]);
    }

    public function unreadCount(): void
    {
        $userId = $_SESSION['user']['id'];
        echo json_encode(['unread' => $this->model->countUnread($userId)]);
    }

    public function markRead(int $id): void
    {
        $userId = $_SESSION['user']['id'];
        $this->model->markRead($id, $userId);
        echo json_encode(['message' => 'Notification lue']);
    }

    public function markAllRead(): void
    {
        $userId = $_SESSION['user']['id'];
        $this->model->markAllRead($userId);
        echo json_encode(['message' => 'Toutes les notifications lues']);
    }
}
