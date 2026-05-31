const { pool } = require('../config/db');
const crypto = require('crypto');

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|EXECUTE)\b.*\b(FROM|INTO|SET|TABLE|DATABASE|PROCEDURE)\b)/gi,
  /(\b(UNION)\b.*\b(SELECT)\b)/gi,
  /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/gi,
  /(\b(OR|AND)\b\s+['"]?\w+['"]?\s*=\s*['"]?\w+['"]?)/gi,
  /(;\s*(DROP|DELETE|INSERT|UPDATE|ALTER)\b)/gi,
  /(\-\-\s*$)/gm,
  /(\b(WAITFOR|BENCHMARK|SLEEP)\b)/gi,
  /(\b(LOAD_FILE|OUTFILE|INFILE)\b)/gi,
];

const XSS_PATTERNS = [
  /<script\b[^>]*>[\s\S]*?<\/script>/gi,
  /<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,
  /<object\b[^>]*>[\s\S]*?<\/object>/gi,
  /<embed\b[^>]*>[\s\S]*?<\/embed>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=/gi,
  /<img\b[^>]*\bonerror\b[^>]*>/gi,
  /<svg\b[^>]*\bonload\b[^>]*>/gi,
  /expression\s*\(/gi,
  /vbscript\s*:/gi,
];

const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$(){}]/,
  /\.\.\//,
  /%2e%2e%2f/gi,
  /\.\.%2f/gi,
  /%2e\.\//gi,
];

const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    'unknown';
};

const sanitizeSQL = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/--.*$/gm, '')
    .replace(/'/g, "''")
    .replace(/;{2,}/g, ';')
    .trim();
};

const sanitizeXSS = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

const sanitizeObject = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    return sanitizeXSS(sanitizeSQL(value));
  }
  if (Array.isArray(value)) {
    return value.map(item => sanitizeObject(item));
  }
  if (typeof value === 'object') {
    const cleaned = {};
    for (const key of Object.keys(value)) {
      const safeKey = sanitizeXSS(sanitizeSQL(key));
      cleaned[safeKey] = sanitizeObject(value[key]);
    }
    return cleaned;
  }
  return value;
};

const detectThreat = (input) => {
  if (typeof input !== 'string') return false;
  const normalized = input.trim();
  const patterns = [
    ...SQL_INJECTION_PATTERNS.map(pattern => ({ pattern, type: 'sql_injection' })),
    ...XSS_PATTERNS.map(pattern => ({ pattern, type: 'xss' })),
    ...COMMAND_INJECTION_PATTERNS.map(pattern => ({ pattern, type: 'command_injection' })),
  ];

  for (const candidate of patterns) {
    if (candidate.pattern.test(normalized)) {
      return {
        detected: true,
        threatType: candidate.type,
        pattern: candidate.pattern.toString(),
        input: normalized.slice(0, 120),
      };
    }
  }

  return false;
};

const analyzeObjectForThreats = (value, path = '') => {
  const threats = [];

  if (value === null || value === undefined) {
    return threats;
  }

  if (typeof value === 'string') {
    const threat = detectThreat(value);
    if (threat) {
      threats.push({ path: path || 'root', ...threat });
    }
    return threats;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      threats.push(...analyzeObjectForThreats(item, `${path}[${index}]`));
    });
    return threats;
  }

  if (typeof value === 'object') {
    for (const key of Object.keys(value)) {
      const childPath = path ? `${path}.${key}` : key;
      threats.push(...analyzeObjectForThreats(value[key], childPath));
    }
    return threats;
  }

  return threats;
};

const logSecurityAlert = async (req, threats, clientIp) => {
  try {
    const alertId = crypto.randomUUID();
    const userId = req.user?.id || null;
    const userAgent = req.get('user-agent') || null;
    const referer = req.get('referer') || null;
    const requestPath = req.path;
    const requestMethod = req.method;
    const threatType = threats[0]?.threatType || 'unknown';
    const threatDetails = JSON.stringify(threats);
    const actionTaken = 'blocked';
    const severity = 'high';

    await pool.query(
      `INSERT INTO security_alerts (id, user_id, ip_address, user_agent, referer, request_method, request_path, threat_type, threat_details, severity, action_taken, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)`,
      [alertId, userId, clientIp, userAgent, referer, requestMethod, requestPath, threatType, threatDetails, severity, actionTaken]
    );

    if (userId) {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM security_alerts WHERE user_id = $1 AND created_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour'`,
        [userId]
      );
      const alertCount = parseInt(result.rows[0]?.count || '0', 10);
      if (alertCount >= 5) {
        await pool.query(
          `UPDATE users SET status = 'flagged' WHERE id = $1 AND status != 'banned'`,
          [userId]
        );
      }
    }
  } catch (error) {
    console.error('Erreur logSecurityAlert:', error);
  }
};

