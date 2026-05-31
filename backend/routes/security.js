// filepath: backend/routes/security.js
// ============================================
// ROUTES DE SÉCURITÉ - Security Command Center
// ============================================

const express = require('express');
const { pool } = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');

const router = express.Router();

// ============================================
// ALERTES DE SÉCURITÉ
// ============================================

// GET /api/security/alerts - Liste des alertes de sécurité
router.get('/alerts', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      threatType,
      severity,
      userId,
      ipAddress,
      startDate,
      endDate
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (threatType) {
      conditions.push(`threat_type = $${paramIndex}`);
      params.push(threatType);
      paramIndex++;
    }

    if (severity) {
      conditions.push(`severity = $${paramIndex}`);
      params.push(severity);
      paramIndex++;
    }

    if (userId) {
      conditions.push(`user_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    if (ipAddress) {
      conditions.push(`ip_address ILIKE $${paramIndex}`);
      params.push(`%${ipAddress}%`);
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

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(`
      SELECT 
        sa.id,
        sa.user_id,
        sa.ip_address,
        sa.user_agent,
        sa.request_method,
        sa.request_path,
        sa.threat_type,
        sa.threat_details,
        sa.severity,
        sa.action_taken,
        sa.created_at,
        u.email as user_email,
        u.name as user_name
      FROM security_alerts sa
      LEFT JOIN users u ON sa.user_id = u.id
      ${whereClause}
      ORDER BY sa.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, parseInt(limit), parseInt(offset)]);

    // Compter le total
    const countResult = await pool.query(`
      SELECT COUNT(*) as total FROM security_alerts ${whereClause}
    `, params.slice(0, paramIndex - 2));

    const total = parseInt(countResult.rows[0].total);

    // Logger l'activité
    logActivity({
      userId: req.user.id,
      actionType: 'View',
      resourceType: 'security_alerts',
      details: { page, limit, filters: req.query },
      req
    }).catch(() => {});

    res.json({
      alerts: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération alertes sécurité:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/security/alerts/stats - Statistiques des alertes
router.get('/alerts/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;

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
        COUNT(*) as total_alerts,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT ip_address) as unique_ips,
        COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_severity,
        COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium_severity,
        COUNT(CASE WHEN severity = 'low' THEN 1 END) as low_severity,
        COUNT(CASE WHEN threat_type = 'sql_injection' THEN 1 END) as sql_injections,
        COUNT(CASE WHEN threat_type = 'xss' THEN 1 END) as xss_attacks,
        COUNT(CASE WHEN threat_type = 'rate_limit_exceeded' THEN 1 END) as rate_limit_violations
      FROM security_alerts
      WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${interval}'
    `);

    // Alertes par heure
    const hourlyAlerts = await pool.query(`
      SELECT 
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(*) as count
      FROM security_alerts
      WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${interval}'
      GROUP BY DATE_TRUNC('hour', created_at)
      ORDER BY hour DESC
      LIMIT 24
    `);

    // Top IPs suspectes
    const topSuspiciousIps = await pool.query(`
      SELECT 
        ip_address,
        COUNT(*) as alert_count,
        COUNT(DISTINCT threat_type) as threat_types,
        MAX(created_at) as last_alert
      FROM security_alerts
      WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${interval}'
      GROUP BY ip_address
      ORDER BY alert_count DESC
      LIMIT 10
    `);

    res.json({
      summary: stats.rows[0],
      hourlyAlerts: hourlyAlerts.rows,
      topSuspiciousIps: topSuspiciousIps.rows
    });
  } catch (error) {
    console.error('Erreur statistiques alertes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// GESTION DES UTILISATEURS (Bannir/Flagger)
// ============================================

// PUT /api/security/users/:userId/status - Modifier le statut d'un utilisateur
router.put('/users/:userId/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;

    const allowedStatuses = ['active', 'flagged', 'banned'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    // Vérifier si l'utilisateur existe
    const userResult = await pool.query(
      'SELECT id, email, name, role, status FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = userResult.rows[0];

    // Empêcher la modification d'un admin par un non-admin
    if (user.role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Action non autorisée sur un administrateur' });
    }

    // Mettre à jour le statut
    const updateResult = await pool.query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, name, status',
      [status, userId]
    );

    // Logger l'alerte si bannissement
    if (status === 'banned' && reason) {
      const crypto = require('crypto');
      await pool.query(
        `INSERT INTO security_alerts (id, user_id, ip_address, threat_type, threat_details, severity, action_taken, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
        [
          crypto.randomUUID(),
          userId,
          req.headers['x-forwarded-for']?.split(',')[0] || req.ip,
          'admin_action',
          JSON.stringify({ reason, action: 'user_banned', adminId: req.user.id }),
          'high',
          'user_banned'
        ]
      );
    }

    // Logger l'activité
    logActivity({
      userId: req.user.id,
      actionType: 'Update',
      resourceType: 'user_status',
      resourceId: userId,
      details: { 
        previousStatus: user.status, 
        newStatus: status, 
        reason,
        targetUser: user.email 
      },
      req
    }).catch(() => {});

    res.json({
      message: `Utilisateur ${status === 'banned' ? 'banni' : status === 'flagged' ? 'signalé' : 'réactivé'}`,
      user: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Erreur modification statut utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/security/users/flagged - Liste des utilisateurs flaggés/bannis
router.get('/users/flagged', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status = 'flagged' } = req.query;

    const result = await pool.query(
      `SELECT id, email, name, role, status, last_ip, last_login_at, created_at 
       FROM users 
       WHERE status IN ('flagged', 'banned')
       ORDER BY updated_at DESC`,
      []
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Erreur récupération utilisateurs flaggés:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// JOURNAL D'AUDIT (Activity Logs)
// ============================================

// GET /api/security/audit-logs - Journal d'audit complet
router.get('/audit-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      actionType,
      resourceType,
      status,
      startDate,
      endDate,
      search
    } = req.query;

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

    const result = await pool.query(`
      SELECT 
        al.id,
        al.user_id,
        al.action_type,
        al.resource_type,
        al.resource_id,
        al.ip_address,
        al.user_agent,
        al.details,
        al.status,
        al.created_at,
        u.email as user_email,
        u.name as user_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, parseInt(limit), parseInt(offset)]);

    const countResult = await pool.query(`
      SELECT COUNT(*) as total FROM activity_logs ${whereClause}
    `, params.slice(0, paramIndex - 2));

    const total = parseInt(countResult.rows[0].total);

    res.json({
      logs: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération journal d\'audit:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/security/audit-logs/stats - Statistiques du journal d'audit
router.get('/audit-logs/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;

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
        COUNT(DISTINCT ip_address) as unique_ips,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_actions,
        COUNT(CASE WHEN status = 'failure' THEN 1 END) as failed_actions
      FROM activity_logs
      WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${interval}'
    `);

    // Activités par type
    const activitiesByType = await pool.query(`
      SELECT 
        action_type,
        COUNT(*) as count
      FROM activity_logs
      WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${interval}'
      GROUP BY action_type
      ORDER BY count DESC
    `);

    // Activités par ressource
    const activitiesByResource = await pool.query(`
      SELECT 
        resource_type,
        COUNT(*) as count
      FROM activity_logs
      WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${interval}'
      GROUP BY resource_type
      ORDER BY count DESC
      LIMIT 10
    `);

    res.json({
      summary: stats.rows[0],
      activitiesByType: activitiesByType.rows,
      activitiesByResource: activitiesByResource.rows
    });
  } catch (error) {
    console.error('Erreur statistiques audit:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;