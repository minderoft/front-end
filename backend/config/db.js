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
  const startTime = Date.now();
  try {
    const connection = await pool.getConnection();
    try {
      await connection.ping();
      const elapsed = Date.now() - startTime;
      console.log(`✅ MySQL connexion établie en ${elapsed}ms`);
    } finally {
      connection.release();
    }
  } catch (err) {
    const elapsed = Date.now() - startTime;
    console.error(`❌ MySQL ping échoué après ${elapsed}ms:`, err.message);
    throw err;
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
  const startTime = Date.now();
  try {
    const [rows, fields] = await pool.execute(sql, params);
    const elapsed = Date.now() - startTime;
    if (elapsed > 1000) {
      console.warn(`⚠️ Requête lente (${elapsed}ms): ${statement}`);
    }
    if (statement === 'SELECT' || statement === 'SHOW' || statement === 'DESCRIBE') {
      return rows;
    }
    return rows;
  } catch (err) {
    const elapsed = Date.now() - startTime;
    console.error(`MySQL query error (${elapsed}ms):`, err.message);
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
      latitude DECIMAL(10,8) NULL,
      longitude DECIMAL(11,8) NULL,
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

  // Vérifier et ajouter les colonnes latitude et longitude si elles n'existent pas
  try {
    const latitudeExists = await getAsync(`
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'announcements' 
      AND COLUMN_NAME = 'latitude'
    `);
    
    if (!latitudeExists || latitudeExists.count === 0) {
      await runAsync(`
        ALTER TABLE announcements ADD COLUMN latitude DECIMAL(10,8) NULL
      `);
      console.log('✅ Colonne latitude ajoutée');
    }

    const longitudeExists = await getAsync(`
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'announcements' 
      AND COLUMN_NAME = 'longitude'
    `);
    
    if (!longitudeExists || longitudeExists.count === 0) {
      await runAsync(`
        ALTER TABLE announcements ADD COLUMN longitude DECIMAL(11,8) NULL
      `);
      console.log('✅ Colonne longitude ajoutée');
    }

    // Vérifier et ajouter la colonne accepted_policy à la table users
    const acceptedPolicyExists = await getAsync(`
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'accepted_policy'
    `);
    
    if (!acceptedPolicyExists || acceptedPolicyExists.count === 0) {
      await runAsync(`
        ALTER TABLE users ADD COLUMN accepted_policy BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ Colonne accepted_policy ajoutée à la table users');
    }
  } catch (err) {
    console.warn('⚠️ Vérification des colonnes échouée:', err.message);
  }

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

  await runAsync(`
    CREATE TABLE IF NOT EXISTS conversations (
      id VARCHAR(36) PRIMARY KEY,
      client_id VARCHAR(36) NOT NULL,
      provider_id VARCHAR(36) NOT NULL,
      service_id VARCHAR(36) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY(client_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(provider_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(service_id) REFERENCES announcements(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR(36) PRIMARY KEY,
      conversation_id VARCHAR(36) NOT NULL,
      sender_id VARCHAR(36) NOT NULL,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE
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
  console.log('📦 Initialisation de la base de données...');
  const initStart = Date.now();
  
  try {
    await testConnection();
  } catch (err) {
    console.error('Impossible de se connecter à MySQL :', err.message);
    throw err;
  }

  const tableStart = Date.now();
  try {
    await createTables();
    console.log(`✅ Tables créées en ${Date.now() - tableStart}ms`);
  } catch (err) {
    console.error('Erreur création tables:', err.message);
    throw err;
  }

  const seedStart = Date.now();
  try {
    await seedPricing();
    console.log(`✅ Pricing initialisé en ${Date.now() - seedStart}ms`);
  } catch (err) {
    console.error('Erreur seedPricing:', err.message);
    throw err;
  }

  const totalTime = Date.now() - initStart;
  console.log(`✅ Base de données initialisée en ${totalTime}ms`);
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
