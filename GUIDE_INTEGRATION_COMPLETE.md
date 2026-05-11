# 📚 Guide d'Intégration - Carte Géolocalisation

## Vue d'ensemble Architecture

```
LocaPlus Frontend
├── pages/
│   ├── CreateAnnouncement.jsx ← Utilise LocationPicker
│   └── AnnouncementDetail.jsx ← Utilise AnnouncementMap
├── components/
│   ├── LocationPicker.jsx ← Carte interactive (nouveau)
│   └── AnnouncementMap.jsx ← Carte fixe (nouveau)
└── services/
    └── api.js ← Envoie lat/lng au backend
```

---

## 🎯 Cas d'Usage 1: Créer une Annonce

### Code dans `CreateAnnouncement.jsx`

```jsx
import LocationPicker from '../components/LocationPicker';

const [formData, setFormData] = useState({
  latitude: '',
  longitude: '',
  // ... autres champs
});

// Handler pour la carte
const handleLocationChange = (position) => {
  setFormData(prev => ({
    ...prev,
    latitude: position.lat.toString(),
    longitude: position.lng.toString()
  }));
};

// Dans le JSX:
<LocationPicker 
  position={
    formData.latitude && formData.longitude ? {
      lat: parseFloat(formData.latitude),
      lng: parseFloat(formData.longitude)
    } : null
  }
  onChange={handleLocationChange}
/>

// Lors du submit, envoyer au backend
const announcementData = {
  title: formData.title,
  description: formData.description,
  latitude: formData.latitude,
  longitude: formData.longitude,
  location: formData.location,
  // ...
};

await announcementService.create(announcementData);
```

### Flux Utilisateur
1. ✅ Utilisateur ouvre la page "Créer une Annonce"
2. ✅ Voir la carte centrée sur Abidjan (zoom 12)
3. ✅ **Cliquer n'importe où sur la carte**
4. ✅ Un marqueur rouge apparaît
5. ✅ Les coordonnées se remplissent automatiquement
6. ✅ Popup affiche Lat/Lng de précision
7. ✅ Le formulaire se met à jour
8. ✅ Soumettre le formulaire avec lat/lng

---

## 🎯 Cas d'Usage 2: Voir une Annonce

### Code dans `AnnouncementDetail.jsx`

```jsx
import AnnouncementMap from '../components/AnnouncementMap';

const [announcement, setAnnouncement] = useState(null);

useEffect(() => {
  const response = await announcementService.getById(id);
  setAnnouncement(response.data.announcement);
}, [id]);

// Dans le JSX (après images):
{announcement && (
  <AnnouncementMap 
    latitude={announcement.latitude}
    longitude={announcement.longitude}
    title={announcement.title}
    location={announcement.location}
  />
)}
```

### Flux Utilisateur
1. ✅ Utilisateur clique sur une annonce
2. ✅ Voir les images, description
3. ✅ **Voir la carte avec localisation du bien**
4. ✅ Marqueur au bon endroit (ex: Bingerville)
5. ✅ Popup affiche titre et adresse
6. ✅ Pouvoir zoomer/déplacer (sans modifier)
7. ✅ Info zone gris: "Position du bien: ..."

---

## 🔄 Flux Données Backend ↔ Frontend

### Envoyer une Annonce (Frontend → Backend)

```jsx
// frontend/src/services/api.js
export const announcementService = {
  create: async (data) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('latitude', data.latitude);  // Ex: "6.8276"
    formData.append('longitude', data.longitude); // Ex: "-5.2893"
    formData.append('location', data.location);   // Ex: "Bingerville"
    // ...
    
    return await api.post('/announcements/create', formData);
  }
};
```

### Backend Stock les Données

```sql
-- backend/config/db.js
CREATE TABLE IF NOT EXISTS announcements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255),
  latitude DECIMAL(10, 8),   -- Stocke la latitude précise
  longitude DECIMAL(11, 8),  -- Stocke la longitude précise
  location VARCHAR(255),     -- Ex: "Bingerville, Côte d'Ivoire"
  -- ... autres colonnes
);

-- Exemple d'annonce
INSERT INTO announcements (..., latitude, longitude, location)
VALUES (..., 6.83451, -5.28934, "Bingerville");
```

### Récupérer une Annonce (Backend → Frontend)

```json
{
  "announcement": {
    "id": 1,
    "title": "Superbe villa à Bingerville",
    "latitude": "6.83451",
    "longitude": "-5.28934",
    "location": "Bingerville",
    "price": 150000000,
    "description": "Magnifique villa avec piscine...",
    "images": ["/uploads/img1.jpg"],
    "created_at": "2026-05-11T10:30:00Z"
  }
}
```

---

## 🗺️ Configuration Leaflet

### Centre de la Carte (Abidjan)

```jsx
// Dans LocationPicker.jsx
const [selectedPosition, setSelectedPosition] = useState(
  position ? [position.lat, position.lng] : [6.8276, -5.2893]
);

// Dans AnnouncementMap.jsx
const position = [parseFloat(latitude), parseFloat(longitude)];
```

