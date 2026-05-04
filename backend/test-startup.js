// Test rapide pour vérifier le démarrage du serveur
try {
  const app = require('./server');
  console.log('✅ Server module loaded successfully');
  process.exit(0);
} catch (error) {
  console.error('❌ Error loading server:', error.message);
  console.error(error.stack);
  process.exit(1);
}
