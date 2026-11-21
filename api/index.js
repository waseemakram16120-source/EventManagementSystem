module.exports = (req, res) => {
  const app = require('../backend/server');
  return app(req, res);
};
