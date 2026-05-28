// filepath: backend/routes/ads.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Multer config for ad uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/ads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) cb(null, true);
  else cb(new Error('Fichier image non valide'));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

// Normalize ad data
const normalizeAd = (ad) => {
  if (!ad || typeof ad !== 'object') return ad;
  const normalized = { ...ad };
  
  if (typeof normalized.metadata === 'string') {
    try {
      normalized.metadata = JSON.parse(normalized.metadata);
    } catch (error) {
      normalized.metadata = {};
    }
  }
  
  return normalized;
};

// GET ALL ADS (Public - for homepage display)
router.get('/', async (req, res) => {
  try {
    const { status, limit, category } = req.query;
    const limitParam = parseInt(limit, 10);
    const limitValue = Number.isNaN(limitParam) || limitParam < 1 ? 10 : Math.min(limitParam, 50);

    let whereClause = 'WHERE status = $1';
    const params = [status || 'active'];
    let paramCount = 2;

    if (category) {
      whereClause += ` AND target_category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    const sql = `
      SELECT * FROM ads 
      ${whereClause}
      AND (end_date IS NULL OR end_date > CURRENT_TIMESTAMP)
      ORDER BY priority DESC, created_at DESC 
      LIMIT $${paramCount}
    `;

    const result = await pool.query(sql, [...params, limitValue]);
    const ads = result.rows.map(normalizeAd);
    
    res.json({ ads });
  } catch (error) {
    console.error('Erreur récupération ads:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET ACTIVE ADS (Public - specifically for homepage banners)
router.get('/active', async (req, res) => {
  try {
    const { limit } = req.query;
    const limitParam = parseInt(limit, 10);
    const limitValue = Number.isNaN(limitParam) || limitParam < 1 ? 10 : Math.min(limitParam, 50);

    const sql = `
      SELECT * FROM ads 
      WHERE status = 'active' 
      AND (end_date IS NULL OR end_date > CURRENT_TIMESTAMP)
      AND paid_at IS NOT NULL
      ORDER BY priority DESC, created_at DESC 
      LIMIT $1
    `;

    const result = await pool.query(sql, [limitValue]);
    const ads = result.rows.map(normalizeAd);
    
    res.json({ ads });
  } catch (error) {
    console.error('Erreur récupération ads actives:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET SINGLE AD
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ads WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Publicité non trouvée' });
    }
    
    res.json({ ad: normalizeAd(result.rows[0]) });
  } catch (error) {
    console.error('Erreur récupération ad:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// CREATE AD (Requires authentication)
router.post('/', authenticateToken, upload.array('images', 3), async (req, res) => {
  try {
    const { title, description, target_category, link_url, priority, pack_type } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Le titre est requis' });
    }

    const images = req.files?.map(f => '/uploads/ads/' + f.filename) || [];
    const image_url = images.length > 0 ? images[0] : null;
    
    const id = uuidv4();
    const priorityValue = parseInt(priority, 10) || 0;
    
    // Determine pack pricing
    const packPricing = {
      image_2days: { price: 500, duration_days: 2 },
      video_3days: { price: 1500, duration_days: 3 },
      premium_7days: { price: 3000, duration_days: 7 },
    };
    
    const pack = packPricing[pack_type] || packPricing.image_2days;
    const end_date = new Date();
    end_date.setDate(end_date.getDate() + pack.duration_days);

    await pool.query(
      `INSERT INTO ads (id, user_id, title, description, image_url, images, target_category, link_url, priority, status, pack_type, price, end_date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10, $11, $12, CURRENT_TIMESTAMP)`,
      [
        id,
        req.user.id,
        title.trim(),
        description?.trim() || null,
        image_url,
        JSON.stringify(images),
        target_category || null,
        link_url || null,
        priorityValue,
        pack_type || 'image_2days',
        pack.price,
        end_date,
      ]
    );

    const result = await pool.query('SELECT * FROM ads WHERE id = $1', [id]);
    res.status(201).json(normalizeAd(result.rows[0]));
  } catch (error) {
    console.error('Erreur création ad:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la publicité' });
  }
});

// UPDATE AD STATUS (Activate after payment)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, paid_at } = req.body;
    const adId = req.params.id;
    
    // Verify ownership
    const checkResult = await pool.query('SELECT user_id FROM ads WHERE id = $1', [adId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Publicité non trouvée' });
    }
    
    if (checkResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const updateFields = [];
    const updateParams = [];
    let paramCount = 1;

    if (status) {
      updateFields.push(`status = $${paramCount}`);
      updateParams.push(status);
      paramCount++;
    }

    if (paid_at) {
      updateFields.push(`paid_at = $${paramCount}`);
      updateParams.push(paid_at);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    }

    updateParams.push(adId);
    
    const sql = `UPDATE ads SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(sql, updateParams);
    
    res.json(normalizeAd(result.rows[0]));
  } catch (error) {
    console.error('Erreur mise à jour status ad:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE AD
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Verify ownership
    const checkResult = await pool.query('SELECT user_id, images FROM ads WHERE id = $1', [req.params.id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Publicité non trouvée' });
    }
    
    if (checkResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    // Delete image files
    try {
      const images = typeof checkResult.rows[0].images === 'string' 
        ? JSON.parse(checkResult.rows[0].images) 
        : [];
      images.forEach(imgPath => {
        const fullPath = path.join(__dirname, '..', imgPath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    } catch (err) {
      console.warn('Erreur suppression fichiers images:', err);
    }

    await pool.query('DELETE FROM ads WHERE id = $1', [req.params.id]);
    res.json({ message: 'Publicité supprimée' });
  } catch (error) {
    console.error('Erreur suppression ad:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET USER'S ADS
router.get('/user/my-ads', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ads WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ ads: result.rows.map(normalizeAd) });
  } catch (error) {
    console.error('Erreur récupération my-ads:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// TRACK AD CLICKS
router.post('/:id/track-click', async (req, res) => {
  try {
    const id = req.params.id;
    
    const updateSql = `
      UPDATE ads 
      SET clicks_count = COALESCE(clicks_count, 0) + 1 
      WHERE id = $1 
      RETURNING id, clicks_count
    `;
    
    const result = await pool.query(updateSql, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Publicité non trouvée' });
    }

    res.json({ ad: result.rows[0] });
  } catch (error) {
    console.error('Erreur track-click ad:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;