# Étapes Finales - Configuration

## ✅ Configuration terminée

Votre fichier `.env.local` a été configuré avec vos informations Supabase:
- **Projet**: Rz_Col_recla
- **URL**: https://nvavwpcyjysbpukcgxnm.supabase.co

## Prochaines étapes

### Étape 1: Créer le schéma de base de données dans Supabase

1. Ouvrez votre navigateur et allez sur: https://app.supabase.com
2. Connectez-vous à votre compte
3. Sélectionnez le projet **Rz_Col_recla**
4. Dans le menu de gauche, cliquez sur **SQL Editor**
5. Cliquez sur **+ New Query**
6. Ouvrez le fichier `supabase_schema.sql` (dans le dossier Reclamation)
7. Copiez TOUT le contenu du fichier
8. Collez-le dans l'éditeur SQL de Supabase
9. Cliquez sur **Run** (ou appuyez sur Ctrl+Enter)
10. Attendez quelques secondes - vous devriez voir "Success"

### Étape 2: Créer le bucket de stockage pour les fichiers

1. Dans Supabase, cliquez sur **Storage** dans le menu de gauche
2. Cliquez sur **Create a new bucket**
3. Remplissez:
   - **Name**: `reclamations`
   - **Public bucket**: ✅ Cochez cette case (important!)
4. Cliquez sur **Create bucket**

### Étape 3: Configurer les politiques de stockage

1. Cliquez sur le bucket `reclamations` que vous venez de créer
2. Cliquez sur **Policies** en haut
3. Cliquez sur **New policy** > **For full customization**
4. Créez la première politique:

**Nom**: Allow authenticated uploads
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'reclamations');
```

5. Créez la deuxième politique:

**Nom**: Allow authenticated reads
```sql
CREATE POLICY "Authenticated users can read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'reclamations');
```

### Étape 4: Créer votre compte administrateur

1. Dans Supabase, cliquez sur **Authentication** > **Users**
2. Cliquez sur **Add user** > **Create new user**
3. Remplissez:
   - **Email**: votre-email@example.com (utilisez votre vrai email)
   - **Password**: Choisissez un mot de passe fort (NOTEZ-LE!)
   - **Auto Confirm User**: ✅ Cochez cette case
4. Cliquez sur **Create user**
5. **IMPORTANT**: Copiez l'**UUID** de l'utilisateur (cliquez sur l'utilisateur et copiez l'ID)

### Étape 5: Ajouter le profil admin dans la base

1. Retournez dans **SQL Editor**
2. Créez une nouvelle requête
3. Collez ce code en remplaçant les valeurs:

```sql
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  'COLLEZ-ICI-UUID-DE-LETAPE-4',
  'votre-email@example.com',
  'Admin Principal',
  'admin'
);
```

4. Cliquez sur **Run**
5. Vous devriez voir "Success. 1 row affected"

### Étape 6: Lancer l'application

1. Ouvrez un terminal (CMD ou PowerShell)
2. Naviguez vers le dossier web:

```bash
cd "C:\Users\zoumi\OneDrive\Bureau\app\Reclamation\web"
```

3. Lancez l'application:

```bash
npm run dev
```

4. Ouvrez votre navigateur sur: **http://localhost:3000**
5. Connectez-vous avec l'email et mot de passe créés à l'Étape 4

### Étape 7: Tester l'application

1. Une fois connecté, vous devriez voir le **Dashboard Admin**
2. Créez votre première réclamation:
   - Cliquez sur **Nouvelle réclamation**
   - Remplissez le formulaire
   - Ajoutez une image de test
   - Cliquez sur **Enregistrer**
3. Vérifiez que la réclamation apparaît dans la liste

## Créer un utilisateur Chauffeur (Optionnel)

1. Dans Supabase > **Authentication** > **Users**
2. Créez un nouvel utilisateur:
   - Email: chauffeur@example.com
   - Password: MotDePasse123!
   - Auto Confirm: ✅
3. Copiez l'UUID du chauffeur
4. Dans **SQL Editor**:

```sql
INSERT INTO profiles (id, email, full_name, role, circuit)
VALUES (
  'UUID-DU-CHAUFFEUR',
  'chauffeur@example.com',
  'Jean Dupont',
  'chauffeur',
  541
);
```

## Résumé des Temps

- ✅ Schéma de base de données: 2 min
- ✅ Bucket de stockage: 2 min
- ✅ Compte admin: 3 min
- ✅ Lancement application: 2 min
- ✅ Test: 2 min

**Total: ~10 minutes**

## Aide Rapide

### L'application ne démarre pas
```bash
# Vérifiez que vous êtes dans le bon dossier
cd "C:\Users\zoumi\OneDrive\Bureau\app\Reclamation\web"

# Réinstallez les dépendances si besoin
npm install

# Relancez
npm run dev
```

### Erreur "Invalid login credentials"
- Vérifiez que vous avez bien créé le profil dans la table `profiles`
- Vérifiez l'email et le mot de passe
- Assurez-vous d'avoir coché "Auto Confirm User"

### Les fichiers ne s'uploadent pas
- Vérifiez que le bucket `reclamations` existe
- Vérifiez qu'il est marqué comme "Public"
- Vérifiez que les politiques de Storage sont créées

## Support

- Documentation complète: Voir `README.md`
- Guide détaillé: Voir `GUIDE_DEMARRAGE.md`

Bonne utilisation ! 🚀
