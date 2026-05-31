// filepath: backend/middleware/appSettings.js
// ============================================
// PARAMÈTRES DYNAMIQUES - Application Settings Service
// ============================================

const { pool } = require('../config/db');
const crypto = require('crypto');

// Cache en mémoire pour les paramètres (avec expiration)
const settingsCache = new Map();
const CACHE_TTL = 60000; // 1 minute de cache

/**
 * Récupère un paramètre spécifique
 */
const getSetting = async (key, useCache = true) => {
  try {
    // Vérifier le cache
    if (useCache) {
      const cached = settingsCache.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.value;
      }
    }

    const result = await pool.query(
      'SELECT setting_value, setting_type FROM app_settings WHERE setting_key = $1',
      [key]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const { setting_value, setting_type } = result.rows[0];
    let value = setting_value;

    // Convertir selon le type
    switch (setting_type) {
      case 'boolean':
        value = setting_value.toLowerCase() === 'true';
        break;
      case 'number':
        value = parseFloat(setting_value);
        break;
      case 'json':
        try {
          value = JSON.parse(setting_value);
        } catch (e) {
          value = setting_value;
        }
        break;
      default:
        value = setting_value;
    }

    // Mettre en cache
    settingsCache.set(key, {
      value,
      timestamp: Date.now()
    });

    return value;
  } catch (error) {
    console.error('Erreur getSetting:', error);
    return null;
  }
};

/**
 * Met à jour un paramètre
 */
const setSetting = async (key, value, updatedBy = null) => {
  try {
    let settingValue = value;
    let settingType = 'string';

    // Déterminer le type
    if (typeof value === 'boolean') {
      settingValue = value.toString();
      settingType = 'boolean';
    } else if (typeof value === 'number') {
      settingValue = value.toString();
      settingType = 'number';
    } else if (typeof value === 'object') {
      settingValue = JSON.stringify(value);
      settingType = 'json';
    }

    // Vérifier si le paramètre existe
    const existing = await pool.query(
      'SELECT id, setting_type FROM app_settings WHERE setting_key = $1',
      [key]
    );

    if (existing.rows.length > 0) {
      // Utiliser le type existant si non spécifié
      if (settingType === 'string') {
        settingType = existing.rows[0].setting_type;
      }

      await pool.query(
        `UPDATE app_settings 
         SET setting_value = $1, setting_type = $2, updated_at = CURRENT_TIMESTAMP, updated_by = $3 
         WHERE setting_key = $4`,
        [settingValue, settingType, updatedBy, key]
      );
    } else {
      const id = crypto.randomUUID();
      await pool.query(
        `INSERT INTO app_settings (id, setting_key, setting_value, setting_type, category, description, updated_by, updated_at)
         VALUES ($1, $2, $3, $4, 'general', '', $5, CURRENT_TIMESTAMP)`,
        [id, key, settingValue, settingType, updatedBy]
      );
    }

    // Invalider le cache
    settingsCache.delete(key);

    return true;
  } catch (error) {
    console.error('Erreur setSetting:', error);
    return false;
  }
};

/**
 * Récupère tous les paramètres publics
 */
const getPublicSettings = async () => {
  try {
    const result = await pool.query(
      'SELECT setting_key, setting_value, setting_type FROM app_settings WHERE is_public = TRUE'
    );

    const settings = {};
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

      settings[row.setting_key] = value;
    }

    return settings;
  } catch (error) {
    console.error('Erreur getPublicSettings:', error);
    return {};
  }
};

/**
 * Récupère tous les paramètres d'une catégorie
 */
const getSettingsByCategory = async (category) => {
  try {
    const result = await pool.query(
      'SELECT setting_key, setting_value, setting_type, description FROM app_settings WHERE category = $1',
      [category]
    );

    const settings = {};
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
        description: row.description
      };
    }

    return settings;
  } catch (error) {
    console.error('Erreur getSettingsByCategory:', error);
    return {};
  }
};

/**
 * Middleware pour exposer les paramètres publics au frontend
 */
const exposePublicSettings = async (req, res, next) => {
  try {
    const publicSettings = await getPublicSettings();
    req.appSettings = publicSettings;
    
    // Rendre les paramètres accessibles dans la réponse
    res.locals.publicSettings = publicSettings;
    
    next();
  } catch (error) {
    console.error('Erreur exposePublicSettings:', error);
    next();
  }
};

/**
 * Middleware pour vérifier le mode maintenance
 */
const checkMaintenanceMode = async (req, res, next) => {
  try {
    // Toujours permettre aux admins d'accéder
    if (req.user?.role === 'admin') {
      return next();
    }

    // Vérifier les routes d'exception
    const exemptRoutes = ['/api/auth/login', '/api/auth/register', '/api/health', '/api/public/settings'];
    if (exemptRoutes.includes(req.path)) {
      return next();
    }

    const isMaintenance = await getSetting('isMaintenanceMode');
    
    if (isMaintenance) {
      return res.status(503).json({
        error: 'Application en maintenance',
        code: 'MAINTENANCE_MODE',
        message: 'L\'application est actuellement en maintenance. Veuillez réessayer plus tard.',
        retryAfter: 300 // 5 minutes
      });
    }

    next();
  } catch (error) {
    console.error('Erreur checkMaintenanceMode:', error);
    next();
  }
};

/**
 * Récupère les paramètres de pricing
 */
const getPricingSettings = async () => {
  try {
    const [basePrice, sponsorDayPrice, boostHourPrice] = await Promise.all([
      getSetting('adBasePriceFCFA'),
      getSetting('adSponsorDayPriceFCFA'),
      getSetting('adBoostHourPriceFCFA')
    ]);

    return {
      basePriceFCFA: basePrice || 1000,
      sponsorDayPriceFCFA: sponsorDayPrice || 500,
      boostHourPriceFCFA: boostHourPrice || 100
    };
  } catch (error) {
    console.error('Erreur getPricingSettings:', error);
    return {
      basePriceFCFA: 1000,
      sponsorDayPriceFCFA: 500,
      boostHourPriceFCFA: 100
    };
  }
};

/**
 * Récupère les paramètres d'upload
 */
const getUploadSettings = async () => {
  try {
    const [maxImages, maxFileSizeMB] = await Promise.all([
      getSetting('maxImageUploads'),
      getSetting('maxFileSizeMB')
    ]);

    return {
      maxImages: maxImages || 5,
      maxFileSizeMB: maxFileSizeMB || 5,
      maxFileSizeBytes: (maxFileSizeMB || 5) * 1024 * 1024
    };
  } catch (error) {
    console.error('Erreur getUploadSettings:', error);
    return {
      maxImages: 5,
      maxFileSizeMB: 5,
      maxFileSizeBytes: 5 * 1024 * 1024
    };
  }
};

/**
 * Invalide tout le cache (à utiliser après des mises à jour en masse)
 */
const invalidateCache = () => {
  settingsCache.clear();
};

module.exports = {
  getSetting,
  setSetting,
  getPublicSettings,
  getSettingsByCategory,
  exposePublicSettings,
  checkMaintenanceMode,
  getPricingSettings,
  getUploadSettings,
  invalidateCache
};