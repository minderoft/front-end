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
    const { email, password, name, phone } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await getAsync('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    const id = uuidv4();

    await runAsync(
      'INSERT INTO users (id, email, password, name, phone) VALUES (?, ?, ?, ?, ?)',
      [id, email, hashedPassword, name, phone || null]
    );

    const user = await getAsync(
      'SELECT id, email, name, phone, role, created_at FROM users WHERE id = ?',
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
      },
      token,
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription' });
  }
});

// Connexion
router.post('/login', validate('login'), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Rechercher l'utilisateur
    const user = await getAsync('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Générer le token
    const token = generateToken(user);

    res.json({
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
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