# 🔧 Corrections Timeout & Debug - LocaPlus Migration Neon

## 🎯 Problèmes Diagnostiqués

```
Symptômes:
- Erreur 500 lors du login
- Timeout 30 secondes (Render cold start)
- Manque de visibilité dans les logs
```

---

## ✅ Corrections Appliquées

### 1. **Frontend (Axios Timeout)**
📁 `front-end/src/services/api.js`

```javascript
// ❌ AVANT: timeout: 30000 (30s)
// ✅ APRÈS: timeout: 60000 (60s)

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 60000, // ✅ Augmenté pour Render cold start
});
```

**Raison:** Render peut mettre jusqu'à 60s à se réveiller après inactivité (cold start).

### 2. **Backend - DB Logs Détaillés**
📁 `backend/config/db.js`

#### testConnection() - Amélioré
```javascript
const testConnection = async () => {
  console.log('🔌 [DB] Test de connexion PostgreSQL/Neon...');
  // Affiche configuration SSL + timing
};
```

#### getAsync() - Logs de Debug
```javascript
const getAsync = async (sql, params = []) => {
  console.log('📊 getAsync - Tentative de connexion à la DB...', {
    table: sql.match(/FROM\s+(\w+)/i)?.[1],
    paramsCount: params.length,
    timestamp: new Date().toISOString(),
  });
  
  // ✅ Mesure timing + affiche résultats
  const result = await pool.query(...);
  console.log(`✅ getAsync réussi en ${elapsed}ms`);
};
```

### 3. **Backend - Login Route Logs**
📁 `backend/routes/auth.js`

```javascript
router.post('/login', validate('login'), async (req, res) => {
  const startTime = Date.now();
  
  // ✅ Log 1: Tentative login
  console.log(`🔐 [LOGIN] Tentative de connexion pour: ${email}`);
  console.log(`⏱️ [LOGIN] Timeout configuré: 60000ms`);

  // ✅ Log 2: Recherche DB
  console.log(`🔍 [LOGIN] Recherche utilisateur dans table 'users'...`);
  const user = await getAsync('SELECT * FROM users WHERE email = ?', [email]);
  const dbElapsed = Date.now() - dbStartTime;
  console.log(`✅ [LOGIN] Requête DB complétée en ${dbElapsed}ms`);

  // ✅ Log 3: Vérification password
  console.log(`✓ [LOGIN] Utilisateur trouvé, vérification mot de passe...`);
  const isValidPassword = await bcrypt.compare(password, user.password);
  const bcryptElapsed = Date.now() - bcryptStartTime;
  console.log(`✅ [LOGIN] Vérification bcrypt complétée en ${bcryptElapsed}ms`);

  // ✅ Log 4: Token généré
  console.log(`🔑 [LOGIN] Génération du JWT token...`);
  
  // ✅ Log 5: Succès total
  const totalElapsed = Date.now() - startTime;
  console.log(`✅ [LOGIN] Connexion réussie en ${totalElapsed}ms\n`);
});
```

### 4. **Frontend - Timeout Error Handling**
📁 `front-end/src/services/api.js`

```javascript
// ✅ Nouveau: Détection ECONNABORTED (timeout)
if (error.code === 'ECONNABORTED') {
  console.error('⏱️ TIMEOUT (60s dépassé):', {
    message: 'La requête a dépassé le délai de 60 secondes',
    url: error.config?.url,
    method: error.config?.method?.toUpperCase(),
  });
}
```

---

## 🧪 Comment Tester

### Test 1: Logs Backend
```bash
# Sur Render Dashboard → Logs
# Devrait afficher:
🔐 [LOGIN] Tentative de connexion pour: test@example.com
📊 [LOGIN] Timestamp: 2026-05-12T10:30:45.123Z
⏱️ [LOGIN] Timeout configuré: 60000ms
🔍 [LOGIN] Recherche utilisateur dans table 'users'...
✅ [LOGIN] Requête DB complétée en 245ms
✓ [LOGIN] Utilisateur trouvé, vérification mot de passe...
✅ [LOGIN] Vérification bcrypt complétée en 156ms
🔑 [LOGIN] Génération du JWT token...
✅ [LOGIN] Connexion réussie en 412ms
```

