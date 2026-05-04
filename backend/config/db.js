const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const databaseFile = path.resolve(__dirname, '..', 'database.sqlite');
if (!fs.existsSync(databaseFile)) {
  fs.writeFileSync(databaseFile, '');
}

const db = new sqlite3.Database(databaseFile, (err) => {
  if (err) {
    console.error("Impossible d'ouvrir SQLite :", err.message);
    process.exit(1);
  }
  console.log('✅ SQLite local prêt :', databaseFile);
});

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON;');
});

const runAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const getAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

const allAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const query = async (sql, params = []) => {
  const statement = sql.trim().toUpperCase();
  if (statement.startsWith('SELECT') || statement.startsWith('PRAGMA')) {
    return allAsync(sql, params);
  }
  return runAsync(sql, params);
};

const seedPricing = async () => {
  const existing = await allAsync('SELECT COUNT(*) as count FROM pricing');
  if (existing[0]?.count > 0) {
    return;
  }

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
  await runAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      role TEXT DEFAULT 'user',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category TEXT,
      type TEXT,
      title TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL DEFAULT 0,
      location TEXT,
      phone TEXT,
      images TEXT,
      metadata TEXT,
      status TEXT DEFAULT 'pending',
      payment_status INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      announcement_id TEXT NOT NULL,
      amount REAL NOT NULL,
      method TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      transaction_id TEXT,
      reference TEXT,
      paid_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY(announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS pricing (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      category TEXT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL DEFAULT 0,
      features TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await seedPricing();
};

module.exports = {
  db,
  runAsync,
  getAsync,
  allAsync,
  query,
  initDatabase,
};