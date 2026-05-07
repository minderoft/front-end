/**
 * Script de test CORS - LocaPlus Backend
 * 
 * Usage: node test-cors.js
 * 
 * Ce script teste la configuration CORS du backend
 * en envoyant des requêtes simples et des requêtes preflight
 */

const http = require('http');
const https = require('https');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'https://backend-ovbc.onrender.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://zel-chi.vercel.app';

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                    CORS TEST - LocaPlus                   ║
╚═══════════════════════════════════════════════════════════╝

🔧 Configuration:
   Backend URL: ${BACKEND_URL}
   Frontend URL: ${FRONTEND_URL}
`);

// Helper pour faire des requêtes HTTP/HTTPS
function makeRequest(method, path, origin, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BACKEND_URL);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: path,
      method: method,
      headers: {
        'Origin': origin,
        'User-Agent': 'CORS-Test/1.0',
        ...headers,
      },
    };

    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Tests
async function runTests() {
  const tests = [
    {
      name: 'Health Check - CORS vérification',
      method: 'GET',
      path: '/api/health',
      origin: FRONTEND_URL,
      expectedCorsHeaders: ['access-control-allow-origin', 'access-control-allow-credentials'],
    },
    {
      name: 'OPTIONS Preflight - /api/auth/register',
      method: 'OPTIONS',
      path: '/api/auth/register',
      origin: FRONTEND_URL,
      headers: {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
      expectedCorsHeaders: ['access-control-allow-origin', 'access-control-allow-methods'],
    },
    {
      name: 'OPTIONS Preflight - /api/announcements',
      method: 'OPTIONS',
      path: '/api/announcements',
      origin: FRONTEND_URL,
      headers: {
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
      expectedCorsHeaders: ['access-control-allow-origin'],
    },
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const test of tests) {
    try {
      console.log(`\n▶ Test: ${test.name}`);
      console.log(`  ${test.method} ${test.path}`);
      console.log(`  Origin: ${test.origin}`);

      const response = await makeRequest(
        test.method,
        test.path,
        test.origin,
        test.headers || {}
      );

      console.log(`  Status: ${response.status}`);

      // Vérifier les headers CORS
      let corsValid = true;
      if (test.expectedCorsHeaders) {
        for (const header of test.expectedCorsHeaders) {
          if (!response.headers[header]) {
            console.log(`  ❌ Header manquant: ${header}`);
            corsValid = false;
          } else {
            console.log(`  ✅ ${header}: ${response.headers[header]}`);
          }
        }
      }

      if (response.status === 200 || response.status === 204 || response.status === 201) {
        if (corsValid) {
          console.log(`  ✅ PASSED`);
          passedTests++;
        } else {
          console.log(`  ⚠️  Headers CORS manquants`);
          failedTests++;
        }
      } else {
        console.log(`  ⚠️  Status inattendu: ${response.status}`);
      }

      // Afficher le corps de la réponse en développement
      if (response.body) {
        try {
          const json = JSON.parse(response.body);
          console.log(`  Réponse: ${JSON.stringify(json, null, 2).substring(0, 200)}...`);
        } catch (e) {
          console.log(`  Réponse: ${response.body.substring(0, 100)}...`);
        }
      }

    } catch (error) {
      console.log(`  ❌ ERREUR: ${error.message}`);
      failedTests++;
    }
  }

  // Résumé
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                      TEST RÉSUMÉ                          ║
╚═══════════════════════════════════════════════════════════╝

✅ Réussis: ${passedTests}
❌ Échoués: ${failedTests}
📊 Total: ${tests.length}
`);

  if (failedTests === 0) {
    console.log('✨ Tous les tests CORS sont passés !');
  } else {
    console.log('⚠️  Certains tests CORS ont échoué. Vérifiez la configuration.');
    process.exit(1);
  }
}

// Exécuter les tests
runTests().catch((error) => {
  console.error('Erreur lors de l\'exécution des tests:', error);
  process.exit(1);
});
