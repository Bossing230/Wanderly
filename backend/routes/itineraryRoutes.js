const r = require('express').Router();
const c = require('../controllers/itineraryController');
r.use(require('../middleware/authMiddleware').protect);
r.route('/').get(c.list).post(c.create);
r.route('/:id').put(c.update).delete(c.remove);
module.exports = r;
