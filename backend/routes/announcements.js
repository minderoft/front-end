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

  normalized.images = Array.isArray(normalized.images) ? normalized.images : [];

  // Exposer un champ image_url pratique (première image) pour le frontend
  normalized.image_url = normalized.images.length > 0 ? normalized.images[0] : null;

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

const debugLog = (...args) => process.env.NODE_ENV !== 'production' && console.log(...args);

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
    const pageParam = Number.parseInt(req.query.page, 10);
    const limitParam = Number.parseInt(req.query.limit, 10);
    const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    const limit = Number.isNaN(limitParam) || limitParam < 1 ? 12 : Math.min(limitParam, 100);
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

    const filters = ['a.status = $1', 'a.payment_status = $2'];
    const params = ['active', 1];
    let paramCount = 3;

    if (category) {
      filters.push(`a.category = $${paramCount}`);
      params.push(category);
      paramCount++;
    }

    if (type) {
      filters.push(`a.type = $${paramCount}`);
      params.push(type);
      paramCount++;
    }

    if (minPrice) {
      const minValue = Number(minPrice);
      if (!Number.isNaN(minValue)) {
        filters.push(`a.price >= $${paramCount}`);
        params.push(minValue);
        paramCount++;
      }
    }

    if (maxPrice) {
      const maxValue = Number(maxPrice);
      if (!Number.isNaN(maxValue)) {
        filters.push(`a.price <= $${paramCount}`);
        params.push(maxValue);
        paramCount++;
      }
    }

    if (location) {
      filters.push(`a.location ILIKE $${paramCount}`);
      params.push(`%${location}%`);
      paramCount++;
    }

    if (search) {
      filters.push(`(a.title ILIKE $${paramCount} OR a.description ILIKE $${paramCount + 1})`);
      params.push(`%${search}%`, `%${search}%`);
      paramCount += 2;
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const baseSql = `
      SELECT a.*, u.name as user_name, u.phone as user_phone,
        COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 1) FROM reviews r WHERE r.target_user_id = a.user_id), 0) as average_rating,
        COALESCE((SELECT COUNT(*) FROM reviews r WHERE r.target_user_id = a.user_id), 0) as review_count
      FROM announcements a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereClause}
    `;

    const countSql = `SELECT COUNT(*) as count FROM announcements a ${whereClause}`;
    const countResult = await pool.query(countSql, params);
    const total = Number(countResult.rows[0]?.count || 0);

    const querySql = `${baseSql} ORDER BY a.is_boosted DESC, a.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    const queryParams = [...params, limit, offset];
    const result = await pool.query(querySql, queryParams);
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
      SELECT a.*, u.name as user_name, u.phone as user_phone,
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

router.get('/sponsored', async (req, res) => {
  try {
    const limitParam = parseInt(req.query.limit, 10);
    const limit = Number.isNaN(limitParam) || limitParam < 1 ? 5 : Math.min(limitParam, 50);

    const sql = `SELECT a.*, u.name as user_name, u.phone as user_phone
      FROM announcements a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.status = 'active' AND a.payment_status = 1 AND a.is_boosted = true AND a.boost_expiry > NOW()
      ORDER BY a.boost_expiry DESC, a.created_at DESC
      LIMIT $1`;

    const result = await pool.query(sql, [limit]);
    const announcements = normalizeAnnouncements(result.rows);
    res.json({ announcements });
  } catch (error) {
    console.error('Erreur sponsored:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET ONE
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.name as user_name, u.phone as user_phone, u.email as user_email,
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

    debugLog('GET /announcements/:id images:', result.rows[0].images);

    res.json({ announcement: normalizeAnnouncement(result.rows[0]) });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// CREATE
router.post('/', authenticateToken, upload.array('images', 10), validate('announcement'), async (req, res) => {
  try {
    debugLog('Création annonce - Début:', { userId: req.user?.id, category: req.body?.category });

    const category = typeof req.body?.category === 'string' ? req.body.category.trim() : req.body?.category;
    const type = typeof req.body?.type === 'string' ? req.body.type.trim() : req.body?.type;
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
    const price = req.body?.price;
    const location = typeof req.body?.location === 'string' ? req.body.location.trim() : '';
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : req.body?.phone;
    const metadata = req.body?.metadata;
    const latitude = req.body?.latitude;
    const longitude = req.body?.longitude;

    const hasImages = req.files && Array.isArray(req.files) && req.files.length > 0;
    const images = hasImages ? req.files.map((file) => '/uploads/' + file.filename) : [];
    const firstImage = images.length > 0 ? images[0] : null;

    if (typeof title !== 'string' || title.length === 0) {
      return res.status(400).json({ error: 'Le titre est requis' });
    }

    if (typeof category !== 'string' || category.length === 0) {
      return res.status(400).json({ error: 'La catégorie est requise' });
    }

    if (typeof location !== 'string' || location.length === 0) {
      return res.status(400).json({ error: 'La localisation est requise' });
    }

    const listingPrice = Number(price || 0);

    // Pour les techniciens, le prix peut être 0 (à négocier)
    if (category !== 'technicien' && (Number.isNaN(listingPrice) || listingPrice <= 0)) {
      return res.status(400).json({ error: 'Le prix doit être un nombre positif' });
    }

    // Pour les techniciens, on définit un prix par défaut de 0
    const finalPrice = category === 'technicien' ? 0 : listingPrice;

    debugLog('Création annonce - Prix calculé:', { finalPrice, category });
    const categoryPrice = await getCategoryPrice(category);
    debugLog('Création annonce - Prix catégorie:', categoryPrice);
    if (categoryPrice === null) {
      return res.status(400).json({ error: 'Tarif de publication introuvable pour cette catégorie' });
    }

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
    debugLog('Création annonce - Avant INSERT:', { id, userId: req.user.id });

    // Allow optional ad-related fields for sponsored listings
    const isSponsored = req.body?.is_sponsored === 'true' || req.body?.is_sponsored === true;
    const adPackType = req.body?.ad_pack_type || null;
    const adTargetCategory = req.body?.ad_target_category || null;

    await pool.query(
      `INSERT INTO announcements (id, user_id, category, type, title, description, price, location, latitude, longitude, phone, images, image_url, metadata, status, payment_status, is_sponsored, ad_pack_type, ad_target_category, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'active', 1, $15, $16, $17, CURRENT_TIMESTAMP)`,
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
        isSponsored,
        adPackType,
        adTargetCategory,
      ]
    );

    debugLog('Création annonce - Après INSERT');
    const result = await pool.query('SELECT * FROM announcements WHERE id = $1', [id]);
    debugLog('Création annonce - Résultat SELECT:', result.rows.length, result.rows[0]?.images);
    const savedAnnouncement = normalizeAnnouncement(result.rows[0]);

    res.status(201).json(savedAnnouncement);
  } catch (error) {
    console.error('Erreur création annonce:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Erreur création annonce',
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

// TRACK CLICKS / VIEWS
router.post('/:id/track-click', async (req, res) => {
  try {
    const id = req.params.id;
    const { action } = req.body;
    if (!action) return res.status(400).json({ error: 'Action requise' });

    const mapping = {
      view: 'views_count',
      click: 'clicks_count',
      whatsapp: 'whatsapp_clicks_count',
      call: 'call_clicks_count',
    };

    const column = mapping[action];
    if (!column) return res.status(400).json({ error: 'Action inconnue' });

    const updateSql = `UPDATE announcements SET ${column} = COALESCE(${column}, 0) + 1 WHERE id = $1 RETURNING id, views_count, clicks_count, whatsapp_clicks_count, call_clicks_count`;
    const result = await pool.query(updateSql, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Annonce non trouvée' });

    res.json({ announcement: result.rows[0] });
  } catch (error) {
    console.error('Erreur track-click:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ADVERTISER DASHBOARD
router.get('/advertiser/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const aggSql = `SELECT
      COUNT(*)::int as total_sponsored,
      COALESCE(SUM(views_count),0)::int as total_views,
      COALESCE(SUM(clicks_count),0)::int as total_clicks,
      COALESCE(SUM(whatsapp_clicks_count),0)::int as total_whatsapp_clicks,
      COALESCE(SUM(call_clicks_count),0)::int as total_call_clicks
      FROM announcements
      WHERE user_id = $1 AND is_sponsored = true`;

    const aggResult = await pool.query(aggSql, [userId]);
    const stats = aggResult.rows[0] || {
      total_sponsored: 0,
      total_views: 0,
      total_clicks: 0,
      total_whatsapp_clicks: 0,
      total_call_clicks: 0,
    };

    const listSql = `SELECT id, title, category, ad_pack_type, ad_target_category, views_count, clicks_count, whatsapp_clicks_count, call_clicks_count, created_at
      FROM announcements WHERE user_id = $1 AND is_sponsored = true ORDER BY created_at DESC`;
    const listResult = await pool.query(listSql, [userId]);

    res.json({ stats, listings: normalizeAnnouncements(listResult.rows) });
  } catch (error) {
    console.error('Erreur advertiser dashboard:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;