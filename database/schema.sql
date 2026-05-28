CREATE DATABASE IF NOT EXISTS smartcampus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smartcampus;

CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE utilisateurs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    actif TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE etudiants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id INT NOT NULL UNIQUE,
    numero_etudiant VARCHAR(20) NOT NULL UNIQUE,
    date_naissance DATE,
    telephone VARCHAR(20),
    niveau VARCHAR(50),
    filiere VARCHAR(100),
    annee_academique VARCHAR(20),
    statut ENUM('inscrit','suspendu','diplome') DEFAULT 'inscrit',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

CREATE TABLE enseignants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id INT NOT NULL UNIQUE,
    numero_enseignant VARCHAR(20) NOT NULL UNIQUE,
    telephone VARCHAR(20),
    departement VARCHAR(100),
    grade VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

CREATE TABLE cours (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) NOT NULL UNIQUE,
    nom VARCHAR(150) NOT NULL,
    description TEXT,
    credits INT DEFAULT 3,
    coefficient DECIMAL(3,1) DEFAULT 1.0,
    capacite_max INT DEFAULT 30,
    niveau VARCHAR(50),
    semestre VARCHAR(20),
    annee_academique VARCHAR(20),
    departement VARCHAR(100),
    enseignant_id INT,
    actif TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enseignant_id) REFERENCES enseignants(id) ON DELETE SET NULL
);

CREATE TABLE salles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(50) NOT NULL,
    capacite INT DEFAULT 30,
    batiment VARCHAR(50)
);

CREATE TABLE seances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cours_id INT NOT NULL,
    salle_id INT,
    jour_semaine ENUM('lundi','mardi','mercredi','jeudi','vendredi','samedi') NOT NULL,
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    type ENUM('cours','td','tp','examen') DEFAULT 'cours',
    FOREIGN KEY (cours_id) REFERENCES cours(id) ON DELETE CASCADE,
    FOREIGN KEY (salle_id) REFERENCES salles(id) ON DELETE SET NULL
);

CREATE TABLE inscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    etudiant_id INT NOT NULL,
    cours_id INT NOT NULL,
    date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut ENUM('actif','annule') DEFAULT 'actif',
    UNIQUE KEY unique_inscription (etudiant_id, cours_id),
    FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE,
    FOREIGN KEY (cours_id) REFERENCES cours(id) ON DELETE CASCADE
);

CREATE TABLE evaluations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cours_id INT NOT NULL,
    nom VARCHAR(100) NOT NULL,
    type ENUM('controle_continu','examen','tp','projet') DEFAULT 'controle_continu',
    coefficient DECIMAL(3,1) DEFAULT 1.0,
    date_evaluation DATE,
    verrouille TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cours_id) REFERENCES cours(id) ON DELETE CASCADE
);

CREATE TABLE notes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    etudiant_id INT NOT NULL,
    evaluation_id INT NOT NULL,
    note DECIMAL(4,2) CHECK (note >= 0 AND note <= 20),
    commentaire TEXT,
    saisie_par INT NOT NULL,
    date_saisie TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_note (etudiant_id, evaluation_id),
    FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE,
    FOREIGN KEY (saisie_par) REFERENCES enseignants(id)
);

CREATE TABLE presences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    etudiant_id INT NOT NULL,
    seance_id INT NOT NULL,
    statut ENUM('present','absent','retard','excuse') DEFAULT 'absent',
    commentaire VARCHAR(255),
    enregistre_par INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_presence (etudiant_id, seance_id),
    FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE,
    FOREIGN KEY (seance_id) REFERENCES seances(id) ON DELETE CASCADE,
    FOREIGN KEY (enregistre_par) REFERENCES enseignants(id) ON DELETE SET NULL
);

CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id INT NOT NULL,
    titre VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('note','absence','cours','emploi_du_temps','general') DEFAULT 'general',
    lu TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

INSERT INTO roles (nom) VALUES ('admin'), ('enseignant'), ('etudiant');
