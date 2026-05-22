// filepath: backend/routes/admin.js
// Routes d'administration pour gérer les statistiques et la modération des annonces

const express = require('express');
const { pool } = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/stats - Statistiques globales du tableau de bord
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const statsResult = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM announcements WHERE status = 'active' AND payment_status = 1) AS total_active_announcements,
        (SELECT COUNT(*) FROM announcements WHERE is_sponsored = TRUE AND status = 'active' AND payment_status = 1) AS total_sponsored_ads,
        COALESCE((SELECT SUM(amount) FROM payments WHERE status = 'completed'), 0) AS revenue_estimation
    `);

    res.json({ stats: statsResult.rows[0] });
  } catch (error) {
    console.error('Erreur récupération stats admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/admin/announcements - Liste des annonces pour modération
router.get('/announcements', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id,
             a.title,
             a.status,
             a.payment_status,
             a.is_sponsored,
             a.is_boosted,
             a.price,
             a.user_id,
             u.name AS user_name,
             u.email AS user_email,
             a.created_at,
             a.updated_at
      FROM announcements a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 500
    `);

    res.json({ announcements: result.rows });
  } catch (error) {
    console.error('Erreur récupération annonces admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/admin/announcements/:id/status - Approuver, suspendre ou modifier le sponsor
router.patch('/announcements/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, status, is_sponsored } = req.body;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    const resolvedStatus = action === 'approve' ? 'active' : action === 'suspend' ? 'suspended' : status;
    if (resolvedStatus) {
      const allowedStatuses = ['active', 'suspended', 'pending'];
      if (!allowedStatuses.includes(resolvedStatus)) {
        return res.status(400).json({ error: 'Statut invalide' });
      }
      updates.push(`status = $${paramIndex}`);
      values.push(resolvedStatus);
      paramIndex += 1;
    }

    if (typeof is_sponsored !== 'undefined') {
      updates.push(`is_sponsored = $${paramIndex}`);
      values.push(is_sponsored === true || is_sponsored === 'true');
      paramIndex += 1;
    }

    if (action === 'toggle_sponsored' && typeof is_sponsored === 'undefined') {
      return res.status(400).json({ error: 'Valeur is_sponsored requise pour toggle_sponsored' });
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune modification valide fournie' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    const query = `UPDATE announcements SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, title, status, payment_status, is_sponsored, is_boosted, price, user_id, created_at, updated_at`;
    values.push(id);

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Annonce introuvable' });
    }

    res.json({ announcement: result.rows[0] });
  } catch (error) {
    console.error('Erreur mise à jour statut annonce admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Optional: existing admin utilities remain available
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

    res.json({
      message: `Utilisateur ${isVerified ? 'marqué comme vérifié' : 'révocation de la vérification'}`,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur vérification utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

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
