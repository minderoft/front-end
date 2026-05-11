# 📦 Commands NPM pour Intégration Carte

## Installation des Dépendances

```bash
# Entrer dans le dossier frontend
cd front-end

# Installer Leaflet et React-Leaflet (version 4.x compatible avec React 18)
npm install leaflet react-leaflet@4

# OU si vous avez des problèmes de dépendances, utiliser :
npm install leaflet react-leaflet@4 --save

# Vérifier l'installation
npm list leaflet react-leaflet
```

## Versions Recommandées

```bash
# React (déjà installé)
react@^18.2.0

# Leaflet (nouvelle dépendance)
leaflet@^1.9.x

# React-Leaflet (nouvelle dépendance, v4 pour React 18)
react-leaflet@^4.2.x
```

## Vérifications Après Installation

```bash
# 1. Vérifier que les packages sont installés
npm list leaflet react-leaflet

# Résultat attendu:
# locaplus-frontend@1.0.0
# ├── leaflet@1.9.4
# └── react-leaflet@4.2.3

# 2. Vérifier node_modules
ls node_modules | grep -E "leaflet|react-leaflet"

# 3. Tester le build
npm run build

# 4. Tester en dev
npm run dev
```

## Résolution de Problèmes

### Erreur: "ERESOLVE unable to resolve dependency tree"
```bash
# Si vous voyez cet erreur, utiliser --legacy-peer-deps:
npm install leaflet react-leaflet@4 --legacy-peer-deps
```

### Erreur: "Leaflet is not defined"
```bash
# Vérifier que vous importez:
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
```

### Icônes Leaflet manquants (marqueurs gris vides)
```bash
# Le code contient déjà le fix automatique:
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '...',
  iconUrl: '...',
  shadowUrl: '...',
});
```

### Carte vide (grise)
```bash
# Vérifier:
# 1. MapContainer a un style height défini
# 2. TileLayer URL est correcte
# 3. Pas de CORS issues (OpenStreetMap est public)
# 4. Refresh la page et les DevTools
```

## Structure des Imports

```jsx
// Dans LocationPicker.jsx et AnnouncementMap.jsx
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
```

## Installation + Test Complet

```bash
# Complet workflow
cd front-end
npm install leaflet react-leaflet@4
npm run dev

# Vérifier:
# 1. Aller à http://localhost:5173/create-announcement
# 2. Voir la carte d'Abidjan
# 3. Cliquer pour placer un marqueur
# 4. Voir les coordonnées se remplir
```

## Options d'Installation Alternatives

### Option 1: Avec yarn (si vous utilisez yarn)
```bash
cd front-end
yarn add leaflet react-leaflet@4
yarn dev
```

### Option 2: Avec pnpm
```bash
cd front-end
pnpm add leaflet react-leaflet@4
pnpm dev
```

### Option 3: Installation manuelle package.json
```json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.3"
  }
}
```
Puis:
```bash
npm install
```

## Post-Installation Checklist

- [ ] Packages installés avec succès
- [ ] Pas d'erreurs ERESOLVE
- [ ] `npm list` affiche les packages
- [ ] `npm run dev` fonctionne sans erreurs
- [ ] Pas d'erreurs dans console du navigateur
- [ ] Carte visible à l'URL http://localhost:5173
- [ ] Clic sur la carte fonctionne
- [ ] Coordonnées se mettent à jour
- [ ] Déploiement Vercel OK

## Fichiers Modifiés/Créés

| Fichier | Type | Statut |
|---------|------|--------|
| `src/components/LocationPicker.jsx` | Modifié | ✅ Avec React-Leaflet |
| `src/components/AnnouncementMap.jsx` | Créé | ✅ Carte fixe |
| `src/pages/AnnouncementDetail.jsx` | Modifié | ✅ Import AnnouncementMap |
| `package.json` | Modifié | ✅ +leaflet +react-leaflet |

## Support & Ressources

- **Leaflet Doc:** https://leafletjs.com/
- **React-Leaflet Doc:** https://react-leaflet.js.org/
- **OpenStreetMap:** https://www.openstreetmap.org/
- **Leaflet Plugins:** https://leafletjs.com/plugins.html

---

**Prêt à partir!** 🚀  
Les composants sont prêts à l'emploi dans vos pages React.
