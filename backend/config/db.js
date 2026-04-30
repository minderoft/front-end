// filepath: backend/config/db.js
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Les variables d'environnement suivantes sont manquantes dans backend/.env : ${missing.join(', ')}`);
}

const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;
const DB_PORT = Number(process.env.DB_PORT || 3306);

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
  dateStrings: true,
  namedPlaceholders: false,
  charset: 'utf8mb4',
});

const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Erreur SQL:', sql, params, error.message);
    throw error;
  }
};

const checkConnection = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.ping();
    console.log('✅ Connecté à la base de données MySQL');
  } catch (error) {
    console.error('❌ Échec de la connexion MySQL :', error.message);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const initDatabase = async () => {
  await checkConnection();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36),
        category VARCHAR(50) NOT NULL,
        type VARCHAR(20),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(12, 2),
        location VARCHAR(255),
        phone VARCHAR(50),
        images JSON,
        status VARCHAR(20) DEFAULT 'pending',
        payment_status TINYINT(1) DEFAULT 0,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36),
        announcement_id VARCHAR(36),
        amount DECIMAL(12, 2) NOT NULL,
        method VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        transaction_id VARCHAR(255),
        reference VARCHAR(255),
        paid_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS pricing (
        id VARCHAR(36) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        category VARCHAR(50),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(12, 2) NOT NULL DEFAULT 0,
        features JSON DEFAULT NULL,
        active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Créer les index (ignorer les erreurs de duplication)
    try { await connection.query('CREATE INDEX idx_announcements_category ON announcements(category)'); } catch (e) { if (e.code !== 'ER_DUP_KEYNAME') throw e; }
    try { await connection.query('CREATE INDEX idx_announcements_status ON announcements(status)'); } catch (e) { if (e.code !== 'ER_DUP_KEYNAME') throw e; }
    try { await connection.query('CREATE INDEX idx_announcements_user_id ON announcements(user_id)'); } catch (e) { if (e.code !== 'ER_DUP_KEYNAME') throw e; }
    try { await connection.query('CREATE INDEX idx_payments_user_id ON payments(user_id)'); } catch (e) { if (e.code !== 'ER_DUP_KEYNAME') throw e; }
    try { await connection.query('CREATE INDEX idx_pricing_type_category ON pricing(type, category)'); } catch (e) { if (e.code !== 'ER_DUP_KEYNAME') throw e; }

    const [pricingCountRows] = await connection.query('SELECT COUNT(*) AS count FROM pricing');
    const pricingCount = Number(pricingCountRows[0]?.count || 0);

    if (pricingCount === 0) {
      const seedRows = [
        {
          id: uuidv4(),
          type: 'publication',
          category: 'immobilier',
          name: 'Publication Immobilier',
          description: "Publication d'annonce immobilière pendant 30 jours",
          price: 5000,
          features: JSON.stringify([
            'Publication pour 30 jours',
            "Jusqu'à 5 photos",
            'Affichage en priorité',
            'Support client dédié',
          ]),
        },
        {
          id: uuidv4(),
          type: 'publication',
          category: 'vehicule',
          name: 'Publication Véhicule',
          description: "Publication d'annonce véhicule pendant 30 jours",
          price: 4000,
          features: JSON.stringify([
            'Publication pour 30 jours',
            "Jusqu'à 8 photos",
            'Affichage en priorité',
            'Support client dédié',
          ]),
        },
        {
          id: uuidv4(),
          type: 'publication',
          category: 'materiaux',
          name: 'Publication Matériaux',
          description: "Publication d'annonce de matériaux pendant 30 jours",
          price: 3000,
          features: JSON.stringify([
            'Publication pour 30 jours',
            "Jusqu'à 5 photos",
            'Affichage en priorité',
            'Support client dédié',
          ]),
        },
        {
          id: uuidv4(),
          type: 'publication',
          category: 'technicien',
          name: 'Publication Technicien',
          description: "Publication d'annonce de technicien pendant 30 jours",
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
          name: "Boost d'annonce",
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
        await connection.query(
          'INSERT INTO pricing (id, type, category, name, description, price, features) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [row.id, row.type, row.category, row.name, row.description, row.price, row.features]
        );
      }
    }

    await connection.commit();
    console.log('✅ Base de données initialisée avec succès');
  } catch (error) {
    await connection.rollback();
    console.error("❌ Erreur lors de l'initialisation:", error.message);
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  pool,
  query,
  initDatabase,
};