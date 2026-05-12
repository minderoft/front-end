# Guide CORS - LocaPlus

## 🎯 Objectif

Configurer correctement CORS pour que le frontend Vercel puisse communiquer avec le backend Render sans erreurs.

---

## 📋 Configuration actuelle

### ✅ Backend (server.js)

```javascript
// CORS est configuré avec :
- Origin: https://loca-plus-hub.vercel.app (Vercel primary)
- Origin: https://front-end-git-main-minderofts-projects.vercel.app (Vercel backup)
- Méthodes: GET, POST, PUT, DELETE, PATCH, OPTIONS
- Headers autorisés: Content-Type, Authorization, X-Requested-With, Accept
- Credentials: true (pour les cookies, si nécessaire)
- maxAge: 86400 (24h en cache)
```

### ✅ Frontend (api.js)

```javascript
// Axios est configuré avec :
- baseURL: https://backend-ovbc.onrender.com/api
- withCredentials: true
- Timeout: 15 secondes
- Interception des erreurs CORS
```

---

## 🚀 Déploiement sur Render et Vercel

### Backend (Render)

1. **Créer une variable d'environnement** dans Render:
   ```
   FRONTEND_URL=https://loca-plus-hub.vercel.app
   NODE_ENV=production
   ```
   - Note: le backend accepte également le domaine de secours `https://front-end-git-main-minderofts-projects.vercel.app` dans `allowedOrigins`.

2. **Vérifier que CORS fonctionne**:
   ```bash
   curl -H "Origin: https://loca-plus-hub.vercel.app" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        https://backend-ovbc.onrender.com/api/auth/register -v
   ```

3. **Tester la route de santé**:
   ```bash
   curl https://backend-ovbc.onrender.com/api/health
   ```

### Frontend (Vercel)

- ✅ Aucune configuration CORS nécessaire côté frontend
- L'API est appelée depuis le navigateur du client
- CORS est géré par le serveur backend

---

## 🔍 Débogage des erreurs CORS

### Erreur: "No 'Access-Control-Allow-Origin' header"

**Cause**: Le backend ne retourne pas les headers CORS

**Solution**:
1. Vérifier que le middleware CORS est appliqué AVANT les routes
2. S'assurer que `app.options('*', cors(corsOptions))` est présent
3. Vérifier que le domaine Vercel est dans la liste `allowedOrigins`

### Erreur: "Access-Control-Allow-Credentials: true"

**Cause**: `withCredentials: true` côté client nécessite `credentials: true` côté serveur

**Solution**:
- Dans `server.js`, vérifier: `credentials: true` ✅

### Erreur: Préflight échoue (OPTIONS)

**Cause**: Les requêtes OPTIONS ne retournent pas les bons headers

**Solution**:
1. S'assurer que `app.options('*', cors(corsOptions))` existe
2. Vérifier `optionsSuccessStatus: 200`

### Erreur: 401 Unauthorized sur les routes protégées

**Cause**: Le token n'est pas envoyé ou est expiré

**Solution**:
1. Vérifier que le token est bien sauvegardé dans localStorage
2. Vérifier que l'intercepteur Axios ajoute le header Authorization
3. Vérifier que le backend accepte le header Authorization

---

## 🧪 Tests CORS

### Test 1: Health Check

```bash
curl https://backend-ovbc.onrender.com/api/health
```

Réponse attendue:
```json
{
  "status": "OK",
  "cors": {
    "requestOrigin": "https://loca-plus-hub.vercel.app",
    "corsEnabled": true
  }
}
```

### Test 2: Preflight (OPTIONS)

```bash
curl -X OPTIONS \
  -H "Origin: https://loca-plus-hub.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://backend-ovbc.onrender.com/api/auth/register -v
```

Réponse attendue:
```
< HTTP/1.1 200 OK
< access-control-allow-origin: https://loca-plus-hub.vercel.app
< access-control-allow-methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
< access-control-allow-headers: Content-Type, Authorization
< access-control-allow-credentials: true
```

### Test 3: Script Node automatisé

```bash
node test-cors.js
```

---

## 📝 Checklist de vérification

- [ ] ✅ CORS est configuré dans server.js
- [ ] ✅ Les origins autorisées incluent Vercel
- [ ] ✅ `app.options('*', cors(corsOptions))` est présent
- [ ] ✅ Les méthodes GET, POST, PUT, DELETE sont autorisées
- [ ] ✅ Les headers Content-Type et Authorization sont autorisés
- [ ] ✅ `credentials: true` est configuré
- [ ] ✅ FRONTEND_URL est correct dans .env
- [ ] ✅ Axios a `withCredentials: true`
- [ ] ✅ Les erreurs CORS sont loggées en développement
- [ ] ✅ La route `/api/health` fonctionne
- [ ] ✅ Les routes `/api/auth/register` et `/api/auth/login` fonctionnent

---

## 🔐 Sécurité

### ✅ Ce qui est fait

- ✅ Origin whitelist (pas de "*")
- ✅ Méthodes explicitement autorisées
- ✅ Headers explicitement autorisés
- ✅ Helmet pour les security headers
- ✅ Rate limiting activé

### ⚠️ À ne pas faire

- ❌ Utiliser `origin: "*"` en production
- ❌ Autoriser tous les headers (`allowedHeaders: "*"`)
- ❌ Accepter n'importe quel origin
- ❌ Désactiver `credentials` si vous utilisez l'authentification

---

## 📚 Ressources

- [MDN - CORS](https://developer.mozilla.org/fr/docs/Web/HTTP/CORS)
- [Express CORS](https://github.com/expressjs/cors)
- [Axios Configuration](https://axios-http.com/fr/docs/req_config)

---

## 💡 Conseils pratiques

### En développement

1. **Activer les logs CORS** dans server.js:
   ```javascript
   if (process.env.NODE_ENV !== 'production') {
     console.log(`📤 Request from: ${req.get('origin')}`);
   }
   ```

2. **Utiliser localhost:5173** pendant le dev:
   ```javascript
   const DEV_URL = 'http://localhost:5173';
   ```

3. **Ouvrir les DevTools du navigateur** (F12):
   - Console > Erreurs CORS
   - Network > Headers de réponse

### En production

1. **Vérifier les domaines** régulièrement
2. **Monitorer les erreurs** via les logs Render/Vercel
3. **Tester avant chaque déploiement**:
   ```bash
   npm run test-cors
   ```

---

## 🆘 Support

Si CORS ne fonctionne pas:

1. Vérifier les variables d'environnement
2. Consulter les logs de Render
3. Tester avec curl avant de tester depuis le navigateur
4. Vérifier la console du navigateur (F12)
5. Vérifier que le backend redémarre après les changements .env
