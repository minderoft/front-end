-- ============================================
-- TEST DATA - Annonce complète avec images
-- ============================================

-- 1. Vérifier qu'un utilisateur existe (ou en créer un)
-- Ce user_id doit exister dans la table users
-- Exemple d'un utilisateur test :
INSERT INTO users (id, email, password, name, phone, role, accepted_policy, created_at, updated_at)
VALUES (
  'test-user-001',
  'testuser@locaplus.com',
  '$2a$12$abcdefghijklmnopqrstuvwxyz', -- Hash bcrypt d'un mot de passe (exemple)
  'Jean Dupont',
  '+221770000000',
  'user',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;

-- 2. Insérer une annonce complète avec image Unsplash
INSERT INTO announcements (
  id,
  user_id,
  category,
  type,
  title,
  description,
  price,
  location,
  latitude,
  longitude,
  phone,
  images,
  metadata,
  status,
  payment_status,
  created_at,
  updated_at
) VALUES (
  'test-announcement-001',
  'test-user-001',
  'immobilier',
  'vente',
  'Maison 3 chambres - Dakar',
  'Maison spacieuse située à Dakar, quartier résidentiel. 3 chambres, 2 salles de bain, salon, cuisine équipée. Proche écoles et commerces. Disponible immédiatement.

Caractéristiques :
- Surface : 150 m²
- Terrain : 300 m²
- Entrée indépendante
- Jardin aménagé
- Parking couvert',
  45000000,
  'Dakar, Sacré-Cœur',
  14.7167,
  -17.4674,
  '+221771234567',
  '["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&h=500&fit=crop"]',
  '{
    "surface": "150 m²",
    "terrain": "300 m²",
    "chambres": 3,
    "salles_bain": 2,
    "parking": "couvert",
    "jardin": "oui"
  }',
  'active',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;

-- 3. Annonce supplémentaire pour tester le tri/filtrage
INSERT INTO announcements (
  id,
  user_id,
  category,
  type,
  title,
  description,
  price,
  location,
  latitude,
  longitude,
  phone,
  images,
  metadata,
  status,
  payment_status,
  created_at,
  updated_at
) VALUES (
  'test-announcement-002',
  'test-user-001',
  'vehicule',
  'vente',
  'Toyota Corolla 2020 - Bon état',
  'Toyota Corolla modèle 2020, kilométrage 45000 km, très bon état. Entretien régulier. Parfait pour utilisation citadine. À vendre rapidement.

Spécifications :
- Moteur : 1.6L Essence
- Transmission : Automatique
- Consommation : 6.5 L/100km
- Teinte : Gris métallisé',
  5500000,
  'Dakar, Plateau',
  14.7500,
  -17.4500,
  '+221779876543',
  '["https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=500&h=500&fit=crop"]',
  '{
    "annee": 2020,
    "kilometrage": 45000,
    "moteur": "1.6L Essence",
    "transmission": "Automatique",
    "couleur": "Gris métallisé"
  }',
  'active',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VÉRIFICATION DES DONNÉES
-- ============================================

-- Vérifier l'utilisateur créé
SELECT id, email, name, phone FROM users WHERE id = 'test-user-001';

-- Vérifier les annonces créées
SELECT 
  id,
  user_id,
  category,
  title,
  price,
  phone,
  images,
  status,
  payment_status
FROM announcements 
WHERE user_id = 'test-user-001'
ORDER BY created_at DESC;

-- Vérifier les jointures (comme dans le frontend)
SELECT 
  a.id,
  a.title,
  a.price,
  a.location,
  a.phone as announcement_phone,
  a.images,
  u.name as user_name,
  u.phone as user_phone,
  u.email as user_email
FROM announcements a
LEFT JOIN users u ON a.user_id = u.id
WHERE a.user_id = 'test-user-001'
ORDER BY a.created_at DESC;