### Test 2: Frontend Console
```javascript
// Sur https://loca-plus-hub.vercel.app
// Ouvrir F12 → Console
// Essayer login → voir logs détaillés
```

### Test 3: Timeout Intentionnel
```javascript
// Pour tester le timeout:
curl -X POST https://backend-ovbc.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  --max-time 65
```

---

## 📊 Diagnostic Checklist

| Item | État | Details |
|------|------|---------|
| **Frontend Timeout** | ✅ | 60000ms (Axios) |
| **Backend SSL** | ✅ | `rejectUnauthorized: false` |
| **DB Logs** | ✅ | getAsync() logs timing |
| **Login Logs** | ✅ | 5 points de debug + timing total |
| **CORS** | ✅ | Domains autorisés |
| **Cold Start** | ✅ | Render peut prendre 50-60s |

---

## 🔍 Logs à Regarder sur Render

### ✅ Logs Normaux (Succès)
```
🔌 [DB] Test de connexion PostgreSQL/Neon...
✅ [DB] PostgreSQL connexion établie en 245ms
📊 [DB] Configuration: ssl: enabled, sslmode: require
🔐 [LOGIN] Tentative de connexion pour: user@example.com
✅ [LOGIN] Connexion réussie en 412ms
```

### ❌ Logs d'Erreur (À Diagnostiquer)
```
❌ [DB] PostgreSQL ping échoué après 2000ms: connect ENOTFOUND
// → Vérifier DATABASE_URL avec ?sslmode=require

❌ PostgreSQL getAsync error après 500ms: Syntax Error
// → Vérifier convertPlaceholders() fonctionne (? → $1, $2)

❌ [LOGIN] ERREUR après 30005ms: TIMEOUT
// → Augmenter timeout frontend à 90000ms
```

---

## 📈 Optimisations Supplémentaires (Optionnel)

Si vous recevez toujours des timeouts > 60s:

### Option 1: Augmenter encore le timeout
```javascript
// front-end/src/services/api.js
timeout: 90000, // 90 secondes
```

### Option 2: Ajouter Connection Pool Warming
```javascript
// backend/config/db.js
const warmConnectionPool = async () => {
  for (let i = 0; i < 5; i++) {
    try {
      await pool.query('SELECT 1');
      console.log(`✅ Pool warmed ${i + 1}/5`);
    } catch (err) {
      console.error(`⚠️ Pool warm failed ${i + 1}/5`, err.message);
    }
  }
};
```

### Option 3: Upgrade Render Plan
- Free tier: Idle timeout 15 min (cold start)
- Starter: Idle timeout 1h (cold start)
- Pro+: Toujours actif (sans cold start)

---

## 🚀 Déploiement

```bash
# 1. Commit les changements
git add -A
git commit -m "feat: add timeout optimization + debug logs for login

- Increase Axios timeout to 60s for Render cold start
- Add detailed logging in getAsync() and login route
- Improve timeout error handling in frontend
- Add SSL config logging in testConnection()
- All timing measurements included for diagnostics"

# 2. Push
git push origin main

# 3. Render redéploiera automatiquement
# 4. Vérifier les logs

# 5. Tester
curl -X POST https://backend-ovbc.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## 📞 Support

| Erreur | Cause | Solution |
|--------|-------|----------|
| Timeout 60s | Cold start Render | Attendre 60s + augmenter timeout |
| Timeout < 5s | Backend crash | Vérifier logs Render |
| `ERR_NETWORK` | CORS blocked | Vérifier allowedOrigins |
| `ENOTFOUND` | DATABASE_URL invalide | Vérifier ?sslmode=require |
| `ECONNREFUSED` | Neon down | Vérifier Neon Dashboard |

---

**Généré:** 12 mai 2026  
**Version:** 1.0 - Debug Optimization Complete
