// filepath: backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { logActivity } = require('../middleware/activityLogger');

const router = express.Router();

// Inscription
router.post('/register', validate('register'), async (req, res) => {
  try {
    const { email, password, name, phone, accepted_policy } = req.body;

    // ✅ Vérifier que l'utilisateur accepte la politique de confidentialité
    if (!accepted_policy) {
      return res.status(400).json({ 
        error: 'Vous devez accepter la Politique de Confidentialité pour vous inscrire' 
      });
    }

    // Vérifier si l'utilisateur existe déjà
    try {
      const existingUserResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUserResult.rowCount > 0) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' });
      }
    } catch (dbError) {
      console.error('❌ [REGISTER] Erreur vérification email:', dbError.message);
      throw dbError;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);
    const id = uuidv4();

    // ✅ Enregistrer avec accepted_policy = TRUE
    try {
      await pool.query(
        'INSERT INTO users (id, email, password, name, phone, accepted_policy, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [id, email, hashedPassword, name, phone || null, true]
      );
    } catch (dbError) {
      console.error('❌ [REGISTER] Erreur insertion user:', dbError.message);
      throw dbError;
    }

    // Récupérer l'utilisateur créé
    let user;
    try {
      const userResult = await pool.query(
        'SELECT id, email, name, phone, role, accepted_policy, created_at FROM users WHERE id = $1',
        [id]
      );
      user = userResult.rows[0];
    } catch (dbError) {
      console.error('❌ [REGISTER] Erreur récupération user:', dbError.message);
      throw dbError;
    }

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
    console.error('❌ [REGISTER] Erreur inscription:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      table: error.table,
      column: error.column,
    });
    res.status(500).json({ 
      error: 'Erreur serveur lors de l\'inscription',
      message: error.message 
    });
  }
});

// Connexion
router.post('/login', validate('login'), async (req, res) => {
  const startTime = Date.now();
  try {
    const { email, password } = req.body;
    console.log(`\n🔐 [LOGIN] Tentative de connexion pour: ${email}`);
    console.log(`📊 [LOGIN] Timestamp: ${new Date().toISOString()}`);

    // Rechercher l'utilisateur dans la table users avec syntaxe PostgreSQL ($1)
    console.log(`🔍 [LOGIN] Recherche utilisateur dans table 'users'...`);
    const dbStartTime = Date.now();
    
    let user;
    try {
      const queryText = 'SELECT id, email, password, name, phone, role, accepted_policy FROM users WHERE email = $1';
      console.log(`📝 [LOGIN] Exécution query:`, queryText, `avec email: ${email}`);
      
      const result = await pool.query(queryText, [email]);
      user = result.rows[0] || null;
      
      const dbElapsed = Date.now() - dbStartTime;
      console.log(`✅ [LOGIN] Requête DB complétée en ${dbElapsed}ms, résultats: ${result.rowCount} ligne(s)`);
    } catch (dbError) {
      console.error('❌ [LOGIN] ERREUR SQL DÉTAILÉE:', {
        message: dbError.message,
        code: dbError.code,
        severity: dbError.severity,
        detail: dbError.detail,
        hint: dbError.hint,
        column: dbError.column,
        table: dbError.table,
        schema: dbError.schema,
        position: dbError.position,
        routine: dbError.routine,
        stack: dbError.stack?.split('\n')[0],
      });
      throw dbError;
    }

    if (!user) {
      console.log(`⚠️ [LOGIN] Utilisateur non trouvé: ${email}`);
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier la colonne accepted_policy
    if (!user.accepted_policy) {
      console.log(`⚠️ [LOGIN] Utilisateur sans accepted_policy: ${email}`);
      return res.status(403).json({ error: 'Vous devez accepter la politique de confidentialité pour vous connecter.' });
    }

    console.log(`✓ [LOGIN] Utilisateur trouvé (id: ${user.id}), vérification mot de passe...`);
    
    // Vérifier le mot de passe
    const bcryptStartTime = Date.now();
    let isValidPassword;
    try {
      isValidPassword = await bcrypt.compare(password, user.password);
      const bcryptElapsed = Date.now() - bcryptStartTime;
      console.log(`✅ [LOGIN] Vérification bcrypt complétée en ${bcryptElapsed}ms`);
    } catch (bcryptError) {
      console.error('❌ [LOGIN] Erreur bcrypt:', bcryptError.message);
      throw bcryptError;
    }

    if (!isValidPassword) {
      console.log(`⚠️ [LOGIN] Mot de passe incorrect pour: ${email}`);
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Générer le token
    console.log(`🔑 [LOGIN] Génération du JWT token...`);
    const token = generateToken(user);
    const totalElapsed = Date.now() - startTime;
    console.log(`✅ [LOGIN] Connexion réussie en ${totalElapsed}ms pour: ${email}\n`);

    await logActivity({
      userId: user.id,
      actionType: 'Login',
      resourceType: 'auth',
      resourceId: user.id,
      details: {
        email,
        route: '/auth/login',
        elapsedMs: totalElapsed,
      },
      status: 'success',
      req
    }).catch(() => {});

    res.status(200).json({
      message: 'Connexion réussie',
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
    const totalElapsed = Date.now() - startTime;
    console.error(`\n❌ [LOGIN] ERREUR GLOBALE après ${totalElapsed}ms:`, {
      message: error.message,
      code: error.code,
      severity: error.severity,
      detail: error.detail,
      hint: error.hint,
      column: error.column,
      table: error.table,
      schema: error.schema,
      position: error.position,
      routine: error.routine,
      line: error.line,
      file: error.file,
      stack: error.stack?.split('\n').slice(0, 3).join('\n'),
      timestamp: new Date().toISOString(),
    });
    console.log('\n');
    res.status(500).json({ 
      error: 'Erreur serveur lors de la connexion',
      message: error.message,
      code: error.code,
      detail: error.detail || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Déconnexion utilisateur
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    await logActivity({
      userId: req.user.id,
      actionType: 'Logout',
      resourceType: 'auth',
      resourceId: req.user.id,
      details: {
        route: '/auth/logout',
      },
      status: 'success',
      req
    }).catch(() => {});

    res.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('❌ [LOGOUT] Erreur journalisation déconnexion:', error.message);
    res.status(500).json({ error: 'Erreur serveur lors de la déconnexion' });
  }
});

// Obtenir le profil utilisateur
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, phone, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ user });
  } catch (error) {
    console.error('❌ [ME] Erreur profil:', error.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour le profil
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone } = req.body;

    await pool.query(
      'UPDATE users SET name = $1, phone = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [name, phone, req.user.id]
    );

    const result = await pool.query('SELECT id, email, name, phone, role FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    res.json({ message: 'Profil mis à jour', user });
  } catch (error) {
    console.error('❌ [PROFILE] Erreur mise à jour profil:', error.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Changer le mot de passe
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Mot de passe invalide (minimum 6 caractères)' });
    }

    // Vérifier le mot de passe actuel
    const result = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const isValid = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!isValid) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', 
      [hashedPassword, req.user.id]);

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error('❌ [PASSWORD] Erreur changement mot de passe:', error.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;