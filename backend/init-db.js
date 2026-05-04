const { initDatabase, db } = require('./config/db');

const run = async () => {
  try {
    console.log('🔧 Initialisation de la base SQLite...');
    await initDatabase();
    console.log('✅ Base de données SQLite initialisée avec succès.');
    console.log('📁 Chemin:', require('path').resolve(__dirname, 'database.sqlite'));
  } catch (error) {
    console.error('❌ Erreur pendant l initialisation de la base de données :', error);
    process.exit(1);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Erreur fermeture de la base de données:', err.message);
      } else {
        console.log('🔒 Connexion SQLite fermée.');
      }
    });
  }
};

run();
