# 🧪 Guide de Test - Carte Géolocalisation

## 1️⃣ Test Installation

### Terminal Test
```bash
cd front-end
npm list leaflet react-leaflet

# Résultat attendu:
# locaplus-frontend@1.0.0
# ├── leaflet@1.9.4
# └── react-leaflet@4.2.3
```

### Fichiers Vérification
```bash
# Vérifier les dossiers existent:
ls -la src/components/LocationPicker.jsx    # ✅ Doit exister
ls -la src/components/AnnouncementMap.jsx   # ✅ Doit exister
ls -la node_modules/leaflet/               # ✅ Doit exister
ls -la node_modules/react-leaflet/         # ✅ Doit exister
```

---

## 2️⃣ Test en Mode Développement

### Lancer le serveur
```bash
cd front-end
npm run dev

# Résultat attendu:
# Local:   http://localhost:5173
# Ready in XXXms
```

### Vérifier pas d'erreurs
```
✅ Pas d'erreur "Cannot find module 'leaflet'"
✅ Pas d'erreur "Cannot find module 'react-leaflet'"
✅ Pas d'erreur de syntaxe React
✅ DevTools > Console: Aucune erreur rouge
```

---

## 3️⃣ Test LocationPicker (Créer Annonce)

### Navigation
```
1. Ouvrir http://localhost:5173
2. Cliquer "Créer une Annonce" OU "Nouvelle Annonce"
3. Remplir: Catégorie, Type, etc...
4. Arriver à la section "Localisation"
```

### Visuels Test
```javascript
Élément                    | Test                           | Résultat
--------------------------|--------------------------------|-----------
Titre "Localisation"      | Doit afficher                 | ✅ "Localisation" visible
Carte                     | Doit afficher une vraie carte | ✅ Abidjan centré
Tuiles OSM                | Doit avoir rues/routes        | ✅ Carte détaillée
Marqueur initial          | Pas de marqueur au début      | ✅ Vide
Zoom Level                | Doit montrer niveau 12        | ✅ Pays/région visible
```

### Interaction Test
```javascript
Action                     | Attendu                        | Test
--------------------------|--------------------------------|------
Cliquer au centre         | Marqueur rouge aparaît        | ✅
Popup s'affiche           | Affiche "Position sélectionnée" | ✅
Latitude/Longitude        | 8 décimales visibles          | ✅
Formulaire se met à jour  | Champs latitude/longitude      | ✅ Remplis
Cliquer ailleurs          | Ancien marqueur disparaît     | ✅
Nouveau marqueur          | À la nouvelle position        | ✅
```

### Coordonnées Précision
```javascript
// Cliquer au centre d'Abidjan, expected:
Latitude:  6.8276 ± 0.05
Longitude: -5.2893 ± 0.05

// Cliquer à Bingerville, expected:
Latitude:  6.8345 ± 0.05
Longitude: -5.2893 ± 0.05

// Vérifier: 8 décimales de précision
```

### Responsive Test
```javascript
// Mobile (375px)
- Carte: ✅ Full-width, 400px hauteur
- Boutons: ✅ Accessibles au doigt
- Texte info: ✅ Lisible

// Tablet (768px)
- Carte: ✅ Full-width
- Layout: ✅ 1 colonne

// Desktop (1280px)
- Carte: ✅ Full-width
- Layout: ✅ Optimal
```

---

## 4️⃣ Test AnnouncementMap (Voir Annonce)

### Navigation
```
1. Accueil OU Announcements
2. Cliquer sur une annonce existante
3. Voir détails + images
4. Scroller vers le bas
5. Voir "Localisation"
```

### Visuels Test
```javascript
Élément                    | Test                           | Résultat
--------------------------|--------------------------------|-----------
Section "Localisation"    | Doit afficher avec emoji 📍   | ✅ Visible
Titre                     | "📍 Localisation"             | ✅ Correct
Carte                     | Vraie carte OSM               | ✅ Affichée
Zoom                      | Doit être 15 (précis)         | ✅ Position exacte
Marqueur                  | Au bon endroit                | ✅ Position correcte
Popup                     | Affiche titre + adresse       | ✅ Visible au clic
Scroll wheel              | Désactivé par défaut          | ✅ Pas de zoom accidentel
```

