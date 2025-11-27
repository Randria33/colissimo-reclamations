# Guide de Démarrage Rapide

## Étape 1: Configuration Supabase (15 minutes)

### 1.1 Créer le projet Supabase

1. Allez sur https://supabase.com et connectez-vous (ou créez un compte gratuit)
2. Cliquez sur "New Project"
3. Remplissez:
   - **Name**: Colissimo-Reclamations
   - **Database Password**: Choisissez un mot de passe fort (NOTEZ-LE!)
   - **Region**: Europe (West) - recommandé pour la France
4. Cliquez sur "Create new project"
5. Attendez 2-3 minutes que le projet soit créé

### 1.2 Créer le schéma de base de données

1. Dans votre projet Supabase, cliquez sur l'icône **SQL Editor** (à gauche)
2. Cliquez sur "+ New Query"
3. Ouvrez le fichier `supabase_schema.sql` dans un éditeur de texte
4. Copiez TOUT le contenu
5. Collez-le dans l'éditeur SQL de Supabase
6. Cliquez sur "Run" (en bas à droite)
7. Attendez quelques secondes, vous devriez voir "Success. No rows returned"

### 1.3 Créer le bucket de stockage

1. Cliquez sur **Storage** dans le menu de gauche
2. Cliquez sur "Create a new bucket"
3. Remplissez:
   - **Name**: `reclamations`
   - **Public bucket**: ✅ Cochez cette case
   - **File size limit**: 5 MB
4. Cliquez sur "Create bucket"
5. Cliquez sur le bucket `reclamations` que vous venez de créer
6. Cliquez sur "Policies" (en haut)
7. Cliquez sur "New policy" et choisissez "For full customization"
8. Ajoutez ces deux politiques:

**Politique 1 - Upload**:
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'reclamations');
```

**Politique 2 - Lecture**:
```sql
CREATE POLICY "Authenticated users can read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'reclamations');
```

### 1.4 Créer votre compte administrateur

1. Cliquez sur **Authentication** > **Users** dans le menu
2. Cliquez sur "Add user" puis "Create new user"
3. Remplissez:
   - **Email**: votre-email@example.com (utilisez un vrai email)
   - **Password**: Choisissez un mot de passe fort (NOTEZ-LE!)
   - **Auto Confirm User**: ✅ Cochez cette case
4. Cliquez sur "Create user"
5. **IMPORTANT**: Copiez l'**UUID** de l'utilisateur (une longue chaîne comme: a1b2c3d4-e5f6-7890-...)

### 1.5 Ajouter le profil admin

1. Retournez dans **SQL Editor**
2. Créez une nouvelle requête
3. Collez ce code (REMPLACEZ les valeurs entre guillemets):

```sql
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  'COLLEZ-ICI-UUID-DE-LETAPE-1.4',
  'votre-email@example.com',
  'Admin Principal',
  'admin'
);
```

4. Cliquez sur "Run"
5. Vous devriez voir "Success. 1 row affected"

### 1.6 Récupérer les clés API

1. Cliquez sur **Settings** (roue dentée en bas à gauche)
2. Cliquez sur **API**
3. Vous verrez:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: Une longue clé qui commence par `eyJ...`
4. **COPIEZ CES DEUX VALEURS** (gardez-les à portée de main)

## Étape 2: Installation de l'Application (5 minutes)

### 2.1 Ouvrir le terminal

1. Ouvrez un terminal (CMD ou PowerShell sur Windows)
2. Naviguez vers le dossier du projet:

```bash
cd "C:\Users\zoumi\OneDrive\Bureau\app\Reclamation\web"
```

### 2.2 Installer les dépendances

```bash
npm install
```

Attendez que toutes les dépendances soient installées (environ 1-2 minutes).

### 2.3 Configurer les variables d'environnement

1. Ouvrez le fichier `web/.env.local` avec un éditeur de texte (Notepad++)
2. Remplacez les valeurs:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...votre-longue-cle
```

**Utilisez les valeurs de l'Étape 1.6**

3. Sauvegardez le fichier

## Étape 3: Lancement de l'Application (2 minutes)

### 3.1 Démarrer le serveur

Dans le terminal (toujours dans le dossier `web`):

```bash
npm run dev
```

Vous verrez:
```
▲ Next.js 16.0.X
- Local:        http://localhost:3000
✓ Starting...
✓ Ready in 2.3s
```

### 3.2 Ouvrir l'application

