# Guide de Déploiement sur Netlify

## Prérequis

- Un compte Netlify (gratuit sur https://netlify.com)
- Un compte GitHub (pour héberger le code)
- L'application fonctionne en local

## Étape 1: Préparer le code pour Git (5 minutes)

### 1.1 Initialiser Git (si pas déjà fait)

```bash
cd "C:\Users\zoumi\OneDrive\Bureau\app\Reclamation"
git init
git add .
git commit -m "Initial commit - Application Réclamations Colissimo"
```

### 1.2 Créer un repository sur GitHub

1. Allez sur https://github.com
2. Cliquez sur "New repository"
3. Nom: `colissimo-reclamations`
4. Description: "Application de gestion des réclamations Colissimo"
5. Visibilité: **Private** (recommandé pour sécurité)
6. Ne cochez pas "Add README" (on en a déjà un)
7. Cliquez sur "Create repository"

### 1.3 Pusher le code sur GitHub

```bash
git remote add origin https://github.com/VOTRE-USERNAME/colissimo-reclamations.git
git branch -M main
git push -u origin main
```

## Étape 2: Déployer sur Netlify (10 minutes)

### 2.1 Connecter Netlify à GitHub

1. Allez sur https://app.netlify.com
2. Cliquez sur "Add new site" > "Import an existing project"
3. Choisissez "GitHub"
4. Autorisez Netlify à accéder à votre compte GitHub
5. Sélectionnez le repository `colissimo-reclamations`

### 2.2 Configurer le build

Netlify devrait détecter automatiquement Next.js. Vérifiez:

- **Base directory**: `web`
- **Build command**: `npm run build`
- **Publish directory**: `.next`

### 2.3 Ajouter les variables d'environnement

Dans Netlify, avant de déployer:

1. Cliquez sur "Advanced settings"
2. Cliquez sur "New variable"
3. Ajoutez ces variables:

```
NEXT_PUBLIC_SUPABASE_URL = https://nvavwpcyjysbpukcgxnm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52YXZ3cGN5anlzYnB1a2NneG5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMTY5OTgsImV4cCI6MjA3OTc5Mjk5OH0.ReK_8pWq51-PAA9GReQSeU_n8jRS2C4HzccL21yUZp8
```

### 2.4 Déployer

1. Cliquez sur "Deploy site"
2. Attendez 3-5 minutes que le build se termine
3. Netlify vous donnera une URL (ex: https://random-name-123.netlify.app)

## Étape 3: Configurer le domaine personnalisé (Optionnel)

### 3.1 Utiliser un sous-domaine Netlify

1. Dans Netlify, allez dans "Site settings" > "Domain management"
2. Cliquez sur "Options" > "Edit site name"
3. Changez le nom (ex: colissimo-reclamations)
4. Votre URL sera: https://colissimo-reclamations.netlify.app

### 3.2 Utiliser votre propre domaine

Si vous avez un domaine (ex: reclamations.votredomaine.fr):

1. Dans Netlify, allez dans "Domain management"
2. Cliquez sur "Add custom domain"
3. Entrez votre domaine
4. Suivez les instructions pour configurer les DNS

## Étape 4: Tester le déploiement

### 4.1 Vérifier l'application

1. Ouvrez l'URL Netlify dans votre navigateur
2. Testez la connexion avec admin@rz.com / admin
3. Créez une réclamation de test
4. Testez la messagerie
5. Vérifiez l'upload de fichiers

### 4.2 Configurer les redirections

Créez un fichier `_redirects` pour gérer les routes:

```bash
# Dans web/public/_redirects
/*    /index.html   200
```

## Étape 5: Mise à jour automatique

Maintenant, chaque fois que vous pushez du code sur GitHub:

```bash
git add .
git commit -m "Description des modifications"
git push
```

Netlify déploiera automatiquement la nouvelle version !

## Étape 6: Configurer Supabase pour la production

### 6.1 Autoriser le domaine Netlify

1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. Allez dans **Authentication** > **URL Configuration**
4. Ajoutez votre URL Netlify dans **Site URL**:
   ```
   https://colissimo-reclamations.netlify.app
   ```
5. Ajoutez aussi dans **Redirect URLs**:
   ```
   https://colissimo-reclamations.netlify.app/**
   ```

### 6.2 Configurer le Storage

1. Allez dans **Storage** > **Policies**
2. Vérifiez que les politiques sont bien actives

## Dépannage

### Erreur de build

Si le build échoue:

1. Vérifiez les logs dans Netlify
2. Assurez-vous que toutes les dépendances sont dans `package.json`
3. Vérifiez que la version de Node.js est compatible

### Erreur de connexion Supabase

1. Vérifiez que les variables d'environnement sont bien configurées
2. Vérifiez que l'URL Netlify est autorisée dans Supabase
3. Vérifiez les politiques RLS dans Supabase

### Upload de fichiers ne fonctionne pas

1. Vérifiez que le bucket `reclamations` existe
2. Vérifiez qu'il est public
3. Vérifiez les politiques de Storage

## Fonctionnalités après déploiement

Une fois déployé, votre application aura:

- ✅ URL accessible partout dans le monde
- ✅ HTTPS automatique (sécurisé)
- ✅ Déploiement automatique à chaque push Git
- ✅ CDN global pour performance optimale
- ✅ Certificat SSL gratuit
- ✅ Previews des pull requests
- ✅ Rollback facile vers versions précédentes

## Coûts

### Netlify (Gratuit)

- 100 GB de bande passante/mois
- 300 minutes de build/mois
- Déploiements illimités
- HTTPS inclus

### Supabase (Gratuit)

- 500 MB de base de données
- 1 GB de stockage fichiers
- 2 GB de bande passante
- 50,000 utilisateurs actifs

Ces quotas gratuits sont largement suffisants pour commencer !

## Support

- Documentation Netlify: https://docs.netlify.com
- Documentation Next.js: https://nextjs.org/docs
- Documentation Supabase: https://supabase.com/docs

## Sécurité en production

### Recommandations:

1. **Changez tous les mots de passe** des utilisateurs test
2. **Activez 2FA** sur Supabase et Netlify
3. **Limitez les accès** aux repositories GitHub
4. **Surveillez les logs** régulièrement
5. **Faites des backups** de la base de données

### Backup Supabase:

1. Allez dans **Database** > **Backups**
2. Activez les backups automatiques quotidiens
3. Téléchargez des backups manuels régulièrement

## Prochaines étapes

Une fois déployé:

1. Partagez l'URL avec votre équipe
2. Créez des comptes pour tous les utilisateurs
3. Importez vos données Excel existantes
4. Configurez les notifications par email (optionnel)
5. Personnalisez le design si nécessaire

Bon déploiement ! 🚀
