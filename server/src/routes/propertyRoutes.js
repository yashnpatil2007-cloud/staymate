const express = require('express');
const controller = require('../controllers/propertyController');
const { optionalAuth, requireAuth, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { propertySchema } = require('../validators/schemas');

const router = express.Router();

router.get('/', optionalAuth, controller.listProperties);
router.get('/mine', requireAuth, requireRole('owner', 'admin'), controller.myProperties);
router.get('/cities', controller.getCities);
router.get('/home', controller.getHomeSummary);
router.get('/:id', optionalAuth, controller.getProperty);
router.post('/', requireAuth, requireRole('owner', 'admin'), validate(propertySchema), controller.createProperty);
router.patch('/:id', requireAuth, requireRole('owner', 'admin'), validate(propertySchema.partial()), controller.updateProperty);
router.delete('/:id', requireAuth, requireRole('owner', 'admin'), controller.deleteProperty);

module.exports = router;
