const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const normalizeImages = (images) => {
  if (Array.isArray(images)) return images;
  if (typeof images === 'string') {
    try {
      return JSON.parse(images);
    } catch (error) {
      console.error('Erreur parse favorite images:', error.message, images);
      return [];
    }
  }
  return images || [];
};

// GET /api/favorites - Récupérer tous les favoris de l'utilisateur
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT f.id, f.announcement_id, a.title, a.category, a.price, a.status, a.images, a.image_url, a.created_at
       FROM favorites f
       JOIN announcements a ON f.announcement_id = a.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );

    const normalizedFavorites = result.rows.map((favorite) => ({
      ...favorite,
      images: normalizeImages(favorite.images),
    }));

    res.json({ favorites: normalizedFavorites });
  } catch (error) {
    console.error('Erreur récupération favoris:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/favorites/:announcementId - Ajouter une annonce aux favoris
router.post('/:announcementId', authenticateToken, async (req, res) => {
  try {
    const { announcementId } = req.params;

    // Vérifier que l'annonce existe
    const announcementResult = await pool.query('SELECT id FROM announcements WHERE id = $1', [announcementId]);
    if (announcementResult.rows.length === 0) {
      return res.status(404).json({ error: 'Annonce introuvable' });
    }

    // Vérifier que le favori n'existe pas déjà
    const existingResult = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND announcement_id = $2',
      [req.user.id, announcementId]
    );
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Annonce déjà présente dans vos favoris' });
    }

    const favoriteId = uuidv4();
    await pool.query(
      'INSERT INTO favorites (id, user_id, announcement_id, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
      [favoriteId, req.user.id, announcementId]
    );

    res.json({ message: 'Annonce ajoutée aux favoris', favoriteId });
  } catch (error) {
    console.error('Erreur création favori:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/favorites/:announcementId - Retirer une annonce des favoris
router.delete('/:announcementId', authenticateToken, async (req, res) => {
  try {
    const { announcementId } = req.params;
    const result = await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND announcement_id = $2',
      [req.user.id, announcementId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Favori non trouvé' });
    }

    res.json({ message: 'Annonce retirée des favoris' });
  } catch (error) {
    console.error('Erreur suppression favori:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/favorites/check/:announcementId - Vérifier si une annonce est dans les favoris
router.get('/check/:announcementId', authenticateToken, async (req, res) => {
  try {
    const { announcementId } = req.params;
    const result = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND announcement_id = $2',
      [req.user.id, announcementId]
    );

    res.json({ isFavorited: result.rows.length > 0 });
  } catch (error) {
    console.error('Erreur vérification favori:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
