# ✅ Configuration PostgreSQL Neon sur Render - Guide Complet

## 1. 🔧 Erreur 500 & CORS - Diagnostic & Correction

### ❌ Problème Principal : Placeholders MySQL vs PostgreSQL

**Le Bug :**
```javascript
// ❌ MAUVAIS - Format MySQL (ne fonctionne PAS avec PostgreSQL)
await getAsync('SELECT * FROM users WHERE email = ?', [email]);
```

**La Correction ✅ :**
```javascript
// ✅ BON - Conversion automatique en PostgreSQL ($1, $2, etc.)
// Tous les fichiers backend utilisent cette conversion automatiquement maintenant
```

**Fichier Corrigé :** `backend/config/db.js`
- Ajout fonction `convertPlaceholders()` qui transforme `?` → `$1`, `$2`, etc.
- Toutes les fonctions (`getAsync`, `runAsync`, `query`, `allAsync`) utilisent cette conversion

---

## 2. 📋 Structure Exacte de DATABASE_URL pour Render

### Format de Neon vers Render

```
postgresql://username:password@host/database?sslmode=require
```

### Exemple Réel (À adapter)
```
postgresql://neon_user:your_secure_password@db.neon.tech:5432/locaplus_db?sslmode=require
```

### Où Trouver ces Informations

1. **Sur Neon Dashboard :**
   - Allez à : https://console.neon.tech/
   - Sélectionnez votre projet → Connexions
   - Copiez la chaîne de connexion PostgreSQL

2. **Exemple complet depuis Neon :**
   ```
   postgresql://neondb_owner:abc123xyz@ep-cool-name-123.us-east-1.neon.tech/neondb?sslmode=require
   ```

### Sur Render - Où Mettre cette Variable

1. **Allez à :** https://dashboard.render.com/
2. **Sélectionnez votre service Backend** (ex: `backend-ovbc`)
3. **Menu → Settings → Environment**
4. **Ajouter ou Modifier :**
   - **Clé :** `DATABASE_URL`
   - **Valeur :** `postgresql://...@db.neon.tech/...?sslmode=require`

---

## 3. ✅ Configuration CORS (Déjà Correcte)

### Domaines Autorisés dans `backend/server.js`
```javascript
const allowedOrigins = [
  'https://loca-plus-hub.vercel.app',           // ✅ Production
  'https://front-end-git-main-minderofts-projects.vercel.app',  // ✅ Backup
  'http://localhost:5173',                      // Dev
  'http://localhost:3000',                      // Dev
  'http://127.0.0.1:5173',                      // Dev
];
```

**État :** ✅ **DÉJÀ CONFIGURÉ**

---

## 4. 🔐 SSL PostgreSQL (Déjà Correct)

### Fichier `backend/config/db.js`
```javascript
const createPoolConfig = () => {
  return {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,  // ✅ OBLIGATOIRE pour Neon sur Render
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
};
```

**État :** ✅ **DÉJÀ CONFIGURÉ**

---

## 5. 🧪 Tests de Connexion

### Test 1 : Health Check (Sans Base de Données)
```bash
curl https://backend-ovbc.onrender.com/
```
**Résultat Attendu :**
```json
{"status":"ok","message":"LocaPlus backend is running"}
```

### Test 2 : Login (Teste la Base de Données)
```bash
curl -X POST https://backend-ovbc.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```
**Résultat Attendu :**
- ✅ Si utilisateur existe : `{"message":"Connexion réussie","user":{...},"token":"..."}`
- ✅ Si utilisateur n'existe pas : `{"error":"Email ou mot de passe incorrect"}`

### Test 3 : CORS depuis le Frontend
```javascript
// Dans la console du navigateur sur https://loca-plus-hub.vercel.app

fetch('https://backend-ovbc.onrender.com/', {
  method: 'GET',
  credentials: 'include'
})
.then(r => r.json())
.then(d => console.log('✅ CORS OK:', d))
.catch(e => console.error('❌ CORS Error:', e))
```

---

## 6. 📝 Variables d'Environnement sur Render (Checklist)

