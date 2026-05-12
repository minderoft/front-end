# ✅ CORS - Configuration complète pour LocaPlus

## 🎯 Résumé des modifications

Vous avez maintenant une configuration CORS complète et sécurisée pour communiquer entre:
- **Frontend**: https://loca-plus-hub.vercel.app (Vercel primary)
- **Frontend de secours**: https://front-end-git-main-minderofts-projects.vercel.app (Vercel backup)
- **Backend**: https://backend-ovbc.onrender.com/api (Render)

---

## 📋 Fichiers modifiés

### 1. **Backend - server.js**
✅ Configuration CORS renforcée:
- Import du module `cors`
- Middleware CORS global appliqué
- Preflight OPTIONS configuré
- Logging des requêtes en développement
- Gestion des erreurs CORS

### 2. **Backend - .env**
✅ Variable d'environnement mise à jour:
```
FRONTEND_URL=https://loca-plus-hub.vercel.app
```
- Le backend autorise également le domaine de secours `https://front-end-git-main-minderofts-projects.vercel.app` dans `allowedOrigins`.

### 3. **Frontend - api.js**
✅ Configuration Axios améliorée:
- `withCredentials: true` pour les cookies
- Timeout: 15 secondes
- Interception des requêtes/réponses
- Logging des erreurs CORS en développement

### 4. **Scripts de test**
✅ Nouveaux scripts pour déboguer:
- `test-cors.js` - Test des requêtes CORS
- `diagnose-cors.js` - Diagnostic complet

---

## 🚀 Étapes de déploiement

### Étape 1: Mettre à jour le backend sur Render

```bash
# 1. Vérifier les variables d'environnement
cd backend
cat .env | grep FRONTEND_URL

# 2. Vérifier la configuration CORS
node diagnose-cors.js

# 3. Commit et push
git add -A
git commit -m "feat: Fix CORS configuration for Vercel frontend"
git push origin main
```

Render redémarrera automatiquement le serveur.

### Étape 2: Vérifier que le backend fonctionne

```bash
# Test la route de santé (sans CORS)
curl https://backend-ovbc.onrender.com/api/health

# Réponse attendue:
# {
#   "status": "OK",
#   "cors": {
#     "requestOrigin": "...",
#     "corsEnabled": true
#   }
# }
```

### Étape 3: Mettre à jour le frontend

```bash
# 1. Vérifier que api.js est à jour
cd ../front-end
cat src/services/api.js | head -20

# 2. Commit et push
git add -A
git commit -m "feat: Improve Axios CORS and error handling"
git push origin main
```

Vercel redéploiera automatiquement.

### Étape 4: Tester depuis le navigateur

1. Aller sur https://loca-plus-hub.vercel.app
2. Ouvrir les DevTools (F12)
3. Aller dans l'onglet **Console**
4. Essayer de s'inscrire ou de se connecter
5. Vérifier qu'il n'y a pas d'erreurs CORS

**Erreurs attendues** ❌:
- `No 'Access-Control-Allow-Origin' header`
- `Access-Control-Allow-Credentials`
- CORS errors en general

**Si vous voyez ces erreurs**, le problème CORS n'est pas résolu.

**Si vous ne voyez pas d'erreurs CORS** ✅, c'est bon!

---

## 🧪 Tests

### Test 1: Health Check CORS

Ouvrir la console du navigateur et exécuter:

```javascript
fetch('https://backend-ovbc.onrender.com/api/health')
  .then(r => r.json())
  .then(d => console.log('✅ Health:', d))
  .catch(e => console.error('❌ Error:', e.message))
```

### Test 2: Inscription

Dans la console:

```javascript
const formData = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  phone: '+1234567890',
};

fetch('https://backend-ovbc.onrender.com/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify(formData),
})
  .then(r => r.json())
  .then(d => console.log('✅ Register:', d))
  .catch(e => console.error('❌ Error:', e.message))
```

### Test 3: Via Axios (depuis React)

```javascript
import { authService } from './services/api';

// Dans un composant React
authService.register({
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  phone: '+1234567890',
})
  .then(res => console.log('✅ Success:', res.data))
  .catch(err => console.error('❌ Error:', err.message))
```

---

## 🔍 Si CORS ne fonctionne pas

### ✅ Checklist de débogage

- [ ] Vérifier que Render a les variables d'environnement correctes
- [ ] Vérifier que le backend a redémarré après la mise à jour
- [ ] Vérifier que FRONTEND_URL est correct: `https://loca-plus-hub.vercel.app`
- [ ] Vérifier que le backend est accessible: `curl https://backend-ovbc.onrender.com/api/health`
- [ ] Vérifier que la Console du navigateur affiche les erreurs
- [ ] Tester la requête avec `curl` en incluant l'origin:
  ```bash
  curl -H "Origin: https://loca-plus-hub.vercel.app" \
       https://backend-ovbc.onrender.com/api/health -v
  ```

### 🆘 Commandes utiles

```bash
# Diagnostiquer la configuration
node backend/diagnose-cors.js

# Tester les requêtes CORS
node backend/test-cors.js

# Vérifier les logs Render (depuis leur dashboard)
# https://dashboard.render.com

# Redémarrer le serveur Render manuellement (depuis le dashboard)
```

---

## 📚 Configuration finale résumée

### Backend (Render)

```javascript
// CORS autorisé pour:
- https://loca-plus-hub.vercel.app (Production)
- http://localhost:5173 (Développement)
- http://localhost:3000 (Développement alternatif)

// Méthodes autorisées:
- GET, POST, PUT, DELETE, PATCH, OPTIONS

// Headers autorisés:
- Content-Type, Authorization, X-Requested-With, Accept

// Credentials: true (pour l'authentification)
```

### Frontend (Vercel)

```javascript
// Requêtes vers:
https://backend-ovbc.onrender.com/api

// Avec Axios:
- withCredentials: true
- Timeout: 15 secondes
- Token Authorization auto-injecté
```

---

## 🎉 Succès!

Après ces modifications, vous devriez voir:

✅ Plus d'erreur CORS  
✅ L'inscription et la connexion fonctionnent  
✅ Les annonces se chargent  
✅ Les paiements sont traités  
✅ Les messages de contact sont envoyés  

---

## 📞 Support

Pour plus d'aide:
1. Consultez `CORS_GUIDE.md`
2. Exécutez `node backend/diagnose-cors.js`
3. Vérifiez les logs Render et Vercel
4. Ouvrez la Console du navigateur (F12)
