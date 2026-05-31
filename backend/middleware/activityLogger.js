// filepath: backend/middleware/activityLogger.js
// ============================================
// JOURNAL D'AUDIT & TRAFIC - Activity Logging Service
// ============================================

const { pool } = require('../config/db');
const crypto = require('crypto');

/**
 * Enregistre une activité dans le journal d'audit
 * @param {Object} options - Options d'enregistrement
 * @param {string} options.userId - ID de l'utilisateur (optionnel)
 * @param {string} options.actionType - Type d'action (Login, Logout, Create, Update, Delete, etc.)
 * @param {string} options.resourceType - Type de ressource (user, announcement, payment, etc.)
 * @param {string} options.resourceId - ID de la ressource (optionnel)
 * @param {Object} options.details - Détails supplémentaires en JSON (optionnel)
 * @param {string} options.status - Statut de l'action (success, failure, pending)
 * @param {Request} options.req - Objet requête Express (pour extraire IP et user-agent)
 */
const logActivity = async ({
  userId = null,
  actionType,
  resourceType = null,
  resourceId = null,
  details = {},
  status = 'success',
  req = null
}) => {
  try {
    const id = crypto.randomUUID();
    const ipAddress = req ? (req.headers['x-forwarded-for']?.split(',')[0].trim() ||
                 req.headers['x-real-ip'] ||
                 req.connection.remoteAddress ||
                 req.socket.remoteAddress) : null;
    const userAgent = req ? (req.get('user-agent') || null) : null;

    await pool.query(
      `INSERT INTO activity_logs (id, user_id, action_type, resource_type, resource_id, ip_address, user_agent, details, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
      [id, userId, actionType, resourceType, resourceId, ipAddress, userAgent, JSON.stringify(details), status]
    );

    if (process.env.NODE_ENV !== 'production') {
      console.log(`📝 [ACTIVITY] ${actionType} ${resourceType ? `(${resourceType})` : ''} by ${userId || 'anonymous'} - ${status}`);
    }
  } catch (error) {
    console.error('Erreur logActivity:', error);
  }
};

/**
 * Middleware pour logger automatiquement les activités
 */
const activityLogger = (options = {}) => {
  const {
    logSuccess = true,
    logFailure = true,
    skipPaths = [],
    skipMethods = ['GET', 'OPTIONS']
  } = options;

  return async (req, res, next) => {
    // Skip certain paths and methods
    if (skipPaths.includes(req.path) || skipMethods.includes(req.method)) {
      return next();
    }

    // Capturer le startTime pour calculer la durée
    const startTime = Date.now();

    // Capturer la réponse
    const originalSend = res.send;
    res.send = function(body) {
      const duration = Date.now() - startTime;
      const status = res.statusCode;

      // Déterminer si on doit logger
      const shouldLog = (status >= 200 && status < 300 && logSuccess) ||
                        ((status >= 400 || status >= 500) && logFailure);

      if (shouldLog) {
        let actionType = req.method;
        let resourceType = req.path.split('/')[2] || 'api';
        let resourceId = req.params.id || null;

        // Mapper les méthodes HTTP vers des types d'action plus descriptifs
        const actionMap = {
          'POST': 'Create',
          'PUT': 'Update',
          'PATCH': 'Update',
          'DELETE': 'Delete',
          'GET': 'View'
        };
        actionType = actionMap[req.method] || req.method;

        logActivity({
          userId: req.user?.id || null,
          actionType,
          resourceType,
          resourceId,
          details: {
            method: req.method,
            path: req.path,
            statusCode: status,
            duration: `${duration}ms`,
            requestBody: req.method !== 'GET' ? sanitizeBody(req.body) : undefined
          },
          status: status >= 200 && status < 400 ? 'success' : 'failure',
          req
        }).catch(() => {});
      }

      originalSend.apply(res, arguments);
    };

    next();
  };
};

/**
 * Nettoie le body de la requête pour le logging (enlève les données sensibles)
 */
const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  
  const sensitiveFields = ['password', 'token', 'creditCard', 'cvv', 'pin'];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
};

/**
 * Récupère les logs d'activité avec pagination et filtres
 */
const getActivityLogs = async ({
  page = 1,
  limit = 50,
  userId = null,
  actionType = null,
  resourceType = null,
  status = null,
  startDate = null,
  endDate = null,
  search = null
}) => {
  try {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (userId) {
      conditions.push(`user_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    if (actionType) {
      conditions.push(`action_type = $${paramIndex}`);
      params.push(actionType);
      paramIndex++;
    }

    if (resourceType) {
      conditions.push(`resource_type = $${paramIndex}`);
      params.push(resourceType);
      paramIndex++;
    }

    if (status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (startDate) {
      conditions.push(`created_at >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`created_at <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(action_type ILIKE $${paramIndex} OR resource_type ILIKE $${paramIndex} OR ip_address ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Requête principale
    const query = `
      SELECT 
        id,
        user_id,
        action_type,
        resource_type,
        resource_id,
        ip_address,
        user_agent,
        details,
        status,
        created_at
      FROM activity_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Compter le total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM activity_logs
      ${whereClause}
    `;
    const countParams = params.slice(0, paramIndex - 2);
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    return {
      logs: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Erreur getActivityLogs:', error);
    throw error;
  }
};

/**
 * Récupère les statistiques d'activité
 */
const getActivityStats = async (timeRange = '24h') => {
  try {
    let interval;
    switch (timeRange) {
      case '1h': interval = '1 hour'; break;
      case '24h': interval = '24 hours'; break;
      case '7d': interval = '7 days'; break;
      case '30d': interval = '30 days'; break;
      default: interval = '24 hours';
    }

    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_activities,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_actions,
        COUNT(CASE WHEN status = 'failure' THEN 1 END) as failed_actions,
        COUNT(CASE WHEN action_type = 'Create' THEN 1 END) as creations,
        COUNT(CASE WHEN action_type = 'Update' THEN 1 END) as updates,
        COUNT(CASE WHEN action_type = 'Delete' THEN 1 END) as deletions,
        COUNT(CASE WHEN action_type = 'Login' THEN 1 END) as logins,
        COUNT(CASE WHEN action_type = 'Logout' THEN 1 END) as logouts
      FROM activity_logs
      WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${interval}'
    `);

    // Activités par heure
    const hourlyActivity = await pool.query(`
      SELECT 
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(*) as count
      FROM activity_logs
      WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${interval}'
      GROUP BY DATE_TRUNC('hour', created_at)
      ORDER BY hour DESC
      LIMIT 24
    `);

    // Top actions
    const topActions = await pool.query(`
      SELECT 
        action_type,
        COUNT(*) as count
      FROM activity_logs
      WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${interval}'
      GROUP BY action_type
      ORDER BY count DESC
      LIMIT 10
    `);

    return {
      summary: stats.rows[0],
      hourlyActivity: hourlyActivity.rows,
      topActions: topActions.rows
    };
  } catch (error) {
    console.error('Erreur getActivityStats:', error);
    throw error;
  }
};

/**
 * Nettoie les anciens logs (à exécuter périodiquement)
 */
const cleanupOldLogs = async (daysToKeep = 90) => {
  try {
    const result = await pool.query(
      `DELETE FROM activity_logs WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '${daysToKeep} days'`
    );
    console.log(`🧹 [CLEANUP] ${result.rowCount} anciens logs supprimés`);
    return result.rowCount;
  } catch (error) {
    console.error('Erreur cleanupOldLogs:', error);
    throw error;
  }
};

module.exports = {
  logActivity,
  activityLogger,
  getActivityLogs,
  getActivityStats,
  cleanupOldLogs
};