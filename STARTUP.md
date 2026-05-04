# 🚀 Guide de Démarrage - LocaPlus Application

## ✅ Corrections Appliquées

Deux **erreurs critiques** ont été détectées et corrigées:

1. **[backend/routes/announcements.js:188]** - Sérialisation JSON de métadonnées
   - ❌ Avant: `metadataValue` (non sérialisé)  
   - ✅ Après: `JSON.stringify(metadataValue)`

2. **[backend/routes/pricing.js:80-82]** - Double export
   - ❌ Avant: Deux lignes `module.exports = router;`
   - ✅ Après: Une seule ligne

---

## 🎯 Démarrer l'Application Localement

### Terminal 1 - Démarrer le Backend API (Port 5000)

```bash
cd backend
npm start
```

Vous devriez voir:
```
✅ SQLite local prêt : [path]/database.sqlite

🚀 LocaPlus API Server

📡 Serveur démarré sur le port: 5000
🌐 URL: http://localhost:5000
📂 API: http://localhost:5000/api
```

### Terminal 2 - Démarrer le Frontend (Port 5173)

```bash
cd front-end
npm run dev
```

Vous devriez voir:
```
➜ Local: http://localhost:5173/
```

---

## 🧪 Tester la Connexion

Une fois les deux serveurs lancés:

### Test 1: Vérifier le Backend
```bash
curl http://localhost:5000/api/health
```

Réponse attendue:
```json
{
  "status": "OK",
  "message": "LocaPlus API est en ligne",
  "timestamp": "2026-05-04T..."
}
```

### Test 2: Accéder le Frontend
- Ouvrez votre navigateur
- Allez à `http://localhost:5173`
- L'application devrait charger complètement

---

## 📋 Configuration Vérifiée

✅ Backend - `.env`: Port 5000, Base de données SQLite  
✅ Frontend - `.env`: API URL = `http://localhost:5000`  
✅ CORS: Activé et configuré  
✅ JWT: Configuré pour l'authentification  
✅ Routes: Toutes les dépendances importées correctement  

---

## ⚠️ Problèmes Potentiels

### Port Déjà Utilisé
Si le port 5000 ou 5173 est déjà utilisé:

**Backend:** Modifiez le PORT dans `backend/.env`
```
PORT=3000
```

**Frontend:** Modifiez le port dans `front-end/vite.config.js`
```javascript
server: {
  port: 3000,  // Changez ici
}
```

### Base de Données
La base de données SQLite se crée automatiquement au premier démarrage:
- Fichier: `backend/database.sqlite`
- Créez les tables si nécessaire: `npm run init-db`

---

## 📞 Débogage

Si ça ne fonctionne toujours pas:

1. Vérifiez les dépendances:
   ```bash
   cd backend && npm list
   cd ../front-end && npm list
   ```

2. Vérifiez les ports:
   ```bash
   # Windows PowerShell
   Get-NetTCPConnection -State Listen | Where-Object {$_.LocalPort -in 5000,5173}
   ```

3. Vérifiez les fichiers `.env`:
   - `backend/.env` 
   - `front-end/.env`

---

**Application maintenant prête à fonctionner! 🎉**
