const express = require('express');
const controller = require('../controllers/savedController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', controller.listSaved);
router.post('/toggle', controller.toggleSaved);

module.exports = router;
