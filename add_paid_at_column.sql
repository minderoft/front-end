-- Script pour ajouter la colonne paid_at à la table payments
-- À exécuter dans votre base de données MySQL sur Render

-- Vérifier si la colonne paid_at existe déjà
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'payments'
    AND COLUMN_NAME = 'paid_at'
);

-- Ajouter la colonne seulement si elle n'existe pas
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE payments ADD COLUMN paid_at DATETIME NULL AFTER reference',
    'SELECT "La colonne paid_at existe déjà" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vérifier le résultat
DESCRIBE payments;