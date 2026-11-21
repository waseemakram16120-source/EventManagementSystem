const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const User = require('./models/User');
const Event = require('./models/Event');
const { buildSeedData, DEMO_USER } = require('./lib/seedData');

// Seeds the database with the demo organizer + 8 upcoming events.
// Uses MONGODB_URI from .env, or falls back to a local MongoDB.
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventmanager';

async function seed() {
  try {
    console.log('--- 🚀 Starting EventFlow Seed ---');
    console.log('Connecting to MongoDB:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected successfully!');

    console.log('Clearing old data...');
    await User.deleteMany({});
    await Event.deleteMany({});
    console.log('✅ Collections cleared.');

    const { demoUser, events } = await buildSeedData();
    const { password, ...demoPlain } = demoUser;
    // Create via the model so the password gets hashed by the pre-save hook.
    const createdUser = await User.create({
      name: demoPlain.name,
      email: demoPlain.email,
      password: DEMO_USER.password,
      role: demoPlain.role,
    });
    console.log('✅ Demo user created:', createdUser.email);

    const eventsWithOrganizer = events.map((e) => ({
      ...e,
      organizer: createdUser._id,
      _id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    }));
    const created = await Event.create(eventsWithOrganizer);
    console.log('✅ Events created:', created.length);

    console.log('\n--- 🎉 ALL DATA SEEDED SUCCESSFULLY ---');
    console.log(`Demo login: ${DEMO_USER.email} / ${DEMO_USER.password}`);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ SEEDING ERROR:', err.message);
    process.exit(1);
  }
}

seed();
