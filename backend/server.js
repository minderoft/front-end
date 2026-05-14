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
const reviewRoutes = require('./routes/reviews');
const reportRoutes = require('./routes/reports');
const favoriteRoutes = require('./routes/favorites');
const contactRoutes = require('./routes/contact');
const pricingRoutes = require('./routes/pricing');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 10000;

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

// ============================================
// CORS - Configuration sécurisée
// ============================================

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://loca-plus-hub.vercel.app';
const DEV_URL = 'http://localhost:5173';

const allowedOrigins = [
  FRONTEND_URL,
  'https://loca-plus-hub.vercel.app',
  'https://front-end-hazel-chi.vercel.app',
  'https://front-end-git-main-minderofts-projects.vercel.app', // Vercel backup project autorisé
  DEV_URL,
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

// Fonction pour vérifier les origins
const corsOptions = {
  origin: function (origin, callback) {
    // Accepter les requêtes sans origin (mobile apps, curl requests, certains navigateurs)
    if (!origin) {
      console.log('🔄 CORS: No origin header - allowing non-browser or mobile/curl request');
      return callback(null, true);
    }

    // Vérifier si l'origin est dans la liste blanche
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS: Origin ${origin} allowed`);
      return callback(null, true);
    }

    console.warn(`❌ CORS: Origin ${origin} not allowed. Allowed origins:`, allowedOrigins);
    return callback(new Error('CORS: Origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400,
  optionsSuccessStatus: 200,
};

// Appliquer CORS globalement
app.use(cors(corsOptions));

// Logger les requêtes preflight OPTIONS
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log(`🔄 OPTIONS request: ${req.method} ${req.path} from origin: ${req.get('origin')}`);
  }
  next();
});

// Gérer les requêtes preflight OPTIONS explicitement
app.options('*', cors(corsOptions));

// Fallback CORS headers pour les réponses
app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Autoriser les requêtes sans origine
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  next();
});

// Middleware optionnel pour logger les requêtes CORS en développement
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log(`  Origin: ${req.get('origin')}`);
    console.log(`  User-Agent: ${req.get('user-agent')}`);
    next();
  });
}

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

// Route racine pour les health checks Render
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'LocaPlus backend is running' });
});

// ============================================
// ROUTES API
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/chat', chatRoutes);

// Route de santé avec CORS debug info
app.get('/api/health', (req, res) => {
  const corsInfo = {
    status: 'OK',
    message: 'LocaPlus API is online',
    timestamp: new Date().toISOString(),
    cors: {
      requestOrigin: req.get('origin') || 'no origin',
      allowedOrigins: allowedOrigins,
      corsEnabled: true,
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      frontendUrl: FRONTEND_URL,
    },
  };

  // Ajouter les headers CORS à la réponse
  res.set('Access-Control-Allow-Origin', req.get('origin') || '*');
  res.set('Access-Control-Allow-Credentials', 'true');

  res.json(corsInfo);
});

// Route de diagnostic base de données
app.get('/api/health/db', async (req, res) => {
  try {
    console.log('🔍 [HEALTH] Diagnostic DB commencé...');
    
    // Test 1: Connexion PostgreSQL
    const connectionStart = Date.now();
    const pingResult = await pool.query('SELECT NOW() as current_time');
    const connectionElapsed = Date.now() - connectionStart;
    
    console.log(`✅ [HEALTH] Connexion PostgreSQL OK (${connectionElapsed}ms)`);
    
    // Test 2: Vérifier les tables
    const tablesStart = Date.now();
    const tablesResult = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    const tablesElapsed = Date.now() - tablesStart;
    const tables = tablesResult.rows.map(r => r.table_name);
    
    console.log(`✅ [HEALTH] Tables vérifiées (${tablesElapsed}ms):`, tables);
    
    // Test 3: Vérifier la table users
    let usersInfo = null;
    if (tables.includes('users')) {
      const usersStart = Date.now();
      const usersResult = await pool.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN accepted_policy = true THEN 1 END) as with_policy,
          COUNT(CASE WHEN accepted_policy = false THEN 1 END) as without_policy
        FROM users
      `);
      const usersElapsed = Date.now() - usersStart;
      usersInfo = {
        ...usersResult.rows[0],
        queryTime: `${usersElapsed}ms`
      };
      console.log(`✅ [HEALTH] Users table OK:`, usersInfo);
    }
    
    // Test 4: Vérifier les colonnes de users
    let usersColumns = null;
    if (tables.includes('users')) {
      const columnsStart = Date.now();
      const columnsResult = await pool.query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `);
      const columnsElapsed = Date.now() - columnsStart;
      usersColumns = columnsResult.rows;
      console.log(`✅ [HEALTH] Colonnes users (${columnsElapsed}ms):`, usersColumns.map(c => c.column_name));
    }
    
    // Response
    const response = {
      status: 'OK',
      database: {
        connected: true,
        connectionTime: `${connectionElapsed}ms`,
        postgresTime: pingResult.rows[0].current_time,
      },
      tables: {
        count: tables.length,
        list: tables,
      },
      users: {
        tableExists: tables.includes('users'),
        data: usersInfo,
        columns: usersColumns?.map(c => ({
          name: c.column_name,
          type: c.data_type,
          nullable: c.is_nullable,
          default: c.column_default
        }))
      },
      environment: {
        databaseUrl: process.env.DATABASE_URL ? '✅ SET' : '❌ NOT SET',
        nodeEnv: process.env.NODE_ENV || 'development',
      },
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  } catch (error) {
    console.error('❌ [HEALTH] DB Diagnostic Error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      severity: error.severity,
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================
// GESTION DES ERREURS
// ============================================

// Middleware de débogage pour les erreurs 404
app.use((req, res, next) => {
  // Ce middleware passe simplement, le gestionnaire 404 en dessous gérera
  next();
});

// 404 - Avec logs détaillés
app.use((req, res) => {
  const errorDetails = {
    error: 'Route non trouvée',
    method: req.method,
    path: req.path,
    fullUrl: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
    query: req.query,
    timestamp: new Date().toISOString(),
  };
  
  // Log l'erreur 404 pour débogage
  console.error('❌ [404] Route non trouvée:', errorDetails);
  
  res.status(404).json(errorDetails);
});

// Gestionnaire d'erreurs CORS spécifique
app.use((err, req, res, next) => {
  if (err && err.message && err.message.toLowerCase().includes('cors')) {
    console.error('Erreur CORS détectée:', err.message, 'Origin:', req.get('origin'));
    return res.status(403).json({
      error: 'CORS: Origin not allowed',
      origin: req.get('origin'),
    });
  }
  next(err);
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

let server;

const startServer = async () => {
  try {
    // Initialiser la base de données
    await initDatabase();
    
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 LocaPlus API Server                                  ║
║                                                           ║
║   📡 Serveur démarré sur le port: ${PORT}                   ║
║   🌐 Environment: ${process.env.NODE_ENV || 'development'}${' '.repeat(process.env.NODE_ENV ? '   ' : '     ')}║
║   📂 API: http://0.0.0.0:${PORT}/api                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

    // Gestion des erreurs du serveur
    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      switch (error.code) {
        case 'EACCES':
          console.error(`Le port ${PORT} nécessite des droits administrateur`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`Le port ${PORT} est déjà utilisé`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('\n⚠️  SIGTERM reçu. Arrêt du serveur en cours...');
      server.close(() => {
        console.log('✅ Serveur arrêté correctement');
        process.exit(0);
      });
      
      // Force exit après 10 secondes
      setTimeout(() => {
        console.error('❌ Arrêt forcé (timeout)');
        process.exit(1);
      }, 10000);
    });

    process.on('SIGINT', () => {
      console.log('\n⚠️  SIGINT reçu. Arrêt du serveur en cours...');
      server.close(() => {
        console.log('✅ Serveur arrêté correctement');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Erreur lors du démarrage:', error);
    process.exit(1);
  }
};

// Gérer les promesses non gérées
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  if (process.env.NODE_ENV === 'production') {
    // En production, logger et arrêter le serveur
    process.exit(1);
  }
});

startServer();

module.exports = app;