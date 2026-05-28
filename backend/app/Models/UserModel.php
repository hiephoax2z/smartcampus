<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Models/Model.php';

class UserModel extends Model
{
    protected string $table = 'utilisateurs';

    public function findByEmail(string $email): array|false
    {
        $stmt = $this->db->prepare(
            "SELECT u.*, r.nom AS role
             FROM utilisateurs u
             JOIN roles r ON r.id = u.role_id
             WHERE u.email = ? AND u.actif = 1"
        );
        $stmt->execute([$email]);
        return $stmt->fetch();
    }
}
