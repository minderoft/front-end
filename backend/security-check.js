# ============================================
# Script de vérification de sécurité
# ============================================
# Ce script vérifie qu'aucun secret n'est codé en dur

const fs = require('fs');
const path = require('path');

const SECRET_PATTERNS = [
  /sk_test_[a-zA-Z0-9]{32,}/,
  /sk_live_[a-zA-Z0-9]{32,}/,
  /pk_test_[a-zA-Z0-9]{32,}/,
  /pk_live_[a-zA-Z0-9]{32,}/,
  /password\s*=\s*['"][^'"]+['"]/i,
  /secret\s*=\s*['"][^'"]+['"]/i,
  /jwt_secret/i,
  /DB_PASSWORD/i,
];

const FILES_TO_CHECK = [
  'backend/config/db.js',
  'backend/config/paystack.js',
  'backend/middleware/auth.js',
  'backend/server.js',
  'backend/routes/auth.js',
  'backend/routes/payments.js',
];

const IGNORE_PATTERNS = [
  /process\.env\./,
  /\.env/,
  /your_.*_here/,
  /example/,
];

function checkFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Fichier non trouvé: ${filePath}`);
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];
  
  lines.forEach((line, index) => {
    // Ignorer les lignes avec process.env
    if (IGNORE_PATTERNS.some(pattern => pattern.test(line))) {
      return;
    }
    
    // Vérifier les patterns de secrets
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(line)) {
        issues.push({
          line: index + 1,
          content: line.trim().substring(0, 80)
        });
      }
    }
  });
  
  if (issues.length > 0) {
    console.log(`\n🔴 ALERTE: ${filePath}`);
    issues.forEach(issue => {
      console.log(`   Ligne ${issue.line}: ${issue.content}`);
    });
  } else {
    console.log(`✅ ${filePath} - OK`);
  }
}

console.log('🔍 Vérification des secrets codés en dur...\n');

FILES_TO_CHECK.forEach(checkFile);

console.log('\n✅ Vérification terminée!');
console.log('\n⚠️  Rappel: Assurez-vous que le fichier .env est dans .gitignore');