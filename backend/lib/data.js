const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { isMongoConnected } = require('../config/db');
const User = require('../models/User');
const Event = require('../models/Event');
const store = require('./store');

// Data layer: every route talks to this module, never directly to Mongoose
// or to the store. When MongoDB is connected it uses Mongoose; otherwise
// it delegates to the in-memory demo store with an identical API.

const useMongo = () => isMongoConnected();

function eventToJson(doc) {
  if (!doc) return null;
  const obj = typeof doc.toObject === 'function' ? doc.toObject({ virtuals: true }) : doc;
  return obj;
}

// ---- Users ----
async function findUserByEmail(email, withPassword = false) {
  if (useMongo()) {
    const q = User.findOne({ email: email.toLowerCase() });
    return withPassword ? q.select('+password') : q;
  }
  return store.findUserByEmail(email);
}

async function findUserById(id) {
  if (useMongo()) return User.findById(id);
  return store.findUserById(id);
}

async function createUser({ name, email, password }) {
  if (useMongo()) return User.create({ name, email, password });
  return store.createUser({ name, email, password });
}

async function getUserProfile(id) {
  if (useMongo()) {
    const user = await User.findById(id).populate('eventsAttending');
    return user ? user.toObject({ virtuals: true }) : null;
  }
  return store.populateUser(await store.findUserById(id));
}

// ---- Events ----
async function listEvents({ category, search, status, sort, page, limit }) {
  if (useMongo()) {
    const query = {};
    if (category && category !== 'all') query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
      ];
    }
    let sortOption = { date: 1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };
    if (sort === 'popular') sortOption = { attendees: -1 };
    if (sort === 'price-low') sortOption = { price: 1 };
    if (sort === 'price-high') sortOption = { price: -1 };
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      Event.find(query).populate('organizer', 'name email avatar').sort(sortOption).skip(skip).limit(limit),
      Event.countDocuments(query),
    ]);
    return {
      events: docs.map(eventToJson),
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    };
  }
  return store.listEvents({ category, search, status, sort, page, limit });
}

async function getFeatured() {
  if (useMongo()) {
    const docs = await Event.find({ isFeatured: true, status: 'upcoming' })
      .populate('organizer', 'name email avatar')
      .sort({ date: 1 })
      .limit(6);
    return docs.map(eventToJson);
  }
  return store.getFeatured();
}

async function getStats(userId) {
  if (useMongo()) {
    const [totalEvents, upcomingEvents, totalAttendees] = await Promise.all([
      Event.countDocuments({ organizer: userId }),
      Event.countDocuments({ organizer: userId, status: 'upcoming' }),
      Event.aggregate([
        { $match: { organizer: new mongoose.Types.ObjectId(userId) } },
        { $project: { attendeeCount: { $size: '$attendees' } } },
        { $group: { _id: null, total: { $sum: '$attendeeCount' } } },
      ]),
    ]);
    return { totalEvents, upcomingEvents, totalAttendees: totalAttendees[0]?.total || 0 };
  }
  return store.getStats(userId);
}

async function getMyEvents(userId) {
  if (useMongo()) {
    const docs = await Event.find({ organizer: userId })
      .populate('organizer', 'name email avatar')
      .sort({ createdAt: -1 });
    return docs.map(eventToJson);
  }
  return store.getMyEvents(userId);
}

async function getEventById(id) {
  if (useMongo()) {
    const doc = await Event.findById(id)
      .populate('organizer', 'name email avatar')
      .populate('attendees', 'name email avatar');
    return eventToJson(doc);
  }
  return store.getEventById(id);
}

// Raw (unpopulated) event, for owner checks and capacity checks.
async function getEventRaw(id) {
  if (useMongo()) return Event.findById(id);
  const ev = await store.getEventById(id);
  return ev || null;
}

async function createEvent(data) {
  if (useMongo()) {
    const event = await Event.create(data);
    const populated = await Event.findById(event._id).populate('organizer', 'name email avatar');
    return eventToJson(populated);
  }
  return store.createEvent(data);
}

async function updateEvent(id, updates) {
  if (useMongo()) {
    const doc = await Event.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate('organizer', 'name email avatar')
      .populate('attendees', 'name email avatar');
    return eventToJson(doc);
  }
  return store.updateEvent(id, updates);
}

async function deleteEvent(id) {
  if (useMongo()) {
    const deleted = await Event.findByIdAndDelete(id);
    return !!deleted;
  }
  return store.deleteEvent(id);
}

async function rsvp(eventId, userId) {
  if (useMongo()) {
    const event = await Event.findById(eventId);
    if (!event) return { error: 'not-found' };
    if (event.attendees.map(String).includes(String(userId))) return { error: 'already' };
    if (event.attendees.length >= event.capacity) return { error: 'full' };
    event.attendees.push(userId);
    await event.save();
    await User.findByIdAndUpdate(userId, { $addToSet: { eventsAttending: event._id } });
    const updated = await Event.findById(eventId)
      .populate('organizer', 'name email avatar')
      .populate('attendees', 'name email avatar');
    return { event: eventToJson(updated) };
  }
  return store.rsvp(eventId, userId);
}

async function cancelRsvp(eventId, userId) {
  if (useMongo()) {
    const event = await Event.findById(eventId);
    if (!event) return { error: 'not-found' };
    if (!event.attendees.map(String).includes(String(userId))) return { error: 'not-attending' };
    event.attendees = event.attendees.filter((a) => String(a) !== String(userId));
    await event.save();
    await User.findByIdAndUpdate(userId, { $pull: { eventsAttending: event._id } });
    const updated = await Event.findById(eventId)
      .populate('organizer', 'name email avatar')
      .populate('attendees', 'name email avatar');
    return { event: eventToJson(updated) };
  }
  return store.cancelRsvp(eventId, userId);
}

async function comparePassword(user, candidate) {
  if (!user || !user.password) return false;
  if (useMongo()) return user.comparePassword(candidate);
  return bcrypt.compare(candidate, user.password);
}

module.exports = {
  useMongo,
  findUserByEmail,
  findUserById,
  createUser,
  getUserProfile,
  listEvents,
  getFeatured,
  getStats,
  getMyEvents,
  getEventById,
  getEventRaw,
  createEvent,
  updateEvent,
  deleteEvent,
  rsvp,
  cancelRsvp,
  comparePassword,
};
