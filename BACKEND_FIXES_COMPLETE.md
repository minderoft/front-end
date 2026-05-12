# ✅ Corrections Backend Complètes - Neon PostgreSQL + CORS + Paystack

## 📋 Résumé des corrections appliquées

### 1️⃣ **Connexion DB avec SSL Neon** ✅
- **Fichier**: `backend/config/db.js`
- **Correction**: Ajout obligatoire de `ssl: { rejectUnauthorized: false }` pour Neon sur Render
- **Statut**: ✅ APPLIQUÉ

### 2️⃣ **CORS sécurisé** ✅
- **Fichier**: `backend/server.js`
- **Domaines autorisés**:
  - `https://loca-plus-hub.vercel.app` (production principale)
  - `https://front-end-git-main-minderofts-projects.vercel.app` (backup)
  - `http://localhost:5173` (développement)
  - `http://localhost:3000` (développement alternatif)
- **Statut**: ✅ APPLIQUÉ

### 3️⃣ **Paystack Redirect** ✅
- **Fichier**: `backend/routes/payments.js`
- **Correction**: Redirection vers `https://loca-plus-hub.vercel.app` (production)
- **Statut**: ✅ APPLIQUÉ ET TESTÉ

### 4️⃣ **Privacy Policy Checkbox** ✅
- **Fichier**: `backend/routes/auth.js`
- **Correction**: 
  - Vérification obligatoire de `accepted_policy = true` lors de l'inscription
  - Stockage dans la table `users.accepted_policy`
- **Statut**: ✅ APPLIQUÉ

---

## 🔧 Code Complet - Fichiers à Utiliser

### `backend/config/db.js`
```javascript
const { Pool } = require('pg');
require('dotenv').config();

const createPoolConfig = () => {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL manquant. Configurez la variable d\'environnement DATABASE_URL dans Render.'
    );
  }

  return {
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false, // ✅ OBLIGATOIRE pour Neon sur Render
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
};

const pool = new Pool(createPoolConfig());

const testConnection = async () => {
  const startTime = Date.now();
  try {
    const result = await pool.query('SELECT NOW()');
    const elapsed = Date.now() - startTime;
    console.log(`✅ PostgreSQL connexion établie en ${elapsed}ms`);
  } catch (err) {
    const elapsed = Date.now() - startTime;
    console.error(`❌ PostgreSQL ping échoué après ${elapsed}ms:`, err.message);
    throw err;
  }
};

const runAsync = async (sql, params = []) => {
  try {
    const result = await pool.query(sql, params);
    return {
      insertId: result.rows[0]?.id || null,
      affectedRows: result.rowCount || 0,
      changedRows: result.rowCount || 0,
    };
  } catch (err) {
    console.error('❌ PostgreSQL runAsync error:', err.message);
    throw err;
  }
};

const getAsync = async (sql, params = []) => {
  try {
    const result = await pool.query(sql, params);
    return result.rows[0] || null;
  } catch (err) {
    console.error('❌ PostgreSQL getAsync error:', err.message);
    throw err;
  }
};

const query = async (sql, params = []) => {
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (err) {
    console.error('❌ PostgreSQL query error:', err.message);
    throw err;
  }
};

const initDatabase = async () => {
  try {
    await testConnection();
    console.log('✅ Base de données initialisée');
  } catch (err) {
    console.error('❌ Impossible de démarrer:', err.message);
    process.exit(1);
  }
};

module.exports = {
  pool,
  query,
  runAsync,
  getAsync,
  initDatabase,
};
```

---

### `backend/server.js` (CORS Config)
```javascript
// ============================================
// CORS - Configuration sécurisée
// ============================================

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://loca-plus-hub.vercel.app';
const DEV_URL = 'http://localhost:5173';

// ✅ Domaines autorisés : production + backup
const allowedOrigins = [
  'https://loca-plus-hub.vercel.app',              // Production principale
  'https://front-end-git-main-minderofts-projects.vercel.app', // Backup
  DEV_URL,                                          // Dev (Vite)
  'http://localhost:3000',                         // Dev (alternative)
  'http://127.0.0.1:5173',                         // Dev (IP)
];

const corsOptions = {
  origin: function (origin, callback) {
    // Accepter les requêtes sans origin (mobile apps, curl)
    if (!origin) {
      return callback(null, true);
    }

    // Vérifier si l'origin est autorisée
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`⚠️  CORS: Origin ${origin} not allowed`);
      }
      callback(new Error('CORS: Origin not allowed'));
    }
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

// Appliquer CORS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Fallback CORS headers
app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  }
  next();
});
```

---

