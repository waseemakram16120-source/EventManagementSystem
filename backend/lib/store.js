const mongoose = require('mongoose');
const { buildSeedData } = require('./seedData');

// In-memory data store used when MongoDB is unavailable (demo mode).
// Mirrors the Mongoose models' shape so routes behave identically in
// both modes. IDs are real ObjectId hex strings, so the API contract
// (including invalid-id 400s) is the same either way.

let users = [];
let events = [];
let seeded = false;

async function ensureSeeded() {
  if (seeded) return;
  seeded = true;
  const { demoUser, events: seedEvents } = await buildSeedData();
  users = [demoUser];
  events = seedEvents;
}

function publicUser(user) {
  if (!user) return null;
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || '',
    role: user.role,
    createdAt: user.createdAt,
  };
}

function populateEvent(event) {
  if (!event) return null;
  const organizer = users.find((u) => u._id === String(event.organizer));
  const attendees = (event.attendees || [])
    .map((id) => users.find((u) => u._id === String(id)))
    .filter(Boolean)
    .map(publicUser);
  return {
    ...event,
    _id: String(event._id),
    organizer: organizer ? publicUser(organizer) : event.organizer,
    attendees,
    availableSpots: event.capacity - (event.attendees || []).length,
  };
}

function populateUser(user) {
  if (!user) return null;
  return {
    ...publicUser(user),
    eventsAttending: (user.eventsAttending || [])
      .map((id) => events.find((e) => String(e._id) === String(id)))
      .filter(Boolean)
      .map(populateEvent),
  };
}

async function findUserByEmail(email) {
  await ensureSeeded();
  return users.find((u) => u.email === email.toLowerCase()) || null;
}

async function findUserById(id) {
  await ensureSeeded();
  return users.find((u) => u._id === String(id)) || null;
}

async function createUser({ name, email, password, role }) {
  await ensureSeeded();
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash(password, 12);
  const user = {
    _id: new mongoose.Types.ObjectId().toString(),
    name,
    email: email.toLowerCase(),
    password: hash,
    avatar: '',
    role: role || 'user',
    eventsAttending: [],
    createdAt: new Date(),
  };
  users.push(user);
  return user;
}

async function listEvents({ category, search, status, sort, page, limit }) {
  await ensureSeeded();
  let filtered = [...events];
  if (category && category !== 'all') filtered = filtered.filter((e) => e.category === category);
  if (status) filtered = filtered.filter((e) => e.status === status);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.location && e.location.city && e.location.city.toLowerCase().includes(q))
    );
  }
  const sorters = {
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    popular: (a, b) => b.attendees.length - a.attendees.length,
    'price-low': (a, b) => a.price - b.price,
    'price-high': (a, b) => b.price - a.price,
    date: (a, b) => new Date(a.date) - new Date(b.date),
  };
  filtered.sort(sorters[sort] || sorters.date);
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  return {
    events: filtered.slice(start, start + limit).map(populateEvent),
    totalPages,
    currentPage: page,
    total,
  };
}

async function getFeatured() {
  await ensureSeeded();
  return events
    .filter((e) => e.isFeatured && e.status === 'upcoming')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 6)
    .map(populateEvent);
}

async function getStats(userId) {
  await ensureSeeded();
  const mine = events.filter((e) => String(e.organizer) === String(userId));
  return {
    totalEvents: mine.length,
    upcomingEvents: mine.filter((e) => e.status === 'upcoming').length,
    totalAttendees: mine.reduce((sum, e) => sum + e.attendees.length, 0),
  };
}

async function getMyEvents(userId) {
  await ensureSeeded();
  return events
    .filter((e) => String(e.organizer) === String(userId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(populateEvent);
}

async function getEventById(id) {
  await ensureSeeded();
  const event = events.find((e) => String(e._id) === String(id));
  return populateEvent(event);
}

async function createEvent(data) {
  await ensureSeeded();
  const event = {
    ...data,
    _id: new mongoose.Types.ObjectId().toString(),
    date: new Date(data.date),
    attendees: [],
    status: data.status || 'upcoming',
    tags: data.tags || [],
    isFeatured: data.isFeatured || false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  events.push(event);
  return populateEvent(event);
}

async function updateEvent(id, updates) {
  await ensureSeeded();
  const event = events.find((e) => String(e._id) === String(id));
  if (!event) return null;
  Object.assign(event, updates, { updatedAt: new Date() });
  if (updates.date) event.date = new Date(updates.date);
  return populateEvent(event);
}

async function deleteEvent(id) {
  await ensureSeeded();
  const idx = events.findIndex((e) => String(e._id) === String(id));
  if (idx === -1) return false;
  const [removed] = events.splice(idx, 1);
  users.forEach((u) => {
    u.eventsAttending = (u.eventsAttending || []).filter(
      (eid) => String(eid) !== String(removed._id)
    );
  });
  return true;
}

async function rsvp(eventId, userId) {
  await ensureSeeded();
  const event = events.find((e) => String(e._id) === String(eventId));
  if (!event) return { error: 'not-found' };
  if (event.attendees.map(String).includes(String(userId))) return { error: 'already' };
  if (event.attendees.length >= event.capacity) return { error: 'full' };
  event.attendees.push(String(userId));
  const user = users.find((u) => u._id === String(userId));
  if (user && !user.eventsAttending.map(String).includes(String(eventId))) {
    user.eventsAttending.push(String(eventId));
  }
  return { event: populateEvent(event) };
}

async function cancelRsvp(eventId, userId) {
  await ensureSeeded();
  const event = events.find((e) => String(e._id) === String(eventId));
  if (!event) return { error: 'not-found' };
  if (!event.attendees.map(String).includes(String(userId))) return { error: 'not-attending' };
  event.attendees = event.attendees.filter((id) => String(id) !== String(userId));
  const user = users.find((u) => u._id === String(userId));
  if (user) {
    user.eventsAttending = (user.eventsAttending || []).filter(
      (eid) => String(eid) !== String(eventId)
    );
  }
  return { event: populateEvent(event) };
}

module.exports = {
  ensureSeeded,
  publicUser,
  populateEvent,
  populateUser,
  findUserByEmail,
  findUserById,
  createUser,
  listEvents,
  getFeatured,
  getStats,
  getMyEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  rsvp,
  cancelRsvp,
};
