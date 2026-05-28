# SmartCampus

Application de gestion de campus universitaire — Backend PHP vanilla (MVC) + Frontend React TypeScript.

## Stack technique

| Couche | Techno |
|---|---|
| Frontend | React 19, TypeScript, Vite, TailwindCSS v3, React Query |
| Backend | PHP 8.2+ vanilla (architecture MVC, sans framework) |
| Base de données | MySQL 8+ |
| HTTP Client | Axios |
| Routing | React Router v6 |

## Prérequis

- PHP 8.2+
- MySQL 8+
- Node.js 18+
- npm 9+

## Installation

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd smart-campus
```

### 2. Base de données

```bash
# Créer la base et les tables
mysql -u root < database/schema.sql

# Insérer les données de démo
mysql -u root < database/seed.sql
```

> Si MySQL nécessite un mot de passe : `mysql -u root -p < database/schema.sql`

### 3. Configurer le backend

Éditer `backend/config/database.php` si besoin :

```php
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'smartcampus');
define('DB_USER', 'root');
define('DB_PASS', '');        // adapter si mot de passe MySQL
```

### 4. Lancer le backend PHP

```bash
php -S localhost:8000 -t backend/public
```

### 5. Installer et lancer le frontend

```bash
cd frontend
npm install
npm run dev
```

L'application est accessible sur **http://localhost:5173**

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur | admin@smartcampus.fr | password |
| Enseignant | j.moreau@smartcampus.fr | password |
| Enseignant | s.benali@smartcampus.fr | password |
| Enseignant | t.lefebvre@smartcampus.fr | password |
| Étudiant | l.dupont@etu.smartcampus.fr | password |
| Étudiant | c.martin@etu.smartcampus.fr | password |
| Étudiant | k.nguyen@etu.smartcampus.fr | password |

## Fonctionnalités

### Administrateur
- Dashboard avec statistiques globales (étudiants, enseignants, cours, inscriptions)
- Gestion complète des étudiants (liste, profil, création)
- Gestion complète des enseignants
- Gestion des cours (liste, détail, création)
- Saisie de notes via modal

### Enseignant
- Dashboard personnalisé : ses cours, évaluations à venir, prochaines séances
- Accès aux cours et à l'emploi du temps
- Saisie de notes pour ses étudiants

### Étudiant
- Dashboard : ses cours du semestre, notes récentes, emploi du temps de la semaine
- Consultation des cours et de l'emploi du temps visuel

## Structure du projet

```
smart-campus/
├── backend/
│   ├── app/
│   │   ├── Controllers/     # AuthController, EtudiantController, CoursController…
│   │   ├── Models/          # Un modèle par entité (PDO)
│   │   ├── Middleware/      # AuthMiddleware (isAuthenticated, hasRole)
│   │   └── Views/
│   ├── config/
│   │   └── database.php     # Connexion PDO singleton
│   ├── public/
│   │   ├── index.php        # Point d'entrée unique
│   │   └── .htaccess
│   └── routes/
│       └── api.php          # Dispatch de toutes les routes API
├── database/
│   ├── schema.sql           # Schéma complet (11 tables)
│   └── seed.sql             # Données de démo
└── frontend/
    └── src/
        ├── api/             # client axios
        ├── components/      # Layout, PrivateRoute
        ├── context/         # AuthContext
        ├── pages/           # Pages par domaine
        └── router.tsx       # Routes React Router v6
```

## API REST — Routes principales

```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/etudiants
POST   /api/etudiants
GET    /api/etudiants/:id
PUT    /api/etudiants/:id
DELETE /api/etudiants/:id

GET    /api/enseignants
POST   /api/enseignants
GET    /api/enseignants/:id
PUT    /api/enseignants/:id
DELETE /api/enseignants/:id

GET    /api/cours
POST   /api/cours
GET    /api/cours/:id
PUT    /api/cours/:id
DELETE /api/cours/:id          (désactivation soft)

GET    /api/inscriptions?etudiant_id=X
GET    /api/inscriptions?cours_id=X
POST   /api/inscriptions
DELETE /api/inscriptions/:id

GET    /api/notes?etudiant_id=X
GET    /api/notes?cours_id=X
POST   /api/notes
PUT    /api/notes/:id

GET    /api/evaluations?cours_id=X
POST   /api/evaluations
PUT    /api/evaluations/:id/verrouiller

GET    /api/seances?cours_id=X
GET    /api/seances?etudiant_id=X
GET    /api/seances?enseignant_id=X
POST   /api/seances
PUT    /api/seances/:id
DELETE /api/seances/:id

GET    /api/dashboard/admin
GET    /api/dashboard/enseignant
GET    /api/dashboard/etudiant
```
