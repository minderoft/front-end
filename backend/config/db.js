// filepath: backend/config/db.js
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const buildConnectionOptions = () => {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    };
  }

  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT || 5432;
  const database = process.env.DB_NAME || process.env.POSTGRES_DB;
  const user = process.env.DB_USER || process.env.POSTGRES_USER;
  const password = process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD;

  if (!host || !database || !user || !password) {
    throw new Error('DATABASE_URL ou les variables DB_HOST, DB_NAME, DB_USER, DB_PASSWORD doivent être définies');
  }

  return {
    connectionString: `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
  };
};

const pool = new Pool(buildConnectionOptions());

const mapPlaceholders = (text = '') => {
  let index = 0;
  return text.replace(/\?/g, () => `$${++index}`);
};

const query = async (text, params = []) => {
  const sql = mapPlaceholders(text);
  const result = await pool.query(sql, params);
  return result.rows;
};

const initDatabase = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36),
        category VARCHAR(50) NOT NULL,
        type VARCHAR(20),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(12, 2),
        location VARCHAR(255),
        phone VARCHAR(50),
        images JSONB,
        status VARCHAR(20) DEFAULT 'pending',
        payment_status BOOLEAN DEFAULT false,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36),
        announcement_id VARCHAR(36),
        amount NUMERIC(12, 2) NOT NULL,
        method VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        transaction_id VARCHAR(255),
        reference VARCHAR(255),
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS pricing (
        id VARCHAR(36) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        category VARCHAR(50),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(12, 2) NOT NULL DEFAULT 0,
        features JSONB DEFAULT '[]',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query('CREATE INDEX IF NOT EXISTS idx_announcements_category ON announcements(category)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_announcements_user_id ON announcements(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_pricing_type_category ON pricing(type, category)');

    const pricingCount = await client.query('SELECT COUNT(*) AS count FROM pricing');
    if (Number(pricingCount.rows[0].count) === 0) {
      const seedRows = [
        {
          id: uuidv4(),
          type: 'publication',
          category: 'immobilier',
          name: 'Publication Immobilier',
          description: 'Publication d\'annonce immobilière pendant 30 jours',
          price: 5000,
          features: JSON.stringify([
            'Publication pour 30 jours',
            'Jusqu\'à 5 photos',
            'Affichage en priorité',
            'Support client dédié',
          ]),
        },
        {
          id: uuidv4(),
          type: 'publication',
          category: 'vehicule',
          name: 'Publication Véhicule',
          description: 'Publication d\'annonce véhicule pendant 30 jours',
          price: 4000,
          features: JSON.stringify([
            'Publication pour 30 jours',
            'Jusqu\'à 8 photos',
            'Affichage en priorité',
            'Support client dédié',
          ]),
        },
        {
          id: uuidv4(),
          type: 'publication',
          category: 'materiaux',
          name: 'Publication Matériaux',
          description: 'Publication d\'annonce de matériaux pendant 30 jours',
          price: 3000,
          features: JSON.stringify([
            'Publication pour 30 jours',
            'Jusqu\'à 5 photos',
            'Affichage en priorité',
            'Support client dédié',
          ]),
        },
        {
          id: uuidv4(),
          type: 'publication',
          category: 'technicien',
          name: 'Publication Technicien',
          description: 'Publication d\'annonce de technicien pendant 30 jours',
          price: 2000,
          features: JSON.stringify([
            'Publication pour 30 jours',
            'Photo de profil',
            'Affichage en priorité',
            'Support client dédié',
          ]),
        },
        {
          id: uuidv4(),
          type: 'boost',
          category: null,
          name: 'Boost d\'annonce',
          description: 'Augmente la visibilité de votre annonce pendant 7 jours',
          price: 2000,
          features: JSON.stringify([
            'Amélioration de la visibilité',
            'Annonce mise en avant',
            'Affichage prioritaire',
          ]),
        },
      ];

      for (const row of seedRows) {
        await client.query(
          `INSERT INTO pricing (id, type, category, name, description, price, features) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [row.id, row.type, row.category, row.name, row.description, row.price, row.features]
        );
      }
    }

    await client.query('COMMIT');
    console.log('✅ Base de données initialisée avec succès');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur lors de l\'initialisation:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  initDatabase,
  query,
};