const r = require('express').Router();
r.use(require('../middleware/authMiddleware').protect);
r.get('/', require('../controllers/weatherController').forecast);
module.exports = r;