**Coordonnées Principales de Côte d'Ivoire:**

| Ville | Latitude | Longitude | Zoom |
|-------|----------|-----------|------|
| Abidjan | 6.8276 | -5.2893 | 12 |
| Bingerville | 6.8345 | -5.2893 | 14 |
| Yamoussoukro | 6.8276 | -5.5466 | 12 |
| Bouaké | 7.7068 | -5.0304 | 12 |

### OpenStreetMap URLs

```javascript
// Tuiles standard
https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png

// Variantes disponibles:
// https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png (French)
// https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png (French style)
```

---

## 🎨 Personnalisation CSS

### Modifier la Hauteur

```jsx
// LocationPicker - pour créer une annonce
<MapContainer
  style={{ 
    height: '500px',  // Augmenter de 400px à 500px
    width: '100%',
  }}
>
```

### Modifier les Couleurs

```jsx
// Dans le conteneur wrapper:
<div style={{
  borderRadius: '12px',      // Plus arrondi
  border: '2px solid #3b82f6', // Bordure bleu
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)', // Ombre plus importante
}}>
```

### Ajouter des Styles Tailwind

```jsx
// Si vous utilisez Tailwind CSS:
<div className="rounded-lg border-2 border-blue-500 shadow-lg">
  <MapContainer className="h-96 w-full rounded-t-lg" />
  <div className="bg-gray-100 p-3 text-sm text-gray-600 rounded-b-lg">
    💡 Cliquez sur la carte
  </div>
</div>
```

---

## 🔍 Débogage

### Vérifier les Coordonnées

```javascript
// Dans la console du navigateur
// 1. Ouvrir DevTools (F12)
// 2. Aller dans l'onglet "Network"
// 3. Filtrer par "/announcements"
// 4. Voir le payload POST/PUT

// Ou directement dans React DevTools:
console.log('Position:', selectedPosition);
console.log('Form Data:', formData);
```

### Vérifier le Backend

```bash
# Sur le serveur backend
SELECT id, title, latitude, longitude, location FROM announcements LIMIT 5;

# Résultat attendu:
# 1 | Superbe villa | 6.83451 | -5.28934 | Bingerville
```

### Erreurs Communes

```javascript
// ❌ ERREUR: "Cannot read property 'setView' of undefined"
// → Utiliser useMapEvents (React-Leaflet 4) au lieu de map.setView()

// ❌ ERREUR: "Marker icon is a gray square"
// → Ajouter le fix des icônes au début du composant

// ❌ ERREUR: "Map appears gray/empty"
// → Vérifier que height est défini en style
// → Vérifier que TileLayer URL est correcte
// → Vérifier pas de CORS error (DevTools Network)

// ✅ SOLUTION: Tous les fixes sont inclus dans les composants!
```

---

## 📊 Schéma de Données

### Colonne Announcement.latitude
```
Type:      DECIMAL(10, 8)
Plage:     -90.00000000 à +90.00000000
Précision: 8 décimales (~1.1mm)
Exemple:   6.83451000
```

### Colonne Announcement.longitude
```
Type:      DECIMAL(11, 8)
Plage:     -180.00000000 à +180.00000000
Précision: 8 décimales (~1.1mm)
Exemple:   -5.28934000
```

### Stocker dans le Formulaire

```javascript
// Frontend
formData.latitude = "6.83451"   // String pour la sécurité
formData.longitude = "-5.28934"

// Envoyer au backend
await announcementService.create({
  latitude: parseFloat(formData.latitude),  // Converti en number
  longitude: parseFloat(formData.longitude)
});

// Backend reçoit et stocke
INSERT INTO announcements (latitude, longitude)
VALUES (6.83451, -5.28934);
```

---

## ✅ Checklist de Déploiement

- [ ] `npm install leaflet react-leaflet@4` exécuté
- [ ] LocationPicker.jsx remplacé (React-Leaflet)
- [ ] AnnouncementMap.jsx créé
- [ ] AnnouncementDetail.jsx mis à jour (import AnnouncementMap)
- [ ] CreateAnnouncement.jsx mises à jour (utilise LocationPicker)
- [ ] Backend: colonnes latitude/longitude existent
- [ ] Backend: API envoie/reçoit lat/lng
- [ ] Test local: `npm run dev`
- [ ] Test création annonce: carte visible + clic fonctionne
- [ ] Test affichage annonce: carte affiche position
- [ ] Build production: `npm run build`
- [ ] Déploiement Vercel: `git push`
- [ ] Test production: vérifie les deux cartes

---

## 🚀 Prochaines Étapes Optionnelles

### Phase 2: Recherche Avancée
```jsx
// Ajouter recherche par adresse
import GeoSearchControl from 'leaflet-geosearch';
```

### Phase 3: Rayon de Couverture
```jsx
// Afficher cercle pour techniciens
import { Circle } from 'react-leaflet';
```

### Phase 4: Clustering
```jsx
// Grouper annonces proches
import MarkerClusterGroup from '@react-leaflet/react-leaflet-markercluster';
```

---

**Documentation Complète** ✅  
Vous êtes prêt à déployer! 🚀
