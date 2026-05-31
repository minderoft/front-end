// filepath: backend/middleware/security.js
// ============================================
// SÉCURITÉ AVANCÉE - Middleware de protection
// ============================================

const { pool } = require('../config/db');

// ============================================
// PATTERNS DE DÉTECTION D'ATTAQUES
// ============================================

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|EXECUTE)\b.*\b(FROM|INTO|SET|TABLE|DATABASE|PROCEDURE)\b)/gi,
  /(\b(UNION)\b.*\b(SELECT)\b)/gi,
  /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/gi,
  /(\b(OR|AND)\b\s+['"]?\w+['"]?\s*=\s*['"]?\w+['"]?)/gi,
  /(;\s*(DROP|DELETE|INSERT|UPDATE|ALTER)\b)/gi,
  /(--\s*$)/gm,
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

// ============================================
// FONCTIONS DE SANITIZATION
// ============================================

/**
 * Nettoie une chaîne de caractères des injections SQL potentielles
 */
const sanitizeSQL = (input) => {
  if (typeof input !== 'string') return input;
  let sanitized = input;
  sanitized = sanitized.replace(/--.*$/gm, '');
  sanitized = sanitized.replace(/'/g, "''");
  sanitized = sanitized.replace(/;{2,}/g, ';');
  return sanitized.trim();
};

/**
 * Nettoie une chaîne des tentatives XSS
 */
const sanitizeXSS = (input) => {
  if (typeof input !== 'string') return input;
  let sanitized = input;
  sanitized = sanitized.replace(/&/g, '&');
  sanitized = sanitized.replace(/</g, '<');
  sanitized = sanitized.replace(/>/g, '>');
  sanitized = sanitized.replace(/"/g, '"');
  sanitized = sanitized.replace(/'/g, '&#x27;');
  sanitized = sanitized.replace(/\//g, '&#x2F;');
  return sanitized;
};

/**
 * Nettoie un objet récursivement
 */
const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return sanitizeXSS(sanitizeSQL(obj));
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  if (typeof obj === 'object' && obj !== null) {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[sanitizeXSS(sanitizeSQL(key))] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  return obj;
};

// ============================================
// DÉTECTION DE MENACES
// ============================================

/**
 * Détecte si une entrée contient des patterns malveillants
 */
const detectThreat = (input, type = 'all') => {
  if (typeof input !== 'string') return false;
  const patterns = [];
  if (type === 'all' || type === 'sql') {
    patterns.push(...SQL_INJECTION_PATTERNS);
  }
  if (type === 'all' || type === 'xss') {
    patterns.push(...XSS_PATTERNS);
  }
  if (type === 'all' || type === 'command') {
    patterns.push(...COMMAND_INJECTION_PATTERNS);
  }
  for (const pattern of patterns) {
    if (pattern.test(input)) {
      return {
        detected: true,
        threatType: pattern === SQL_INJECTION_PATTERNS ? 'sql_injection' : 
                    pattern === XSS_PATTERNS ? 'xss' : 'command_injection',
        pattern: pattern.toString(),
        input: input.substring(0, 100)
      };
    }
  }
  return false;
};

/**
 * Analyse récursivement un objet pour détecter des menaces
 */
const analyzeObjectForThreats = (obj, path = '') => {
  const threats = [];
  if (obj === null || obj === undefined) return threats;
  if (typeof obj === 'string') {
    const threat = detectThreat(obj);
    if (threat) {
      threats.push({ path: path || 'root', ...threat });
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      threats.push(...analyzeObjectForThreats(item, `${path}[${index}]`));
    });
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        threats.push(...analyzeObjectForThreats(obj[key], path ? `${path}.${key}` : key));
      }
    }
  }
  return threats;
};

// ============================================
// LOGGING DES ALERTES DE SÉCURITÉ
// ============================================

/**
 * Enregistre une alerte de sécurité dans la base de données
 */
const logSecurityAlert = async (req, threats, clientIp) => {
  try {
    const userId = req.user?.id || null;
    const userAgent = req.get('user-agent') || '';
    const referer = req.get('referer') || '';
    
    await pool.query(
      `INSERT INTO security_alerts (user_id, ip_address, user_agent, referer, request_method, request_path, threat_type, threat_details, severity, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
      [
        userId,
        clientIp,
        userAgent,
        referer,
        req.method,
        req.path,
        threats[0]?.threatType || 'unknown',
        JSON.stringify(threats),
        'high'
      ]
    );
    
    // Si un utilisateur est impliqué, le flagger après plusieurs alertes
    if (userId) {
      const alertCount = await pool.query(
        `SELECT COUNT(*) as count FROM security_alerts WHERE user_id = $1 AND created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'`,
        [userId]
      );
      
      if (parseInt(alertCount.rows[0].count) >= 5) {
        await pool.query(
          `UPDATE users SET status = 'flagged' WHERE id = $1 AND status != 'banned'`,
          [userId]
        );
        console.warn(`🚨 [AUTO-FLAG] User ${userId} flagged after ${alertCount.rows[0].count} security alerts in 1 hour`);
      }
    }
  } catch (error) {
    console.error('Erreur logSecurityAlert:', error);
  }
};

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Middleware de sanitization des entrées
 */
const inputSanitizer = (req, res, next) => {
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
    next();
  } catch (error) {
    console.error('Erreur inputSanitizer:', error);
    next();
  }
};

/**
 * Middleware de détection de menaces
 */
const threatDetector = (req, res, next) => {
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
      const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
                       req.headers['x-real-ip'] ||
                       req.connection.remoteAddress ||
                       req.socket.remoteAddress;
      
      console.warn('⚠️ [THREAT DETECTED]', {
        ip: clientIp,
        method: req.method,
        path: req.path,
        threats: threats,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
      });
      
      logSecurityAlert(req, threats, clientIp).catch(err => {
        console.error('Erreur logging security alert:', err);
      });
      
      return res.status(403).json({
        error: 'Requête bloquée pour raison de sécurité',
        code: 'THREAT_DETECTED',
        message: 'Votre requête a été identifiée comme potentiellement malveillante.'
      });
    }
    next();
  } catch (error) {
    console.error('Erreur threatDetector:', error);
    next();
  }
};

