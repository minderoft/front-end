-- Migration: Add security & UX columns (non-breaking - utilise les colonnes existantes)
-- File: MIGRATE_RSI_SECURITY.sql

BEGIN;

-- 1) Add is_verified column to users (for verified seller badge)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- 2) Add last_ip column for IP tracking (double auth prep)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_ip VARCHAR(45);

-- 3) Add last_login_at for activity tracking
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- 4) Ensure announcements has boost tracking columns (likely exist)
ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT FALSE;

ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS boost_expiry TIMESTAMP;

COMMIT;

-- Notes:
-- - is_verified: marquer les vendeurs/prestataires de confiance
-- - last_ip: prêt pour double authentification basée sur IP
-- - last_login_at: tracking activité utilisateur
-- - boost columns: déjà probablement présentes, juste s'assurer
