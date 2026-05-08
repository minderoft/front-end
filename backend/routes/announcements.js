// filepath: backend/routes/announcements.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { getCategoryPrice } = require('../config/pricing');

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
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

// GET ALL
router.get('/', async (req, res) => {
  try {
    const { category, type, minPrice, maxPrice, location, search } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT a.*, u.name as user_name, u.phone as user_phone
      FROM announcements a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.status = 'active' AND a.payment_status = 1
    `;

    const params = [];

    if (category) {
      sql += ` AND a.category = ?`;
      params.push(category);
    }

    if (type) {
      sql += ` AND a.type = ?`;
      params.push(type);
    }

    if (minPrice) {
      sql += ` AND a.price >= ?`;
      params.push(Number(minPrice));
    }

    if (maxPrice) {
      sql += ` AND a.price <= ?`;
      params.push(Number(maxPrice));
    }

    if (location) {
      sql += ` AND a.location LIKE ?`;
      params.push('%' + location + '%');
    }

    if (search) {
      sql += ` AND (a.title LIKE ? OR a.description LIKE ?)`;
      params.push('%' + search + '%', '%' + search + '%');
    }

    // COUNT
    const countSql = sql.replace(/SELECT a\.\*, u\.name as user_name, u\.phone as user_phone/, 'SELECT COUNT(*) as count');
    const countResult = await query(countSql, params);
    const total = countResult[0]?.count || 0;

    // Pagination
    sql += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const result = await query(sql, params);

    res.json({
      announcements: result,
      pagination: {
        page,
        limit,
        total: Number(total),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erreur liste annonces:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET MY ANNOUNCEMENTS
router.get('/user/my-announcements', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM announcements WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ announcements: result });
  } catch (error) {
    console.error('Erreur my-announcements:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir les prix des annonces (utilisé par le frontend)
router.get('/prices', async (req, res) => {
  try {
    const result = await query('SELECT category, price FROM pricing WHERE type = ? AND active = 1', ['publication']);
    res.json({ prices: result });
  } catch (error) {
    console.error('Erreur récupération tarifs annonces:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET ONE
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT a.*, u.name, u.phone
       FROM announcements a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.id = ?`,
      [req.params.id]
    );

    if (!result.length) {
      return res.status(404).json({ error: 'Annonce non trouvée' });
    }

    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// CREATE
router.post('/', authenticateToken, upload.array('images', 10), validate('announcement'), async (req, res) => {
  try {
    const { category, type, title, description, price, location, phone, metadata } = req.body;
    const listingPrice = Number(price || 0);

    // Pour les techniciens, le prix peut être 0 (à négocier)
    if (category !== 'technicien' && (Number.isNaN(listingPrice) || listingPrice <= 0)) {
      return res.status(400).json({ error: 'Le prix doit être un nombre positif' });
    }

    // Pour les techniciens, on définit un prix par défaut de 0
    const finalPrice = category === 'technicien' ? 0 : listingPrice;

    const categoryPrice = await getCategoryPrice(category);
    if (categoryPrice === null) {
      return res.status(400).json({ error: 'Tarif de publication introuvable pour cette catégorie' });
    }

    const images = req.files?.map((f) => '/uploads/' + f.filename) || [];
    let metadataValue = {};

    if (typeof metadata === 'string' && metadata.trim() !== '') {
      try {
        metadataValue = JSON.parse(metadata);
      } catch (parseError) {
        console.error('Erreur parsing metadata:', parseError.message, metadata);
        return res.status(400).json({ error: 'Metadata invalide' });
      }
    } else if (typeof metadata === 'object' && metadata !== null) {
      metadataValue = metadata;
    }

    const id = uuidv4();

    await query(
      `INSERT INTO announcements (id, user_id, category, type, title, description, price, location, phone, images, metadata, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [id, req.user.id, category, type, title, description, finalPrice, location, phone, JSON.stringify(images), JSON.stringify(metadataValue)]
    );

    const result = await query('SELECT * FROM announcements WHERE id = ?', [id]);

    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Erreur création annonce:', error, {
      userId: req.user?.id,
      category: req.body?.category,
      type: req.body?.type,
      title: req.body?.title,
    });
    res.status(500).json({ error: 'Erreur création' });
  }
});

// DELETE
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM announcements WHERE id = ?', [req.params.id]);
    res.json({ message: 'Supprimé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur suppression' });
  }
});

module.exports = router;