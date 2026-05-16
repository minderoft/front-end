// filepath: backend/middleware/ipTracking.js
// Middleware pour tracker l'IP et la dernière connexion (prêt pour double auth)

const { pool } = require('../config/db');

const ipTracking = async (req, res, next) => {
  try {
    if (req.user && req.user.id) {
      // Récupérer l'IP du client
      const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
                       req.headers['x-real-ip'] ||
                       req.connection.remoteAddress ||
                       req.socket.remoteAddress;

      // Mettre à jour last_ip et last_login_at
      await pool.query(
        'UPDATE users SET last_ip = $1, last_login_at = CURRENT_TIMESTAMP WHERE id = $2',
        [clientIp, req.user.id]
      );

      if (process.env.NODE_ENV !== 'production') {
        console.log(`[IP TRACKING] User ${req.user.id} from IP: ${clientIp}`);
      }
    }
  } catch (error) {
    console.error('Erreur IP tracking:', error.message);
    // Ne pas bloquer la requête si le tracking échoue
  }
  next();
};

module.exports = { ipTracking };
