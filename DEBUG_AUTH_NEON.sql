-- ============================================
-- SCRIPT DEBUG - Vérifier les utilisateurs et mots de passe hachés
-- ============================================
-- Utilisez ce script dans la console Neon pour diagnostiquer les problèmes d'authentification

-- 1️⃣ Vérifier le nombre total d'utilisateurs
SELECT COUNT(*) as total_users FROM users;

-- 2️⃣ Vérifier tous les utilisateurs (ATTENTION: les mots de passe sont visibles)
SELECT 
    id,
    email,
    name,
    phone,
    role,
    accepted_policy,
    password as password_hash_preview,
    LENGTH(password) as password_length,
    created_at,
    updated_at
FROM users
ORDER BY created_at DESC;

-- 3️⃣ Vérifier les utilisateurs avec politique acceptée
SELECT 
    id,
    email,
    name,
    role,
    accepted_policy,
    LENGTH(password) as password_hash_length,
    SUBSTRING(password, 1, 20) || '...' as password_preview,
    created_at
FROM users
WHERE accepted_policy = TRUE
ORDER BY created_at DESC;

-- 4️⃣ Identifier les mots de passe en clair (DANGER!)
-- Les mots de passe bcrypt commencent par $2a$, $2b$, $2x$, ou $2y$
-- Les mots de passe en clair n'ont pas ce format
SELECT 
    id,
    email,
    password,
    CASE 
        WHEN password LIKE '$2%' THEN '✅ Haché (bcrypt)'
        ELSE '❌ DANGER - Mot de passe en clair!'
    END as password_status,
    created_at
FROM users
ORDER BY created_at DESC;

-- 5️⃣ Vérifier un utilisateur spécifique (remplacer avec l'email réel)
SELECT 
    id,
    email,
    name,
    phone,
    role,
    accepted_policy,
    SUBSTRING(password, 1, 60) as password_hash,
    LENGTH(password) as hash_length,
    CASE 
        WHEN password LIKE '$2%' THEN 'BCRYPT (correct)'
        WHEN LENGTH(password) > 60 THEN 'Potentiellement bcrypt'
        ELSE 'PEUT ÊTRE EN CLAIR'
    END as password_format,
    created_at,
    updated_at
FROM users
WHERE email = 'test@example.com'  -- ← Remplacer avec l'email réel
LIMIT 1;

-- 6️⃣ Vérifier la structure de la table users
\d users

-- 7️⃣ Compter les utilisateurs par statut de politique
SELECT 
    accepted_policy,
    COUNT(*) as count
FROM users
GROUP BY accepted_policy;

-- 8️⃣ Vérifier les erreurs potentielles
-- Les bcrypt valides font 60 caractères
SELECT 
    id,
    email,
    LENGTH(password) as actual_length,
    CASE 
        WHEN LENGTH(password) = 60 THEN '✅ Longueur correcte pour bcrypt'
        WHEN LENGTH(password) < 30 THEN '❌ TOO SHORT - Probablement en clair!'
        WHEN LENGTH(password) > 100 THEN '⚠️ Très long, vérifier format'
        ELSE '⚠️ Longueur inhabituelle'
    END as length_check
FROM users;

-- 9️⃣ Pour les utilisateurs sans mot de passe valide
SELECT 
    id,
    email,
    password,
    created_at
FROM users
WHERE password IS NULL 
   OR password = ''
   OR LENGTH(password) < 20;

-- 🔟 Debug: Chercher les utilisateurs avec problème de connexion
-- Voir les utilisateurs qui ont accepted_policy = FALSE
SELECT 
    id,
    email,
    name,
    accepted_policy,
    created_at
FROM users
WHERE accepted_policy = FALSE
ORDER BY created_at DESC;

-- ============================================
-- INSTRUCTIONS IMPORTANTES
-- ============================================
-- 
-- 1. Vérifier que les mots de passe commencent par $2a$, $2b$, $2x$ ou $2y$
--    Exemple: $2b$12$Zy8wG8...
--    Longueur: 60 caractères exactement
--
-- 2. Si un utilisateur a accepted_policy = FALSE, il ne peut pas se connecter
--
-- 3. Si un mot de passe est visible en clair, c'est une erreur grave!
--
-- 4. Pour corriger les mots de passe en clair, vous devez:
--    - Arrêter le backend
--    - Réinscrire les utilisateurs (qui utiliseront bcrypt)
--    - Ou utiliser un script Node.js pour hasher les anciens mots de passe
--
-- ============================================