### Position Vérification

```javascript
// Si annonce en Bingerville:
- Latitude: 6.83451
- Longitude: -5.28934
- Expected: Marqueur à Bingerville

// Si annonce en Abidjan:
- Latitude: 6.8276
- Longitude: -5.2893
- Expected: Marqueur à Abidjan

// Vérifier Google Maps si doute:
// https://maps.google.com/?q=6.83451,-5.28934
```

### Popup Test
```javascript
Cliquer sur le marqueur:
├─ Titre s'affiche (ex: "Superbe villa")
├─ Adresse s'affiche (ex: "📍 Bingerville")
└─ Coordonnées visibles (Lat/Lng)

Contenu exemple:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Superbe villa

📍 Bingerville

Lat: 6.8345 | Lng: -5.2893
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 5️⃣ Test Backend Integration

### API Vérification

```bash
# 1. Créer une annonce via UI
- Remplir formulaire
- Placer marqueur sur carte
- Voir latitude/longitude remplies
- Cliquer "Soumettre"

# 2. Vérifier Réseau (DevTools)
- Ouvrir F12 > Network
- Filtre: "announcements"
- POST request
- Voir payload contient "latitude" et "longitude"

# 3. Vérifier Backend reçoit
curl http://localhost:3000/announcements
# Résultat JSON doit contenir latitude/longitude
```

### Database Vérification

```sql
-- Sur le serveur MySQL/MariaDB
SELECT 
  id, 
  title, 
  latitude, 
  longitude, 
  location 
FROM announcements 
WHERE latitude IS NOT NULL
LIMIT 5;

-- Résultat attendu:
┌────┬──────────────┬──────────┬───────────┬──────────────┐
│ id │ title        │ lat      │ lng       │ location     │
├────┼──────────────┼──────────┼───────────┼──────────────┤
│ 1  │ Superbe villa│ 6.83451  │ -5.28934  │ Bingerville  │
│ 2  │ Apt Abidjan  │ 6.82760  │ -5.28930  │ Abidjan      │
└────┴──────────────┴──────────┴───────────┴──────────────┘
```

---

## 6️⃣ Test Edge Cases

### Pas de Données Latitude/Longitude
```javascript
// Si annonce sans lat/lng:
- AnnouncementMap: ✅ Ne s'affiche pas (condition null)
- Page: ✅ Pas d'erreur, galerie visible
- Console: ✅ Pas d'erreur
```

### Données Invalides
```javascript
// Si latitude = "invalid":
- Carte: ✅ Pas d'erreur
- Fallback: ✅ Pas d'affichage
- Console: ✅ Possible warning (acceptable)

// Test format:
latitude = "not-a-number" → ❌ AnnouncementMap hidden (OK)
latitude = "6.8276" → ✅ Correct
latitude = 6.8276 → ✅ Aussi correct (number)
```

### Performace
```javascript
// Test avec beaucoup d'annonces:
- Charger liste 100 annonces
- Cliquer 5-10 annonces
- Mesurer: < 2 secondes par chargement
- Console: ✅ Pas de memory leak

// DevTools > Performance:
- Enregistrer
- Afficher annonce
- Voir: < 500ms rendering
```

---

## 7️⃣ Test CSS/Styling

### Vérifier Styling
```javascript
// LocationPicker
- Hauteur: 400px ✅
- Bordure: 1px solid ✅
- Bordure arrondie: 8px ✅
- Ombre: présente ✅
- Zone info grise: présente ✅

// AnnouncementMap
- Hauteur: 350px ✅
- Bordure: 1px solid ✅
- Bordure arrondie: 8px ✅
- Ombre: présente ✅
- Zone info: "Position du bien" ✅
```

### Vérifier Variables CSS
```javascript
// DevTools > Inspect > Computed
- var(--radius-md): ✅ 8px
- var(--border): ✅ #E2E8F0
- var(--background): ✅ Couleur OK
- var(--text): ✅ Couleur OK

