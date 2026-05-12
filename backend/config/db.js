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

// ✅ CONVERTIR les placeholders MySQL (?) en PostgreSQL ($1, $2, etc.)
const convertPlaceholders = (sql, params) => {
  if (!params || params.length === 0) return { sql, params };
  
  let paramIndex = 1;
  let convertedSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
  
  return { sql: convertedSql, params };
};

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
    const { sql: convertedSql, params: convertedParams } = convertPlaceholders(sql, params);
    const result = await pool.query(convertedSql, convertedParams);
    return {
      insertId: result.rows[0]?.id || null,
      affectedRows: result.rowCount || 0,
      changedRows: result.rowCount || 0,
    };
  } catch (err) {
    console.error('PostgreSQL runAsync error:', err.message);
    throw err;
  }
};

const getAsync = async (sql, params = []) => {
  try {
    const { sql: convertedSql, params: convertedParams } = convertPlaceholders(sql, params);
    const result = await pool.query(convertedSql, convertedParams);
    return result.rows[0] || null;
  } catch (err) {
    console.error('PostgreSQL getAsync error:', err.message);
    throw err;
  }
};

const allAsync = async (sql, params = []) => {
  try {
    const { sql: convertedSql, params: convertedParams } = convertPlaceholders(sql, params);
    const result = await pool.query(convertedSql, convertedParams);
    return result.rows;
  } catch (err) {
    console.error('PostgreSQL allAsync error:', err.message);
    throw err;
  }
};

const query = async (sql, params = []) => {
  const statement = sql.trim().split(' ')[0].toUpperCase();
  const startTime = Date.now();
  try {
    const { sql: convertedSql, params: convertedParams } = convertPlaceholders(sql, params);
    const result = await pool.query(convertedSql, convertedParams);
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

const createTables = async () => {
  try {
    // 1. Créer la table users
    await runAsync(`
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

    // 2. Créer la table announcements
    await runAsync(`
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

    // 3. Créer la table payments
    await runAsync(`
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

    // 4. Créer la table contact_messages
    await runAsync(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Créer la table pricing
    await runAsync(`
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

    // 6. Créer la table conversations
    await runAsync(`
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

    // 7. Créer la table messages
    await runAsync(`
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

    console.log('✅ Tables PostgreSQL créées avec succès');
  } catch (err) {
    console.error('❌ Erreur lors de la création des tables:', err.message);
  }
};

const seedPricing = async () => {
  try {
    const existing = await allAsync('SELECT COUNT(*) as count FROM pricing');
    if (existing[0]?.count > 0) return;

    const pricingItems = [
      {
        id: 'pub-immobilier',
        type: 'publication',
        category: 'immobilier',
        name: 'Publication Immobilier',
        description: 'Publication d\'annonces immobilières',
        price: 5000,
        features: JSON.stringify(['Annonce 30 jours', 'Visibilité standard']),
        active: 1,
      },
      {
        id: 'pub-vehicule',
        type: 'publication',
        category: 'vehicule',
        name: 'Publication Véhicule',
        description: 'Publication d\'annonces de véhicules',
        price: 4000,
        features: JSON.stringify(['Annonce 30 jours', 'Visibilité standard']),
        active: 1,
      },
      {
        id: 'pub-materiaux',
        type: 'publication',
        category: 'materiaux',
        name: 'Publication Matériaux',
        description: 'Publication d\'annonces pour matériaux',
        price: 3000,
        features: JSON.stringify(['Annonce 30 jours', 'Visibilité standard']),
        active: 1,
      },
      {
        id: 'pub-technicien',
        type: 'publication',
        category: 'technicien',
        name: 'Publication Technicien',
        description: 'Publication d\'annonces de techniciens',
        price: 2000,
        features: JSON.stringify(['Annonce 30 jours', 'Visibilité standard']),
        active: 1,
      },
      {
        id: 'boost-standard',
        type: 'boost',
        category: null,
        name: 'Boost annonce',
        description: 'Boost d\'une annonce',
        price: 1500,
        features: JSON.stringify(['Meilleure visibilité', '7 jours']),
        active: 1,
      },
    ];

    for (const item of pricingItems) {
      await runAsync(
        `INSERT INTO pricing (id, type, category, name, description, price, features, active, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          item.id,
          item.type,
          item.category,
          item.name,
          item.description,
          item.price,
          item.features,
          item.active,
        ]
      );
    }

    console.log('✅ Données de tarification insérées');
  } catch (err) {
    console.warn('⚠️ Impossible de seed les tarifs:', err.message);
  }
};

const initDatabase = async () => {
  try {
    await testConnection();
    await createTables();
    await seedPricing();
    console.log('✅ Base de données PostgreSQL initialisée');
  } catch (err) {
    console.error('❌ Erreur lors de l\'initialisation:', err);
    throw err;
  }
};

module.exports = {
  pool,
  query,
  runAsync,
  getAsync,
  allAsync,
  testConnection,
  initDatabase,
};
