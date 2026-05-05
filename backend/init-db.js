const { initDatabase, closeDatabase } = require('./config/db');

const run = async () => {
  try {
    console.log('🔧 Initialisation de la base MySQL...');
    await initDatabase();
    console.log('✅ Base de données MySQL initialisée avec succès.');
  } catch (error) {
    console.error('❌ Erreur pendant l initialisation de la base de données :', error);
    process.exit(1);
  } finally {
    try {
      await closeDatabase();
      console.log('🔒 Connexion MySQL fermée.');
    } catch (closeError) {
      console.error('❌ Erreur lors de la fermeture de la base de données :', closeError.message);
    }
  }
};

run();
