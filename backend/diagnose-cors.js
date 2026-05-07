#!/usr/bin/env node

/**
 * Script de diagnostic CORS - LocaPlus Backend
 * 
 * Usage: node diagnose-cors.js
 * 
 * Ce script vérifie la configuration CORS et identifie les problèmes
 */

const fs = require('fs');
const path = require('path');

console.log(`
╔═══════════════════════════════════════════════════════════╗
║            DIAGNOSTIC CORS - LocaPlus Backend             ║
╚═══════════════════════════════════════════════════════════╝
`);

// Vérifications
const checks = {
  passed: [],
  failed: [],
  warnings: [],
};

// 1. Vérifier que server.js existe et contient CORS
console.log('📋 Vérification des fichiers...\n');

try {
  const serverPath = path.join(__dirname, 'server.js');
  const serverContent = fs.readFileSync(serverPath, 'utf8');

  // Vérifications sur server.js
  if (serverContent.includes('const cors = require(\'cors\')')) {
    checks.passed.push('✅ cors est importé dans server.js');
  } else {
    checks.failed.push('❌ cors n\'est pas importé dans server.js');
  }

  if (serverContent.includes('app.use(cors(corsOptions))')) {
    checks.passed.push('✅ cors middleware est appliqué');
  } else {
    checks.failed.push('❌ cors middleware n\'est pas appliqué');
  }

  if (serverContent.includes('app.options(\'*\', cors(corsOptions))')) {
    checks.passed.push('✅ Preflight OPTIONS est configuré');
  } else {
    checks.failed.push('❌ Preflight OPTIONS n\'est pas configuré');
  }

  if (serverContent.includes('credentials: true')) {
    checks.passed.push('✅ credentials: true est configuré');
  } else {
    checks.warnings.push('⚠️  credentials: true n\'est pas configuré (peut être nécessaire)');
  }

  if (serverContent.includes("'GET', 'POST', 'PUT', 'DELETE'")) {
    checks.passed.push('✅ Les méthodes GET, POST, PUT, DELETE sont autorisées');
  } else {
    checks.failed.push('❌ Les méthodes ne sont pas toutes autorisées');
  }

  if (serverContent.includes('allowedOrigins')) {
    checks.passed.push('✅ allowedOrigins est défini');
  } else {
    checks.failed.push('❌ allowedOrigins n\'est pas défini');
  }

  if (serverContent.includes('zel-chi.vercel.app')) {
    checks.passed.push('✅ Le domaine Vercel est dans allowedOrigins');
  } else {
    checks.warnings.push('⚠️  Le domaine Vercel n\'est pas trouvé (vérifier FRONTEND_URL)');
  }

} catch (error) {
  checks.failed.push(`❌ Impossible de lire server.js: ${error.message}`);
}

// 2. Vérifier package.json
try {
  const packagePath = path.join(__dirname, 'package.json');
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

  if (packageContent.dependencies && packageContent.dependencies.cors) {
    checks.passed.push(`✅ cors est installé (v${packageContent.dependencies.cors})`);
  } else {
    checks.failed.push('❌ cors n\'est pas dans package.json');
  }

  if (packageContent.dependencies && packageContent.dependencies.express) {
    checks.passed.push(`✅ express est installé (v${packageContent.dependencies.express})`);
  } else {
    checks.failed.push('❌ express n\'est pas dans package.json');
  }

} catch (error) {
  checks.failed.push(`❌ Impossible de lire package.json: ${error.message}`);
}

// 3. Vérifier .env
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');

    if (envContent.includes('FRONTEND_URL')) {
      const match = envContent.match(/FRONTEND_URL=(.+)/);
      if (match) {
        const url = match[1].trim();
        if (url.includes('vercel.app')) {
          checks.passed.push(`✅ FRONTEND_URL est configuré: ${url}`);
        } else {
          checks.warnings.push(`⚠️  FRONTEND_URL ne semble pas être une URL Vercel: ${url}`);
        }
      }
    } else {
      checks.warnings.push('⚠️  FRONTEND_URL n\'est pas défini dans .env');
    }

    if (envContent.includes('NODE_ENV')) {
      const match = envContent.match(/NODE_ENV=(.+)/);
      if (match) {
        checks.passed.push(`✅ NODE_ENV est configuré: ${match[1].trim()}`);
      }
    }
  } else {
    checks.warnings.push('⚠️  .env n\'existe pas');
  }
} catch (error) {
  checks.warnings.push(`⚠️  Erreur lors de la lecture de .env: ${error.message}`);
}

// 4. Vérifier les routes
try {
  const authPath = path.join(__dirname, 'routes', 'auth.js');
  const authContent = fs.readFileSync(authPath, 'utf8');

  if (authContent.includes('res.status(201)') || authContent.includes('res.status(200)')) {
    checks.passed.push('✅ Les routes auth retournent les statuts HTTP corrects');
  } else {
    checks.warnings.push('⚠️  Vérifier les statuts HTTP des routes auth');
  }

} catch (error) {
  checks.warnings.push(`⚠️  Impossible de vérifier les routes auth: ${error.message}`);
}

// Afficher les résultats
console.log('📊 Résultats:\n');

if (checks.passed.length > 0) {
  console.log('✅ PASSÉS:');
  checks.passed.forEach(msg => console.log(`   ${msg}`));
  console.log();
}

if (checks.warnings.length > 0) {
  console.log('⚠️  AVERTISSEMENTS:');
  checks.warnings.forEach(msg => console.log(`   ${msg}`));
  console.log();
}

if (checks.failed.length > 0) {
  console.log('❌ ÉCHOUÉS:');
  checks.failed.forEach(msg => console.log(`   ${msg}`));
  console.log();
}

// Résumé final
const totalChecks = checks.passed.length + checks.failed.length + checks.warnings.length;
const passRate = ((checks.passed.length / totalChecks) * 100).toFixed(0);

console.log(`╔═══════════════════════════════════════════════════════════╗
║                      RÉSUMÉ                              ║
╚═══════════════════════════════════════════════════════════╝

✅ Passé: ${checks.passed.length}/${totalChecks}
⚠️  Avertissements: ${checks.warnings.length}
❌ Échoué: ${checks.failed.length}
📊 Taux de réussite: ${passRate}%
`);

if (checks.failed.length === 0) {
  console.log('🎉 Configuration CORS semble correcte!');
  console.log('\n💡 Prochaines étapes:');
  console.log('   1. Redémarrer le serveur backend');
  console.log('   2. Tester depuis le frontend');
  console.log('   3. Vérifier la console du navigateur (F12)');
} else {
  console.log('⚠️  Veuillez corriger les erreurs ci-dessus.');
  process.exit(1);
}

console.log('\n📚 Pour plus d\'aide, consultez CORS_GUIDE.md\n');
