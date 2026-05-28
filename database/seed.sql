USE smartcampus;

-- ─────────────────────────────────────────
-- UTILISATEURS
-- mots de passe : "password" hashé bcrypt
-- ─────────────────────────────────────────
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role_id) VALUES
-- admin
('Admin',       'System',    'admin@smartcampus.fr',         '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
-- enseignants (role_id = 2)
('Moreau',      'Julien',    'j.moreau@smartcampus.fr',      '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2),
('Benali',      'Samira',    's.benali@smartcampus.fr',      '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2),
('Lefebvre',    'Thomas',    't.lefebvre@smartcampus.fr',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2),
-- étudiants (role_id = 3)
('Dupont',      'Lucas',     'l.dupont@etu.smartcampus.fr',  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3),
('Martin',      'Chloé',     'c.martin@etu.smartcampus.fr',  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3),
('Nguyen',      'Kevin',     'k.nguyen@etu.smartcampus.fr',  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3),
('Bernard',     'Emma',      'e.bernard@etu.smartcampus.fr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3),
('Rousseau',    'Maxime',    'm.rousseau@etu.smartcampus.fr','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3);

-- ─────────────────────────────────────────
-- ENSEIGNANTS
-- utilisateur_id : 2, 3, 4
-- ─────────────────────────────────────────
INSERT INTO enseignants (utilisateur_id, numero_enseignant, telephone, departement, grade) VALUES
(2, 'ENS-001', '06 11 22 33 44', 'Informatique',       'Maître de conférences'),
(3, 'ENS-002', '06 55 66 77 88', 'Mathématiques',      'Professeur agrégé'),
(4, 'ENS-003', '06 99 00 11 22', 'Réseaux & Systèmes', 'Ingénieur pédagogique');

-- ─────────────────────────────────────────
-- ÉTUDIANTS
-- utilisateur_id : 5, 6, 7, 8, 9
-- ─────────────────────────────────────────
INSERT INTO etudiants (utilisateur_id, numero_etudiant, date_naissance, telephone, niveau, filiere, annee_academique, statut) VALUES
(5, 'ETU-2024-001', '2003-04-12', '07 10 20 30 40', 'Licence 3', 'Informatique',       '2024-2025', 'inscrit'),
(6, 'ETU-2024-002', '2003-09-25', '07 11 21 31 41', 'Licence 3', 'Informatique',       '2024-2025', 'inscrit'),
(7, 'ETU-2024-003', '2002-12-01', '07 12 22 32 42', 'Master 1',  'Réseaux & Sécurité', '2024-2025', 'inscrit'),
(8, 'ETU-2024-004', '2003-06-18', '07 13 23 33 43', 'Licence 3', 'Informatique',       '2024-2025', 'inscrit'),
(9, 'ETU-2024-005', '2002-03-30', '07 14 24 34 44', 'Master 1',  'Réseaux & Sécurité', '2024-2025', 'inscrit');

-- ─────────────────────────────────────────
-- SALLES
-- ─────────────────────────────────────────
INSERT INTO salles (nom, capacite, batiment) VALUES
('A101', 35, 'Bâtiment A'),
('A102', 35, 'Bâtiment A'),
('B201', 25, 'Bâtiment B'),
('Amphi C', 120, 'Bâtiment C'),
('Lab Info 1', 20, 'Bâtiment A');

-- ─────────────────────────────────────────
-- COURS (6 cours)
-- enseignant_id : 1=Moreau, 2=Benali, 3=Lefebvre
-- ─────────────────────────────────────────
INSERT INTO cours (code, nom, description, credits, coefficient, capacite_max, niveau, semestre, annee_academique, departement, enseignant_id) VALUES
('INF301', 'Analyse et algèbre',
 'Structures de donnée, complexité, graphes et algorithmes de tri avancés.',
 6, 2.0, 30, 'Licence 3', 'S5', '2024-2025', 'Informatique', 1),

('INF302', 'Développement Web ',
 'HTML/CSS, JavaScript, PHP, bases de données relationnelles et API REST.',
 6, 2.0, 30, 'Licence 3', 'S5', '2024-2025', 'Informatique', 1),

('MAT301', 'Probabilités ',
 'Variables aléatoires, lois usuelles, tests d''hypothèse, régression linéaire.',
 4, 1.5, 35, 'Licence 3', 'S5', '2024-2025', 'Mathématiques', 2),

('INF401', 'Electromagnétisme',
 'Cryptographie, protocoles TLS, sécurité réseau, ethical hacking.',
 6, 2.0, 25, 'Master 1', 'S7', '2024-2025', 'Réseaux & Systèmes', 3),

('INF402', 'Base de donées',
 'Docker, Kubernetes, CI/CD, AWS/GCP, infrastructure as code.',
 6, 2.0, 25, 'Master 1', 'S7', '2024-2025', 'Réseaux & Systèmes', 3),

('MAT302', 'Système bouclés',
 'Méthodes de résolution d''équations, interpolation, intégration numérique.',
 4, 1.5, 30, 'Licence 3', 'S5', '2024-2025', 'Mathématiques', 2);

-- ─────────────────────────────────────────
-- SÉANCES (emploi du temps)
-- ─────────────────────────────────────────
INSERT INTO seances (cours_id, salle_id, jour_semaine, heure_debut, heure_fin, date_debut, date_fin, type) VALUES
-- INF301 – lundi et mercredi
(1, 1, 'lundi',    '08:00', '10:00', '2024-09-09', '2025-01-13', 'cours'),
(1, 3, 'mercredi', '10:15', '12:15', '2024-09-11', '2025-01-15', 'td'),
-- INF302 – mardi et jeudi (labo)
(2, 5, 'mardi',    '13:30', '15:30', '2024-09-10', '2025-01-14', 'cours'),
(2, 5, 'jeudi',    '15:45', '17:45', '2024-09-12', '2025-01-16', 'tp'),
-- MAT301 – lundi et vendredi
(3, 2, 'lundi',    '10:15', '12:15', '2024-09-09', '2025-01-13', 'cours'),
(3, 2, 'vendredi', '08:00', '10:00', '2024-09-13', '2025-01-17', 'td'),
-- INF401 – mardi et jeudi
(4, 4, 'mardi',    '08:00', '10:00', '2024-09-10', '2025-01-14', 'cours'),
(4, 3, 'jeudi',    '10:15', '12:15', '2024-09-12', '2025-01-16', 'td'),
-- INF402 – mercredi et vendredi
(5, 4, 'mercredi', '13:30', '15:30', '2024-09-11', '2025-01-15', 'cours'),
(5, 5, 'vendredi', '13:30', '15:30', '2024-09-13', '2025-01-17', 'tp'),
-- MAT302 – jeudi matin
(6, 2, 'jeudi',    '08:00', '10:00', '2024-09-12', '2025-01-16', 'cours');

-- ─────────────────────────────────────────
-- INSCRIPTIONS
-- etudiants L3 (id 1-3-4) → INF301, INF302, MAT301, MAT302
-- etudiants M1 (id 3-5)   → INF401, INF402
-- ─────────────────────────────────────────
INSERT INTO inscriptions (etudiant_id, cours_id) VALUES
-- Lucas (L3 info)
(1, 1), (1, 2), (1, 3), (1, 6),
-- Chloé (L3 info)
(2, 1), (2, 2), (2, 3), (2, 6),
-- Kevin (M1 réseaux)
(3, 4), (3, 5),
-- Emma (L3 info)
(4, 1), (4, 2), (4, 3), (4, 6),
-- Maxime (M1 réseaux)
(5, 4), (5, 5);

-- ─────────────────────────────────────────
-- ÉVALUATIONS
-- ─────────────────────────────────────────
INSERT INTO evaluations (cours_id, nom, type, coefficient, date_evaluation, verrouille) VALUES
-- INF301
(1, 'Contrôle 1 – Tri et complexité',  'controle_continu', 1.0, '2024-10-14', 1),
(1, 'TP noté – Graphes',               'tp',                1.0, '2024-11-18', 1),
(1, 'Examen final',                    'examen',            2.0, '2025-01-08', 0),
-- INF302
(2, 'Contrôle 1 – HTML/CSS/JS',        'controle_continu', 1.0, '2024-10-21', 1),
(2, 'Projet Full-Stack',               'projet',            2.0, '2024-12-16', 0),
-- MAT301
(3, 'Contrôle 1 – Probabilités',       'controle_continu', 1.0, '2024-10-28', 1),
(3, 'Examen final',                    'examen',            2.0, '2025-01-10', 0),
-- INF401
(4, 'TP Ethical Hacking',              'tp',                1.5, '2024-11-04', 1),
(4, 'Examen final',                    'examen',            2.0, '2025-01-09', 0),
-- INF402
(5, 'Mini-projet Docker/K8s',          'projet',            1.5, '2024-12-09', 1),
(5, 'Examen final',                    'examen',            2.0, '2025-01-13', 0),
-- MAT302
(6, 'Contrôle 1 – Interpolation',      'controle_continu', 1.0, '2024-11-06', 1),
(6, 'Examen final',                    'examen',            2.0, '2025-01-07', 0);

-- ─────────────────────────────────────────
-- NOTES
-- saisie_par : enseignant_id (1=Moreau, 2=Benali, 3=Lefebvre)
-- ─────────────────────────────────────────
INSERT INTO notes (etudiant_id, evaluation_id, note, commentaire, saisie_par) VALUES
-- ── Lucas (etudiant 1) ──
-- INF301
(1, 1, 14.50, NULL, 1),
(1, 2, 16.00, 'Bon travail sur les algorithmes de Dijkstra', 1),
-- INF302
(1, 4, 13.00, NULL, 1),
-- MAT301
(1, 6, 11.50, NULL, 2),
-- MAT302
(1, 12, 12.00, NULL, 2),

-- ── Chloé (etudiant 2) ──
-- INF301
(2, 1, 17.00, 'Excellente maîtrise', 1),
(2, 2, 18.50, 'Rendu impeccable', 1),
-- INF302
(2, 4, 15.50, NULL, 1),
-- MAT301
(2, 6, 16.00, NULL, 2),
-- MAT302
(2, 12, 15.00, NULL, 2),

-- ── Kevin (etudiant 3) ──
-- INF401
(3, 8, 15.00, 'Bonne analyse des vulnérabilités', 3),
-- INF402
(3, 10, 17.50, 'Pipeline CI/CD très bien configuré', 3),

-- ── Emma (etudiant 4) ──
-- INF301
(4, 1, 09.00, 'Doit retravailler la complexité', 1),
(4, 2, 11.00, NULL, 1),
-- INF302
(4, 4, 12.50, NULL, 1),
-- MAT301
(4, 6, 08.50, 'Difficultés sur les lois de probabilité', 2),
-- MAT302
(4, 12, 10.00, NULL, 2),

-- ── Maxime (etudiant 5) ──
-- INF401
(5, 8, 18.00, 'Excellent TP, rapport très détaillé', 3),
-- INF402
(5, 10, 14.00, NULL, 3);

-- ─────────────────────────────────────────
-- PRÉSENCES (3 séances passées)
-- séances id 1, 3, 7
-- ─────────────────────────────────────────
INSERT INTO presences (etudiant_id, seance_id, statut, commentaire, enregistre_par) VALUES
-- Séance 1 – INF301 lundi (L3)
(1, 1, 'present',  NULL,                    1),
(2, 1, 'present',  NULL,                    1),
(4, 1, 'absent',   'Non justifié',          1),
-- Séance 3 – INF302 mardi (L3)
(1, 3, 'present',  NULL,                    1),
(2, 3, 'retard',   'Arrivée 15 min après',  1),
(4, 3, 'present',  NULL,                    1),
-- Séance 7 – INF401 mardi (M1)
(3, 7, 'present',  NULL,                    3),
(5, 7, 'excuse',   'Certificat médical',    3);

-- ─────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────
INSERT INTO notifications (utilisateur_id, titre, message, type, lu) VALUES
(5, 'Note disponible',     'Votre note au Contrôle 1 d''INF301 est disponible : 14.50/20.',         'note',            0),
(6, 'Note disponible',     'Votre note au Contrôle 1 d''INF301 est disponible : 17.00/20.',         'note',            1),
(8, 'Absence enregistrée', 'Une absence non justifiée a été enregistrée le lundi 09/09 en INF301.', 'absence',         0),
(7, 'Cours annulé',        'La séance de TD INF401 du jeudi 10/10 est annulée.',                    'emploi_du_temps', 0),
(9, 'Note disponible',     'Votre note au TP Ethical Hacking est disponible : 18.00/20.',           'note',            0);
