# ✅ CORRECTIONS AUTHENTIFICATION - LocaPlus

## 🔴 PROBLÈME CRITIQUE CORRIGÉ

### ❌ Erreur 403 Forbidden sur `/api/auth/me`

**Cause identifiée:** Syntaxe PostgreSQL incorrecte dans [backend/middleware/auth.js](backend/middleware/auth.js)

```javascript
// ❌ AVANT (MAUVAIS - MySQL syntax)
const result = await query('SELECT id, email, name, phone, role FROM users WHERE id = ?', [decoded.id]);
if (result.length === 0) { ... }
req.user = result[0];
```

```javascript
// ✅ APRÈS (CORRECT - PostgreSQL syntax)
const result = await pool.query('SELECT id, email, name, phone, role FROM users WHERE id = $1', [decoded.id]);
if (result.rowCount === 0) { ... }
req.user = result.rows[0];
```

**Changements:**
- Remplacé `query()` par `pool.query()` (utilise PostgreSQL)
- Remplacé `?` par `$1` (syntaxe PostgreSQL)
- Remplacé `result.length` par `result.rowCount`
- Remplacé `result[0]` par `result.rows[0]`

---

## ✅ AMÉLIORATIONS APPORTÉES

### 1. **AuthContext.jsx** - Meilleure gestion de la session

**Améliorations:**
- ✅ Meilleure gestion des erreurs lors de la restauration de session
- ✅ Ajout de logging pour le debugging
- ✅ Vérification plus robuste du token à chargement de la page
- ✅ Gestion correcte du cas où `getProfile()` échoue

**Résultat:** Les utilisateurs gardent maintenant leur session même après un rechargement de page

---

## 📋 VÉRIFICATIONS COMPLÈTEMENT OK

### ✅ 1. Hachage du mot de passe (Backend)
- ✅ Utilise `bcrypt.hash(password, 12)` lors de l'inscription
- ✅ Utilise `bcrypt.compare(password, hashedPassword)` lors de la connexion
- ✅ Mot de passe stocké en base de données avec hash bcrypt

### ✅ 2. Gestion du Token JWT
- ✅ Token généré avec `generateToken(user)` après inscription ET connexion
- ✅ Token contient: `id`, `email`, `role` avec expiration 24h
- ✅ Token stocké dans `localStorage` avec clé `'token'`

### ✅ 3. Persistance de la Session (Frontend)
- ✅ AuthContext vérifie le token au chargement de page via `useEffect`
- ✅ Session restaurée depuis localStorage
- ✅ Appel à `/auth/me` pour valider le token auprès du serveur

### ✅ 4. Headers Authorization
- ✅ Intercepteur Axios ajoute `Authorization: Bearer <token>` sur toutes requêtes
- ✅ Token récupéré depuis localStorage
- ✅ Logique: si token existe → ajout au header `Authorization`

### ✅ 5. CORS & Credentials
- ✅ Backend: `credentials: true` dans CORS
- ✅ Frontend: `withCredentials: true` dans axios
- ✅ Headers CORS autorise `Authorization`, `Content-Type`
- ✅ Méthodes autorisées: GET, POST, PUT, DELETE, PATCH, OPTIONS

---

## 🧪 SCRIPT DE DEBUG SQL

Un script complet a été créé: [DEBUG_AUTH_NEON.sql](DEBUG_AUTH_NEON.sql)

**Le script permet de vérifier:**
- ✅ Nombre total d'utilisateurs
- ✅ Liste de tous les utilisateurs avec aperçu du hash
- ✅ Format des mots de passe hachés (doivent commencer par `$2a$`, `$2b$`, `$2x$` ou `$2y$`)
- ✅ Longueur des mots de passe (bcrypt = 60 caractères)
- ✅ Statut `accepted_policy` des utilisateurs
- ✅ Identifier les mots de passe en clair (DANGER!)

**À utiliser dans la console Neon:**
1. Allez sur https://console.neon.tech
2. Sélectionnez votre base de données
3. Ouvrez l'onglet "SQL Editor"
4. Collez les queries du script

---

## 🔧 PROCÉDURE DE TEST

### 1️⃣ Redémarrez le backend
```bash
# Sur Render, déclenchez un redéploiement
# Ou, en local:
cd backend
npm install  # si besoin
node server.js
```

