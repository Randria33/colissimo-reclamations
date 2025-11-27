# Gestionnaire de Réclamations Colissimo

Application web moderne pour gérer les réclamations Colissimo avec synchronisation en temps réel via Supabase.

## Fonctionnalités

### Pour les Administrateurs
- Dashboard complet avec statistiques en temps réel
- Gestion complète des réclamations (CRUD)
- Assignation des réclamations aux chauffeurs
- Recherche avancée et filtres multiples
- Visualisation des statistiques par circuit
- Export de données (à venir)
- Gestion des utilisateurs

### Pour les Chauffeurs
- Interface simplifiée et mobile-friendly
- Création de nouvelles réclamations
- Suivi des réclamations assignées
- Upload de preuves (photos, documents)
- Mise à jour des statuts
- Notifications en temps réel

### Fonctionnalités Techniques
- Authentication sécurisée (Supabase Auth)
- Upload de fichiers (images, PDF, documents)
- Recherche full-text
- Historique complet des modifications
- Notifications automatiques
- Row Level Security (RLS) pour la sécurité
- Interface responsive (mobile/tablet/desktop)

## Technologies Utilisées

- **Frontend**: Next.js 16 (App Router), React, TypeScript, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **UI**: Lucide React (icônes)
- **Validation**: Zod + React Hook Form
- **Charts**: Recharts

## Installation

### 1. Prérequis

- Node.js 18+ installé
- Un compte Supabase (gratuit sur https://supabase.com)

### 2. Configuration Supabase

1. Créez un nouveau projet sur https://app.supabase.com
2. Allez dans **SQL Editor** et exécutez le fichier `supabase_schema.sql`
3. Allez dans **Storage** et créez un bucket nommé `reclamations`:
   - Cliquez sur "Create bucket"
   - Nom: `reclamations`
   - Public: Cochez "Public bucket"
   - Cliquez sur "Create bucket"

4. Configurez les politiques de stockage pour le bucket `reclamations`:
   - Allez dans Storage > Policies
   - Ajoutez ces politiques:

```sql
-- Permettre l'upload pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'reclamations');

-- Permettre la lecture pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'reclamations');
```

5. Créez votre premier utilisateur Admin:
   - Allez dans **Authentication > Users**
   - Cliquez sur "Add user" > "Create new user"
   - Email: votre-email@example.com
   - Password: votre-mot-de-passe-sécurisé
   - Cochez "Auto Confirm User"
   - Cliquez sur "Create user"

6. Ajoutez le profil admin dans la base de données:
   - Allez dans **SQL Editor**
   - Copiez l'UUID de l'utilisateur depuis Authentication > Users
   - Exécutez:

```sql
INSERT INTO profiles (id, email, full_name, role)
VALUES ('VOTRE-UUID-ICI', 'votre-email@example.com', 'Admin', 'admin');
```

7. Récupérez vos clés API:
   - Allez dans **Settings > API**
   - Copiez `Project URL` et `anon public` key

### 3. Installation du projet

```bash
# Naviguez vers le dossier du projet web
cd web

# Installez les dépendances
npm install

# Configurez les variables d'environnement
# Éditez le fichier .env.local avec vos clés Supabase
```

Éditez `web/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon-ici
```

### 4. Lancement de l'application

```bash
# Mode développement
npm run dev

# Ouvrez http://localhost:3000 dans votre navigateur
```

### 5. Connexion

- Utilisez l'email et le mot de passe de l'utilisateur admin créé précédemment
- Vous serez redirigé vers le dashboard admin

## Création d'utilisateurs Chauffeurs

1. Connectez-vous en tant qu'admin
2. Allez dans Supabase > Authentication > Users
3. Créez un nouvel utilisateur
4. Dans SQL Editor, ajoutez le profil:

```sql
INSERT INTO profiles (id, email, full_name, role, circuit)
VALUES ('UUID-DU-CHAUFFEUR', 'chauffeur@example.com', 'Nom du Chauffeur', 'chauffeur', 541);
```

## Structure du Projet

```
Reclamation/
├── supabase_schema.sql          # Schéma de base de données
├── Reclamation.xlsx             # Fichier Excel source
├── README.md                    # Cette documentation
└── web/                         # Application Next.js
    ├── src/
    │   ├── app/
    │   │   ├── login/           # Page de connexion
    │   │   ├── dashboard/       # Dashboard admin
    │   │   └── chauffeur/       # Interface chauffeur
    │   ├── components/          # Composants réutilisables
    │   ├── lib/
    │   │   └── supabase/        # Configuration Supabase
    │   └── types/               # Types TypeScript
    ├── .env.local               # Variables d'environnement
    └── package.json
```

## Utilisation

### Créer une réclamation

1. Cliquez sur "Nouvelle réclamation"
2. Remplissez le formulaire:
   - Numéro de colis (obligatoire)
   - Référence dossier (obligatoire)
   - Circuit (obligatoire)
   - Type de réclamation
   - Dates importantes
   - Motif, remarques
3. Ajoutez des fichiers (photos, attestations, documents)
4. Cliquez sur "Enregistrer"

### Rechercher une réclamation

- Utilisez la barre de recherche pour chercher par:
  - Numéro de colis
  - Référence dossier
  - Adresse client
- Filtrez par statut (En attente, En cours, Clôturé)
- Les résultats s'affichent en temps réel

### Modifier une réclamation

1. Cliquez sur l'icône "Modifier" sur une réclamation
2. Modifiez les champs nécessaires
3. Changez le statut si besoin
4. Ajoutez des remarques ou commentaires
5. Uploadez des fichiers supplémentaires
6. Cliquez sur "Enregistrer"

## Améliorations par rapport à Excel

1. **Collaboration en temps réel**: Plusieurs utilisateurs peuvent travailler simultanément
2. **Gestion des droits**: Admins et chauffeurs ont des accès différents
3. **Upload de fichiers**: Photos, attestations, preuves jointes directement
4. **Recherche avancée**: Recherche instantanée sur tous les champs
5. **Historique complet**: Toutes les modifications sont tracées
6. **Notifications**: Alertes automatiques pour les échéances
7. **Statistiques**: Dashboard avec KPIs en temps réel
8. **Sécurité**: Authentification et chiffrement des données
9. **Mobile-friendly**: Utilisable sur smartphone et tablette
10. **Sauvegarde automatique**: Aucune perte de données

## Déploiement en Production

### Option 1: Vercel (Recommandé)

```bash
# Installez Vercel CLI
npm i -g vercel

# Déployez
cd web
vercel

# Configurez les variables d'environnement sur Vercel:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Option 2: Docker

```bash
# À venir
```

## Support

Pour toute question ou problème:
1. Consultez la documentation Supabase: https://supabase.com/docs
2. Consultez la documentation Next.js: https://nextjs.org/docs
3. Contactez votre administrateur système

## Sécurité

- Toutes les données sont chiffrées en transit (HTTPS)
- Row Level Security (RLS) activé sur toutes les tables
- Authentification sécurisée via Supabase Auth
- Les mots de passe sont hashés avec bcrypt
- Validation des données côté serveur et client
- Protection contre les injections SQL

## Licence

Propriété de Colissimo - Usage interne uniquement

## Auteur

Développé avec Claude Code

## Changelog

### Version 1.0.0 (2025-11-27)
- Version initiale
- Dashboard admin complet
- Interface chauffeur
- Upload de fichiers
- Recherche et filtres
- Authentification multi-rôles
- Statistiques en temps réel
