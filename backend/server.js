// filepath: backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { initDatabase } = require('./config/db');
const authRoutes = require('./routes/auth');
const announcementRoutes = require('./routes/announcements');
const paymentRoutes = require('./routes/payments');
const contactRoutes = require('./routes/contact');
const pricingRoutes = require('./routes/pricing');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// SÉCURITÉ
// ============================================

// Helmet - Headers de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
    },
  },
}));

// CORS - Mode développement local
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Rate Limiting - Limitation des requêtes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par fenêtre
  message: { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Rate Limiting plus strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 tentatives de connexion
  message: { error: 'Trop de tentatives. Veuillez réessayer plus tard.' },
});
app.use('/api/auth/login', authLimiter);

// ============================================
// MIDDLEWARE
// ============================================

// Parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques (images uploadées)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// ROUTES API
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/pricing', pricingRoutes);

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'LocaPlus API est en ligne',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// GESTION DES ERREURS
// ============================================

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Gestionnaire d'erreurs centralisé
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  
  // Erreur Multer (upload)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Fichier trop volumineux (max 5MB)' });
    }
    return res.status(400).json({ error: err.message });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Erreur serveur' 
      : err.message,
  });
});

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================

const startServer = async () => {
  try {
    // Initialiser la base de données
    await initDatabase();
    
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 LocaPlus API Server                                  ║
║                                                           ║
║   📡 Serveur démarré sur le port: ${PORT}                   ║
║   🌐 URL: http://localhost:${PORT}                          ║
║   📂 API: http://localhost:${PORT}/api                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Erreur lors du démarrage:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;