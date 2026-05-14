const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

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

    const announcement = await query('SELECT id, user_id FROM announcements WHERE id = ?', [announcementId]);
    if (announcement.length === 0) {
      return res.status(404).json({ error: 'Annonce introuvable' });
    }

    const targetUserId = announcement[0].user_id;
    if (targetUserId === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas évaluer votre propre annonce' });
    }

    const reviewId = uuidv4();
    await query(
      'INSERT INTO reviews (id, reviewer_id, target_user_id, announcement_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)',
      [reviewId, req.user.id, targetUserId, announcementId, numericRating, comment || null]
    );

    res.json({ message: 'Merci pour votre avis', reviewId });
  } catch (error) {
    console.error('Erreur création review:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const summary = await query(
      'SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0) as average_rating, COUNT(*) as total_reviews FROM reviews WHERE target_user_id = ?',
      [userId]
    );

    const reviews = await query(
      `SELECT r.id, r.rating, r.comment, r.created_at, r.announcement_id, u.name as reviewer_name
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.target_user_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json({
      average_rating: Number(summary[0].average_rating),
      total_reviews: Number(summary[0].total_reviews),
      reviews,
    });
  } catch (error) {
    console.error('Erreur récupération reviews:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