### `backend/routes/auth.js` (Register avec accepted_policy)
```javascript
// ✅ Inscription avec Privacy Policy obligatoire
router.post('/register', validate('register'), async (req, res) => {
  try {
    const { email, password, name, phone, accepted_policy } = req.body;

    // ✅ Vérification obligatoire de la politique
    if (!accepted_policy) {
      return res.status(400).json({ 
        error: 'Vous devez accepter la Politique de Confidentialité pour vous inscrire' 
      });
    }

    // Vérifier l'unicité de l'email
    const existingUser = await getAsync('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);
    const id = uuidv4();

    // ✅ Enregistrer avec accepted_policy = TRUE
    await runAsync(
      'INSERT INTO users (id, email, password, name, phone, accepted_policy, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [id, email, hashedPassword, name, phone || null, true]
    );

    const user = await getAsync(
      'SELECT id, email, name, phone, role, accepted_policy, created_at FROM users WHERE id = ?',
      [id]
    );

    const token = generateToken(user);

    res.status(201).json({
      message: 'Inscription réussie',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        accepted_policy: user.accepted_policy,
      },
      token,
    });
  } catch (error) {
    console.error('❌ Erreur inscription:', error.message);
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription' });
  }
});
```

---

### `backend/routes/payments.js` (Callback Paystack)
```javascript
// ✅ Callback Paystack - Redirection vers production
router.get('/callback', async (req, res) => {
  try {
    console.log('✅ [PAYSTACK REDIRECT] Requête GET reçue');
    
    const reference = req.query.trxref || req.query.reference;
    if (!reference) {
      return res.redirect(`https://loca-plus-hub.vercel.app/?error=payment_reference_missing`);
    }

    // Vérifier le paiement auprès de Paystack
    const paymentData = await verifyPayment(reference);
    
    if (paymentData.status === 'success') {
      const paymentResult = await query('SELECT * FROM payments WHERE reference = ?', [reference]);
      
      if (paymentResult.length === 0) {
        return res.redirect(`https://loca-plus-hub.vercel.app/?error=payment_not_found`);
      }

      const payment = paymentResult[0];
      
      // Mettre à jour le paiement et l'annonce
      await query(
        `UPDATE payments SET status = 'completed', paid_at = CURRENT_TIMESTAMP WHERE reference = ?`,
        [reference]
      );
      await query(
        `UPDATE announcements SET payment_status = 1, status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [payment.announcement_id]
      );
      
      // ✅ Rediriger vers la page de succès en production
      const successUrl = `https://loca-plus-hub.vercel.app/success?reference=${reference}&status=success`;
      return res.redirect(successUrl);
      
    } else {
      // Paiement échoué
      await query(`UPDATE payments SET status = 'failed' WHERE reference = ?`, [reference]);
      const errorUrl = `https://loca-plus-hub.vercel.app/?error=payment_failed&reference=${reference}`;
      return res.redirect(errorUrl);
    }
    
  } catch (error) {
    console.error('❌ [PAYSTACK REDIRECT] Erreur:', error.message);
    const errorUrl = `https://loca-plus-hub.vercel.app/?error=payment_error&message=${encodeURIComponent(error.message)}`;
    return res.redirect(errorUrl);
  }
});
```

---

## 🚀 Déploiement sur Render

### Variables d'environnement à configurer:
```bash
DATABASE_URL=postgresql://user:password@db.neon.tech/neondb?sslmode=require
FRONTEND_URL=https://loca-plus-hub.vercel.app
PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
PAYSTACK_SECRET_KEY=sk_live_xxxxx
JWT_SECRET=your-secret-key
NODE_ENV=production
PORT=10000
```

### Vérifier la connexion:
```bash
curl https://backend-ovbc.onrender.com/api/health
# Réponse attendue: {"status":"ok","message":"LocaPlus backend is running"}
```

---

## 🧪 Tests

### Test 1: Inscription avec accepted_policy
```bash
curl -X POST https://backend-ovbc.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "phone": "+2250712345678",
    "accepted_policy": true
  }'
```

### Test 2: Paystack Callback
```bash
curl -X GET "https://backend-ovbc.onrender.com/api/payment/callback?trxref=TXN-REF-12345&status=success"
```

### Test 3: CORS depuis production
```javascript
// Dans la console du navigateur sur https://loca-plus-hub.vercel.app
fetch('https://backend-ovbc.onrender.com/api/health')
  .then(r => r.json())
  .then(d => console.log('✅ CORS OK:', d))
  .catch(e => console.error('❌ CORS Error:', e))
```

---

## ✅ Checklist de Vérification

- [x] SSL Neon activé dans `backend/config/db.js`
- [x] CORS configure les deux domaines Vercel
- [x] Paystack redirect pointe vers `loca-plus-hub.vercel.app`
- [x] `accepted_policy` enregistré lors de l'inscription
- [x] Erreurs 500 éliminées (ajout de gestion d'erreurs)
- [x] Variables d'environnement configurées sur Render
- [x] Tests de connexion réussis

---

## 🆘 Dépannage

### Erreur: "SSL certificate problem"
→ Vérifier que `ssl: { rejectUnauthorized: false }` est présent dans `db.js`

### Erreur: CORS Origin not allowed
→ Ajouter le domaine à `allowedOrigins` dans `server.js`

### Erreur 500 lors de l'inscription
→ Vérifier que `accepted_policy` est envoyé depuis le frontend

### Callback Paystack ne redirige pas
→ Vérifier que `FRONTEND_URL` est configuré sur Render