const inputGuard = (req, res, next) => {
  if (req.is('multipart/form-data')) {
    return next();
  }

  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }
  } catch (error) {
    console.error('Erreur inputGuard:', error);
  }

  next();
};

const threatGuard = async (req, res, next) => {
  if (req.is('multipart/form-data')) {
    return next();
  }

  try {
    const threats = [];
    if (req.body && typeof req.body === 'object') {
      threats.push(...analyzeObjectForThreats(req.body, 'body'));
    }
    if (req.query && typeof req.query === 'object') {
      threats.push(...analyzeObjectForThreats(req.query, 'query'));
    }

    if (threats.length > 0) {
      const clientIp = getClientIp(req);
      console.warn('⚠️ [THREAT DETECTED]', { ip: clientIp, path: req.path, threats });
      await logSecurityAlert(req, threats, clientIp);
      return res.status(403).json({
        error: 'Requête bloquée pour raison de sécurité',
        code: 'THREAT_DETECTED',
        threats,
      });
    }

    next();
  } catch (error) {
    console.error('Erreur threatGuard:', error);
    next();
  }
};

const checkUserStatus = async (req, res, next) => {
  if (!req.user?.id) {
    return next();
  }

  try {
    const result = await pool.query('SELECT status FROM users WHERE id = $1', [req.user.id]);
    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Utilisateur non trouvé', code: 'USER_NOT_FOUND' });
    }

    const status = result.rows[0].status;
    req.userStatus = status;

    if (status === 'banned') {
      return res.status(403).json({
        error: 'Compte suspendu',
        code: 'ACCOUNT_BANNED',
        message: 'Votre compte a été suspendu. Contactez un administrateur.'
      });
    }

    if (status === 'flagged') {
      res.set('X-User-Status', 'flagged');
    }

    next();
  } catch (error) {
    console.error('Erreur checkUserStatus:', error);
    next();
  }
};

const createAdvancedRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    blockDurationMs = 30 * 60 * 1000,
    message = 'Trop de requêtes. Veuillez réessayer plus tard.',
  } = options;

  const store = new Map();

  const cleanup = () => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if ((!record.blocked && now - record.timestamp > windowMs) || (record.blocked && now > record.blockedUntil)) {
        store.delete(key);
      }
    }
  };
  setInterval(cleanup, 5 * 60 * 1000);

  return async (req, res, next) => {
    const clientIp = getClientIp(req);
    const key = `${clientIp}:${req.path}`;
    const now = Date.now();

    let record = store.get(key);
    if (!record || (now - record.timestamp > windowMs && !record.blocked)) {
      record = { count: 0, timestamp: now, blocked: false };
    }

    if (record.blocked && now < record.blockedUntil) {
      const retryAfter = Math.ceil((record.blockedUntil - now) / 1000);
      return res.status(429).json({
        error: 'Trop de tentatives. IP temporairement bloquée.',
        code: 'IP_BLOCKED',
        retryAfter,
      });
    }

    record.count += 1;
    record.timestamp = now;

    if (record.count > max) {
      record.blocked = true;
      record.blockedUntil = now + blockDurationMs;
      store.set(key, record);

      await logSecurityAlert(req, [{
        threatType: 'rate_limit_exceeded',
        pattern: 'rate_limit',
        input: `IP ${clientIp} exceeded ${max} requests in window`,
      }], clientIp).catch(() => {});

      return res.status(429).json({
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(blockDurationMs / 1000),
      });
    }

    store.set(key, record);
    res.set('X-RateLimit-Limit', max);
    res.set('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.set('X-RateLimit-Reset', Math.ceil((record.timestamp + windowMs) / 1000));

    next();
  };
};

const authRateLimiter = createAdvancedRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
  blockDurationMs: 30 * 60 * 1000,
  message: 'Trop de tentatives de connexion. Veuillez réessayer plus tard.',
});

const generalRateLimiter = createAdvancedRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  blockDurationMs: 5 * 60 * 1000,
});

const sensitiveRateLimiter = createAdvancedRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  blockDurationMs: 15 * 60 * 1000,
});

module.exports = {
  inputSanitizer,
  threatDetector: threatGuard,
  checkUserStatus,
  authRateLimiter,
  sensitiveRateLimiter,
  generalRateLimiter,
  logSecurityAlert,
  sanitizeObject,
  sanitizeSQL,
  sanitizeXSS,
};