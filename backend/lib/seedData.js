const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const DEMO_USER = {
  name: 'Demo Organizer',
  email: 'demo@eventflow.pk',
  password: 'Demo1234',
  role: 'organizer',
};

// 8 realistic upcoming events (Dec 2026 – Mar 2027) across Lahore,
// Islamabad, Karachi and online. Used by the in-memory demo store and
// by seed.js when a real MongoDB is available.
const SEED_EVENTS = [
  {
    title: 'Lahore Tech Summit 2026',
    description:
      'Pakistan’s biggest gathering of founders, engineers and product leaders. Keynotes on AI, cloud and startups, plus a startup expo and networking dinner.',
    category: 'conference',
    date: '2026-12-12',
    time: '09:00',
    location: { venue: 'Expo Centre Lahore', address: '158-H Johar Town', city: 'Lahore' },
    capacity: 500,
    price: 2500,
    tags: ['tech', 'ai', 'startups'],
    isFeatured: true,
    image:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'React & Modern Web Workshop',
    description:
      'A hands-on full-day workshop: build a production-ready React app with Vite, hooks, routing and deployment. Laptops required — beginners welcome.',
    category: 'workshop',
    date: '2026-12-19',
    time: '10:00',
    location: { venue: 'National Incubation Center', address: 'H-9/1, Islamabad', city: 'Islamabad' },
    capacity: 80,
    price: 1500,
    tags: ['react', 'web', 'hands-on'],
    isFeatured: true,
    image:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Karachi Winter Music Night',
    description:
      'An evening of live indie, pop and classical fusion under the stars. Food stalls, open-mic slots and a headline set by local artists.',
    category: 'concert',
    date: '2027-01-09',
    time: '19:00',
    location: { venue: 'Port Grand', address: 'Marine Drive, Clifton', city: 'Karachi' },
    capacity: 1200,
    price: 1200,
    tags: ['music', 'live', 'night'],
    isFeatured: true,
    image:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Lahore Founders Meetup',
    description:
      'Monthly meetup for founders, freelancers and makers. Three lightning talks, open networking and a jobs board. Coffee on the house.',
    category: 'meetup',
    date: '2027-01-16',
    time: '18:00',
    location: { venue: 'Plan9 — Arfa Software Technology Park', address: 'Ferozepur Road', city: 'Lahore' },
    capacity: 120,
    price: 0,
    tags: ['networking', 'founders'],
    isFeatured: false,
    image:
      'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Freelancing & Remote Work Seminar',
    description:
      'How to win clients on Upwork and Fiverr, price your work and get paid from Pakistan. Live Q&A with top-rated freelancers. Join from anywhere.',
    category: 'seminar',
    date: '2027-01-24',
    time: '16:00',
    location: { venue: 'Online (Zoom)', address: 'Join link sent after RSVP', city: 'Online' },
    capacity: 300,
    price: 0,
    tags: ['freelancing', 'remote', 'career'],
    isFeatured: false,
    image:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Karachi Corporate Cricket Cup',
    description:
      'A weekend T20 tournament for company teams, with food, music and a trophy ceremony. Register your team or come cheer from the stands.',
    category: 'sports',
    date: '2027-02-06',
    time: '08:00',
    location: { venue: 'Moin Khan Academy', address: 'DHA Phase 8', city: 'Karachi' },
    capacity: 400,
    price: 500,
    tags: ['cricket', 'tournament', 'weekend'],
    isFeatured: false,
    image:
      'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'UI/UX Design Sprint — Online Workshop',
    description:
      'Design a complete mobile app in one day: research, wireframes, Figma prototypes and usability testing, guided by senior product designers.',
    category: 'workshop',
    date: '2027-02-13',
    time: '11:00',
    location: { venue: 'Online (Google Meet)', address: 'Join link sent after RSVP', city: 'Online' },
    capacity: 60,
    price: 1000,
    tags: ['design', 'figma', 'ux'],
    isFeatured: true,
    image:
      'https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Islamabad AI & Data Conference',
    description:
      'Two days of talks and demos on machine learning, data engineering and applied AI in Pakistan — from academia and industry practitioners.',
    category: 'conference',
    date: '2027-03-06',
    time: '09:30',
    location: { venue: 'Pak-China Friendship Centre', address: 'Shakarparian', city: 'Islamabad' },
    capacity: 350,
    price: 3000,
    tags: ['ai', 'data', 'ml'],
    isFeatured: false,
    image:
      'https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=1200&q=80',
  },
];

function newObjectId() {
  return new mongoose.Types.ObjectId().toString();
}

async function buildSeedData() {
  const passwordHash = await bcrypt.hash(DEMO_USER.password, 12);
  const demoUser = {
    _id: newObjectId(),
    name: DEMO_USER.name,
    email: DEMO_USER.email,
    password: passwordHash,
    avatar: '',
    role: DEMO_USER.role,
    eventsAttending: [],
    createdAt: new Date(),
  };
  const events = SEED_EVENTS.map((e, i) => ({
    ...e,
    _id: newObjectId(),
    date: new Date(`${e.date}T${e.time}:00`),
    organizer: demoUser._id,
    attendees: [],
    status: 'upcoming',
    createdAt: new Date(Date.now() - (SEED_EVENTS.length - i) * 3600 * 1000),
    updatedAt: new Date(),
  }));
  return { demoUser, events };
}

module.exports = { DEMO_USER, SEED_EVENTS, buildSeedData, newObjectId };
