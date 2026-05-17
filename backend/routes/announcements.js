// filepath: backend/routes/announcements.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { getCategoryPrice } = require('../config/pricing');

const router = express.Router();

const normalizeAnnouncement = (announcement) => {
  if (!announcement || typeof announcement !== 'object') return announcement;

  const normalized = { ...announcement };

  if (typeof normalized.images === 'string') {
    try {
      normalized.images = JSON.parse(normalized.images);
    } catch (error) {
      console.error('Erreur parse images:', error.message, normalized.images);
      normalized.images = [];
    }
  }

  // Exposer un champ image_url pratique (première image) pour le frontend
  try {
    normalized.image_url = Array.isArray(normalized.images) && normalized.images.length > 0
      ? normalized.images[0]
      : null;
  } catch (err) {
    normalized.image_url = null;
  }

  if (typeof normalized.metadata === 'string') {
    try {
      normalized.metadata = JSON.parse(normalized.metadata);
    } catch (error) {
      console.error('Erreur parse metadata:', error.message, normalized.metadata);
      normalized.metadata = {};
    }
  }

  return normalized;
};

const normalizeAnnouncements = (rows) => rows.map(normalizeAnnouncement);

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

const sendAnnouncementError = (res, error, context = {}) => {
  console.error('Erreur annonce:', error, context);

  if (error.name === 'MulterError') {
    return res.status(400).json({ error: `Upload d'image échoué: ${error.message}` });
  }

  if (error.message?.includes('Multipart: Boundary not found')) {
    return res.status(400).json({ error: 'Le formulaire multipart est invalide. Vérifiez que la requête contient bien des fichiers.' });
  }

  if (error.code === 'ER_NO_SUCH_TABLE') {
    return res.status(500).json({ error: 'Base de données non initialisée ou table manquante' });
  }

  if (error.code === 'ER_ACCESS_DENIED_ERROR') {
    return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
  }

  if (error.code === 'ER_BAD_FIELD_ERROR') {
    return res.status(500).json({ error: 'Champ SQL invalide dans la requête' });
  }

  const responseError = {
    error: process.env.NODE_ENV === 'production' ? 'Erreur création annonce' : error.message,
  };

  if (error.details) {
    responseError.details = error.details;
  }

  return res.status(500).json(responseError);
};

