// filepath: backend/config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration de la connexion MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'railway',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
});

// Test de connexion
pool.getConnection()
  .then(conn => {
    console.log('✅ Connecté à la base de données MySQL');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Erreur de connexion à la base de données:', err.message);
  });

// Fonction helper pour les requêtes
const query = async (text, params) => {
  const [rows] = await pool.query(text, params);
  return rows;
};

// Initialisation des tables
const initDatabase = async () => {
  const connection = await pool.getConnection();
  try {
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
      )
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
        payment_status BOOLEAN DEFAULT false,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36),
        announcement_id VARCHAR(36),
        amount DECIMAL(10, 2) NOT NULL,
        method VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        transaction_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Index pour optimiser les recherches (MySQL ne supporte pas IF NOT EXISTS pour les index)
    try {
      await connection.query('CREATE INDEX idx_announcements_category ON announcements(category)');
    } catch (e) { /* Index déjà existant */ }
    
    try {
      await connection.query('CREATE INDEX idx_announcements_status ON announcements(status)');
    } catch (e) { /* Index déjà existant */ }
    
    try {
      await connection.query('CREATE INDEX idx_announcements_user_id ON announcements(user_id)');
    } catch (e) { /* Index déjà existant */ }
    
    try {
      await connection.query('CREATE INDEX idx_payments_user_id ON payments(user_id)');
    } catch (e) { /* Index déjà existant */ }

    console.log('✅ Base de données initialisée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error.message);
  } finally {
    connection.release();
  }
};

module.exports = {
  pool,
  initDatabase,
  query,
};