/**
 * Middleware de vérification du statut utilisateur
 */
const checkUserStatus = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return next();
  }
  try {
    const result = await pool.query(
      'SELECT status FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND'
      });
    }
    
    const user = result.rows[0];
    
    if (user.status === 'banned') {
      console.warn(`🚫 [BANNED USER] User ${req.user.id} tente d'accéder à ${req.method} ${req.path}`);
      return res.status(403).json({
        error: 'Compte suspendu',
        code: 'ACCOUNT_BANNED',
        message: 'Votre compte a été suspendu. Contactez l\'administrateur pour plus d\'informations.'
      });
    }
    
    if (user.status === 'flagged') {
      res.set('X-User-Status', 'flagged');
    }
    
    req.userStatus = user.status;
    next();
  } catch (error) {
    console.error('Erreur checkUserStatus:', error);
    next();
  }
};

/**
 * Middleware de rate limiting avancé
 */
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
    for (const [key, value] of store.entries()) {
      if (now - value.timestamp > windowMs && !value.blocked) {
        store.delete(key);
      } else if (value.blocked && now > value.blockedUntil) {
        store.delete(key);
      }
    }
  };
  
  setInterval(cleanup, 5 * 60 * 1000);
  
  return (req, res, next) => {
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
                     req.headers['x-real-ip'] ||
                     req.connection.remoteAddress ||
                     req.socket.remoteAddress;
    
    const key = `${clientIp}:${req.path}`;
    const now = Date.now();
    
    let record = store.get(key);
    
    if (!record || (now - record.timestamp > windowMs && !record.blocked)) {
      record = { count: 0, timestamp: now, blocked: false };
    }
    
    if (record.blocked) {
      if (now < record.blockedUntil) {
        const timeLeft = Math.ceil((record.blockedUntil - now) / 1000);
        return res.status(429).json({
          error: 'Trop de tentatives. IP temporairement bloquée.',
          code: 'IP_BLOCKED',
          retryAfter: timeLeft
        });
      } else {
        record = { count: 0, timestamp: now, blocked: false };
      }
    }
    
    record.count++;
    record.timestamp = now;
    
    if (record.count > max) {
      record.blocked = true;
      record.blockedUntil = now + blockDurationMs;
      
      // Logger le blocage
      logSecurityAlert(req, [{
        threatType: 'rate_limit_exceeded',
        path: 'rate_limiter',
        input: `IP: ${clientIp}, Requests: ${record.count}`
      }], clientIp).catch(() => {});
      
      return res.status(429).json({
        error: 'Trop de requêtes. IP temporairement bloquée.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(blockDurationMs / 1000)
      });
    }
    
    store.set(key, record);
    
    // Headers standards pour le rate limiting
    res.set('X-RateLimit-Limit', max);
    res.set('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.set('X-RateLimit-Reset', Math.ceil((record.timestamp + windowMs) / 1000));
    
    next();
  };
};

// Rate limiter strict pour l'authentification
const authRateLimiter = createAdvancedRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  blockDurationMs: 30 * 60 * 1000,
  message: 'Trop de tentatives de connexion. Veuillez réessayer plus tard.'
});

// Rate limiter pour les routes sensibles
const sensitiveRateLimiter = createAdvancedRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  blockDurationMs: 15 * 60 * 1000
});

// Rate limiter général
const generalRateLimiter = createAdvancedRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  blockDurationMs: 5 * 60 * 1000
});

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Fonctions de sanitization
  sanitizeSQL,
  sanitizeXSS,
  sanitizeObject,
  
  // Fonctions de détection
  detectThreat,
  analyzeObjectForThreats,
  
  // Middleware
  inputSanitizer,
  threatDetector,
  checkUserStatus,
  
  // Rate limiters
  createAdvancedRateLimiter,
  authRateLimiter,
  sensitiveRateLimiter,
  generalRateLimiter,
  
  // Logging
  logSecurityAlert
};