# 📊 Guide d'Administration des Tarifs LocaPlus

## 🎯 Localisation des Tarifs

### 1. **Base de Données SQLite**
- **Fichier** : `backend/database.sqlite`
- **Table** : `pricing`
- **Colonnes principales** :
  - `id` : Identifiant unique
  - `type` : Type de tarif (`publication`, `boost`)
  - `category` : Catégorie (`immobilier`, `vehicule`, `materiaux`, `technicien`)
  - `name` : Nom du tarif (ex: "Immobilier - Publication")
  - `price` : Prix en FCFA
  - `description` : Description du tarif
  - `features` : Caractéristiques (format JSON)
  - `active` : Actif/Inactif (1/0)

### 2. **Configuration Backend**
- **Fichier** : `backend/config/pricing.js`
- **Contient** :
  - `durations` : Durées de publication disponibles (7, 14, 30, 90 jours)
  - `paymentMethods` : Méthodes de paiement (Wave, Orange Money, MTN, Moov, Carte)
  - Fonctions pour récupérer les tarifs

### 3. **Routes API**
- **GET** `/api/pricing` : Récupère tous les tarifs
- **GET** `/api/pricing/category/:categoryId` : Tarif d'une catégorie
- **PUT** `/api/pricing/:id` : ⚠️ Admin uniquement - Modifier un tarif

---

## 🔧 Méthode 1 : Modifier les Tarifs via Base de Données

### Étape 1 : Ouvrir la base de données

```bash
# Depuis le dossier backend
npm install sqlite3 -g  # Si pas déjà installé
sqlite3 backend/database.sqlite
```

### Étape 2 : Voir les tarifs actuels

```sql
SELECT id, category, name, price, active FROM pricing WHERE type = 'publication';
```

### Étape 3 : Modifier un prix

```sql
-- Exemple : Augmenter le prix de l'Immobilier à 15,000 FCFA
UPDATE pricing SET price = 15000, updated_at = CURRENT_TIMESTAMP 
WHERE category = 'immobilier' AND type = 'publication';

-- Confirmer
SELECT id, category, name, price FROM pricing WHERE category = 'immobilier';
```

### Étape 4 : Quitter

```sql
.quit
```

---

## 🔌 Méthode 2 : Modifier les Tarifs via API Admin

### Préalable : Créer un Compte Admin

1. S'inscrire sur https://loca-plus-hub.vercel.app/register
2. Contacter l'administrateur pour faire passer le compte en `role: 'admin'`
   ```sql
   -- Depuis le terminal backend :
   sqlite3 backend/database.sqlite
   UPDATE users SET role = 'admin' WHERE email = 'votremail@example.com';
   ```

### Obtenir un Token JWT

```bash
curl -X POST https://backend-ovbc.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "votreMotDePasse"
  }'
```

**Réponse** :
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "email": "admin@example.com", "role": "admin" }
}
```

### Mettre à Jour un Tarif

```bash
# Augmenter le tarif Immobilier à 15,000 FCFA
curl -X PUT https://backend-ovbc.onrender.com/api/pricing/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "price": 15000,
    "name": "Immobilier - Publication",
    "description": "Publiez votre bien immobilier",
    "active": 1
  }'
