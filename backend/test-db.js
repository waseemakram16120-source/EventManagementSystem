// Checks that the API is up and (optionally) that MongoDB is reachable.
// Usage: node test-db.js [baseUrl]   (default http://localhost:5000)
const http = require('http');

const baseUrl = process.argv[2] || process.env.API_URL || 'http://localhost:5000';

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`${baseUrl}${path}`, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

async function main() {
  console.log('--- 🔍 Testing EventFlow API ---');
  console.log('Base URL:', baseUrl);
  try {
    const health = await get('/api/health');
    console.log(`✅ Health check: ${health.status} ${health.body}`);
    const events = await get('/api/events?limit=1');
    const parsed = JSON.parse(events.body);
    console.log(`✅ Events endpoint: ${events.status}, total events: ${parsed.total}`);
    console.log('\n--- 🎉 TEST PASSED! ---');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    console.error('Is the server running? Start it with: npm run dev');
    process.exit(1);
  }
}

main();
