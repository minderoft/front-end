// filepath: backend/routes/admin.js
// Routes d'administration pour gérer les utilisateurs et les annonces

const express = require('express');
const { pool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Middleware pour vérifier que l'utilisateur est admin
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Pour l'MVP, on considère admin = id en dur ou email spécifique
    // À remplacer par une colonne `is_admin` dans la table users
    const adminEmails = ['admin@locaplus.ci', 'contact@locaplus.ci'];
    if (!adminEmails.includes(req.user.email)) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PUT /api/admin/users/:userId/verify - Marquer un utilisateur comme vérifié
router.put('/users/:userId/verify', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isVerified = true } = req.body;

    const result = await pool.query(
      'UPDATE users SET is_verified = $1 WHERE id = $2 RETURNING id, name, email, is_verified',
      [isVerified, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    const user = result.rows[0];
    res.json({
      message: `Utilisateur ${isVerified ? 'marqué comme vérifié' : 'révocation de la vérification'}`,
      user
    });
  } catch (error) {
    console.error('Erreur vérification utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/admin/announcements/:announcementId/boost - Activer le boost administrateur
router.put('/announcements/:announcementId/boost', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { announcementId } = req.params;
    const { durationHours = 24 } = req.body;

    const result = await pool.query(
      `UPDATE announcements 
       SET is_boosted = TRUE, boost_expiry = CURRENT_TIMESTAMP + INTERVAL '${durationHours} hours'
       WHERE id = $1
       RETURNING id, title, is_boosted, boost_expiry`,
      [announcementId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Annonce introuvable' });
    }

    res.json({
      message: `Annonce boostée pour ${durationHours}h`,
      announcement: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur boost annonce:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/admin/announcements/boosted - Récupérer toutes les annonces boostées
router.get('/announcements/boosted', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, user_id, is_boosted, boost_expiry, created_at
       FROM announcements
       WHERE is_boosted = TRUE AND boost_expiry > CURRENT_TIMESTAMP
       ORDER BY boost_expiry DESC`
    );

    res.json({ boostedAnnouncements: result.rows });
  } catch (error) {
    console.error('Erreur récupération annonces boostées:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
