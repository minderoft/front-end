// filepath: backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query, getAsync, runAsync } = require('../config/db');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Inscription
router.post('/register', validate('register'), async (req, res) => {
  try {
    const { email, password, name, phone, accepted_policy } = req.body;

    // ✅ Vérifier que l'utilisateur accepte la politique de confidentialité
    if (!accepted_policy) {
      return res.status(400).json({ 
        error: 'Vous devez accepter la Politique de Confidentialité pour vous inscrire' 
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await getAsync('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    const id = uuidv4();

    // ✅ Enregistrer avec accepted_policy = TRUE
    await runAsync(
      'INSERT INTO users (id, email, password, name, phone, accepted_policy, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [id, email, hashedPassword, name, phone || null, true]
    );

    const user = await getAsync(
      'SELECT id, email, name, phone, role, accepted_policy, created_at FROM users WHERE id = ?',
      [id]
    );
    const token = generateToken(user);

    res.status(201).json({
      message: 'Inscription réussie',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        accepted_policy: user.accepted_policy,
      },
      token,
    });
  } catch (error) {
    console.error('❌ Erreur inscription:', error.message);
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription' });
  }
});

// Connexion
router.post('/login', validate('login'), async (req, res) => {
  const startTime = Date.now();
  try {
    const { email, password } = req.body;
    console.log(`\n🔐 [LOGIN] Tentative de connexion pour: ${email}`);
    console.log(`📊 [LOGIN] Timestamp: ${new Date().toISOString()}`);
    console.log(`⏱️ [LOGIN] Timeout configuré: 60000ms`);

    // Rechercher l'utilisateur dans la table users de Neon
    console.log(`🔍 [LOGIN] Recherche utilisateur dans table 'users'...`);
    const dbStartTime = Date.now();
    const user = await getAsync(
      'SELECT id, email, password, name, phone, role, accepted_policy FROM users WHERE email = ?',
      [email]
    );
    const dbElapsed = Date.now() - dbStartTime;
    console.log(`✅ [LOGIN] Requête DB complétée en ${dbElapsed}ms`);

    if (!user) {
      console.log(`⚠️ [LOGIN] Utilisateur non trouvé: ${email}`);
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    if (!user.accepted_policy) {
      console.log(`⚠️ [LOGIN] Utilisateur sans accepted_policy: ${email}`);
      return res.status(403).json({ error: 'Vous devez accepter la politique de confidentialité pour vous connecter.' });
    }

    console.log(`✓ [LOGIN] Utilisateur trouvé, vérification mot de passe...`);
    // Vérifier le mot de passe
    const bcryptStartTime = Date.now();
    const isValidPassword = await bcrypt.compare(password, user.password);
    const bcryptElapsed = Date.now() - bcryptStartTime;
    console.log(`✅ [LOGIN] Vérification bcrypt complétée en ${bcryptElapsed}ms`);

    if (!isValidPassword) {
      console.log(`⚠️ [LOGIN] Mot de passe incorrect pour: ${email}`);
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Générer le token
    console.log(`🔑 [LOGIN] Génération du JWT token...`);
    const token = generateToken(user);
    const totalElapsed = Date.now() - startTime;
    console.log(`✅ [LOGIN] Connexion réussie en ${totalElapsed}ms pour: ${email}\n`);

    res.status(200).json({
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        accepted_policy: user.accepted_policy,
      },
      token,
    });
  } catch (error) {
    const totalElapsed = Date.now() - startTime;
    console.error(`\n❌ [LOGIN] ERREUR après ${totalElapsed}ms:`, {
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 3).join('\n'),
      timestamp: new Date().toISOString(),
    });
    console.log('\n');
    res.status(500).json({ 
      error: 'Erreur serveur lors de la connexion',
      details: error.message
    });
  }
});

// Obtenir le profil utilisateur
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await getAsync(
      'SELECT id, email, name, phone, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Erreur profil:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour le profil
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone } = req.body;

    await query(
      'UPDATE users SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, phone, req.user.id]
    );

    const user = await getAsync('SELECT id, email, name, phone, role FROM users WHERE id = ?', [req.user.id]);

    res.json({ message: 'Profil mis à jour', user });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Changer le mot de passe
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Mot de passe invalide (minimum 6 caractères)' });
    }

    // Vérifier le mot de passe actuel
    const result = await query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const isValid = await bcrypt.compare(currentPassword, result[0].password);

    if (!isValid) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await query('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
      [hashedPassword, req.user.id]);

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;