-- Migration: Add boost columns to announcements table
-- Ajout des colonnes pour gérer le boost des annonces

BEGIN;

-- 1) Ajouter les colonnes de boost si elles n'existent pas
ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS boost_expiry TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2) Ajouter les autres colonnes manquantes
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- 3) Créer un index pour les annonces boostées (pour optimiser les requêtes)
CREATE INDEX IF NOT EXISTS idx_announcements_is_boosted ON announcements(is_boosted);
CREATE INDEX IF NOT EXISTS idx_announcements_boost_expiry ON announcements(boost_expiry);

-- 4) Ajouter une colonne pour tracker le statut du paiement plus finement
ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS purpose VARCHAR(100);

COMMIT;

-- Notes:
-- - is_boosted: Indicateur si l'annonce est actuellement boostée
-- - boost_expiry: Date/heure d'expiration du boost
-- - image_url: L'URL de la première image (optimisation)
-- - Après exécution, vérifier que la migration s'est bien passée
