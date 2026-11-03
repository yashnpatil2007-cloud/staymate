const express = require('express');
const controller = require('../controllers/reportController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { reportSchema } = require('../validators/schemas');

const router = express.Router();

router.post('/', requireAuth, validate(reportSchema), controller.createReport);

module.exports = router;
