const mongoose = require('mongoose');
const User = require('./models/User');
const Event = require('./models/Event');

// Hardcoded URI to match your Compass screenshot
const MONGODB_URI = 'mongodb://127.0.0.1:27017/eventmanager';

const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin',
  },
  {
    name: 'John Organizer',
    email: 'john@example.com',
    password: 'password123',
    role: 'organizer',
  },
];

async function seed() {
  try {
    console.log('--- 🚀 Starting Database Seed ---');
    
    console.log('1. Connecting to MongoDB at:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected successfully!');

    console.log('2. Clearing old data...');
    await User.deleteMany({});
    await Event.deleteMany({});
    console.log('✅ Collections cleared.');

    console.log('3. Creating sample users...');
    const users = await User.create(sampleUsers);
    const organizerId = users[1]._id;
    console.log('✅ Users created:', users.length);

    console.log('4. Creating sample events...');
    const events = [
      {
        title: 'Global Tech Summit 2026',
        description: 'AI and Future Tech conference.',
        category: 'conference',
        date: new Date('2026-08-15'),
        time: '09:00',
        location: { venue: 'Skyline Center', address: '452 Innovation Way', city: 'San Francisco' },
        capacity: 500,
        price: 299,
        organizer: organizerId,
      },
      {
        title: 'Neon Music Fest',
        description: 'Electronic music festival.',
        category: 'concert',
        date: new Date('2026-09-20'),
        time: '19:00',
        location: { venue: 'Moonlight Arena', address: '789 Festival Dr', city: 'Los Angeles' },
        capacity: 2000,
        price: 85,
        organizer: organizerId,
      }
    ];
    await Event.create(events);
    console.log('✅ Events created:', events.length);

    console.log('\n--- 🎉 ALL DATA SEEDED SUCCESSFULLY ---');
    console.log('You can now log in with: admin@example.com / password123');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ SEEDING ERROR:', err.message);
    process.exit(1);
  }
}

seed();