```

---

## 🚀 Méthode 3 : Créer une Panneau Admin Personnalisé (Recommandé)

### Créer le Composant Admin

```jsx
// front-end/src/pages/AdminPricing.jsx
import { useState, useEffect } from 'react';
import { pricingService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminPricing = () => {
  const { user } = useAuth();
  const [pricing, setPricing] = useState([]);
  const [editing, setEditing] = useState(null);

  // Vérifier que l'utilisateur est admin
  useEffect(() => {
    if (user?.role !== 'admin') {
      window.location.href = '/';
    }
  }, [user]);

  useEffect(() => {
    const fetchPricing = async () => {
      const response = await pricingService.getAll();
      setPricing(response.data.categories);
    };
    fetchPricing();
  }, []);

  const handleUpdatePrice = async (id, newPrice) => {
    try {
      const response = await pricingService.updatePrice(id, {
        price: newPrice,
        active: 1
      });
      setPricing(pricing.map(p => p.id === id ? response.data.pricing : p));
      setEditing(null);
      alert('Tarif mis à jour avec succès !');
    } catch (error) {
      alert('Erreur lors de la mise à jour');
      console.error(error);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>📊 Gestion des Tarifs</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#1E3A5F', color: 'white' }}>
            <th style={{ padding: '12px', textAlign: 'left' }}>Catégorie</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Nom</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Prix FCFA</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pricing.map((item) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '12px' }}>{item.category}</td>
              <td style={{ padding: '12px' }}>{item.name}</td>
              <td style={{ padding: '12px' }}>
                {editing === item.id ? (
                  <input
                    type="number"
                    defaultValue={item.price}
                    id={`price-${item.id}`}
                    style={{ padding: '6px', width: '100px' }}
                  />
                ) : (
                  item.price.toLocaleString()
                )}
              </td>
              <td style={{ padding: '12px' }}>
                {editing === item.id ? (
                  <>
                    <button
                      onClick={() => handleUpdatePrice(item.id, document.getElementById(`price-${item.id}`).value)}
                      style={{ marginRight: '8px', padding: '6px 12px', backgroundColor: '#38A169', color: 'white', border: 'none', cursor: 'pointer' }}
                    >
                      ✓ Sauvegarder
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      style={{ padding: '6px 12px', backgroundColor: '#E53E3E', color: 'white', border: 'none', cursor: 'pointer' }}
                    >
                      ✕ Annuler
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(item.id)}
                    style={{ padding: '6px 12px', backgroundColor: '#FF6B35', color: 'white', border: 'none', cursor: 'pointer' }}
                  >
                    ✏️ Modifier
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPricing;
```

### Ajouter la Service API

```javascript
// Ajouter dans front-end/src/services/api.js
export const pricingService = {
  getAll: () => api.get('/pricing'),
  getCategory: (categoryId) => api.get(`/pricing/category/${categoryId}`),
  updatePrice: (id, data) => api.put(`/pricing/${id}`, data),
};
```

### Ajouter la Route Protégée

```jsx
// Dans front-end/src/App.jsx
import AdminPricing from './pages/AdminPricing';

<Route path="/admin/pricing" element={<ProtectedRoute><AdminPricing /></ProtectedRoute>} />
```

---

## 🔒 Sécurité (RSI - Responsable de la Sécurité Informatique)

### Authentification et Autorisation

✅ **Déjà implémenté** :
- Token JWT valide 24h
- Vérification de `role: 'admin'` sur routes `/api/pricing/:id` (PUT)
- Logs d'accès via `req.user` dans les middlewares

### Protocole d'Accès Admin

1. **Uniquement admin** peut modifier les tarifs
   ```javascript
   router.put('/:id', authenticateToken, requireAdmin, async (req, res) => { ... })
   ```

2. **Audit** : Logger toutes les modifications
   ```sql
   CREATE TABLE IF NOT EXISTS audit_log (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     admin_id INTEGER NOT NULL,
     action TEXT,
     table_name TEXT,
     record_id INTEGER,
     old_value TEXT,
     new_value TEXT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (admin_id) REFERENCES users(id)
   );
   ```

3. **Commandes pour Audit** (Optionnel)
   ```bash
   # Ajouter la table audit
   sqlite3 backend/database.sqlite < backend/scripts/audit.sql
   ```

4. **Limiter les Admins**
   ```sql
   SELECT * FROM users WHERE role = 'admin';
   -- Ne créer que 1-2 comptes admin maximum
   ```

---

## 🎯 Résumé Rapide : Comment Modifier un Tarif à l'Avenir

### Option 1 : Via Base de Données (Plus rapide)
```bash
cd backend
sqlite3 database.sqlite
UPDATE pricing SET price = 15000 WHERE category = 'immobilier';
.quit
# Les tarifs se mettront à jour automatiquement à la prochaine requête /api/pricing
```

### Option 2 : Via Panneau Admin (Plus user-friendly)
1. Aller sur `https://loca-plus-hub.vercel.app/admin/pricing` (admin uniquement)
2. Cliquer sur "Modifier" pour le tarif à changer
3. Entrer le nouveau prix
4. Cliquer sur "✓ Sauvegarder"
5. Le changement s'applique immédiatement sur le site

---

## ✅ Vérification : Tarifs en Production

### Sur Render
```bash
curl https://backend-ovbc.onrender.com/api/pricing | jq '.categories'
```

### Sur Vercel
Aller sur https://loca-plus-hub.vercel.app et vérifier la section "Tarifs de Publication"

---

## 🐛 Dépannage

**Les tarifs affichent "Tarifs non disponibles"** ?
1. Vérifier la connexion API : https://backend-ovbc.onrender.com/api/pricing
2. Vérifier le `VITE_API_URL` sur Vercel (doit être `https://backend-ovbc.onrender.com`)
3. Vérifier les logs Render : https://dashboard.render.com

**Modification ne s'applique pas ?**
1. Vérifier que vous êtes connecté en admin
2. Rafraîchir le navigateur (Ctrl+F5)
3. Vérifier la console du navigateur (F12) pour les erreurs API
