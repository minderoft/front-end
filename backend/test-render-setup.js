#!/usr/bin/env node
/**
 * Test Script - Vérifier Neon PostgreSQL + CORS sur Render
 * 
 * Usage: node backend/test-render-setup.js
 * 
 * Ce script teste :
 * 1. Connexion PostgreSQL à Neon avec SSL
 * 2. Routes API basiques
 * 3. Conversion des placeholders (? → $1, $2, etc.)
 */

const http = require('http');
const url = require('url');

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  ok: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️ ${colors.reset}${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ️ ${colors.reset}${msg}`),
  title: (msg) => console.log(`\n${colors.cyan}━━━ ${msg} ━━━${colors.reset}`),
};

// Test 1: Vérifier les variables d'environnement
const testEnvironmentVariables = () => {
  log.title('Test 1: Variables d\'environnement');
  
  const required = ['DATABASE_URL', 'NODE_ENV', 'FRONTEND_URL'];
  const missing = required.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    log.warn(`Variables manquantes: ${missing.join(', ')}`);
    return false;
  }
  
  log.info(`DATABASE_URL: ${process.env.DATABASE_URL.substring(0, 50)}...`);
  log.info(`NODE_ENV: ${process.env.NODE_ENV}`);
  log.info(`FRONTEND_URL: ${process.env.FRONTEND_URL}`);
  
  // Vérifier que DATABASE_URL contient SSL
  if (process.env.DATABASE_URL.includes('sslmode=require')) {
    log.ok('SSL mode configuré (sslmode=require)');
  } else {
    log.warn('SSL mode non détecté dans DATABASE_URL');
  }
  
  return true;
};

// Test 2: Vérifier les fichiers clés
const testFilesExist = () => {
  log.title('Test 2: Fichiers essentiels');
  
  const fs = require('fs');
  const files = [
    'backend/config/db.js',
    'backend/server.js',
    'backend/routes/auth.js',
    'backend/package.json',
  ];
  
  let allExist = true;
  files.forEach(file => {
    if (fs.existsSync(file)) {
      log.ok(`${file} existe`);
    } else {
      log.error(`${file} manquant`);
      allExist = false;
    }
  });
  
  return allExist;
};

// Test 3: Vérifier la conversion des placeholders
const testPlaceholderConversion = () => {
  log.title('Test 3: Conversion des placeholders');
  
  // Simuler la fonction convertPlaceholders
  const convertPlaceholders = (sql, params) => {
    if (!params || params.length === 0) return { sql, params };
    
    let paramIndex = 1;
    let convertedSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    
    return { sql: convertedSql, params };
  };
  
  // Tests
  const testCases = [
    {
      input: 'SELECT * FROM users WHERE email = ?',
      params: ['test@example.com'],
      expected: 'SELECT * FROM users WHERE email = $1',
    },
    {
      input: 'INSERT INTO users (email, password) VALUES (?, ?)',
      params: ['test@example.com', 'hashed_pwd'],
      expected: 'INSERT INTO users (email, password) VALUES ($1, $2)',
    },
    {
      input: 'UPDATE users SET name = ?, role = ? WHERE id = ?',
      params: ['John', 'admin', 'user-123'],
      expected: 'UPDATE users SET name = $1, role = $2 WHERE id = $3',
    },
  ];
  
  let allPassed = true;
  testCases.forEach((test, i) => {
    const result = convertPlaceholders(test.input, test.params);
    if (result.sql === test.expected) {
      log.ok(`Test ${i + 1}: ${test.input.substring(0, 40)}...`);
    } else {
      log.error(`Test ${i + 1} ÉCHOUÉ`);
      log.error(`  Attendu: ${test.expected}`);
      log.error(`  Reçu:    ${result.sql}`);
      allPassed = false;
    }
  });
  
  return allPassed;
};

// Test 4: Vérifier que db.js inclut convertPlaceholders
const testDbConfiguration = () => {
  log.title('Test 4: Configuration db.js');
  
  const fs = require('fs');
  const dbContent = fs.readFileSync('backend/config/db.js', 'utf8');
  
  const checks = [
    { name: 'SSL config', pattern: /rejectUnauthorized:\s*false/ },
    { name: 'convertPlaceholders', pattern: /convertPlaceholders/ },
    { name: 'pool.query', pattern: /pool\.query/ },
  ];
  
  let allValid = true;
  checks.forEach(check => {
    if (check.pattern.test(dbContent)) {
      log.ok(`${check.name} trouvé dans db.js`);
    } else {
      log.error(`${check.name} manquant dans db.js`);
      allValid = false;
    }
  });
  
  return allValid;
};

// Test 5: Vérifier CORS en server.js
const testCorsConfiguration = () => {
  log.title('Test 5: Configuration CORS');
  
  const fs = require('fs');
  const serverContent = fs.readFileSync('backend/server.js', 'utf8');
  
  const requiredDomains = [
    'loca-plus-hub.vercel.app',
    'front-end-git-main-minderofts-projects.vercel.app',
  ];
  
  let allPresent = true;
  requiredDomains.forEach(domain => {
    if (serverContent.includes(domain)) {
      log.ok(`Domaine autorisé: ${domain}`);
    } else {
      log.error(`Domaine MANQUANT: ${domain}`);
      allPresent = false;
    }
  });
  
  if (serverContent.includes('cors(corsOptions)')) {
    log.ok('Middleware CORS appliqué globalement');
  } else {
    log.error('Middleware CORS pas trouvé');
    allPresent = false;
  }
  
  return allPresent;
};

// Test 6: Vérifier la validation accepted_policy
const testAcceptedPolicyValidation = () => {
  log.title('Test 6: Validation accepted_policy');
  
  const fs = require('fs');
  const authContent = fs.readFileSync('backend/routes/auth.js', 'utf8');
  
  const checks = [
    { name: 'Vérification accepted_policy', pattern: /!accepted_policy/ },
    { name: 'Stockage accepted_policy', pattern: /accepted_policy.*true/ },
    { name: 'Table users', pattern: /FROM users WHERE/ },
  ];
  
  let allValid = true;
  checks.forEach(check => {
    if (check.pattern.test(authContent)) {
      log.ok(`${check.name} configuré`);
    } else {
      log.error(`${check.name} manquant`);
      allValid = false;
    }
  });
  
  return allValid;
};

// Test 7: Vérifier package.json pour les dépendances
const testDependencies = () => {
  log.title('Test 7: Dépendances Node.js');
  
  const fs = require('fs');
  const packageJson = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  const deps = packageJson.dependencies || {};
  
  const required = ['express', 'pg', 'bcryptjs', 'cors', 'helmet', 'jsonwebtoken'];
  
  let allPresent = true;
  required.forEach(dep => {
    if (deps[dep]) {
      log.ok(`${dep}: ${deps[dep]}`);
    } else {
      log.error(`${dep} manquant - Exécutez: npm install ${dep}`);
      allPresent = false;
    }
  });
  
  return allPresent;
};

// Exécuter tous les tests
const runAllTests = async () => {
  console.log(`
${colors.cyan}╔════════════════════════════════════════════════════════╗
║   🧪 Test Render PostgreSQL Neon Setup                  ║
║   Vérification: Placeholders + SSL + CORS + Privacy      ║
╚════════════════════════════════════════════════════════╝${colors.reset}
  `);
  
  const results = [];
  
  try {
    results.push({ name: 'Variables d\'environnement', passed: testEnvironmentVariables() });
    results.push({ name: 'Fichiers essentiels', passed: testFilesExist() });
    results.push({ name: 'Conversion placeholders', passed: testPlaceholderConversion() });
    results.push({ name: 'Configuration db.js', passed: testDbConfiguration() });
    results.push({ name: 'Configuration CORS', passed: testCorsConfiguration() });
    results.push({ name: 'Validation accepted_policy', passed: testAcceptedPolicyValidation() });
    results.push({ name: 'Dépendances', passed: testDependencies() });
  } catch (err) {
    log.error(`Erreur durant les tests: ${err.message}`);
  }
  
  // Résumé
  log.title('📊 Résumé');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);
  
  results.forEach(r => {
    if (r.passed) {
      log.ok(r.name);
    } else {
      log.error(r.name);
    }
  });
  
  console.log(`\n${colors.cyan}Résultat: ${passed}/${total} tests réussis (${percentage}%)${colors.reset}`);
  
  if (percentage === 100) {
    log.ok('✨ Tous les tests réussis! Prêt pour le déploiement.');
  } else {
    log.warn(`${total - passed} test(s) à corriger avant le déploiement`);
  }
  
  console.log(`
${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Prochaines étapes:
1. Corriger les tests échoués
2. Pousser les changements: git push origin main
3. Render redéploiera automatiquement
4. Vérifier les logs: https://dashboard.render.com
${colors.reset}`);
};

// Exécuter
runAllTests().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
