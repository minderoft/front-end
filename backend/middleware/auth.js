// filepath: backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET;

// Générer un token JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Vérifier le token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token d\'accès requis' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Récupérer l'utilisateur depuis la base de données
    const result = await query('SELECT id, email, name, phone, role FROM users WHERE id = ?', [decoded.id]);
    
    if (result.length === 0) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    req.user = result[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré' });
    }
    return res.status(403).json({ error: 'Token invalide' });
  }
};

// Vérifier si l'utilisateur est admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé. Réservé aux administrateurs.' });
  }
  next();
};

// Vérifier si l'utilisateur est propriétaire de la ressource
const requireOwner = (resourceUserId) => {
  return (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.id !== resourceUserId) {
      return res.status(403).json({ error: 'Accès refusé. Vous n\'êtes pas propriétaire de cette ressource.' });
    }
    next();
  };
};

module.exports = {
  JWT_SECRET,
  generateToken,
  authenticateToken,
  requireAdmin,
  requireOwner,
};