# Guide de test des fixes pour annonces et images

## 📋 Corrections appliquées

### 1. ✅ Backend: Annonces créées avec le bon statut
- **Fichier**: `backend/routes/announcements.js` (ligne ~375)
- **Changement**: Annonces maintenant créées avec `status='active'` et `payment_status=1`
- **Avant**: `'pending'` et `0` (jamais affichées)
- **Après**: `'active'` et `1` (visibles immédiatement)

### 2. ✅ Frontend: Fetch logique corrigée
- **Fichiers**: 
  - `front-end/src/pages/Home.jsx` (lignes ~105, ~134)
  - `front-end/src/pages/Announcements.jsx` (ligne ~35)
- **Changement**: Removed incorrect fallback that returned empty arrays
- **Avant**: `announcementsRes.data?.announcements ?? announcementsRes.data ?? []`
- **Après**: `announcementsRes.data?.announcements ?? []`

### 3. ✅ Frontend: Images avec fallback amélioré
- **Fichier**: `front-end/src/pages/Home.jsx` (ligne ~368)
- **Changement**: Added `image_url` fallback from database
- **Avant**: Seulement `parsedImages[0]`
- **Après**: `announcement.image_url || parsedImages[0]`

### 4. ✅ Debug logs ajoutés
- Console logs pour tracer le chargement des annonces
- Console logs pour tracer la résolution des images
- Active seulement en mode développement (`import.meta.env.DEV`)

---

## 🧪 Étapes de test

### Phase 1: Redémarrage du backend
```bash
# 1. Arrêtez le backend actuel (Ctrl+C dans le terminal)
# 2. Redémarrez le backend
cd backend
npm start
# Vérifiez que le serveur démarre sans erreurs
```

### Phase 2: Test création d'annonce
1. **Ouvrez le navigateur** avec la console ouverte (F12 > Console)
2. **Naviguez** vers `/create` (Publier une annonce)
3. **Remplissez** le formulaire:
   - Catégorie: Immobilier (ou autre)
   - Titre: "Test Annonce Visible"
   - Description: "Cette annonce devrait être visible"
   - Prix: 500000
   - Localisation: "Bamako"
   - Téléphone: votre numéro
   - Images: Téléchargez au moins une image
4. **Soumettez** le formulaire
5. **Vérifiez** la console pour:
   - Logs de création sans erreurs
   - Réponse de l'API avec l'annonce créée

### Phase 3: Test Home page
1. **Naviguez** vers la page Home (`/`)
2. **Vérifiez** la console pour:
   ```
   DEBUG Home.jsx - Annonces chargées: [nombre] [array]
   ```
3. **Vérifiez visuellement**:
   - ✅ Section "Annonces Récentes" affiche les annonces
   - ✅ Images se chargent (pas d'emoji 🏠 seul)
   - ✅ Bouton "Voir" fonctionne (clique = navigue vers détail)
   - ✅ Bouton WhatsApp visible et functional

### Phase 4: Test Announcements page
1. **Naviguez** vers `/announcements`
2. **Vérifiez** la console pour:
   ```
   DEBUG Announcements.jsx - Annonces chargées: [nombre] [array]
   ```
3. **Vérifiez visuellement**:
   - ✅ Annonces affichées en grille
   - ✅ Images présentes
   - ✅ Filtres fonctionnent

### Phase 5: Test AnnouncementDetail page
1. **Cliquez** sur un bouton "Voir" depuis Home ou Announcements
2. **Vérifiez**:
   - ✅ Page détail charge l'annonce
   - ✅ Galerie d'images fonctionne
   - ✅ Boutons de contact visibles:
     - 💬 WhatsApp avec message pré-rempli
     - ☎️ Appeler
     - 📧 Email
   - ✅ Carte géographique s'affiche (si géolocalisation présente)

---

## 🔍 Console Debug: Résultats attendus

### Home page - Console normale
```javascript
DEBUG Home.jsx - Annonces chargées: 6 [
  { id: "...", title: "Test Annonce", image_url: "/uploads/...", images: [...], ... }
]
DEBUG Annonce Récentes: {
  id: "...",
  image_url: "/uploads/123456.jpg",
  images: ["/uploads/123456.jpg"],
  parsedImages: ["/uploads/123456.jpg"],
  rawImage: "/uploads/123456.jpg",
  imageUrl: "https://backend-ovbc.onrender.com/uploads/123456.jpg"
}
```

### Erreurs à ignorer
- ❌ CORs warnings (normal, configuré dans backend)
- ❌ Font warnings (normal, pas critique)

---

## ⚠️ Dépannage

### Problème: Annonces visibles mais images vides
**Causes possibles**:
1. Images ne sont pas uploadées correctement
2. Dossier `/uploads` manquant sur le backend

**Solutions**:
```bash
# Vérifier le dossier uploads existe
ls -la backend/uploads/

# Vérifier les logs du backend pour les erreurs d'upload
# Regarder dans CreateAnnouncement pour voir si erreur upload
```

### Problème: Annonces toujours invisibles
**Causes possibles**:
1. Backend pas redémarré
2. Changes backend pas appliquées

**Solutions**:
```bash
# Redémarrer le backend complètement
cd backend
npm start

# Vérifier le log "Création annonce - Avant INSERT"
# et voir les valeurs de status et payment_status
```

### Problème: Console montre erreur API
**À vérifier**:
1. Vérifiez que le backend est UP (port 5000 ou Render)
2. Vérifiez que l'URL de base est correcte dans `api.js`
3. Vérifiez les logs du backend pour détails d'erreur

---

## 📝 Notes importantes

1. **Images**: Le backend stocke les images comme JSON array en database
   - `image_url` est calculé comme première image du array
   - Frontend utilise ce fallback automatiquement

2. **Statuts**: 
   - `status='active'` = annonce visible
   - `payment_status=1` = annonce payée (simulation pour test)
   
3. **Logs**: Les debug logs disparaissent en production (sauf erreurs)

---

## ✅ Checklist finale

- [ ] Backend redémarré
- [ ] Créé une nouvelle annonce
- [ ] Annonce visible sur Home page
- [ ] Images visibles (pas d'emoji)
- [ ] Bouton "Voir" fonctionne
- [ ] Boutons de contact visibles sur détail
- [ ] Console montre les debug logs corrects
- [ ] Aucune erreur API dans console
