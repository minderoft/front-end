const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const favorites = await query(
      `SELECT f.id, f.announcement_id, a.title, a.category, a.price, a.status, a.images, a.created_at
       FROM favorites f
       JOIN announcements a ON f.announcement_id = a.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );

    res.json({ favorites });
  } catch (error) {
    console.error('Erreur récupération favoris:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/:announcementId', authenticateToken, async (req, res) => {
  try {
    const { announcementId } = req.params;

    const announcement = await query('SELECT id FROM announcements WHERE id = ?', [announcementId]);
    if (announcement.length === 0) {
      return res.status(404).json({ error: 'Annonce introuvable' });
    }

    const favoriteId = uuidv4();
    await query(
      'INSERT INTO favorites (id, user_id, announcement_id) VALUES (?, ?, ?)',
      [favoriteId, req.user.id, announcementId]
    );

    res.json({ message: 'Annonce ajoutée aux favoris' });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Annonce déjà présente dans vos favoris' });
    }
    console.error('Erreur création favori:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:announcementId', authenticateToken, async (req, res) => {
  try {
    const { announcementId } = req.params;
    await query('DELETE FROM favorites WHERE user_id = ? AND announcement_id = ?', [req.user.id, announcementId]);
    res.json({ message: 'Annonce retirée des favoris' });
  } catch (error) {
    console.error('Erreur suppression favori:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
