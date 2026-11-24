const r = require('express').Router();
r.use(require('../middleware/authMiddleware').protect);
r.post('/', require('../controllers/routeController').calculate);
module.exports = r;
