const mongoose = require('mongoose');

// Async route wrapper — forwards rejected promises to the error handler.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Reject malformed ids with 400 instead of letting Mongoose throw a 500.
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid event id' });
  }
  next();
};

// 404 for unknown API routes.
const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Central error handler — always JSON { message } (+ errors on validation).
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err.message);
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id format' });
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    return res.status(400).json({ message: messages[0] || 'Validation failed', errors: messages });
  }
  if (err.code === 11000) {
    return res.status(400).json({ message: 'A record with that value already exists' });
  }
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Something went wrong!' });
};

module.exports = { asyncHandler, validateObjectId, notFound, errorHandler };