| Variable | Format | Exemple |
|----------|--------|---------|
| `DATABASE_URL` | postgresql://... | `postgresql://user:pass@db.neon.tech/db?sslmode=require` |
| `NODE_ENV` | production | `production` |
| `FRONTEND_URL` | https://... | `https://loca-plus-hub.vercel.app` |
| `PAYSTACK_PUBLIC_KEY` | pk_live_... | Depuis https://dashboard.paystack.com |
| `PAYSTACK_SECRET_KEY` | sk_live_... | Depuis https://dashboard.paystack.com |
| `JWT_SECRET` | Chaîne aléatoire | `your_secret_key_here` |

**Vérifier sur Render :**
```
Settings → Environment → Afficher toutes les variables
```

---

## 7. 🚀 Étapes de Déploiement

### 1️⃣ Préparer l'Environnement Render
```
DATABASE_URL = postgresql://...@db.neon.tech/...?sslmode=require
NODE_ENV = production
FRONTEND_URL = https://loca-plus-hub.vercel.app
PAYSTACK_PUBLIC_KEY = pk_live_...
PAYSTACK_SECRET_KEY = sk_live_...
JWT_SECRET = random_secret_key
```

### 2️⃣ Pousser le Code
```bash
git add -A
git commit -m "fix: PostgreSQL placeholder conversion + SSL config"
git push origin main
```

### 3️⃣ Redémarrer le Service Render
- Dashboard → Services → Backend → Manual Deploy
- Ou attendez que Render détecte le push automatiquement

### 4️⃣ Vérifier les Logs
- Dashboard → Backend → Logs
- Cherchez : `✅ PostgreSQL connexion établie en XXXms`

---

## 8. 🐛 Dépannage - Erreurs Courantes

### ❌ Erreur : `connect ENOTFOUND db.neon.tech`
**Cause :** DATABASE_URL n'est pas définie ou mal configurée  
**Solution :** Vérifier Variable d'environnement sur Render → Settings

### ❌ Erreur 500 sur /api/auth/login
**Cause :** Placeholders `?` non convertis (MAINTENANT RÉSOLU)  
**Solution :** Vérifier que `convertPlaceholders()` est importée dans `db.js`

### ❌ CORS policy error
**Cause :** Domaine frontend non dans `allowedOrigins`  
**Solution :** Ajouter le domaine à `server.js` puis redéployer

### ❌ Error: ENOENT: no such file or directory
**Cause :** Dossier `uploads/` manquant  
**Solution :** 
```bash
mkdir -p backend/uploads
git add backend/uploads/.gitkeep
git commit -m "feat: create uploads directory"
```

### ❌ "ssl: { rejectUnauthorized: false }" ne fonctionne pas
**Cause :** DATABASE_URL n'inclut pas `?sslmode=require`  
**Solution :** Vérifier format exact :
```
postgresql://user:pass@db.neon.tech/db?sslmode=require
```

---

## 9. ✅ Checklist Finale

- [ ] DATABASE_URL configurée sur Render avec `?sslmode=require`
- [ ] NODE_ENV = `production`
- [ ] FRONTEND_URL = `https://loca-plus-hub.vercel.app`
- [ ] Paystack keys configurées
- [ ] JWT_SECRET définie
- [ ] Code pushé avec convertPlaceholders()
- [ ] Service Render redémarré
- [ ] Health check répond ✅
- [ ] Login endpoint teste la DB ✅
- [ ] CORS test depuis navigateur ✅
- [ ] Logs Render montrent "✅ PostgreSQL connexion établie"

---

## 10. 📞 Support Rapide

| Problème | Diagnostic | Action |
|----------|-----------|--------|
| Erreur 500 Everywhere | Regarder logs Render | Vérifier DATABASE_URL + convertPlaceholders |
| CORS error sur frontend | Vérifier browser console | Ajouter domaine à allowedOrigins |
| Base de données vide | Vérifier tables | Exécuter NEON_SETUP.sql manuellement |
| Service ne démarre pas | Regarder logs | Vérifier NODE_ENV + PORT + env vars |

---

**Généré :** 12 mai 2026  
**État :** ✅ PostgreSQL Neon SSL + CORS + Placeholder Conversion - PRÊT POUR PRODUCTION
