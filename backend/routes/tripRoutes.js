const r = require('express').Router();
const c = require('../controllers/tripController');
r.use(require('../middleware/authMiddleware').protect);
r.get('/stats', c.stats);
r.get('/history', c.history);
r.route('/').get(c.list).post(c.create);
r.route('/:id').get(c.get).put(c.update).delete(c.remove);
r.post('/:id/destinations', c.addDestination);
module.exports = r;