// GET ALL
router.get('/', async (req, res) => {
  try {
    const { category, type, minPrice, maxPrice, location, search } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    let userId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        console.warn('Token invalide pour récupération facultative de favoris:', err.message);
      }
    }

    let sql = `
      SELECT a.*, u.name as user_name, u.phone as user_phone, u.is_verified,
        COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 1) FROM reviews r WHERE r.target_user_id = a.user_id), 0) as average_rating,
        COALESCE((SELECT COUNT(*) FROM reviews r WHERE r.target_user_id = a.user_id), 0) as review_count
      FROM announcements a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.status = 'active' AND a.payment_status = 1
    `;

    const params = [];
    let paramCount = 1;

    if (category) {
      sql += ` AND a.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (type) {
      sql += ` AND a.type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    if (minPrice) {
      sql += ` AND a.price >= $${paramCount}`;
      params.push(Number(minPrice));
      paramCount++;
    }

    if (maxPrice) {
      sql += ` AND a.price <= $${paramCount}`;
      params.push(Number(maxPrice));
      paramCount++;
    }

    if (location) {
      sql += ` AND a.location ILIKE $${paramCount}`;
      params.push('%' + location + '%');
      paramCount++;
    }

    if (search) {
      sql += ` AND (a.title ILIKE $${paramCount} OR a.description ILIKE $${paramCount + 1})`;
      params.push('%' + search + '%', '%' + search + '%');
      paramCount += 2;
    }

    // COUNT
    const countSql = sql.replace(
      /SELECT a\.\*,.*?FROM announcements a/s,
      'SELECT COUNT(*) as count FROM announcements a'
    );
    const countResult = await pool.query(countSql, params);
    const total = countResult.rows[0]?.count || 0;

    sql += ` ORDER BY a.is_boosted DESC, a.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(sql, params);
    const announcements = normalizeAnnouncements(result.rows);

    if (userId) {
      const favoriteResult = await pool.query('SELECT announcement_id FROM favorites WHERE user_id = $1', [userId]);
      const favoriteIds = new Set(favoriteResult.rows.map((row) => row.announcement_id));
      announcements.forEach((item) => {
        item.is_favorite = favoriteIds.has(item.id);
      });
    }

    res.json({
      announcements,
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
    const result = await pool.query(
      'SELECT * FROM announcements WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ announcements: normalizeAnnouncements(result.rows) });
  } catch (error) {
    console.error('Erreur my-announcements:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir les prix des annonces (utilisé par le frontend)
router.get('/prices', async (req, res) => {
  try {
    const result = await pool.query('SELECT category, price FROM pricing WHERE type = $1 AND active = 1', ['publication']);
    res.json({ prices: result.rows });
  } catch (error) {
    console.error('Erreur récupération tarifs annonces:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET NEARBY
router.get('/nearby', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ error: 'Latitude et longitude valides requises' });
    }

    const sql = `
      SELECT a.*, u.name as user_name, u.phone as user_phone, u.is_verified,
        (6371 * ACOS(
          COS(RADIANS($1)) * COS(RADIANS(a.latitude)) * COS(RADIANS(a.longitude) - RADIANS($2)) +
          SIN(RADIANS($3)) * SIN(RADIANS(a.latitude))
        )) AS distance_km
      FROM announcements a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.status = 'active' AND a.payment_status = 1 AND a.latitude IS NOT NULL AND a.longitude IS NOT NULL
      HAVING distance_km <= $4
      ORDER BY distance_km ASC
      LIMIT 50
    `;

    const result = await pool.query(sql, [lat, lng, lat, 10]);
    const nearby = normalizeAnnouncements(result.rows);
    res.json({ announcements: nearby });
  } catch (error) {
    console.error('Erreur recherche nearby:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET ONE
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.name as user_name, u.phone as user_phone, u.email as user_email, u.is_verified,
        COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 1) FROM reviews r WHERE r.target_user_id = a.user_id), 0) as average_rating,
        COALESCE((SELECT COUNT(*) FROM reviews r WHERE r.target_user_id = a.user_id), 0) as review_count
       FROM announcements a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Annonce non trouvée' });
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('GET /announcements/:id images:', result.rows[0].images);
    }

    res.json({ announcement: normalizeAnnouncement(result.rows[0]) });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// CREATE
router.post('/', authenticateToken, upload.array('images', 10), validate('announcement'), async (req, res) => {
  try {
    console.log('Création annonce - Début:', { userId: req.user.id, category: req.body.category });
    const { category, type, title, description, price, location, phone, metadata, latitude, longitude } = req.body;
    const listingPrice = Number(price || 0);

    // Pour les techniciens, le prix peut être 0 (à négocier)
    if (category !== 'technicien' && (Number.isNaN(listingPrice) || listingPrice <= 0)) {
      return res.status(400).json({ error: 'Le prix doit être un nombre positif' });
    }

    // Pour les techniciens, on définit un prix par défaut de 0
    const finalPrice = category === 'technicien' ? 0 : listingPrice;

    console.log('Création annonce - Prix calculé:', { finalPrice, category });
    const categoryPrice = await getCategoryPrice(category);
    console.log('Création annonce - Prix catégorie:', categoryPrice);
    if (categoryPrice === null) {
      return res.status(400).json({ error: 'Tarif de publication introuvable pour cette catégorie' });
    }

    const images = req.files?.map((f) => '/uploads/' + f.filename) || [];
    const firstImage = images.length > 0 ? images[0] : null;
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

    const latitudeValue = latitude ? parseFloat(latitude) : null;
    const longitudeValue = longitude ? parseFloat(longitude) : null;

    if ((latitude && !longitude) || (!latitude && longitude)) {
      return res.status(400).json({ error: 'Latitude et longitude doivent être fournies ensemble' });
    }

    const id = uuidv4();
    console.log('Création annonce - Avant INSERT:', { id, userId: req.user.id });

    await pool.query(
      `INSERT INTO announcements (id, user_id, category, type, title, description, price, location, latitude, longitude, phone, images, image_url, metadata, status, payment_status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'pending', 0, CURRENT_TIMESTAMP)`,
      [
        id,
        req.user.id,
        category,
        type,
        title,
        description,
        finalPrice,
        location,
        latitudeValue,
        longitudeValue,
        phone,
        JSON.stringify(images),
        firstImage,
        JSON.stringify(metadataValue),
      ]
    );

    console.log('Création annonce - Après INSERT');
    const result = await pool.query('SELECT * FROM announcements WHERE id = $1', [id]);
    if (process.env.NODE_ENV !== 'production') {
      console.log('Création annonce - Résultat SELECT:', result.rows.length, result.rows[0]?.images);
    }
    const savedAnnouncement = normalizeAnnouncement(result.rows[0]);

    res.status(201).json(savedAnnouncement);
  } catch (error) {
    return sendAnnouncementError(res, error, {
      userId: req.user?.id,
      category: req.body?.category,
      type: req.body?.type,
      title: req.body?.title,
    });
  }
});

// DELETE
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM announcements WHERE id = $1', [req.params.id]);
    res.json({ message: 'Supprimé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur suppression' });
  }
});

module.exports = router;