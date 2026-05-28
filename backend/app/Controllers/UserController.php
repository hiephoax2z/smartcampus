<?php

declare(strict_types=1);

require_once ROOT_PATH . '/app/Models/UserModel.php';

class UserController
{
    private UserModel $model;

    public function __construct()
    {
        $this->model = new UserModel();
    }

    public function index(): void
    {
        echo json_encode($this->model->findAll());
    }

    public function show(int $id): void
    {
        $user = $this->model->findById($id);

        if (!$user) {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
            return;
        }

        echo json_encode($user);
    }

    public function store(): void
    {
        $body = json_decode(file_get_contents('php://input'), true);

        if (empty($body['name']) || empty($body['email'])) {
            http_response_code(422);
            echo json_encode(['error' => 'name and email are required']);
            return;
        }

        $id = $this->model->create([
            'name'  => $body['name'],
            'email' => $body['email'],
        ]);

        http_response_code(201);
        echo json_encode(['id' => $id]);
    }
}
