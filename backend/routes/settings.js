// filepath: backend/routes/settings.js
// ============================================
// PARAMÈTRES DYNAMIQUES - Application Settings Routes
// ============================================

const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getSetting,
  setSetting,
  getPublicSettings,
  getSettingsByCategory,
  invalidateCache
} = require('../middleware/appSettings');
const { logActivity } = require('../middleware/activityLogger');

const router = express.Router();

// ============================================
// PARAMÈTRES PUBLICS (accessibles sans auth)
// ============================================

// GET /api/public/settings - Paramètres publics
router.get('/public/settings', async (req, res) => {
  try {
    const settings = await getPublicSettings();
    res.json({ settings });
  } catch (error) {
    console.error('Erreur récupération paramètres publics:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// PARAMÈTRES ADMIN (nécessite authentification admin)
// ============================================

// GET /api/settings - Tous les paramètres (admin seulement)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { category } = req.query;

    let settings;
    if (category) {
      settings = await getSettingsByCategory(category);
    } else {
      // Récupérer tous les paramètres depuis la DB
      const { pool } = require('../config/db');
      const result = await pool.query(
        'SELECT setting_key, setting_value, setting_type, category, description, is_public, updated_at FROM app_settings ORDER BY category, setting_key'
      );

      settings = {};
      for (const row of result.rows) {
        let value = row.setting_value;

        switch (row.setting_type) {
          case 'boolean':
            value = row.setting_value.toLowerCase() === 'true';
            break;
          case 'number':
            value = parseFloat(row.setting_value);
            break;
          case 'json':
            try {
              value = JSON.parse(row.setting_value);
            } catch (e) {
              value = row.setting_value;
            }
            break;
        }

        settings[row.setting_key] = {
          value,
          type: row.setting_type,
          category: row.category,
          description: row.description,
          isPublic: row.is_public,
          updatedAt: row.updated_at
        };
      }
    }

    res.json({ settings });
  } catch (error) {
    console.error('Erreur récupération paramètres:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/settings/:key - Mettre à jour un paramètre
router.put('/:key', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined || value === null) {
      return res.status(400).json({ error: 'Valeur requise' });
    }

    const success = await setSetting(key, value, req.user.id);

    if (!success) {
      return res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }

    // Logger l'activité
    logActivity({
      userId: req.user.id,
      actionType: 'Update',
      resourceType: 'app_setting',
      resourceId: key,
      details: { key, value },
      req
    }).catch(() => {});

    res.json({
      message: `Paramètre ${key} mis à jour`,
      key,
      value
    });
  } catch (error) {
    console.error('Erreur mise à jour paramètre:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/settings/bulk - Mettre à jour plusieurs paramètres
router.post('/bulk', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Paramètres requis' });
    }

    const results = [];
    for (const [key, value] of Object.entries(settings)) {
      const success = await setSetting(key, value, req.user.id);
      results.push({ key, success, value });
    }

    // Invalider le cache
    invalidateCache();

    // Logger l'activité
    logActivity({
      userId: req.user.id,
      actionType: 'Update',
      resourceType: 'app_settings_bulk',
      details: { count: Object.keys(settings).length, keys: Object.keys(settings) },
      req
    }).catch(() => {});

    res.json({
      message: `${results.filter(r => r.success).length}/${results.length} paramètres mis à jour`,
      results
    });
  } catch (error) {
    console.error('Erreur mise à jour en masse:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// PARAMÈTRES SPÉCIFIQUES
// ============================================

// GET /api/settings/maintenance - Statut du mode maintenance
router.get('/maintenance', async (req, res) => {
  try {
    const isMaintenance = await getSetting('isMaintenanceMode');
    res.json({ isMaintenanceMode: isMaintenance });
  } catch (error) {
    console.error('Erreur récupération mode maintenance:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/settings/maintenance - Activer/désactiver le mode maintenance
router.put('/maintenance', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { enabled, message } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    await setSetting('isMaintenanceMode', enabled, req.user.id);

    // Logger l'activité
    logActivity({
      userId: req.user.id,
      actionType: 'Update',
      resourceType: 'maintenance_mode',
      details: { enabled, message },
      req
    }).catch(() => {});

    res.json({
      message: `Mode maintenance ${enabled ? 'activé' : 'désactivé'}`,
      isMaintenanceMode: enabled
    });
  } catch (error) {
    console.error('Erreur mode maintenance:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/settings/pricing - Paramètres de pricing
router.get('/pricing', async (req, res) => {
  try {
    const { pool } = require('../config/db');
    const result = await pool.query(
      `SELECT setting_key, setting_value, setting_type FROM app_settings 
       WHERE category = 'pricing' OR setting_key LIKE '%price%' OR setting_key LIKE '%fcfa%'`
    );

    const pricing = {};
    for (const row of result.rows) {
      let value = row.setting_value;
      if (row.setting_type === 'number') {
        value = parseFloat(row.setting_value);
      }
      pricing[row.setting_key] = value;
    }

    res.json({ pricing });
  } catch (error) {
    console.error('Erreur récupération pricing:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/settings/pricing - Mettre à jour les paramètres de pricing
router.put('/pricing', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Paramètres requis' });
    }

    const results = [];
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === 'number' && value >= 0) {
        const success = await setSetting(key, value, req.user.id);
        results.push({ key, success, value });
      }
    }

    // Invalider le cache
    invalidateCache();

    // Logger l'activité
    logActivity({
      userId: req.user.id,
      actionType: 'Update',
      resourceType: 'pricing_settings',
      details: { count: results.length },
      req
    }).catch(() => {});

    res.json({
      message: `${results.filter(r => r.success).length}/${results.length} paramètres de pricing mis à jour`,
      results
    });
  } catch (error) {
    console.error('Erreur mise à jour pricing:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/settings/uploads - Paramètres d'upload
router.get('/uploads', async (req, res) => {
  try {
    const [maxImages, maxFileSizeMB] = await Promise.all([
      getSetting('maxImageUploads'),
      getSetting('maxFileSizeMB')
    ]);

    res.json({
      maxImages: maxImages || 5,
      maxFileSizeMB: maxFileSizeMB || 5,
      maxFileSizeBytes: (maxFileSizeMB || 5) * 1024 * 1024
    });
  } catch (error) {
    console.error('Erreur récupération paramètres upload:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;