1. Ouvrez votre navigateur (Chrome, Firefox, Edge)
2. Allez sur: **http://localhost:3000**
3. Vous devriez voir la page de connexion

### 3.3 Première connexion

1. Entrez:
   - **Email**: Celui que vous avez utilisé à l'Étape 1.4
   - **Mot de passe**: Celui que vous avez choisi à l'Étape 1.4
2. Cliquez sur "Se connecter"
3. Vous devriez être redirigé vers le **Dashboard Admin**

## Étape 4: Tester l'Application (5 minutes)

### 4.1 Créer une première réclamation

1. Cliquez sur "Nouvelle réclamation"
2. Remplissez le formulaire:
   - **Numéro de colis**: 6A04563232564
   - **Référence dossier**: COL-81524694
   - **Circuit**: 541
   - **Type**: Réclamation Locale
   - **Date de remise**: Aujourd'hui
   - **À clôturer avant**: Dans 7 jours
   - **Motif**: Test de l'application
3. Ajoutez une image de test (optionnel)
4. Cliquez sur "Enregistrer"
5. Vous devriez voir votre réclamation dans le tableau

### 4.2 Créer un utilisateur chauffeur

1. Allez dans Supabase > **Authentication** > **Users**
2. Créez un nouvel utilisateur:
   - **Email**: chauffeur@test.com
   - **Password**: TestChauffeur123!
   - **Auto Confirm**: ✅
3. Copiez l'UUID du chauffeur
4. Dans **SQL Editor**, créez le profil:

```sql
INSERT INTO profiles (id, email, full_name, role, circuit)
VALUES (
  'UUID-DU-CHAUFFEUR',
  'chauffeur@test.com',
  'Jean Dupont',
  'chauffeur',
  541
);
```

5. Déconnectez-vous de l'admin
6. Connectez-vous avec le compte chauffeur
7. Vous devriez voir l'interface chauffeur simplifiée

## Étape 5: Import des données Excel (Optionnel)

Si vous voulez importer vos données Excel existantes:

### 5.1 Convertir Excel en CSV

1. Ouvrez `Reclamation.xlsx` dans Excel
2. Cliquez sur "Fichier" > "Enregistrer sous"
3. Choisissez le format **CSV UTF-8**
4. Sauvegardez comme `reclamations.csv`

### 5.2 Importer dans Supabase

1. Allez dans Supabase > **Table Editor**
2. Sélectionnez la table `reclamations`
3. Cliquez sur "Insert" > "Import data from CSV"
4. Sélectionnez votre fichier `reclamations.csv`
5. Mappez les colonnes correctement
6. Cliquez sur "Import"

## Dépannage Rapide

### Erreur: "Invalid login credentials"
- Vérifiez que vous avez bien coché "Auto Confirm User" lors de la création
- Vérifiez l'email et le mot de passe
- Assurez-vous d'avoir créé le profil dans la table `profiles`

### Erreur: "Failed to fetch"
- Vérifiez que les clés dans `.env.local` sont correctes
- Redémarrez le serveur (`Ctrl+C` puis `npm run dev`)

### Les fichiers ne s'uploadent pas
- Vérifiez que le bucket `reclamations` est public
- Vérifiez que les politiques de Storage sont bien créées

### La page est blanche
- Ouvrez la console du navigateur (F12)
- Regardez les erreurs dans la console
- Vérifiez que le serveur est démarré (`npm run dev`)

### Besoin d'aide ?
- Consultez le fichier `README.md` pour plus de détails
- Vérifiez les logs dans le terminal
- Regardez les erreurs dans Supabase > Logs

## Prochaines Étapes

Une fois l'application testée et fonctionnelle:

1. **Créez plus d'utilisateurs chauffeurs** pour votre équipe
2. **Importez vos données existantes** depuis Excel
3. **Personnalisez les types de réclamations** dans le code
4. **Configurez les notifications** (documentation avancée)
5. **Déployez en production** sur Vercel (voir README.md)

## Résumé des Temps

- ✅ Configuration Supabase: 15 min
- ✅ Installation: 5 min
- ✅ Lancement: 2 min
- ✅ Tests: 5 min

**Total: ~30 minutes** pour avoir une application fonctionnelle!

## Contacts et Support

- Documentation Supabase: https://supabase.com/docs
- Documentation Next.js: https://nextjs.org/docs
- Lucide Icons: https://lucide.dev

Bon courage! 🚀
