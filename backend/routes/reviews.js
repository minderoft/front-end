const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/reviews - Créer un nouvel avis
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { announcementId, rating, comment } = req.body;

    if (!announcementId || !rating) {
      return res.status(400).json({ error: 'announcementId et rating sont requis' });
    }

    const numericRating = Number(rating);
    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: 'La note doit être un entier entre 1 et 5' });
    }

    // Récupérer l'ID du vendeur
    const announcementResult = await pool.query('SELECT id, user_id FROM announcements WHERE id = $1', [announcementId]);
    if (announcementResult.rows.length === 0) {
      return res.status(404).json({ error: 'Annonce introuvable' });
    }

    const targetUserId = announcementResult.rows[0].user_id;
    if (targetUserId === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas évaluer votre propre annonce' });
    }

    // Vérifier qu'on n'a pas déjà noté cette annonce
    const existingReviewResult = await pool.query(
      'SELECT id FROM reviews WHERE reviewer_id = $1 AND announcement_id = $2',
      [req.user.id, announcementId]
    );
    if (existingReviewResult.rows.length > 0) {
      return res.status(400).json({ error: 'Vous avez déjà évalué cette annonce' });
    }

    const reviewId = uuidv4();
    await pool.query(
      'INSERT INTO reviews (id, reviewer_id, target_user_id, announcement_id, rating, comment, created_at) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)',
      [reviewId, req.user.id, targetUserId, announcementId, numericRating, comment || null]
    );

    res.json({ message: 'Merci pour votre avis', reviewId });
  } catch (error) {
    console.error('Erreur création review:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/reviews/user/:userId - Récupérer les avis d'un vendeur
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Récupérer le résumé des avis
    const summaryResult = await pool.query(
      `SELECT 
        COALESCE(ROUND(AVG(rating)::numeric, 1), 0) as average_rating, 
        COUNT(*) as total_reviews 
       FROM reviews 
       WHERE target_user_id = $1`,
      [userId]
    );

    const summary = summaryResult.rows[0] || { average_rating: 0, total_reviews: 0 };

    // Récupérer les avis individuels
    const reviewsResult = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, r.announcement_id, u.name as reviewer_name
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.target_user_id = $1
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [userId]
    );

    res.json({
      average_rating: Number(summary.average_rating),
      total_reviews: Number(summary.total_reviews),
      reviews: reviewsResult.rows,
    });
  } catch (error) {
    console.error('Erreur récupération reviews:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/reviews/announcement/:announcementId - Récupérer les avis pour une annonce
router.get('/announcement/:announcementId', async (req, res) => {
  try {
    const { announcementId } = req.params;

    const result = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name as reviewer_name
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.announcement_id = $1
       ORDER BY r.created_at DESC`,
      [announcementId]
    );

    res.json({ reviews: result.rows });
  } catch (error) {
    console.error('Erreur récupération reviews annonce:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
