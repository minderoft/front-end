// Test du serveur avec connexion HTTP
const http = require('http');

// Attendre 3 secondes pour que le serveur démarre
setTimeout(() => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('✅ Server is responding!');
      console.log('Response:', data);
      process.exit(0);
    });
  });

  req.on('error', (error) => {
    console.error('❌ Server connection error:', error.message);
    process.exit(1);
  });

  req.end();
}, 3000);
