# LocaPlus - Spécifications Techniques

## 1. Aperçu du Projet

**Nom :** LocaPlus  
**Type :** Plateforme multi-services de mise en relation  
**Résumé :** Application web professionnelle permettant aux propriétaires, vendeurs et techniciens de publier des annonces pour trouver des clients.  
**Utilisateurs cibles :** Propriétaires immobiliers, propriétaires de véhicules, vendeurs de matériaux, techniciens de tous métiers

---

## 2. Architecture Technique

### Stack Technique
- **Frontend :** React.js 18 + Vite
- **Backend :** Node.js + Express.js
- **Base de données :** PostgreSQL
- **Authentification :** JWT + bcrypt
- **Upload d'images :** Stockage local sécurisé (uploads/)
- **Paiement :** PayStack (Wave, Orange Money, MTN, Moov, cartes bancaires)

### Structure des Dossiers
```
mon App/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Announcement.js
│   │   └── Payment.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── announcements.js
│   │   ├── payments.js
│   │   └── contact.js
│   ├── uploads/
│   ├── server.js
│   └── package.json
│
├── front end/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── services/
│   │   ├── styles/
│   │   └── App.jsx
│   ├── index.html
│   └── package.json
│
└── README.md
```

---

## 3. Spécifications UI/UX

### Palette de Couleurs
| Rôle | Couleur | Code Hex |
|------|---------|----------|
| Primaire | Bleu foncé | #1E3A5F |
| Secondaire | Blanc | #FFFFFF |
| Accent | Orange | #FF6B35 |
| Fond | Gris clair | #F5F7FA |
| Texte | Gris foncé | #2D3748 |
| Success | Vert | #38A169 |
| Error | Rouge | #E53E3E |

### Typographie
- **Police principale :** Inter (Google Fonts)
- **Titres :** 700 (bold), 24-32px
- **Sous-titres :** 600 (semibold), 18-20px
- **Corps :** 400 (regular), 14-16px

### Composants UI
- Boutons primaires : Fond bleu (#1E3A5F), texte blanc, border-radius 8px
- Boutons secondaires : Fond transparent, bordure bleue
- Cards : Fond blanc, ombre douce, border-radius 12px
- Inputs : Bordure grise, focus bleu, border-radius 6px
- Navigation : Fixe en haut, fond blanc avec ombre

### Responsive
- Mobile : < 768px
- Tablette : 768px - 1024px
- Desktop : > 1024px

---

## 4. Catégories d'Annonces

### 4.1 Immobilier
**Prix :** 5000 FCFA/mois  
**Champs :**
- Type (location/vente)
- Catégorie (terrain/villa/appartement/bureau)
- Titre
- Description
- Prix (FCFA)
- Localisation (ville, quartier)
- Surface (m²)
- Nombre de pièces
- Images (multiple)

### 4.2 Véhicules
**Prix :** 4000 FCFA/mois  
**Champs :**
- Type (location/vente)
- Catégorie (voiture/moto/camion)
- Marque
- Modèle
- Année
- Kilométrage
- Carburant
- Prix (FCFA)
- Localisation
- Description
- Images (multiple)

### 4.3 Matériaux de Construction
**Prix :** 3000 FCFA/mois  
**Champs :**
- Catégorie (ciment/sable/gravier/fer/brique/bois/peinture/autre)
- Titre
- Description
- Prix unitaire (FCFA)
- Unité (sac/tonne/m³/pièce)
- Localisation
- Disponibilité
- Images (multiple)

### 4.4 Techniciens
**Prix :** 2000 FCFA/mois  
**Champs :**
- Métier (plombier/électricien/maçon/peintre/carreleur/mécanicien/autre)
- Nom/Entreprise
- Description
- Localisation
- Téléphone
- Email
- Disponibilité
- Images (portfolio)

---

## 5. Spécifications API

### 5.1 Authentification
```
POST /api/auth/register - Inscription
POST /api/auth/login - Connexion
GET  /api/auth/me - Profil utilisateur
```

### 5.2 Annonces
```
GET    /api/announcements - Liste (avec filtres)
GET    /api/announcements/:id - Détail
POST   /api/announcements - Créer (authentifié)
PUT    /api/announcements/:id - Modifier (propriétaire)
DELETE /api/announcements/:id - Supprimer (propriétaire)
```

### 5.3 Paiements
```
POST /api/payments/create - Créer paiement
POST /api/payments/verify - Vérifier paiement
GET  /api/payments/history - Historique utilisateur
```

### 5.4 Contact
```
POST /api/contact - Envoyer message

```

---

## 6. Sécurité

### Protection Implémentée
- **bcrypt** : Hashage des mots de passe (12 rounds)
- **JWT** : Tokens d'accès (24h expiration)
- **Validation** : Joi pour validation des données
- **Rate Limiting** : 100 requêtes/15min par IP
- **CORS** : Configuration stricte
- **Helmet** : Headers de sécurité
- **Sanitization** : Protection XSS
- **Prepared Statements** : Protection SQL Injection

---

## 7. Fonctionnalités

### Pages Frontend
1. **Accueil** - Hero, catégories, annonces récentes
2. **Annonces** - Liste avec filtres (catégorie, prix, localisation)
3. **Détail Annonce** - Informations complètes, images, contact
4. **Publier** - Formulaire dynamique selon catégorie
5. **Dashboard** - Gestion des annonces, statistiques
6. **Connexion/Inscription** - Authentification
7. **Aide** - FAQ et guide d'utilisation
8. **Contact** - Formulaire de contact admin

### Filtres de Recherche
- Catégorie principale
- Sous-catégorie
- Prix min/max
- Localisation (ville)
- Type (location/vente)

---

## 8. Modèle de Données

### User
```javascript
{
  id: UUID,
  email: String (unique),
  password: String (hashed),
  name: String,
  phone: String,
  role: Enum ['user', 'admin'],
  createdAt: DateTime
}
```

### Announcement
```javascript
{
  id: UUID,
  userId: UUID (FK),
  category: Enum ['immobilier', 'vehicule', 'materiaux', 'technicien'],
  type: Enum ['vente', 'location'] (optionnel),
  title: String,
  description: Text,
  price: Number,
  location: String,
  images: String[] (chemins),
  status: Enum ['pending', 'active', 'expired'],
  paymentStatus: Boolean,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Payment
```javascript
{
  id: UUID,
  userId: UUID (FK),
  announcementId: UUID (FK),
  amount: Number,
  method: Enum ['wave', 'orange_money', 'mtn', 'moov', 'card'],
  status: Enum ['pending', 'completed', 'failed'],
  transactionId: String,
  createdAt: DateTime
}
```

---

## 9. Logo LocaPlus

### Spécifications
- **Style :** Moderne, startup tech
- **Icône :** Maison + flèche vers le haut (connexion/croissance)
- **Couleurs :** Bleu (#1E3A5F) + Orange (#FF6B35)
- **Format :** SVG vectoriel
- **Usage :** Header, favicon, documents

---

## 10. Critères de Succès

- [ ] Inscription/connexion fonctionnelle
- [ ] Publication d'annonces avec upload d'images
- [ ] Système de paiement simulé opérationnel
- [ ] Recherche et filtres fonctionnels
- [ ] Dashboard utilisateur complet
- [ ] Interface responsive mobile/desktop
- [ ] Sécurité backend renforcée
- [ ] Code structuré et commenté
- [ ] README complet avec instructions