### 2️⃣ Testez l'inscription
```
POST /api/auth/register
{
  "email": "test@example.com",
  "password": "TestPassword123",
  "name": "Test User",
  "accepted_policy": true
}
```

**Attendez-vous à recevoir:**
```json
{
  "message": "Inscription réussie",
  "user": { "id": "...", "email": "test@example.com", ... },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 3️⃣ Testez la connexion
```
POST /api/auth/login
{
  "email": "test@example.com",
  "password": "TestPassword123"
}
```

**Attendez-vous à recevoir:**
```json
{
  "message": "Connexion réussie",
  "user": { "id": "...", "email": "test@example.com", ... },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 4️⃣ Testez `/api/auth/me`
```
GET /api/auth/me
Headers: Authorization: Bearer <votre_token>
```

**Attendez-vous à recevoir:**
```json
{
  "user": { "id": "...", "email": "test@example.com", ... }
}
```

---

## 🚀 DÉPLOIEMENT

Les corrections sont prêtes:

1. ✅ **backend/middleware/auth.js** - CORRIGÉ
2. ✅ **front-end/src/context/AuthContext.jsx** - AMÉLIORÉ

**Commandes:**
```bash
cd backend
git add .
git commit -m "Fix: Corriger syntaxe PostgreSQL dans authenticateToken"
git push origin main
# Render se redéploiera automatiquement

cd ../front-end
git add .
git commit -m "Improve: Meilleure gestion session AuthContext"
git push origin main
# Vercel se redéploiera automatiquement
```

---

## 📊 RÉSUMÉ DES MODIFICATIONS

| Fichier | Problème | Solution | Impact |
|---------|----------|----------|--------|
| `backend/middleware/auth.js` | Syntaxe MySQL au lieu PostgreSQL | Remplacer `query()` par `pool.query()`, `?` par `$1` | 🔴 CRITIQUE - Corrige erreur 403 |
| `front-end/src/context/AuthContext.jsx` | Gestion session faible | Meilleur error handling et logging | 🟡 Amélioration UX |
| `front-end/src/services/api.js` | ✅ OK | Aucune modification nécessaire | ✅ Pas de problème |
| `backend/server.js` | ✅ OK | Aucune modification nécessaire | ✅ CORS bien configuré |
| `backend/routes/auth.js` | ✅ OK | Aucune modification nécessaire | ✅ Bcrypt bien utilisé |

---

## ⚠️ NOTES IMPORTANTES

### Authenticité du mot de passe
- Les mots de passe sont maintenant correctement hachés avec bcrypt
- Les anciennes données en clair (si elles existent) doivent être regénérées
- Utilisez le script SQL pour vérifier le format

### Token JWT
- Expiration: 24 heures
- Secret: `process.env.JWT_SECRET` (doit être défini dans .env)
- Portée: Contient uniquement l'ID, email, et role (pas le mot de passe)

### CORS
- Les cookies ne sont pas utilisés, mais les headers Authorization à la place
- C'est plus sûr pour une architecture Vercel → Render

### Frontend
- Token stocké dans `localStorage` (non httpOnly)
- Cela permet à JavaScript de l'utiliser, mais c'est moins sûr
- Alternative: utiliser des cookies httpOnly côté backend

---

## 🧪 TEST RAPIDE

Ouvrez la console du navigateur et vérifiez:
```javascript
// Vérifier le token stocké
console.log(localStorage.getItem('token'));

// Vérifier l'utilisateur stocké
console.log(JSON.parse(localStorage.getItem('user')));
```

Les appels API suivants doivent maintenant fonctionner:
- ✅ POST /api/auth/register
- ✅ POST /api/auth/login
- ✅ GET /api/auth/me
- ✅ PUT /api/auth/profile
- ✅ PUT /api/auth/password

---

## 📞 SUPPORT

Si vous rencontrez toujours des problèmes:

1. **Vérifier les logs du backend** (console Render)
   - Chercher les messages `[LOGIN]`, `[AUTH]`, `[REGISTER]`

2. **Vérifier la console du navigateur** (DevTools)
   - Chercher les appels API et leurs réponses

3. **Utiliser le script SQL** pour vérifier la base de données
   - Vérifier que les mots de passe sont hachés
   - Vérifier que `accepted_policy = TRUE`

4. **Vérifier les variables d'environnement**
   - Backend: `JWT_SECRET`, `DATABASE_URL`
   - Frontend: `VITE_API_BASE_URL` (devrait pointer à Render)

