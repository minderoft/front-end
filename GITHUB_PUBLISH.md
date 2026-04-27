# 🔒 Checklist Sécurité - LocaPlus

## ✅ Avant de pousser sur GitHub

### 1. Fichiers protégés par .gitignore
- [x] `.env` - Variables d'environnement (clés API, mots de passe)
- [x] `node_modules/` - Dépendances
- [x] `uploads/` - Images utilisateurs
- [x] `dist/` - Fichiers de build
- [x] `*.log` - Fichiers de logs

### 2. Vérification des secrets codés en dur
- [x] Plus de clés API dans le code
- [x] Plus de mots de passe par défaut
- [x] JWT_SECRET utilise uniquement `process.env`

### 3. Fichiers créés pour la sécurité
- [x] `.gitignore` - Complet et à jour
- [x] `.env.example` - Template sans données réelles
- [x] `backend/security-check.js` - Script de vérification

### 4. Commandes de vérification

```bash
# Vérifier que .env n'est pas suivi
git ls-files | grep "\.env"

# Vérifier les secrets dans le code
node backend/security-check.js

# Voir ce qui sera poussé
git status
git diff --staged --name-only
```

---

## 🚀 Pour publier sur GitHub

```bash
# 1. Initialiser git (si pas fait)
git init

# 2. Ajouter les fichiers
git add .

# 3. Vérifier ce qu'on ajoute
git status

# 4. Créer le commit
git commit -m "feat: LocaPlus - Plateforme multi-services

- Système d'authentification JWT
- Gestion des annonces par catégorie
- Paiement Paystack (Wave, Orange, MTN, Moov)
- Design responsive"

# 5. Créer le repo sur GitHub puis:
git remote add origin https://github.com/VOTRE_USERNAME/locaplus.git
git push -u origin main
```

---

## ⚠️ Après le clonage

Les utilisateurs devront:
1. Copier `.env.example` vers `.env`
2. Remplir leurs propres valeurs
3. Exécuter `npm install` dans `backend/` et `front-end/`

```bash
# Backend
cd backend
cp .env.example .env
# Éditer .env avec vos valeurs
npm install

# Frontend
cd ../front-end
npm install
npm run dev
```