const express = require('express');
const Event = require('../models/Event');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/events
// @desc    Get all events with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, search, status, sort, page = 1, limit = 12 } = req.query;

    let query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

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

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const events = await Event.find(query)
      .populate('organizer', 'name email avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(query);

    res.json({
      events,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/events/featured
// @desc    Get featured events
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const events = await Event.find({ isFeatured: true, status: 'upcoming' })
      .populate('organizer', 'name email avatar')
      .sort({ date: 1 })
      .limit(6);
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/events/stats
// @desc    Get event statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments({ organizer: req.user._id });
    const upcomingEvents = await Event.countDocuments({ organizer: req.user._id, status: 'upcoming' });
    const totalAttendees = await Event.aggregate([
      { $match: { organizer: req.user._id } },
      { $project: { attendeeCount: { $size: '$attendees' } } },
      { $group: { _id: null, total: { $sum: '$attendeeCount' } } },
    ]);

    res.json({
      totalEvents,
      upcomingEvents,
      totalAttendees: totalAttendees[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/events/my-events
// @desc    Get events created by logged-in user
// @access  Private
router.get('/my-events', protect, async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id })
      .populate('organizer', 'name email avatar')
      .sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/events/:id
// @desc    Get single event
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email avatar')
      .populate('attendees', 'name email avatar');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/events
// @desc    Create a new event
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      organizer: req.user._id,
    };

    const event = await Event.create(eventData);
    const populatedEvent = await Event.findById(event._id).populate('organizer', 'name email avatar');

    res.status(201).json(populatedEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/events/:id
// @desc    Update an event
// @access  Private (owner only)
router.put('/:id', protect, async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('organizer', 'name email avatar');

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete an event
// @access  Private (owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/events/:id/rsvp
// @desc    RSVP to an event
// @access  Private
router.post('/:id/rsvp', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if already attending
    if (event.attendees.includes(req.user._id)) {
      return res.status(400).json({ message: 'You are already attending this event' });
    }

    // Check capacity
    if (event.attendees.length >= event.capacity) {
      return res.status(400).json({ message: 'Event is at full capacity' });
    }

    event.attendees.push(req.user._id);
    await event.save();

    // Also add to user's attending list
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { eventsAttending: event._id },
    });

    const updatedEvent = await Event.findById(req.params.id)
      .populate('organizer', 'name email avatar')
      .populate('attendees', 'name email avatar');

    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/events/:id/cancel-rsvp
// @desc    Cancel RSVP
// @access  Private
router.post('/:id/cancel-rsvp', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!event.attendees.includes(req.user._id)) {
      return res.status(400).json({ message: 'You are not attending this event' });
    }

    event.attendees = event.attendees.filter(
      (id) => id.toString() !== req.user._id.toString()
    );
    await event.save();

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { eventsAttending: event._id },
    });

    const updatedEvent = await Event.findById(req.params.id)
      .populate('organizer', 'name email avatar')
      .populate('attendees', 'name email avatar');

    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
