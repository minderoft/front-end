const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const databaseFile = path.join(__dirname, '..', 'database.sqlite');
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
};

module.exports = {
  db,
  runAsync,
  getAsync,
  allAsync,
  query,
  initDatabase,
};