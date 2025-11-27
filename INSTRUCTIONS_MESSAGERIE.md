# Instructions - Système de Messagerie

## Étape importante : Activer la messagerie dans Supabase

Avant d'utiliser la messagerie, vous devez exécuter le script SQL dans Supabase.

### Comment faire:

1. **Ouvrez Supabase**
   - Allez sur https://app.supabase.com
   - Sélectionnez votre projet **Rz_Col_recla**

2. **Ouvrez SQL Editor**
   - Cliquez sur l'icône **SQL Editor** dans le menu de gauche
   - Cliquez sur **+ New Query**

3. **Copiez le script**
   - Ouvrez le fichier `supabase_messagerie.sql` (dans le dossier Reclamation)
   - Copiez TOUT le contenu

4. **Exécutez le script**
   - Collez le contenu dans l'éditeur SQL
   - Cliquez sur **Run** (en bas à droite)
   - Attendez quelques secondes
   - Vous devriez voir "Success"

## Fonctionnalités de la messagerie

### Pour les Admins

1. **Voir toutes les réclamations**
   - Cliquez sur l'icône "œil" sur une réclamation
   - Vous verrez les détails + la messagerie sur la droite

2. **Envoyer un message**
   - Tapez votre message dans le champ en bas
   - Cliquez sur "Envoyer"
   - Le chauffeur assigné sera notifié

3. **Messages en temps réel**
   - Les nouveaux messages apparaissent automatiquement
   - Pas besoin de rafraîchir la page

### Pour les Chauffeurs

1. **Voir vos réclamations**
   - Cliquez sur "Voir détails" sur une réclamation
   - La messagerie est sur la droite

2. **Communiquer avec l'admin**
   - Posez des questions
   - Demandez des clarifications
   - Donnez des mises à jour
   - Les admins sont notifiés instantanément

3. **Voir l'historique**
   - Tous les messages sont conservés
   - Scroll pour voir les anciens messages

## Exemples d'utilisation

### Exemple 1: Demande de clarification (Chauffeur)

```
Chauffeur: Bonjour, le client m'a dit qu'il n'a jamais reçu le colis.
Dois-je faire une nouvelle livraison ?

Admin: Non, vérifiez d'abord avec les voisins.
Le colis a été signé par M. Dupont au 3ème étage.

Chauffeur: OK compris, je vais vérifier. Merci !
```

### Exemple 2: Mise à jour de statut (Admin)

```
Admin: Le client a confirmé la réception.
Vous pouvez clôturer cette réclamation.

Chauffeur: Parfait, je marque comme clôturé.
```

### Exemple 3: Demande de preuve (Admin)

```
Admin: Pouvez-vous uploader une photo de la livraison ?

Chauffeur: [Upload une photo]
Voici la photo de la signature.

Admin: Merci ! C'est parfait.
```

## Interface de messagerie

### Couleurs des messages

- **Bleu**: Vos propres messages
- **Vert**: Messages des admins
- **Gris**: Messages des autres chauffeurs

### Informations affichées

- Nom de l'expéditeur
- Rôle (Admin ou pas)
- Heure d'envoi
- Contenu du message

### Fonctionnalités

- ✅ Messages en temps réel (WebSocket)
- ✅ Scroll automatique vers le bas
- ✅ Historique complet
- ✅ Notifications
- ✅ Horodatage précis

## Notifications

### Quand recevez-vous des notifications ?

**Admins reçoivent une notification quand:**
- Un chauffeur envoie un message

**Chauffeurs reçoivent une notification quand:**
- Un admin envoie un message sur leur réclamation

### Où voir les notifications ?

- Icône cloche 🔔 dans la barre de navigation
- Badge rouge avec le nombre de notifications
- (À venir: emails de notification)

## Bonnes pratiques

### Pour les Chauffeurs

1. **Soyez précis**: Donnez des détails clairs
2. **Répondez rapidement**: Les admins attendent vos retours
3. **Ajoutez des photos**: Ça aide beaucoup
4. **Mettez à jour le statut**: Après avoir résolu un problème

### Pour les Admins

1. **Répondez vite**: Les chauffeurs sont sur le terrain
2. **Donnez des instructions claires**: Évitez les malentendus
3. **Suivez les conversations**: Vérifiez régulièrement
4. **Clôturez quand c'est résolu**: Gardez la liste à jour

## Troubleshooting

### Les messages ne s'affichent pas

1. Vérifiez que vous avez exécuté `supabase_messagerie.sql`
2. Actualisez la page (F5)
3. Vérifiez votre connexion internet

### Impossible d'envoyer un message

1. Vérifiez que vous êtes connecté
2. Vérifiez que le champ n'est pas vide
3. Actualisez la page

### Les messages en temps réel ne fonctionnent pas

1. C'est normal si vous êtes sur localhost
2. Actualisez la page pour voir les nouveaux messages
3. En production sur Netlify, ça fonctionnera automatiquement

## Avantages de la messagerie

### Par rapport à Excel:

- ✅ **Communication directe** entre admin et chauffeur
- ✅ **Historique complet** de chaque réclamation
- ✅ **Notifications instantanées**
- ✅ **Pas besoin d'emails** ou de téléphone
- ✅ **Tout est centralisé** au même endroit
- ✅ **Traçabilité complète** des échanges

### Par rapport aux emails:

- ✅ **Plus rapide** que les emails
- ✅ **Contexte conservé** (lié à la réclamation)
- ✅ **Pas de boîte mail encombrée**
- ✅ **Accessible partout** (mobile, tablette, PC)
- ✅ **Recherche facile** dans l'historique

## Support

Si vous avez des problèmes avec la messagerie:

1. Vérifiez que le script SQL a été exécuté
2. Vérifiez les permissions RLS dans Supabase
3. Consultez les logs dans la console du navigateur (F12)
4. Contactez l'administrateur système

## Prochaines améliorations (à venir)

- 📧 Notifications par email
- 📱 Application mobile
- 🔔 Notifications push
- 📎 Drag & drop de fichiers dans le chat
- 🔍 Recherche dans les messages
- 📊 Statistiques de réponse

Bonne communication ! 💬
