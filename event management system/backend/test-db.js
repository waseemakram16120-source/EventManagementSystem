const { MongoClient } = require('mongodb');

// This uses the native driver to test the connection directly
const url = 'mongodb://localhost:27017';
const dbName = 'eventmanager';

async function main() {
  const client = new MongoClient(url);

  try {
    console.log('--- 🔍 Testing MongoDB Connection ---');
    await client.connect();
    console.log('✅ 1. Successfully connected to server');

    const db = client.db(dbName);
    const collection = db.collection('users');

    console.log('2. Inserting test user...');
    const result = await collection.insertOne({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      createdAt: new Date()
    });

    console.log('✅ 3. Insert successful! ID:', result.insertedId);
    
    const count = await collection.countDocuments();
    console.log('4. Total users in database now:', count);

    console.log('\n--- 🎉 TEST PASSED! ---');
    console.log('Check Compass now. You should see "test@example.com"');

  } catch (err) {
    console.error('\n❌ TEST FAILED!');
    console.error('Error details:', err.message);
  } finally {
    await client.close();
  }
}

main();
