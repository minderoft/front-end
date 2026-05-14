const { Pool } = require('pg');
require('dotenv').config();

// ============================================
// CONFIGURATION POOL POSTGRESQL/NEON
// ============================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // ✅ OBLIGATOIRE pour Neon
  },
});

// Émettre un avertissement si DATABASE_URL n'est pas défini
if (!process.env.DATABASE_URL) {
  console.warn('⚠️ WARNING: DATABASE_URL is not set in environment variables');
}

// ============================================
// TEST DE CONNEXION
// ============================================

const testConnection = async () => {
  const startTime = Date.now();
  try {
    console.log('🔌 [DB] Testing PostgreSQL/Neon connection...');
    const result = await pool.query('SELECT NOW() as current_time');
    const elapsed = Date.now() - startTime;
    
    console.log(`✅ [DB] PostgreSQL connected in ${elapsed}ms`);
    console.log(`📊 [DB] Database time: ${result.rows[0].current_time}`);
    console.log(`📊 [DB] Configuration:`, {
      ssl: 'enabled (rejectUnauthorized: false)',
      sslmode: 'require (in DATABASE_URL)',
      timestamp: new Date().toISOString(),
    });
    
    return true;
  } catch (err) {
    const elapsed = Date.now() - startTime;
    console.error(`❌ [DB] PostgreSQL connection failed after ${elapsed}ms:`, {
      message: err.message,
      code: err.code,
      severity: err.severity,
      detail: err.detail,
      hint: err.hint,
      timestamp: new Date().toISOString(),
    });
    throw err;
  }
};

// ============================================
// INITIALISATION BASE DE DONNÉES
// ============================================

const initDatabase = async () => {
  try {
    await testConnection();

    console.log('\n📝 [DB] Dropping existing tables with CASCADE to resolve type conflicts...');
    
    // Drop tables in dependency order (reverse of creation order)
    const dropOrder = [
      'DROP TABLE IF EXISTS messages CASCADE',
      'DROP TABLE IF EXISTS conversations CASCADE',
      'DROP TABLE IF EXISTS payments CASCADE',
      'DROP TABLE IF EXISTS announcements CASCADE',
      'DROP TABLE IF EXISTS pricing CASCADE',
      'DROP TABLE IF EXISTS contact_messages CASCADE',
      'DROP TABLE IF EXISTS users CASCADE',
    ];

    for (const dropStatement of dropOrder) {
      try {
        await pool.query(dropStatement);
        console.log(`✅ ${dropStatement}`);
      } catch (err) {
        console.warn(`⚠️ ${dropStatement} - ${err.message}`);
      }
    }

    console.log('\n📝 [DB] Creating tables with consistent VARCHAR(36) type for all IDs...');
    
    // Create users table with VARCHAR(36) for UUIDs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(60),
        role VARCHAR(50) DEFAULT 'user',
        accepted_policy BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ [DB] users table ready (id: VARCHAR(36) for UUID)');

    // Create announcements table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        category VARCHAR(100),
        type VARCHAR(100),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        location VARCHAR(255),
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        phone VARCHAR(60),
        images TEXT,
        metadata TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        payment_status SMALLINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ [DB] announcements table ready');

    // Create payments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        announcement_id VARCHAR(36) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        method VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        transaction_id VARCHAR(255),
        reference VARCHAR(255),
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY(announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ [DB] payments table ready');

    // Create contact_messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ [DB] contact_messages table ready');

    // Create pricing table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pricing (
        id VARCHAR(36) PRIMARY KEY,
        type VARCHAR(100) NOT NULL,
        category VARCHAR(100),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        features TEXT,
        active SMALLINT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ [DB] pricing table ready');

    // Seed pricing items if table is empty
    const existingPricing = await pool.query('SELECT COUNT(*) as count FROM pricing');
    if (Number(existingPricing.rows[0].count) === 0) {
      console.log('🔧 [DB] Seed default pricing items');
      await pool.query(`
        INSERT INTO pricing (id, type, category, name, description, price, features, active) VALUES
        ('pub-immobilier', 'publication', 'immobilier', 'Publication Immobilier', 'Publication d\'annonces immobilières', 5000, $1, 1),
        ('pub-vehicule', 'publication', 'vehicule', 'Publication Véhicule', 'Publication d\'annonces de véhicules', 4000, $2, 1),
        ('pub-materiaux', 'publication', 'materiaux', 'Publication Matériaux', 'Publication d\'annonces pour matériaux', 3000, $3, 1),
        ('pub-technicien', 'publication', 'technicien', 'Publication Technicien', 'Publication d\'annonces de techniciens', 2000, $4, 1),
        ('boost-standard', 'boost', NULL, 'Boost annonce', 'Boost d\'une annonce', 1500, $5, 1)
      `, [
        JSON.stringify(['Annonce 30 jours', 'Visibilité standard']),
        JSON.stringify(['Annonce 30 jours', 'Visibilité standard']),
        JSON.stringify(['Annonce 30 jours', 'Visibilité standard']),
        JSON.stringify(['Annonce 30 jours', 'Visibilité standard']),
        JSON.stringify(['Boost 7 jours', 'Visibilité augmentée']),
      ]);
      console.log('✅ [DB] Default pricing items seeded');
    }

    // Create conversations table with VARCHAR(36) IDs (FIXED TYPE MISMATCH!)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(36) PRIMARY KEY,
        client_id VARCHAR(36) NOT NULL,
        provider_id VARCHAR(36) NOT NULL,
        service_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(client_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(provider_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(service_id) REFERENCES announcements(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ [DB] conversations table ready (id: VARCHAR(36), client_id: VARCHAR(36), provider_id: VARCHAR(36), service_id: VARCHAR(36))');

    // Create messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(36) PRIMARY KEY,
        conversation_id VARCHAR(36) NOT NULL,
        sender_id VARCHAR(36) NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ [DB] messages table ready');

    console.log('✅ [DB] Database initialization complete\n');
    return true;
  } catch (err) {
    console.error('❌ [DB] Database initialization error:', err.message);
    throw err;
  }
};

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const closeDatabase = async () => {
  try {
    await pool.end();
    console.log('✅ [DB] Connection pool closed');
  } catch (err) {
    console.error('❌ [DB] Error closing connection pool:', err.message);
  }
};

// ============================================
// EXPORTS
// ============================================

const normalizeQueryPlaceholders = (sql) => {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
};

const query = async (sql, params = []) => {
  const normalizedSql = normalizeQueryPlaceholders(sql);
  const statement = normalizedSql.trim().split(' ')[0].toUpperCase();
  const startTime = Date.now();
  try {
    const result = await pool.query(normalizedSql, params);
    const elapsed = Date.now() - startTime;
    if (elapsed > 1000) {
      console.warn(`⚠️ Requête lente (${elapsed}ms): ${statement}`);
    }
    return result.rows;
  } catch (err) {
    const elapsed = Date.now() - startTime;
    console.error(`PostgreSQL query error (${elapsed}ms):`, err.message);
    throw err;
  }
};

module.exports = {
  pool,
  query,
  testConnection,
  initDatabase,
  closeDatabase,
};
