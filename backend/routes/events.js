const express = require('express');
const data = require('../lib/data');
const { protect } = require('../middleware/auth');
const { asyncHandler, validateObjectId } = require('../middleware/errorHandler');
const { eventValidation, eventUpdateValidation } = require('../middleware/validate');

const router = express.Router();

const ownerId = (event) => {
  const org = event.organizer;
  return String(org && org._id ? org._id : org);
};

// @route   GET /api/events
// @desc    Get all events with filters, search, sort & pagination
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  const { category, search, status, sort } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
  const result = await data.listEvents({ category, search, status, sort, page, limit });
  res.json(result);
}));

// @route   GET /api/events/featured
// @desc    Get featured events
// @access  Public
router.get('/featured', asyncHandler(async (req, res) => {
  res.json(await data.getFeatured());
}));

// @route   GET /api/events/stats
// @desc    Get event statistics for the logged-in organizer
// @access  Private
router.get('/stats', protect, asyncHandler(async (req, res) => {
  res.json(await data.getStats(req.user._id));
}));

// @route   GET /api/events/my-events
// @desc    Get events created by logged-in user
// @access  Private
router.get('/my-events', protect, asyncHandler(async (req, res) => {
  res.json(await data.getMyEvents(req.user._id));
}));

// @route   GET /api/events/:id
// @desc    Get single event
// @access  Public
router.get('/:id', validateObjectId, asyncHandler(async (req, res) => {
  const event = await data.getEventById(req.params.id);
  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }
  res.json(event);
}));

// @route   POST /api/events
// @desc    Create a new event
// @access  Private
router.post('/', protect, eventValidation, asyncHandler(async (req, res) => {
  const event = await data.createEvent({ ...req.body, organizer: req.user._id });
  res.status(201).json(event);
}));

// @route   PUT /api/events/:id
// @desc    Update an event
// @access  Private (owner only)
router.put('/:id', protect, validateObjectId, eventUpdateValidation, asyncHandler(async (req, res) => {
  const existing = await data.getEventRaw(req.params.id);
  if (!existing) {
    return res.status(404).json({ message: 'Event not found' });
  }
  if (ownerId(existing) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Not authorized to update this event' });
  }
  if (req.body.capacity !== undefined) {
    const attendeeCount = (existing.attendees || []).length;
    if (Number(req.body.capacity) < attendeeCount) {
      return res.status(400).json({
        message: `Capacity cannot be below the current attendee count (${attendeeCount})`,
      });
    }
  }
  // Never let the client reassign the organizer or the attendee list.
  const { organizer, attendees, _id, ...updates } = req.body;
  const event = await data.updateEvent(req.params.id, updates);
  res.json(event);
}));

// @route   DELETE /api/events/:id
// @desc    Delete an event
// @access  Private (owner only)
router.delete('/:id', protect, validateObjectId, asyncHandler(async (req, res) => {
  const existing = await data.getEventRaw(req.params.id);
  if (!existing) {
    return res.status(404).json({ message: 'Event not found' });
  }
  if (ownerId(existing) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Not authorized to delete this event' });
  }
  await data.deleteEvent(req.params.id);
  res.json({ message: 'Event deleted successfully' });
}));

// @route   POST /api/events/:id/rsvp
// @desc    RSVP to an event
// @access  Private
router.post('/:id/rsvp', protect, validateObjectId, asyncHandler(async (req, res) => {
  const { event, error } = await data.rsvp(req.params.id, req.user._id);
  if (error === 'not-found') return res.status(404).json({ message: 'Event not found' });
  if (error === 'already') return res.status(400).json({ message: 'You are already attending this event' });
  if (error === 'full') return res.status(400).json({ message: 'Event is at full capacity' });
  res.json(event);
}));

// @route   POST /api/events/:id/cancel-rsvp
// @desc    Cancel RSVP
// @access  Private
router.post('/:id/cancel-rsvp', protect, validateObjectId, asyncHandler(async (req, res) => {
  const { event, error } = await data.cancelRsvp(req.params.id, req.user._id);
  if (error === 'not-found') return res.status(404).json({ message: 'Event not found' });
  if (error === 'not-attending') return res.status(400).json({ message: 'You are not attending this event' });
  res.json(event);
}));

module.exports = router;