// Si variables undefined:
// Fallback values utilisés ✅
```

---

## 8️⃣ Test Console Errors

### Liste d'Erreurs Acceptables
```javascript
// ✅ ACCEPTABLES (pas de problème):
// - Warnings d'OpenStreetMap
// - Messages info Leaflet
// - WebSocket connection (si temps limite)

// ❌ INACCEPTABLES (investigation requise):
// - "Cannot read property of undefined"
// - "ReferenceError: L is not defined"
// - "Map container not found"
// - "TileLayer failed to load"
```

### DevTools Check
```
F12 > Console:
- Aucune erreur rouge    ✅
- Pas d'undefined       ✅
- Pas de CORS error     ✅
- Icons charger OK      ✅

F12 > Network:
- leaflet.css           ✅ 200 OK
- leaflet.js (CDN)      ✅ 200 OK (si utilisé)
- marker-icon.png (CDN) ✅ 200 OK
- Tiles OSM             ✅ 200 OK
```

---

## 9️⃣ Test Cross-Browser

### Chrome/Edge
```javascript
✅ Carte visible
✅ Clic fonctionne
✅ Zoom fonctionne
✅ Drag fonctionne
✅ Popup s'affiche
```

### Firefox
```javascript
✅ Carte visible
✅ Clic fonctionne
✅ Zoom fonctionne
✅ Drag fonctionne
✅ Popup s'affiche
```

### Safari (Mac)
```javascript
✅ Carte visible
✅ Clic fonctionne
✅ Zoom fonctionne
✅ Drag fonctionne
✅ Popup s'affiche
```

### Mobile (iOS/Android)
```javascript
✅ Carte visible
✅ Touch zoom fonctionne
✅ Drag fonctionne
✅ Popup s'affiche au tap
```

---

## 🔟 Test Production (Vercel)

### Déploiement
```bash
git add -A
git commit -m "Feat: Ajouter cartes Leaflet pour géolocalisation"
git push

# Vercel build (attendre 3-5 min)
# Vérifier: https://vercel.com/dashboard
```

### Tests Production
```javascript
1. Ouvrir site live (Vercel)
2. Créer annonce: 
   ✅ Carte visible
   ✅ Clic fonctionne
3. Voir annonce:
   ✅ Carte affichée
   ✅ Position correcte

4. Mobile test:
   ✅ Responsive OK
   ✅ Touch zoom OK

5. Performance:
   ✅ < 2s chargement page
   ✅ Pas de lag
```

---

## Checklist Finale

```
Installation
☐ npm install réussi
☐ npm list affiche packages
☐ Pas d'erreur ERESOLVE

Composants
☐ LocationPicker.jsx existe
☐ AnnouncementMap.jsx existe
☐ Imports corrects

Test Local
☐ npm run dev fonctionne
☐ Pas d'erreur console
☐ LocationPicker visible
☐ AnnouncementMap visible
☐ Clic sur carte fonctionne
☐ Données se mettent à jour

Test Backend
☐ API reçoit lat/lng
☐ DB stocke lat/lng
☐ API retourne lat/lng

Test Production
☐ Build OK (npm run build)
☐ Déploiement Vercel réussi
☐ Carte fonctionne sur live
☐ Responsive OK

Performance
☐ < 500ms rendering
☐ Pas de memory leak
☐ Zoom smooth
☐ Pas de lag
```

---

## 🆘 Troubleshooting Rapide

| Problème | Cause | Solution |
|----------|-------|----------|
| Carte grise/vide | Height non défini | Vérifier `style={{ height: '400px' }}` |
| Marqueur gris | Icônes manquantes | Le fix est inclus ✅ |
| Clic ne fonctionne pas | useMapEvents mal utilisé | Vérifier MapClickHandler |
| Latitude/Longitude vides | onChange non appelé | Vérifier prop `onChange` |
| "Cannot find module" | npm install échouée | Relancer `npm install leaflet react-leaflet@4` |
| CORS error | OpenStreetMap | Pas normal, contacter support |
| Zoom ne fonctionne pas | scrollWheelZoom | Vérifier `scrollWheelZoom={false}` |

---

**Test Complet** ✅  
Vous êtes prêt à valider! 🚀
