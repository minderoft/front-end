const mysql = require('mysql2/promise');
require('dotenv').config();

const createPoolConfig = () => {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL manquant. Configurez la variable d environnement Railway DATABASE_URL dans Render.'
    );
  }

  return {
    uri: databaseUrl,
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
  };
};

const pool = mysql.createPool(createPoolConfig());

const testConnection = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
};

const runAsync = async (sql, params = []) => {
  try {
    const [result] = await pool.execute(sql, params);
    return {
      insertId: result.insertId,
      affectedRows: result.affectedRows,
      changedRows: result.changedRows,
    };
  } catch (err) {
    console.error('MySQL runAsync error:', err.message);
    throw err;
  }
};

const getAsync = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
  } catch (err) {
    console.error('MySQL getAsync error:', err.message);
    throw err;
  }
};

const allAsync = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (err) {
    console.error('MySQL allAsync error:', err.message);
    throw err;
  }
};

const query = async (sql, params = []) => {
  const statement = sql.trim().split(' ')[0].toUpperCase();
  try {
    const [rows, fields] = await pool.execute(sql, params);
    if (statement === 'SELECT' || statement === 'SHOW' || statement === 'DESCRIBE') {
      return rows;
    }
    return rows;
  } catch (err) {
    console.error('MySQL query error:', err.message);
    throw err;
  }
};

const createTables = async () => {
  await runAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(60),
      role VARCHAR(50) DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

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
      phone VARCHAR(60),
      images TEXT,
      metadata TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      payment_status TINYINT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

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
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY(announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      subject VARCHAR(255),
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS pricing (
      id VARCHAR(36) PRIMARY KEY,
      type VARCHAR(100) NOT NULL,
      category VARCHAR(100),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      features TEXT,
      active TINYINT NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

const seedPricing = async () => {
  const existing = await allAsync('SELECT COUNT(*) as count FROM pricing');
  if (existing[0]?.count > 0) return;

  const pricingItems = [
    {
      id: 'pub-immobilier',
      type: 'publication',
      category: 'immobilier',
      name: 'Publication Immobilier',
      description: 'Publication d annonces immobilières',
      price: 5000,
      features: ['Annonce 30 jours', 'Visibilité standard'],
      active: 1,
    },
    {
      id: 'pub-vehicule',
      type: 'publication',
      category: 'vehicule',
      name: 'Publication Véhicule',
      description: 'Publication d annonces de véhicules',
      price: 4000,
      features: ['Annonce 30 jours', 'Visibilité standard'],
      active: 1,
    },
    {
      id: 'pub-materiaux',
      type: 'publication',
      category: 'materiaux',
      name: 'Publication Matériaux',
      description: 'Publication d annonces pour matériaux',
      price: 3000,
      features: ['Annonce 30 jours', 'Visibilité standard'],
      active: 1,
    },
    {
      id: 'pub-technicien',
      type: 'publication',
      category: 'technicien',
      name: 'Publication Technicien',
      description: 'Publication d annonces de techniciens',
      price: 2000,
      features: ['Annonce 30 jours', 'Visibilité standard'],
      active: 1,
    },
    {
      id: 'boost-standard',
      type: 'boost',
      category: null,
      name: 'Boost annonce',
      description: 'Augmentez la visibilité de votre annonce',
      price: 2000,
      features: ['Visibilité accrue', 'Annonce en haut de liste'],
      active: 1,
    },
  ];

  const insertSql = `
    INSERT INTO pricing (id, type, category, name, description, price, features, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  for (const item of pricingItems) {
    await runAsync(insertSql, [
      item.id,
      item.type,
      item.category,
      item.name,
      item.description,
      item.price,
      JSON.stringify(item.features),
      item.active,
    ]);
  }
};

const initDatabase = async () => {
  try {
    await testConnection();
    console.log('MySQL est prêt.');
  } catch (err) {
    console.error('Impossible de se connecter à MySQL :', err.message);
    throw err;
  }

  await createTables();
  await seedPricing();
};

const closeDatabase = async () => {
  try {
    await pool.end();
  } catch (err) {
    console.error('Erreur lors de la fermeture de la connexion MySQL :', err.message);
  }
};

module.exports = {
  db: pool,
  runAsync,
  getAsync,
  allAsync,
  query,
  initDatabase,
  closeDatabase,
};
