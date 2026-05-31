# Hôtel Reservation System

## Système de gestion des réservations hôtelières

## Description

**Hôtel Reservation System** est une application web complète de gestion hôtelière permettant de gérer les réservations, les clients, les chambres, les factures et les utilisateurs de manière centralisée.

L'application a été développée avec les technologies suivantes :

* **Backend :** Node.js, Express
* **Frontend :** React
* **Base de données :** PostgreSQL

L'architecture du projet respecte les principes de la **Clean Architecture**, garantissant une meilleure maintenabilité, évolutivité et séparation des responsabilités.

---

# Fonctionnalités principales

## Gestion des clients

* Création, consultation, modification, désactivation et activation des clients
* Recherche avancée de clients
* Consultation de l'historique des séjours

## Gestion des chambres

* Gestion complète des chambres
* Gestion des équipements associés
* Suivi de la disponibilité en temps réel

## Gestion des réservations

* Création de réservations
* Modification de réservations existantes
* Annulation avec application éventuelle de pénalités

## Gestion des séjours

* Check-in anticipé avec enregistrement de l'heure réelle d'arrivée
* Check-out automatique
* Génération automatique d'une facture détaillée au format PDF

## Gestion tarifaire

* Tarifs saisonniers
* Remises commerciales

## Gestion des utilisateurs

* Authentification sécurisée
* Gestion des rôles
* Création, modification, désactivation et activation des comptes réceptionnistes par l'administrateur

## Consultation publique

* Consultation des réservations à l'aide du numéro de pièce d'identité (CIN)

---

# Technologies utilisées

| Catégorie           | Technologies                                                     |
| ------------------- | ---------------------------------------------------------------- |
| **Backend**         | Node.js, Express, JWT, bcryptjs, pg, pdfkit.                     |
| **Frontend**        | React, React Router, Axios, CSS personnalisé (thème Navy & Gold) |
| **Base de données** | PostgreSQL                                                       |
| **Outils**          | VS Code, Git, GitHub, pgAdmin, PlantUML, Overleaf (LaTeX), npm   |

---

# Prérequis

Avant de commencer, assurez-vous d'avoir installé :

* **Node.js** (version 18 ou supérieure)
* **PostgreSQL** (version 14 ou supérieure)

---

# Installation et configuration

## 1. Cloner le dépôt

```bash
git clone https://github.com/wassimlaaribi10/hotel-reservation-system.git
cd hotel-reservation-system
```

---

## 2. Configurer la base de données

### Création de la base de données

Créez une base de données nommée :

```sql
hotel_db
```

Vous pouvez utiliser :

* pgAdmin

### Création des tables

Exécutez le script suivant situé à la racine du projet :

```txt
database.sql
```

Ce script crée automatiquement l'ensemble des tables nécessaires au fonctionnement de l'application.

---

## 3. Création du compte administrateur initial

Avant la première connexion, un compte administrateur doit être créé manuellement.

### Accéder au dossier Backend

```bash
cd backend
```

### Installer les dépendances

```bash
npm install
```

### Générer un hash de mot de passe

```bash
node -e "console.log(require('bcryptjs').hashSync('votreMotDePasseAdmin', 10))"
```

Remplacez `votreMotDePasseAdmin` par le mot de passe souhaité (par exemple : `admin123`).

Copiez le hash généré.

### Insérer l'administrateur dans la base de données

```sql
INSERT INTO users (email, password_hash, role, is_active)
VALUES
('admin@hotel.com', 'LE_HASH_OBTENU', 'admin', true);
```

Remplacez `LE_HASH_OBTENU` par le hash précédemment généré.

> Une fois connecté, l'administrateur pourra créer et gérer les comptes administrateurs/réceptionnistes depuis la page **Utilisateurs**.

---

## 4. Données de test intégrées

Le fichier `database.sql` contient déjà des données de test prêtes à l’emploi :

- **Clients** : Jean Dupont (CIN `JD123`), Marie Curie (CIN `MC456`), etc.
- **Chambres** : 101, 102, 201, 202
- **Équipements** : Climatisation, Wi‑Fi, Mini‑bar, Vue mer, Balcon
- **Tarifs saisonniers** : haute et basse saison
- **Réservations** : une réservation en cours, une confirmée, une terminée, une annulée
- **Facture** : associée à la réservation terminée

---

## 5. Configuration de l'environnement

Créez un fichier `.env` dans le dossier `backend` :

```env
PORT=5000

DB_USER=postgres
DB_HOST=localhost
DB_NAME=hotel_db
DB_PASSWORD=votre_mot_de_passe_postgres
DB_PORT=5432

JWT_SECRET=une_cle_secrete_tres_longue_et_aleatoire
```

> Adaptez les valeurs selon votre environnement local.

---

## 6. Installation des dépendances

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd ../frontend
npm install
```

---

# Exécution de l'application

## Démarrer le Backend

```bash
cd backend
npm run dev
```

Le serveur sera accessible à l'adresse :

```text
http://localhost:5000
```

---

## Démarrer le Frontend

```bash
cd frontend
npm start
```

L'application sera accessible à l'adresse :

```text
http://localhost:3000
```

---

# Comptes de test

| Rôle           | Email                                       | Mot de passe                               |
| -------------- | ------------------------------------------- | ------------------------------------------ |
| Administrateur | admin@hotel.com                             | Celui défini lors de la génération du hash |
| Réceptionniste | À créer depuis l'interface d'administration | Défini lors de sa création                 |

---

# Test de la page publique

Pour tester la consultation publique des réservations, utilisez un CIN existant :

| Client      | CIN   |
| ----------- | ----- |
| Jean Dupont | JD123 |
| Marie Curie | MC456 |

---

# Conclusion

Une fois les étapes précédentes réalisées, l'application est prête à être exécutée dans un environnement local. Le compte administrateur initial permet de gérer l'ensemble des fonctionnalités du système, notamment la gestion des utilisateurs, des clients, des chambres et des réservations.
