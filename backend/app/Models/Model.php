<?php

declare(strict_types=1);
//classe abstraite utilisée pour les étudiants, cours, etc
abstract class Model
{
    protected PDO $db;
    protected string $table;


    public function __construct()
    {
        $this->db = getConnection();
    }

    //on doit pouvoir selectionner toutes les données d'une entité
    public function findAll(): array
    {
        $stmt = $this->db->query("SELECT * FROM {$this->table}");
        return $stmt->fetchAll();
    }

    //on doit pouvoir selectionne une entité en particulier par son id
    public function findById(int $id): array|false
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    //on doit pouvoir creer une entite
    public function create(array $data): int
    {
        $columns = implode(', ', array_keys($data));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));
        $stmt = $this->db->prepare("INSERT INTO {$this->table} ({$columns}) VALUES ({$placeholders})");
        $stmt->execute(array_values($data));
        return (int) $this->db->lastInsertId();
    }
}
