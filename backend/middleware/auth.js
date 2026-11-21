const jwt = require('jsonwebtoken');
const data = require('../lib/data');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'eventflow-dev-secret');
    const userDoc = await data.findUserById(decoded.id);
    if (!userDoc) {
      return res.status(401).json({ message: 'User not found' });
    }
    // Normalise to a plain object without the password hash. Clone first:
    // in demo mode the user object is the live in-memory record, so
    // deleting the password here would destroy the stored hash.
    const raw = typeof userDoc.toObject === 'function' ? userDoc.toObject() : userDoc;
    const user = { ...raw };
    delete user.password;
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };
