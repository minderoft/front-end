// filepath: backend/routes/announcements.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

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

// Tarifs
const PRICES = {
  immobilier: 5000,
  vehicule: 4000,
  materiaux: 3000,
  technicien: 2000,
};

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
      WHERE a.status = 'active' AND a.payment_status = true
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
    const { category, type, title, description, price, location, metadata } = req.body;

    if (price < PRICES[category]) {
      return res.status(400).json({ error: 'Prix trop bas' });
    }

    const images = req.files?.map(f => '/uploads/' + f.filename) || [];
    const id = uuidv4();

    await query(
      `INSERT INTO announcements (id, user_id, category, type, title, description, price, location, images, metadata, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [id, req.user.id, category, type, title, description, price, location, JSON.stringify(images), metadata]
    );

    const result = await query('SELECT * FROM announcements WHERE id = ?', [id]);

    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Erreur création:', error);
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

module.exports = router;